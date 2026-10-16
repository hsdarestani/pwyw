"""Human-approved campaign proposals. Cloudflare Workers AI is optional and never runs in-browser.

A proposal is NOT live until an authenticated brand owner approves it.
No speculative discounts, price promises or factual service claims are allowed.
"""
import json
import os
import re
import secrets
import urllib.request
from datetime import datetime, timezone
from fastapi import HTTPException, Request
from pydantic import BaseModel, Field

OBJECTIVE_GAMES={"upsell":["orbit","memory","rush"],"return":["bloom","merge","hop"],"refer":["lane","snake","breaker"],"learn":["sequence","memory","rush"]}
PERSIAN={
 "upsell":[
 ("یه پیشنهاد مناسب برای سفارشت","یه دست بازی کن و ببین چی می‌تونه کنار سفارشت باشه.","دیدن پیشنهاد","برای انتخاب یه گزینه مناسب، از تیم ما بپرس.","پیشنهاد کنار سفارش"),
 ("یه چیز خوب کنار خریدت","چند دقیقه بازی کن و بعد پیشنهاد ما رو ببین.","ببین چی پیشنهاد می‌دیم","برای پیدا کردن گزینه مناسب، با کارکنان صحبت کن.","پیشنهاد مخصوص سفارش"),
 ("یه انتخاب دیگه هم هست","بازی کن و یه ایده تازه برای سفارش بعدی بگیر.","دیدن پیشنهاد ما","این پیشنهاد صرفاً برای آشناییه؛ برای جزئیات از فروشگاه بپرس.","پیشنهاد فروشگاه"),
 ("یه دقیقه بازی، یه پیشنهاد تازه","یه بازی کوتاه، بعدش یه ایده جدید برای خریدت.","پیشنهاد رو ببین","پیشنهادهای موجود رو از کارکنان بپرس.","انتخاب بیشتر"),
 ],
 "return":[
 ("باز هم بهمون سر بزن","یه بازی کوتاه انجام بده؛ خوشحال می‌شیم دوباره ببینیمت.","برای دفعه بعد","هر وقت خواستی دوباره به ما سر بزن.","مراجعه دوباره"),
 ("دفعه بعد هم خوش می‌گذره","بازی کن و برای سر زدن دوباره آماده شو.","دوباره سر بزن","منتظریم باز هم ببینیمت.","دیدار بعدی"),
 ("یه بازی تا دیدار بعدی","این بار بازی کن، دفعه بعد دوباره بهمون سر بزن.","باشه، دوباره میام","برای مراجعه بعدی با تیم ما در ارتباط باش.","مراجعه بعدی"),
 ("به زودی می‌بینیمت؟","یه چالش کوتاه و یه بهونه برای برگشتن.","دیدار دوباره","از دیدنت دوباره خوشحال می‌شیم.","برگشت به فروشگاه"),
 ],
 "refer":[
 ("دوستت رو به بازی دعوت کن","این چالش کوتاه رو برای دوستت بفرست و با هم رقابت کنین.","دعوت از دوست","لینک بازی رو برای کسی که دوست داری بفرست.","بازی با دوستان"),
 ("با هم بازی کنین","یه بازی کوتاه رو با دوستت شریک شو.","فرستادن بازی","با اشتراک لینک، دوستت هم می‌تونه بازی کنه.","چالش دوستان"),
 ("کی بیشتر امتیاز می‌گیره؟","دوستت رو دعوت کن و رکوردتون رو مقایسه کنین.","دعوت کردن","این لینک رو برای دوستت بفرست.","رقابت دوستانه"),
 ("این بازی رو برای دوستت بفرست","با هم بازی کنین و ببینین رکورد کی بالاتره.","اشتراک بازی","دوستت رو هم به این چالش دعوت کن.","بازی مشترک"),
 ],
 "learn":[
 ("یه نکته کاربردی درباره ما","یه بازی کوتاه کن و در آخر به یه سؤال جواب بده.","شروع یادگیری","برای اطلاعات دقیق‌تر، از کارکنان ما بپرس.","راهنمای مشتری"),
 ("قبل از اینکه بری، اینو بدون","بعد از بازی یه سؤال ساده در مورد راهنمایی گرفتن از ما داری.","دیدن راهنما","تیم ما برای جواب دادن به سؤال‌هات اینجاست.","نکات مهم"),
 ("یه سؤال کوتاه بعد از بازی","بازی کن، بعدش یه نکته ساده یاد بگیر.","بازی و سؤال","اگه درباره خدمات سؤالی داری از تیم ما بپرس.","راهنمای مراجعه"),
 ("بازی کن، یه نکته یاد بگیر","یه دقیقه بازی و یک سؤال ساده درباره گرفتن اطلاعات.","آماده‌ام","برای اطلاع از شرایط خدمات، از کارکنان کمک بگیر.","آشنایی با خدمات"),
 ]
}
GERMAN={
 "upsell":[
 ("Eine passende Ergänzung","Spiel eine kurze Runde und entdecke eine Idee für deine Bestellung.","Angebot ansehen","Frag unser Team nach einer passenden Ergänzung.","Passende Empfehlung"),
 ("Noch eine gute Idee","Ein kleines Spiel und danach eine Empfehlung für deinen Einkauf.","Empfehlung ansehen","Für aktuelle Optionen frag bitte das Team.","Empfehlung zum Einkauf"),
 ("Etwas Passendes dazu","Nach dem Spiel zeigen wir dir, was zu deiner Auswahl passen könnte.","Idee entdecken","Unser Team hilft dir bei der Auswahl.","Weitere Option"),
 ("Eine Runde, eine neue Idee","Ein Mini-Game und danach eine neue Anregung für deinen Einkauf.","Vorschlag ansehen","Frage vor Ort nach den verfügbaren Angeboten.","Vorschlag vor Ort"),
 ],
 "return":[
 ("Schau bald wieder vorbei","Spiel eine Runde. Wir freuen uns auf deinen nächsten Besuch.","Nächsten Besuch planen","Du bist jederzeit wieder willkommen.","Nächster Besuch"),
 ("Bis zum nächsten Mal","Ein kleines Spiel und ein Grund, wieder vorbeizuschauen.","Wiederkommen","Wir freuen uns, dich bald wiederzusehen.","Erneuter Besuch"),
 ("Ein Spiel bis zum Wiedersehen","Heute spielst du. Beim nächsten Mal sehen wir uns wieder.","Bis bald","Melde dich bei unserem Team, wenn du Fragen hast.","Nächster Termin"),
 ("Sehen wir uns wieder?","Mach eine kurze Pause und komm gern erneut vorbei.","Noch einmal vorbeischauen","Wir freuen uns auf ein Wiedersehen.","Wiedersehen"),
 ],
 "refer":[
 ("Fordere deine Freunde heraus","Teile dieses Spiel und vergleicht eure Punkte.","Freunde einladen","Sende den Link an jemanden, der mitspielen möchte.","Freunde-Challenge"),
 ("Zusammen macht es mehr Spaß","Spiele eine Runde und teile die Herausforderung.","Spiel teilen","Deine Freunde können über den Link mitspielen.","Gemeinsames Spiel"),
 ("Wer schafft mehr Punkte?","Lade jemanden zum freundschaftlichen Wettkampf ein.","Challenge teilen","Schicke den Spiel-Link an deine Freunde.","Spiel-Challenge"),
 ("Dieses Spiel ist zum Teilen da","Mach mit und lade deine Freunde zum Spielen ein.","Freunde herausfordern","Teile das Spiel mit jemandem aus deinem Freundeskreis.","Gemeinsame Runde"),
 ],
 "learn":[
 ("Eine nützliche Information","Spiel kurz und beantworte anschließend eine einfache Frage.","Hinweis lesen","Bei Fragen hilft dir unser Team.","Servicehinweis"),
 ("Gut informiert","Ein kleines Spiel, danach eine kurze Wissensfrage.","Jetzt lernen","Unser Team erklärt dir gern die Details.","Kundeninformation"),
 ("Eine Frage nach dem Spiel","Nach dem Spiel geht es um eine einfache Servicefrage.","Frage starten","Für genaue Informationen frag unser Team.","Servicefrage"),
 ("Spiel und lerne etwas","Eine Minute Spielspaß und anschließend eine kleine Frage.","Information ansehen","Frag bei Bedarf unser Team nach Einzelheiten.","Wichtige Information"),
 ]
}
QUIZ_FA={"quiz_question":"از کجا می‌تونی اطلاعات دقیق خدمات رو بگیری؟","quiz_options":["از کارکنان مجموعه","بدون پرسیدن و با حدس زدن","از شایعه‌های تأییدنشده"]}
QUIZ_DE={"quiz_question":"Wo bekommst du verlässliche Informationen zu unserem Angebot?","quiz_options":["Bei unserem Team","Ohne nachzufragen, durch Raten","Aus unbestätigten Gerüchten"]}
BLOCKED_CLAIMS=re.compile(r"(?:\b\d+\s*%|\b\d+\s*(?:EUR|euro|€|تومان|ریال)|guarantee|garantiert|garantie|رایگان|تخفیف|gratis|kostenlos)",re.I)
class ProposalRequest(BaseModel):
    objective:str
    reject_id:str=Field(default="",max_length=60)
class ApprovalRequest(BaseModel):
    proposal_id:str=Field(min_length=12,max_length=60)
def template(brand,objective,index):
    fa=PERSIAN[objective][index%len(PERSIAN[objective])]
    de=GERMAN[objective][index%len(GERMAN[objective])]
    # A rejection must return a genuinely new proposal, even when Workers AI is unavailable.
    # Six independent alternative lead-ins × four distinct base ideas give 24 safe drafts
    # per objective (the per-user hourly budget is lower than this).
    fa_lead={
      "upsell":["اگه دوست داری،","برای تنوع،","یه پیشنهاد دیگه:","یه ایده برای خریدت:","چند دقیقه وقت داری؟","نوبت یه انتخاب تازه‌ست!"],
      "return":["برای دفعه بعد،","یه پیشنهاد متفاوت:","دلت می‌خواد باز هم سر بزنی؟","این دفعه یه ایده تازه داریم:","برای دیدار بعدی،","یه برنامه کوچیک برای برگشتن:"],
      "refer":["این بار با دوستت،","یه چالش دوستانه تازه:","یه ایده برای با هم بازی کردن:","دوستت رو هم وارد بازی کن؛","برای بازی دونفره،","یه رقابت تازه:"],
      "learn":["یه نکته دیگه:","برای آشنایی بیشتر،","این بار یه سؤال کوتاه:","قبل از شروع،","یه راهنمایی تازه:","یه دقیقه وقت بذار:"]
    }
    de_lead={
      "upsell":["Entdecke auch:","Zur Abwechslung:","Noch eine Idee:","Eine weitere Anregung:","Zeit für etwas Neues:","Ein anderer Vorschlag:"],
      "return":["Fürs nächste Mal:","Eine neue Idee:","Komm gern wieder:","Ein neuer Anlass:","Bis zum nächsten Mal:","Noch ein Wiedersehen:"],
      "refer":["Diesmal zusammen:","Noch eine Challenge:","Spielt gemeinsam:","Auch für deine Freunde:","Ein Spiel zu zweit:","Eine neue Runde:"],
      "learn":["Noch ein Hinweis:","Zum Kennenlernen:","Eine kurze Frage:","Vor dem Start:","Ein nützlicher Hinweis:","Eine Frage für dich:"]
    }
    if index>=4:
        # Index groups 1..6 are distinct and prevent repeating an earlier draft title.
        lead_idx=(index//4-1)%6
        fa=list(fa); de=list(de)
        fa[0]=fa_lead[objective][lead_idx]+" "+fa[0]
        de[0]=de_lead[objective][lead_idx]+" "+de[0]
    payload={
      "objective":objective,"title":de[0],"description":de[1],"cta":de[2],"offer":de[3],
      "product_name":de[4],"game":OBJECTIVE_GAMES[objective][index%len(OBJECTIVE_GAMES[objective])],
      "destination":"","margin_per_sale":0,"reward_cost":0,"is_active":True,
      "translations":{"fa":{"title":fa[0],"description":fa[1],"cta":fa[2],"offer":fa[3],"product_name":fa[4]}}
    }
    if objective=="learn":
        payload.update(QUIZ_DE)
        payload["quiz_correct_index"]=0
        payload["translations"]["fa"].update(QUIZ_FA)
    return payload

def cloudflare_candidate(brand,objective,index):
    token=os.getenv("CLOUDFLARE_AI_API_TOKEN","").strip()
    account=os.getenv("CLOUDFLARE_ACCOUNT_ID","").strip()
    if not token or not re.fullmatch(r"[a-f0-9]{32}",account,re.I):
        return None
    # Never supply a model, account or URL from untrusted user input.
    model="@cf/meta/llama-3.3-70b-instruct-fp8-fast"
    system=("You write concise natural German and colloquial Iranian Persian advertising UX."
        " Return ONLY a JSON object with keys de and fa, each containing title, description,"
        " cta, offer, product_name, plus optional quiz_question and quiz_options."
        " All values are short strings except quiz_options which is 3 short strings."
        " Do not invent discounts, rewards, pricing, products, policies, medical/legal claims,"
        " or promises. Be genuinely different from previously proposed ideas."
        " If the business has no catalog data, use only safe generic suggestions and ask staff."
        " Avoid English words and stiff literal Persian translation.")
    prompt=json.dumps({"brand_name":brand["name"][:65],"industry":brand["industry"],
        "objective":objective,"idea_number":index+1,"style_hint":index%7,
        "constraint":"Never invent a tangible bonus or imply a discount is available."},ensure_ascii=False)
    body=json.dumps({"messages":[{"role":"system","content":system},{"role":"user","content":prompt}],
                      "max_tokens":950,"temperature":0.9,"stream":False}).encode("utf-8")
    url=f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}"
    try:
        req=urllib.request.Request(url,data=body,headers={"Content-Type":"application/json",
             "Authorization":"Bearer "+token},method="POST")
        with urllib.request.urlopen(req,timeout=16) as response:
            raw=json.load(response)
        if not raw.get("success",False):return None
        answer=raw.get("result",{}).get("response","")
        match=re.search(r"\{[\s\S]*\}",answer)
        if not match:return None
        data=json.loads(match.group())
        if not isinstance(data,dict):return None
        for lang in ("de","fa"):
            x=data.get(lang)
            if not isinstance(x,dict):return None
            for k,size in (("title",100),("description",300),("cta",90),("offer",180),("product_name",90)):
                val=x.get(k)
                if not isinstance(val,str) or not 3<=len(val.strip())<=size or BLOCKED_CLAIMS.search(val):return None
        p=template(brand,objective,index)
        for k in ("title","description","cta","offer","product_name"):
            p[k]=data["de"][k].strip()
            p["translations"]["fa"][k]=data["fa"][k].strip()
        if objective=="learn":
            # Keep factually grounded quiz rather than trusting model-generated factual instructions.
            pass
        return p
    except Exception:
        # Errors never leak the token or break an existing campaign.
        return None

def install(app,db,user_from,owned_brand,throttle,save_campaign,CampaignInput):
    with db() as con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS campaign_proposals (
              id TEXT PRIMARY KEY, brand_id INTEGER NOT NULL, objective TEXT NOT NULL,
              proposal_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
              generated_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS campaign_proposals_owner
            ON campaign_proposals(brand_id,objective,created_at);
        """)
    @app.post("/api/brands/{slug}/campaigns/propose")
    def propose(slug:str,data:ProposalRequest,request:Request):
        user=user_from(request)
        brand=owned_brand(slug,user)
        if data.objective not in PERSIAN:raise HTTPException(422,"Invalid objective")
        throttle(request,"campaign-propose",24,3600)
        with db() as con:
            if data.reject_id:
                old=con.execute("SELECT * FROM campaign_proposals WHERE id=? AND brand_id=? AND objective=?",
                            (data.reject_id,brand["id"],data.objective)).fetchone()
                if not old or old["status"]!="pending":raise HTTPException(409,"Proposal already handled")
                con.execute("UPDATE campaign_proposals SET status='rejected' WHERE id=?",(data.reject_id,))
            n=con.execute("SELECT COUNT(*) AS n FROM campaign_proposals WHERE brand_id=? AND objective=?",
                (brand["id"],data.objective)).fetchone()["n"]
            # Invalidate abandoned drafts for the selected objective only.
            con.execute("UPDATE campaign_proposals SET status='superseded' WHERE brand_id=? AND objective=? AND status='pending'",
                (brand["id"],data.objective))
            con.execute("DELETE FROM campaign_proposals WHERE created_at<datetime('now','-14 days')")
        candidate=cloudflare_candidate(brand,data.objective,n)
        source="cloudflare" if candidate else "template"
        proposal=candidate or template(brand,data.objective,n)
        pid=secrets.token_urlsafe(22)
        with db() as con:
            con.execute("INSERT INTO campaign_proposals(id,brand_id,objective,proposal_json,status,generated_by) VALUES (?,?,?,?,?,?)",
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
            if not row or row["status"]!="pending":raise HTTPException(409,"Proposal no longer available")
            p=json.loads(row["proposal_json"])
            # Never silently republish a stale draft (24-hour expiry).
            if con.execute("SELECT created_at<datetime('now','-1 day') expired FROM campaign_proposals WHERE id=?",
                 (data.proposal_id,)).fetchone()["expired"]:
                con.execute("UPDATE campaign_proposals SET status='expired' WHERE id=?",(data.proposal_id,))
                raise HTTPException(409,"Proposal expired, generate another")
            result=save_campaign(slug,p["objective"],CampaignInput(**p),request)
            con.execute("UPDATE campaign_proposals SET status='approved' WHERE id=? AND status='pending'",(data.proposal_id,))
        return {"ok":True,"objective":p["objective"],"campaign":p,"published":True}
