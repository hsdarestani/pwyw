"""Owner-approved campaign proposals, generated from verified UX mechanics.

Business-specific concepts are editorially anchored. Cloudflare AI may improve the copy
but cannot introduce a new product, reward, price, service or factual claim.
"""
import json
import logging
import os
import re
import secrets
import urllib.error
import urllib.request
from copy import deepcopy
from fastapi import HTTPException, Request
from pydantic import BaseModel, Field
from campaign_concepts import as_campaign

LOG=logging.getLogger(__name__)
OBJECTIVE_GAMES={
  "upsell":["orbit","memory","rush"],"return":["bloom","merge","hop"],
  "refer":["lane","snake","breaker"],"learn":["sequence","memory","rush"]
}
QUIZ_FA={
 "quiz_question":"برای اطلاع از شرایط خدمات، کدوم راه مطمئن‌تره؟",
 "quiz_options":["پرسیدن از کارکنان مجموعه","حدس زدن بدون اطلاعات","اعتماد به اطلاعات تأییدنشده"]
}
QUIZ_DE={
 "quiz_question":"Wo erhältst du verlässliche Informationen zu den Leistungen?",
 "quiz_options":["Direkt beim Team nachfragen","Einfach ohne Infos raten","Unbestätigten Gerüchten vertrauen"]
}
FORBIDDEN_CLAIMS=re.compile(
 r"(?:\b\d+[.,]?\d*\s*(?:%|EUR|Euro|€|USD|toman)|درصد|تومان|ریال|"
 r"تخفیف|رایگان|هدیه|جایزه|garantiert|garantie|kostenlos|gratis|Rabatt|"
 r"geschenkt|free|guarantee|discount|giveaway)",re.I
)
STOPWORDS={"کنار","برای","بعد","خرید","مناسب","بررسی","خدمات","مراجعه","پیشنهاد",
           "zum","mit","eine","einer","einem","the","und","oder","für","nach"}

class ProposalRequest(BaseModel):
    objective:str
    reject_id:str=Field(default="",max_length=60)

class ApprovalRequest(BaseModel):
    proposal_id:str=Field(min_length=12,max_length=60)

def template(brand,objective,index):
    """High quality deterministic proposal; always safe when AI is unavailable."""
    p=as_campaign(brand,objective,index,OBJECTIVE_GAMES,QUIZ_DE,QUIZ_FA)
    # Distinct business concepts first; later rounds use a different call-to-action
    # framing, never nonsensical title prefixes.
    if index>=6:
        number=index//6
        if objective=="upsell":
            if number%2:
                p["description"]="Nach dem Spiel wartet eine Idee zu deiner Bestellung."
                p["translations"]["fa"]["description"]="بعد از بازی، یه ایده مرتبط با سفارشت می‌بینی."
            else:
                p["description"]="Eine kurze Runde und danach eine Ergänzung entdecken."
                p["translations"]["fa"]["description"]="یه دست بازی کن و بعد پیشنهاد مکمل رو ببین."
        elif objective=="refer":
            p["description"]="Spiel und lade jemanden zum Mitmachen ein."
            p["translations"]["fa"]["description"]="بازی کن و بعد یه نفر رو برای رقابت دعوت کن."
        elif objective=="return":
            p["description"]="Spiel eine Runde und nimm einen Code für deinen nächsten Besuch mit."
            p["translations"]["fa"]["description"]="بازی کن و کد مراجعه بعدی رو دریافت کن."
    return p

def _anchor_word(product):
    # One substantive product noun must remain in an AI-generated upsell.
    for raw in product.split():
        word=raw.strip("،؟.!:;()").casefold()
        if len(word)>=3 and word not in STOPWORDS:
            return word
    return None

def _parse_response(payload):
    raw=payload.get("result",{})
    answer=raw.get("response") if isinstance(raw,dict) else raw
    if not isinstance(answer,str):
        return None
    answer=re.sub(r"^\s*```(?:json)?|\s*```\s*$","",answer.strip(),flags=re.I)
    try:
        return json.loads(answer)
    except json.JSONDecodeError:
        match=re.search(r"\{[\s\S]*\}",answer)
        if not match:return None
        try:return json.loads(match.group())
        except json.JSONDecodeError:return None

def cloudflare_candidate(brand,objective,index,base=None):
    token=os.getenv("CLOUDFLARE_AI_API_TOKEN","").strip()
    account=os.getenv("CLOUDFLARE_ACCOUNT_ID","").strip()
    if not token or not re.fullmatch(r"[a-f0-9]{32}",account,re.I):
        return None
    base=base or template(brand,objective,index)
    model="@cf/meta/llama-3.3-70b-instruct-fp8-fast"
    system=("You are a senior bilingual copywriter. Improve an existing approved campaign CONCEPT"
        " for a German and Iranian Persian audience. Keep the exact product/service concept."
        " Output ONLY valid JSON: {\\\"de\\\":{\\\"title\\\":string,\\\"description\\\":string,\\\"offer\\\":string},"
        " \\\"fa\\\":{\\\"title\\\":string,\\\"description\\\":string,\\\"offer\\\":string}}."
        " Title <= 85 chars. Description <= 180 chars. Offer <= 150 chars."
        " Fa must sound natural in colloquial Iranian Persian, de natural in German."
        " NO generic platitudes, ALL text should be coherent with the listed product."
        " Mention that availability of the item must be checked with the merchant."
        " Do NOT invent prices, discounts, gifts, prizes, stock, policies, medical promises,"
        " availability or services beyond the supplied product concept."
        " No emojis, markdown, commentary or additional fields.")
    prompt=json.dumps({
       "business_name":brand["name"][:65],"business_category":brand["industry"],
       "objective":objective,"product_de":base["product_name"],
       "product_fa":base["translations"]["fa"]["product_name"],
       "approved_concept_de":{k:base[k] for k in ("title","description","offer")},
       "approved_concept_fa":{k:base["translations"]["fa"][k] for k in ("title","description","offer")},
       "attempt":index+1,"task":"Polish language only, retain the same offer and mechanic."
     },ensure_ascii=False)
    body=json.dumps({"messages":[{"role":"system","content":system},{"role":"user","content":prompt}],
       "max_tokens":1200,"temperature":0.45,"stream":False}).encode("utf-8")
    url=f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}"
    try:
        req=urllib.request.Request(url,data=body,method="POST",
          headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"})
        with urllib.request.urlopen(req,timeout=18) as response:
            raw=json.load(response)
        if not raw.get("success",False):
            LOG.info("PWYW AI rejected request: provider_not_success")
            return None
        data=_parse_response(raw)
        if not isinstance(data,dict):return None
        result=deepcopy(base)
        for lang in ("de","fa"):
            item=data.get(lang)
            if not isinstance(item,dict):return None
            for key,limit in (("title",85),("description",180),("offer",150)):
                value=item.get(key)
                if not isinstance(value,str):return None
                value=value.strip()
                if len(value)<8 or len(value)>limit or FORBIDDEN_CLAIMS.search(value):return None
                if lang=="fa":result["translations"]["fa"][key]=value
                else:result[key]=value
            if objective=="upsell":
                product=base["translations"]["fa"]["product_name"] if lang=="fa" else base["product_name"]
                anchor=_anchor_word(product)
                combined=" ".join((item.get("title",""),item.get("description",""),item.get("offer",""))).casefold()
                if anchor and anchor not in combined:
                    LOG.info("PWYW AI copy rejected: off_topic_%s",lang)
                    return None
        result["concept_id"]=base["concept_id"]
        result["owner_explanation"]=base["owner_explanation"]
        result["review_needed"]=base["review_needed"]
        return result
    except urllib.error.HTTPError as e:
        LOG.warning("PWYW AI endpoint returned HTTP %s (no secret details)",e.code)
    except Exception as e:
        LOG.info("PWYW AI fallback: %s",type(e).__name__)
    return None

def install(app,db,user_from,owned_brand,throttle,save_campaign,CampaignInput):
    with db() as con:
        con.executescript("""
          CREATE TABLE IF NOT EXISTS campaign_proposals(
            id TEXT PRIMARY KEY,brand_id INTEGER NOT NULL,objective TEXT NOT NULL,
            proposal_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',
            generated_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS campaign_proposals_owner
          ON campaign_proposals(brand_id,objective,created_at);
        """)
    @app.post("/api/brands/{slug}/campaigns/propose")
    def propose(slug:str,data:ProposalRequest,request:Request):
        user=user_from(request)
        brand=owned_brand(slug,user)
        if data.objective not in OBJECTIVE_GAMES:
            raise HTTPException(422,"Invalid objective")
        throttle(request,"campaign-propose",24,3600)
        with db() as con:
            if data.reject_id:
                old=con.execute("SELECT * FROM campaign_proposals WHERE id=? AND brand_id=? AND objective=?",
                        (data.reject_id,brand["id"],data.objective)).fetchone()
                if not old or old["status"]!="pending":
                    raise HTTPException(409,"Proposal already handled")
                con.execute("UPDATE campaign_proposals SET status='rejected' WHERE id=?",(data.reject_id,))
            n=con.execute("SELECT COUNT(*) AS n FROM campaign_proposals WHERE brand_id=? AND objective=?",
                         (brand["id"],data.objective)).fetchone()["n"]
            con.execute("UPDATE campaign_proposals SET status='superseded' WHERE brand_id=? AND objective=? AND status='pending'",
                        (brand["id"],data.objective))
            con.execute("DELETE FROM campaign_proposals WHERE created_at<datetime('now','-14 days')")
        base=template(brand,data.objective,n)
        proposal=cloudflare_candidate(brand,data.objective,n,base)
        source="cloudflare" if proposal else "curated"
        proposal=proposal or base
        pid=secrets.token_urlsafe(22)
        with db() as con:
            con.execute("INSERT INTO campaign_proposals(id,brand_id,objective,proposal_json,status,generated_by) VALUES(?,?,?,?,?,?)",
                 (pid,brand["id"],data.objective,json.dumps(proposal,ensure_ascii=False),"pending",source))
        return {"proposal_id":pid,"campaign":proposal,"source":source,"published":False,
          "generation":n+1,"ai_available":bool(os.getenv("CLOUDFLARE_AI_API_TOKEN") and os.getenv("CLOUDFLARE_ACCOUNT_ID"))}
    @app.post("/api/brands/{slug}/campaigns/approve")
    def approve(slug:str,data:ApprovalRequest,request:Request):
        user=user_from(request)
        brand=owned_brand(slug,user)
        with db() as con:
            row=con.execute("SELECT * FROM campaign_proposals WHERE id=? AND brand_id=?",
                       (data.proposal_id,brand["id"])).fetchone()
            if not row or row["status"]!="pending":
                raise HTTPException(409,"Proposal no longer available")
            p=json.loads(row["proposal_json"])
            if con.execute("SELECT created_at<datetime('now','-1 day') expired FROM campaign_proposals WHERE id=?",
                           (data.proposal_id,)).fetchone()["expired"]:
                con.execute("UPDATE campaign_proposals SET status='expired' WHERE id=?",(data.proposal_id,))
                raise HTTPException(409,"Proposal expired, generate another")
            save_campaign(slug,p["objective"],CampaignInput(**p),request)
            con.execute("UPDATE campaign_proposals SET status='approved' WHERE id=? AND status='pending'",(data.proposal_id,))
        return {"ok":True,"objective":p["objective"],"campaign":p,"published":True}
