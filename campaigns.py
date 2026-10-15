"""Outcome-first game campaigns. Monetary outcomes are only merchant-verified entries."""
import re
import secrets
import sqlite3
from datetime import datetime
from fastapi import HTTPException, Request
from pydantic import BaseModel, Field

OBJECTIVES = {
    "upsell": {"title":"Play to Upsell","metric":"Verified add-on contribution"},
    "return": {"title":"Play to Return","metric":"Verified repeat visits"},
    "refer": {"title":"Play to Refer","metric":"Verified friend purchases"},
    "learn": {"title":"Play to Learn","metric":"Reported support time saved"},
}
GAMES = {"memory","merge","rush","snake","breaker","hop","orbit","bloom","lane","sequence"}

class CampaignInput(BaseModel):
    objective: str
    title: str = Field(min_length=3,max_length=100)
    description: str = Field(default="",max_length=300)
    cta: str = Field(default="",max_length=90)
    offer: str = Field(default="",max_length=180)
    product_name: str = Field(default="",max_length=90)
    reward_cost: float = Field(default=0,ge=0,le=9999)
    margin_per_sale: float = Field(default=0,ge=0,le=99999)
    destination: str = Field(default="",max_length=500)
    game: str = "orbit"
    is_active: bool = True
    quiz_question: str = Field(default="",max_length=220)
    quiz_options: list[str] = Field(default_factory=list,max_length=4)
    quiz_correct_index: int = Field(default=0,ge=0,le=3)

class ClaimInput(BaseModel):
    sid: str = Field(min_length=12,max_length=80)
    ref_code: str = Field(default="",max_length=24)

class RedeemInput(BaseModel):
    code: str = Field(min_length=8,max_length=24)
    verified_value: float = Field(default=0,ge=0,le=99999)
    note: str = Field(default="",max_length=160)

class AnswerInput(BaseModel):
    sid: str = Field(min_length=12,max_length=80)
    selected_index: int = Field(ge=0,le=3)

class TrackInput(BaseModel):
    sid: str = Field(min_length=12,max_length=80)
    event: str
    game: str = ""
    detail: str = Field(default="",max_length=140)

def install(app, db, user_from, owned_brand, public_brand, throttle):
    with db() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS campaigns(
          id INTEGER PRIMARY KEY, brand_id INTEGER NOT NULL REFERENCES brands(id),
          objective TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
          cta TEXT NOT NULL DEFAULT '', offer TEXT NOT NULL DEFAULT '',
          product_name TEXT NOT NULL DEFAULT '', reward_cost REAL NOT NULL DEFAULT 0,
          margin_per_sale REAL NOT NULL DEFAULT 0, destination TEXT NOT NULL DEFAULT '',
          game TEXT NOT NULL DEFAULT 'orbit', is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(brand_id,objective)
        );
        CREATE TABLE IF NOT EXISTS claims(
          id INTEGER PRIMARY KEY, campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
          sid TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
          ref_code TEXT NOT NULL DEFAULT '', claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          redeemed_at TEXT, verified_value REAL,
          staff_note TEXT NOT NULL DEFAULT '',
          UNIQUE(campaign_id,sid)
        );
        CREATE INDEX IF NOT EXISTS claims_campaign ON claims(campaign_id,claimed_at);
        CREATE TABLE IF NOT EXISTS campaign_events(
          id INTEGER PRIMARY KEY, campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
          sid TEXT NOT NULL, kind TEXT NOT NULL, game TEXT NOT NULL DEFAULT '',
          detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS campaign_events_idx ON campaign_events(campaign_id,created_at);
        CREATE TABLE IF NOT EXISTS campaign_quiz(
          campaign_id INTEGER PRIMARY KEY REFERENCES campaigns(id),
          question TEXT NOT NULL,
          options TEXT NOT NULL,
          correct_index INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS quiz_attempts(
          id INTEGER PRIMARY KEY,campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
          sid TEXT NOT NULL, selected_index INTEGER NOT NULL,correct INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(campaign_id,sid)
        );
        """)

    def lookup_campaign(slug, objective):
        if objective not in OBJECTIVES: raise HTTPException(404,"Unknown campaign")
        with db() as con:
            row=con.execute("""SELECT c.*, b.slug FROM campaigns c JOIN brands b ON b.id=c.brand_id
                WHERE b.slug=? AND c.objective=? AND c.is_active=1""",(slug,objective)).fetchone()
            if row: return dict(row)
        # Explicit default demo campaigns. Real tenant needs a saved objective.
        if slug in {"luna-cafe","volt-garage","little-forest","poppy-studio"}:
            defaults={
                "upsell": ("Unlock your next favorite","Play, then discover something worth adding.","See the pairing","Try a house special","Signature pairing"),
                "return": ("The next visit starts here","Beat a mini challenge and make your next visit sweeter.","Save the comeback","Next-visit treat","Your next visit"),
                "refer": ("Better played together","Play and send a head-to-head challenge to a friend.","Invite a friend","A surprise for you both","Friend challenge"),
                "learn": ("Know before you go","A playful 60-second introduction to what happens next.","See what to prepare","What you need to know","Service guide"),
            }
            name,description,cta,offer,product=defaults[objective]
            with db() as con:
                brand=con.execute("SELECT id FROM brands WHERE slug=?",(slug,)).fetchone()
            return {"id":None,"brand_id":brand["id"],"slug":slug,
                    "objective":objective,"title":name,"description":description,"cta":cta,
                    "offer":offer,"product_name":product,"game":{"upsell":"orbit","return":"bloom","refer":"lane","learn":"sequence"}[objective],
                    "destination":"","reward_cost":0,"margin_per_sale":0,"demo":True}
        raise HTTPException(404,"Campaign not configured")

    @app.get("/api/objectives")
    def objectives():
        return OBJECTIVES

    @app.get("/api/brands/{slug}/campaigns")
    def list_campaigns(slug:str,request:Request):
        user=user_from(request)
        brand=owned_brand(slug,user)
        with db() as con:
            rows=con.execute("SELECT * FROM campaigns WHERE brand_id=? ORDER BY id DESC",(brand["id"],)).fetchall()
            result=[dict(x) for x in rows]
            for row in result:
                if row["objective"]=="learn":
                    q=con.execute("SELECT * FROM campaign_quiz WHERE campaign_id=?",(row["id"],)).fetchone()
                    if q:
                        row["quiz_question"]=q["question"]
                        row["quiz_options"]=__import__("json").loads(q["options"])
                        row["quiz_correct_index"]=q["correct_index"]
            return result

    @app.put("/api/brands/{slug}/campaigns/{objective}")
    def save_campaign(slug:str,objective:str,data:CampaignInput,request:Request):
        user=user_from(request)
        brand=owned_brand(slug,user)
        if objective not in OBJECTIVES or objective!=data.objective: raise HTTPException(422,"Invalid objective")
        if data.game not in GAMES: raise HTTPException(422,"Invalid game")
        if data.destination and not re.fullmatch(r"https://[A-Za-z0-9.-]+(?::[0-9]+)?(?:/[^\s]*)?",data.destination):
            raise HTTPException(422,"Only HTTPS destination links are supported")
        with db() as con:
            con.execute("""INSERT INTO campaigns(
                brand_id,objective,title,description,cta,offer,product_name,reward_cost,
                margin_per_sale,destination,game,is_active)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
              ON CONFLICT(brand_id,objective) DO UPDATE SET
                title=excluded.title,description=excluded.description,cta=excluded.cta,
                offer=excluded.offer,product_name=excluded.product_name,
                reward_cost=excluded.reward_cost,margin_per_sale=excluded.margin_per_sale,
                destination=excluded.destination,game=excluded.game,is_active=excluded.is_active
            """,(brand["id"],objective,data.title.strip(),data.description.strip(),
                  data.cta.strip(),data.offer.strip(),data.product_name.strip(),
                  data.reward_cost,data.margin_per_sale,data.destination.strip(),
                  data.game,int(data.is_active)))
        if objective=="learn":
            if data.quiz_question.strip():
                options=[str(x).strip() for x in data.quiz_options]
                if len(options)!=3 or not all(1<=len(x)<=110 for x in options) or data.quiz_correct_index>=3:
                    raise HTTPException(422,"Learning quizzes require three short answers and a valid correct option")
                with db() as con:
                    row=con.execute("SELECT id FROM campaigns WHERE brand_id=? AND objective='learn'",
                                    (brand["id"],)).fetchone()
                    con.execute("""INSERT INTO campaign_quiz(campaign_id,question,options,correct_index) VALUES(?,?,?,?)
                      ON CONFLICT(campaign_id) DO UPDATE SET question=excluded.question,
                        options=excluded.options,correct_index=excluded.correct_index""",
                        (row["id"],data.quiz_question.strip(),__import__("json").dumps(options),data.quiz_correct_index))
        return {"ok":True,"objective":objective}

    @app.get("/api/public/brands/{slug}/campaigns")
    def public_campaigns(slug:str):
        public_brand(slug)
        with db() as con:
            rows=con.execute("""SELECT objective,title,description,cta,offer,product_name,game,destination
                    FROM campaigns c JOIN brands b ON b.id=c.brand_id
                    WHERE b.slug=? AND is_active=1 ORDER BY c.id""",(slug,)).fetchall()
        if rows:return [dict(x) for x in rows]
        # Rich live demos only for system-seeded demo brands; no fake campaigns for real businesses.
        if slug in {"luna-cafe","volt-garage","little-forest","poppy-studio"}:
            return [{k:v for k,v in lookup_campaign(slug,o).items() if k in
                ("objective","title","description","cta","offer","product_name","game","destination")}
                for o in OBJECTIVES]
        return []

    @app.get("/api/public/brands/{slug}/campaigns/{objective}")
    def public_campaign(slug:str,objective:str):
        public_brand(slug)
        c=lookup_campaign(slug,objective)
        result={k:c[k] for k in ("objective","title","description","cta","offer",
                "product_name","game","destination")}
        if objective=="learn":
            if c["id"]:
                with db() as con:
                    q=con.execute("SELECT question,options FROM campaign_quiz WHERE campaign_id=?",
                                  (c["id"],)).fetchone()
                if q:result["quiz"]={"question":q["question"],"options":__import__("json").loads(q["options"])}
            else:result["quiz"]={"question":"What should you do before your appointment?",
                 "options":["Bring the requested documents","Ignore all instructions","Arrive without booking"]}
        return result

    @app.post("/api/public/brands/{slug}/campaigns/learn/answer")
    def answer_quiz(slug:str,data:AnswerInput,request:Request):
        throttle(request,"learn-quiz",12,3600)
        c=lookup_campaign(slug,"learn")
        if not re.fullmatch(r"[A-Za-z0-9_-]{12,80}",data.sid):raise HTTPException(422,"Invalid session")
        if c["id"] is None:return {"correct":data.selected_index==0,"demo":True,
                "message":"This is a demonstration, not a verified training result."}
        with db() as con:
            q=con.execute("SELECT correct_index FROM campaign_quiz WHERE campaign_id=?",(c["id"],)).fetchone()
            if not q:raise HTTPException(404,"No learning quiz configured")
            previous=con.execute("SELECT correct FROM quiz_attempts WHERE campaign_id=? AND sid=?",
                                 (c["id"],data.sid)).fetchone()
            if previous:return {"correct":bool(previous["correct"]),"already_submitted":True}
            correct=int(data.selected_index==q["correct_index"])
            con.execute("""INSERT INTO quiz_attempts(campaign_id,sid,selected_index,correct)
                VALUES(?,?,?,?)""",(c["id"],data.sid,data.selected_index,correct))
            con.execute("""INSERT INTO campaign_events(campaign_id,sid,kind,game,detail)
                VALUES(?,?,'learn_answer','','')""",(c["id"],data.sid))
        return {"correct":bool(correct),"demo":False,
            "message":"Answer recorded. This is not proof of reduced staff work."}

    @app.post("/api/public/brands/{slug}/campaigns/{objective}/track")
    def campaign_track(slug:str,objective:str,data:TrackInput,request:Request):
        throttle(request,"campaign-event",80,60)
        c=lookup_campaign(slug,objective)
        if not re.fullmatch(r"[A-Za-z0-9_-]{12,80}",data.sid):raise HTTPException(422,"Invalid session")
        if data.event not in ("view","play","finish","cta","learn_answer","share"):
            raise HTTPException(422,"Invalid event")
        if data.game and data.game not in GAMES:raise HTTPException(422,"Invalid game")
        if c["id"] is None:return {"ok":True,"demo":True}
        with db() as con:
            con.execute("INSERT INTO campaign_events(campaign_id,sid,kind,game,detail) VALUES(?,?,?,?,?)",
                        (c["id"],data.sid,data.event,data.game,data.detail))
        return {"ok":True}

    @app.post("/api/public/brands/{slug}/campaigns/{objective}/claim")
    def claim(slug:str,objective:str,data:ClaimInput,request:Request):
        throttle(request,"claim",7,3600)
        c=lookup_campaign(slug,objective)
        if objective=="learn":raise HTTPException(422,"Learning experiences do not issue rewards")
        if not re.fullmatch(r"[A-Za-z0-9_-]{12,80}",data.sid):raise HTTPException(422,"Invalid session")
        if c["id"] is None:
            return {"code":"DEMO-ONLY","demo":True,
                    "message":"This is a preview. No real discount or benefit is issued."}
        ref=data.ref_code.strip().upper()
        if ref and not re.fullmatch(r"[A-Z0-9-]{8,24}",ref):raise HTTPException(422,"Invalid referral")
        if objective!="refer":ref=""
        with db() as con:
            row=con.execute("SELECT code FROM claims WHERE campaign_id=? AND sid=?",
                            (c["id"],data.sid)).fetchone()
            if row:return {"code":row["code"],"demo":False}
            if ref:
                # Only acknowledge verified existing campaign claims as inviters; prevent self-referral.
                inviter=con.execute("SELECT sid FROM claims WHERE campaign_id=? AND code=?",
                                    (c["id"],ref)).fetchone()
                if not inviter or inviter["sid"]==data.sid:ref=""
            code="PW"+secrets.token_hex(5).upper()
            try:
                con.execute("INSERT INTO claims(campaign_id,sid,code,ref_code) VALUES (?,?,?,?)",
                            (c["id"],data.sid,code,ref))
            except sqlite3.IntegrityError:
                row=con.execute("SELECT code FROM claims WHERE campaign_id=? AND sid=?",
                                (c["id"],data.sid)).fetchone()
                if not row:raise HTTPException(409,"Please try again")
                code=row["code"]
        return {"code":code,"demo":False,
                "note":"Offer subject to merchant terms. Staff must verify redemption."}

    @app.post("/api/brands/{slug}/campaigns/{objective}/redeem")
    def redeem(slug:str,objective:str,data:RedeemInput,request:Request):
        user=user_from(request)
        brand=owned_brand(slug,user)
        if objective not in OBJECTIVES or objective=="learn":raise HTTPException(422,"Invalid objective")
        code=data.code.strip().upper()
        with db() as con:
            row=con.execute("""SELECT cl.id,cl.redeemed_at,cl.ref_code FROM claims cl
                JOIN campaigns c ON c.id=cl.campaign_id
                WHERE c.brand_id=? AND c.objective=? AND cl.code=?""",
                (brand["id"],objective,code)).fetchone()
            if not row:raise HTTPException(404,"Code not found for this business")
            if row["redeemed_at"]:raise HTTPException(409,"Already redeemed")
            cur=con.execute("""UPDATE claims SET redeemed_at=CURRENT_TIMESTAMP,verified_value=?,staff_note=?
               WHERE id=? AND redeemed_at IS NULL""",(data.verified_value,data.note,row["id"]))
            if cur.rowcount!=1:raise HTTPException(409,"Already redeemed")
        return {"ok":True,"verified":True,
                "note":"Amount entered by merchant; not independently verified POS revenue."}

    @app.get("/api/brands/{slug}/campaigns/outcomes")
    def outcomes(slug:str,request:Request):
        user=user_from(request)
        brand=owned_brand(slug,user)
        with db() as con:
            rows=con.execute("""SELECT c.objective,c.title,c.reward_cost,c.margin_per_sale,
                (SELECT COUNT(*) FROM campaign_events e WHERE e.campaign_id=c.id AND e.kind='view') views,
                (SELECT COUNT(*) FROM campaign_events e WHERE e.campaign_id=c.id AND e.kind='finish') finishes,
                (SELECT COUNT(*) FROM campaign_events e WHERE e.campaign_id=c.id AND e.kind='cta') actions,
                (SELECT COUNT(*) FROM claims cl WHERE cl.campaign_id=c.id) issued,
                (SELECT COUNT(*) FROM claims cl WHERE cl.campaign_id=c.id AND cl.redeemed_at IS NOT NULL) redeemed,
                (SELECT COUNT(*) FROM claims cl WHERE cl.campaign_id=c.id
                 AND cl.redeemed_at IS NOT NULL AND cl.ref_code<>'') referred_buyers,
                (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.campaign_id=c.id) quiz_attempts,
                (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.campaign_id=c.id AND qa.correct=1) quiz_correct,
                (SELECT COALESCE(SUM(cl.verified_value),0) FROM claims cl WHERE cl.campaign_id=c.id
                    AND cl.redeemed_at IS NOT NULL) declared_total
                FROM campaigns c WHERE c.brand_id=? ORDER BY c.id""",(brand["id"],)).fetchall()
        result=[]
        for row in rows:
            x=dict(row)
            # x.declared_total is merchant-entered gross contribution, NOT a causal uplift measure.
            x["net_claimed_contribution"]=round(float(x["declared_total"])-float(x["reward_cost"])*int(x["redeemed"]),2)
            result.append(x)
        return {"campaigns":result,"disclaimer":
            "Only manually merchant-verified redemptions and merchant-declared values. No POS confirmation, A/B incrementality or causality; do not call these incremental profits."}
