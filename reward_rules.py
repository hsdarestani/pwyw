"""Persistent reward rules for the branded arcade, independent of legacy campaigns.
Browser game scores are self-reported, not verified purchase or fraud-proof competition.
Leaderboard rewards are issued only after explicit merchant settlement.
"""
import re
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Request
from pydantic import BaseModel, Field

GAMES={"memory","merge","rush","snake","breaker","hop","orbit","bloom","lane","sequence"}
TYPES={"first_play","repeat_days","score_threshold","leaderboard_daily","leaderboard_weekly","verified_visit","verified_referral"}
METHODS={"code","staff","qr"}
SID_RE=re.compile(r"^[A-Za-z0-9_-]{12,80}$")
CODE_RE=re.compile(r"^RW[A-F0-9]{24}$")
TEMPLATES=[
 {"key":"welcome","label":"Erstes Spiel belohnen","label_fa":"جایزه اولین بازی","reason":"Kleine Belohnung, begrenztes Budget.","reason_fa":"جایزه کوچک با بودجه محدود.","rule_type":"first_play","period":"lifetime","game":"all","title":"Willkommen im Spielportal","reward_title":"Überraschung beim nächsten Besuch","delivery":"code","reward_cost_cents":100,"budget_cents":2000,"max_awards":20,"target_count":1},
 {"key":"return","label":"Wiederkommen fördern","label_fa":"تشویق به بازگشت","reason":"Nach drei unterschiedlichen Spieltagen.","reason_fa":"بعد از بازی در سه روز متفاوت.","rule_type":"repeat_days","period":"lifetime","game":"all","title":"Drei Tage gespielt","reward_title":"Extra beim nächsten Besuch","delivery":"staff","reward_cost_cents":150,"budget_cents":3000,"max_awards":20,"target_count":3},
 {"key":"weekly","label":"Wochen-Challenge","label_fa":"مسابقه هفتگی","reason":"Top 3 eines Spiels; Freigabe durch das Geschäft.","reason_fa":"سه نفر برتر یک بازی با تأیید کسب‌وکار.","rule_type":"leaderboard_weekly","period":"weekly","game":"breaker","title":"Top 3 der Woche","reward_title":"Gratis Getränk","delivery":"qr","reward_cost_cents":300,"budget_cents":900,"max_awards":3,"target_count":3},
 {"key":"daily","label":"Tages-Challenge","label_fa":"مسابقه روزانه","reason":"Ein Spiel, ein Tag, manuell bestätigen.","reason_fa":"یک بازی، یک روز، با تأیید کسب‌وکار.","rule_type":"leaderboard_daily","period":"daily","game":"memory","title":"Heute ganz oben","reward_title":"Tagespreis","delivery":"code","reward_cost_cents":200,"budget_cents":600,"max_awards":3,"target_count":3},
 {"key":"refer","label":"Echte Empfehlung","label_fa":"معرفی واقعی دوست","reason":"Erst nach Bestätigung durch das Personal.","reason_fa":"بعد از تأیید واقعی توسط کارکنان.","rule_type":"verified_referral","period":"lifetime","game":"all","title":"Freunde bringen Freunde","reward_title":"Dankeschön für deine Empfehlung","delivery":"staff","reward_cost_cents":300,"budget_cents":3000,"max_awards":10,"target_count":1},
 {"key":"visit","label":"Bestätigter Besuch","label_fa":"جایزه مراجعه تأییدشده","reason":"Ein Besuch wird von Personal bestätigt.","reason_fa":"مراجعه توسط کارکنان تأیید می‌شود.","rule_type":"verified_visit","period":"lifetime","game":"all","title":"Schön, dass du da bist","reward_title":"Treue-Bonus","delivery":"code","reward_cost_cents":150,"budget_cents":1500,"max_awards":10,"target_count":1}
]

class RuleInput(BaseModel):
 title:str=Field(min_length=3,max_length=100)
 rule_type:str
 game:str="all"
 period:str="lifetime"
 target_count:int=Field(default=1,ge=1,le=100000)
 reward_title:str=Field(min_length=3,max_length=150)
 delivery:str="code"
 reward_cost_cents:int=Field(default=0,ge=0,le=100000)
 budget_cents:int=Field(default=0,ge=0,le=10000000)
 max_awards:int=Field(default=20,ge=1,le=100)
 is_active:bool=False

class VerifyInput(BaseModel):
 sid:str=Field(min_length=12,max_length=80)
 note:str=Field(default="",max_length=140)

class RedeemInput(BaseModel):
 code:str=Field(min_length=8,max_length=32)
 note:str=Field(default="",max_length=140)

class SettleInput(BaseModel):
 period_key:str=Field(default="",max_length=12)

def validate(d):
 if d.rule_type not in TYPES:raise HTTPException(422,"Unknown rule type")
 if d.game!="all" and d.game not in GAMES:raise HTTPException(422,"Unknown game")
 if d.delivery not in METHODS:raise HTTPException(422,"Unknown delivery")
 period="daily" if d.rule_type=="leaderboard_daily" else "weekly" if d.rule_type=="leaderboard_weekly" else "lifetime"
 if d.period!=period:raise HTTPException(422,"Invalid rule period")
 if d.rule_type.startswith("leaderboard") and d.game=="all":raise HTTPException(422,"Choose one game for a fair competition")
 if d.is_active and (d.budget_cents<=0 or d.budget_cents<d.reward_cost_cents):raise HTTPException(422,"A live rule needs a sufficient budget")
 if d.rule_type in {"first_play","verified_visit","verified_referral"} and d.target_count!=1:raise HTTPException(422,"Invalid threshold")

def key_for(period,now=None):
 now=now or datetime.now(timezone.utc)
 return now.strftime("%Y-%m-%d") if period=="daily" else now.strftime("%G-W%V") if period=="weekly" else "lifetime"

def bounds(period,key):
 try:
  if period=="daily":
   start=datetime.strptime(key,"%Y-%m-%d").replace(tzinfo=timezone.utc)
   if start.strftime("%Y-%m-%d")!=key:raise ValueError()
   end=start+timedelta(days=1)
  elif period=="weekly":
   year,week=key.split("-W")
   start=datetime.fromisocalendar(int(year),int(week),1).replace(tzinfo=timezone.utc)
   if start.strftime("%G-W%V")!=key:raise ValueError()
   end=start+timedelta(days=7)
  else:raise ValueError()
 except (ValueError,TypeError):raise HTTPException(422,"Invalid competition period")
 return start.strftime("%Y-%m-%d %H:%M:%S"),end.strftime("%Y-%m-%d %H:%M:%S"),end

def award(con,rule,sid,period_key,score=None):
 # Must be called in a write transaction. Idempotent and bound by cap and budget.
 if not SID_RE.fullmatch(sid):return None
 existing=con.execute("SELECT * FROM rule_awards WHERE rule_id=? AND sid=? AND period_key=?",
                      (rule["id"],sid,period_key)).fetchone()
 if existing:return dict(existing)
 count=con.execute("SELECT COUNT(*) n FROM rule_awards WHERE rule_id=? AND period_key=?",
                   (rule["id"],period_key)).fetchone()["n"]
 if count>=rule["max_awards"] or count*rule["reward_cost_cents"]+rule["reward_cost_cents"]>rule["budget_cents"]:return None
 code="RW"+secrets.token_hex(12).upper()
 con.execute("INSERT INTO rule_awards(rule_id,brand_id,sid,period_key,code,score) VALUES(?,?,?,?,?,?)",
             (rule["id"],rule["brand_id"],sid,period_key,code,score))
 return dict(con.execute("SELECT * FROM rule_awards WHERE code=?",(code,)).fetchone())

def issue_for_completion(con,brand_id,sid,game,score):
 # Reward only participation; self-reported score can NEVER directly claim a ranking prize.
 started=con.execute("""SELECT 1 FROM events WHERE brand_id=? AND sid=? AND game=? AND kind='start'
             AND created_at>=datetime('now','-30 minutes') LIMIT 1""",(brand_id,sid,game)).fetchone()
 if not started:return []
 result=[]
 rows=con.execute("""SELECT * FROM reward_rules WHERE brand_id=? AND is_active=1
              AND rule_type IN ('first_play','repeat_days') AND (game='all' OR game=?)""",(brand_id,game)).fetchall()
 for rule in rows:
  if rule["rule_type"]=="repeat_days":
   count=con.execute("""SELECT COUNT(DISTINCT substr(created_at,1,10)) n FROM events
       WHERE brand_id=? AND sid=? AND kind='complete' AND (game=? OR ?='all')""",
       (brand_id,sid,rule["game"],rule["game"])).fetchone()["n"]
   if count<rule["target_count"]:continue
  new=award(con,rule,sid,"lifetime",score)
  if new:result.append({"rule_id":rule["id"],"code":new["code"]})
 return result

def install(app,db,user_from,owned_brand,public_brand,throttle):
 with db() as con:
  con.executescript("""
   CREATE TABLE IF NOT EXISTS reward_rules(
    id INTEGER PRIMARY KEY,brand_id INTEGER NOT NULL REFERENCES brands(id),title TEXT NOT NULL,
    rule_type TEXT NOT NULL,game TEXT NOT NULL DEFAULT 'all',period TEXT NOT NULL DEFAULT 'lifetime',
    target_count INTEGER NOT NULL DEFAULT 1,reward_title TEXT NOT NULL,delivery TEXT NOT NULL DEFAULT 'code',
    reward_cost_cents INTEGER NOT NULL DEFAULT 0,budget_cents INTEGER NOT NULL DEFAULT 0,
    max_awards INTEGER NOT NULL DEFAULT 20,is_active INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
   CREATE INDEX IF NOT EXISTS reward_rules_brand ON reward_rules(brand_id,is_active);
   CREATE TABLE IF NOT EXISTS rule_awards(
    id INTEGER PRIMARY KEY,rule_id INTEGER NOT NULL REFERENCES reward_rules(id),
    brand_id INTEGER NOT NULL REFERENCES brands(id),sid TEXT NOT NULL,
    period_key TEXT NOT NULL,code TEXT NOT NULL UNIQUE,score INTEGER,
    issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,redeemed_at TEXT,
    staff_note TEXT NOT NULL DEFAULT '',
    UNIQUE(rule_id,sid,period_key));
   CREATE INDEX IF NOT EXISTS rule_awards_owner ON rule_awards(brand_id,sid);
   CREATE TABLE IF NOT EXISTS rule_settlements(
    rule_id INTEGER NOT NULL REFERENCES reward_rules(id),
    period_key TEXT NOT NULL,settled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(rule_id,period_key));
  """)

 @app.get("/api/reward-rule-templates")
 def templates():return TEMPLATES

 @app.get("/api/brands/{slug}/reward-recommendations")
 def recommendations(slug:str,request:Request):
  brand=owned_brand(slug,user_from(request))
  with db() as con:
   live=con.execute("SELECT COUNT(*) n FROM reward_rules WHERE brand_id=? AND is_active=1",(brand["id"],)).fetchone()["n"]
   plays=con.execute("""SELECT COUNT(*) n FROM events WHERE brand_id=? AND kind='complete'
                      AND created_at>=datetime('now','-30 days')""",(brand["id"],)).fetchone()["n"]
  preferred=(["welcome","return","weekly"] if brand["industry"] in ("cafe","restaurant","hotel") else
             ["welcome","visit","weekly"] if brand["industry"] in ("salon","health") else ["welcome","refer","weekly"])
  reason=("Starte mit einer kleinen Budgetgrenze." if plays<20 else
          "Es gibt Spielaktivität. Teste eine begrenzte Wochen-Challenge.")
  return {"recommended":preferred,"reason":reason,"games_30d":plays,"live_rules":live,
          "disclaimer":"Rule suggestions are templates, not proven sales uplift."}

 @app.get("/api/brands/{slug}/reward-rules")
 def list_rules(slug:str,request:Request):
  brand=owned_brand(slug,user_from(request))
  with db() as con:
   rows=con.execute("""SELECT r.*,
    (SELECT COUNT(*) FROM rule_awards a WHERE a.rule_id=r.id) awards_issued,
    (SELECT COUNT(*) FROM rule_awards a WHERE a.rule_id=r.id AND a.redeemed_at IS NOT NULL) awards_redeemed
    FROM reward_rules r WHERE r.brand_id=? ORDER BY r.id DESC""",(brand["id"],)).fetchall()
  return [dict(x) for x in rows]

 @app.post("/api/brands/{slug}/reward-rules")
 def create_rule(slug:str,data:RuleInput,request:Request):
  throttle(request,"new-rule",30,3600)
  brand=owned_brand(slug,user_from(request));validate(data)
  with db() as con:
   con.execute("""INSERT INTO reward_rules(brand_id,title,rule_type,game,period,target_count,reward_title,
     delivery,reward_cost_cents,budget_cents,max_awards,is_active) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
     (brand["id"],data.title.strip(),data.rule_type,data.game,data.period,data.target_count,
      data.reward_title.strip(),data.delivery,data.reward_cost_cents,data.budget_cents,data.max_awards,int(data.is_active)))
   key=con.execute("SELECT last_insert_rowid()").fetchone()[0]
  return {"id":key,"ok":True}

 @app.put("/api/brands/{slug}/reward-rules/{rule_id}")
 def update_rule(slug:str,rule_id:int,data:RuleInput,request:Request):
  brand=owned_brand(slug,user_from(request));validate(data)
  with db() as con:
   row=con.execute("SELECT * FROM reward_rules WHERE id=? AND brand_id=?",(rule_id,brand["id"])).fetchone()
   if not row:raise HTTPException(404,"Rule not found")
   issued=con.execute("SELECT 1 FROM rule_awards WHERE rule_id=? LIMIT 1",(rule_id,)).fetchone()
   if issued and any((row[k]!=getattr(data,k)) for k in ("rule_type","period","game","reward_cost_cents")):
    raise HTTPException(409,"Pause and create a new rule when changing trigger, game, period or cost")
   con.execute("""UPDATE reward_rules SET title=?,rule_type=?,game=?,period=?,target_count=?,reward_title=?,
    delivery=?,reward_cost_cents=?,budget_cents=?,max_awards=?,is_active=? WHERE id=? AND brand_id=?""",
    (data.title.strip(),data.rule_type,data.game,data.period,data.target_count,data.reward_title.strip(),
     data.delivery,data.reward_cost_cents,data.budget_cents,data.max_awards,int(data.is_active),rule_id,brand["id"]))
  return {"ok":True}

 @app.get("/api/public/brands/{slug}/reward-rules")
 def public_rules(slug:str):
  brand=public_brand(slug)
  with db() as con:
   rows=con.execute("""SELECT id,title,rule_type,game,period,target_count,reward_title,delivery,max_awards
                     FROM reward_rules WHERE brand_id=? AND is_active=1 ORDER BY id DESC""",(brand["id"],)).fetchall()
  return [dict(x) for x in rows]

 @app.get("/api/public/brands/{slug}/rewards")
 def rewards(slug:str,sid:str):
  brand=public_brand(slug)
  if not SID_RE.fullmatch(sid):raise HTTPException(422,"Invalid session")
  with db() as con:
   rows=con.execute("""SELECT a.code,a.period_key,a.issued_at,a.redeemed_at,
     r.title,r.reward_title,r.delivery,r.rule_type
     FROM rule_awards a JOIN reward_rules r ON r.id=a.rule_id
     WHERE a.brand_id=? AND a.sid=? ORDER BY a.id DESC LIMIT 30""",(brand["id"],sid)).fetchall()
  return [dict(x) for x in rows]

 @app.post("/api/brands/{slug}/reward-rules/{rule_id}/verify")
 def verify_action(slug:str,rule_id:int,data:VerifyInput,request:Request):
  throttle(request,"staff-verify",100,3600)
  brand=owned_brand(slug,user_from(request))
  if not SID_RE.fullmatch(data.sid):raise HTTPException(422,"Invalid session")
  with db() as con:
   con.execute("BEGIN IMMEDIATE")
   row=con.execute("SELECT * FROM reward_rules WHERE id=? AND brand_id=? AND is_active=1",(rule_id,brand["id"])).fetchone()
   if not row:raise HTTPException(404,"Active rule not found")
   if row["rule_type"] not in ("verified_visit","verified_referral","score_threshold"):
    raise HTTPException(422,"This rule cannot be staff verified")
   if row["rule_type"]=="score_threshold":
    best=con.execute("SELECT MAX(score) score FROM events WHERE brand_id=? AND sid=? AND kind='complete' AND game=?",
                     (brand["id"],data.sid,row["game"])).fetchone()["score"]
    if best is None or best<row["target_count"]:raise HTTPException(422,"Score threshold not reached")
   item=award(con,row,data.sid,"lifetime")
  if not item:raise HTTPException(409,"Budget exhausted")
  return {"ok":True,"code":item["code"],"note":"Staff confirmed, not independently POS verified"}

 @app.post("/api/brands/{slug}/reward-rules/{rule_id}/settle")
 def settle(slug:str,rule_id:int,data:SettleInput,request:Request):
  throttle(request,"settle",30,3600)
  brand=owned_brand(slug,user_from(request))
  with db() as con:
   con.execute("BEGIN IMMEDIATE")
   rule=con.execute("SELECT * FROM reward_rules WHERE id=? AND brand_id=? AND is_active=1",(rule_id,brand["id"])).fetchone()
   if not rule:raise HTTPException(404,"Rule not found")
   if rule["rule_type"] not in ("leaderboard_daily","leaderboard_weekly"):
    raise HTTPException(422,"Not a leaderboard rule")
   now=datetime.now(timezone.utc)
   key=data.period_key or key_for(rule["period"],now-timedelta(days=1 if rule["period"]=="daily" else 7))
   start,end,close=bounds(rule["period"],key)
   if close>now:raise HTTPException(409,"Competition not ended")
   if con.execute("SELECT 1 FROM rule_settlements WHERE rule_id=? AND period_key=?",(rule_id,key)).fetchone():
    raise HTTPException(409,"Competition already settled")
   rows=con.execute("""SELECT e.sid,MAX(e.score) best FROM events e
      WHERE e.brand_id=? AND e.kind='complete' AND e.game=? AND e.score IS NOT NULL
      AND e.created_at>=? AND e.created_at<?
      AND EXISTS (SELECT 1 FROM events st WHERE st.brand_id=e.brand_id AND st.sid=e.sid AND
      st.kind='start' AND st.game=e.game AND st.created_at>=? AND st.created_at<?)
      GROUP BY e.sid ORDER BY best DESC,e.sid LIMIT ?""",
      (brand["id"],rule["game"],start,end,start,end,rule["max_awards"])).fetchall()
   winners=[]
   for row in rows:
    item=award(con,rule,row["sid"],key,row["best"])
    if item:winners.append({"sid_suffix":row["sid"][-4:],"score":row["best"],"code":item["code"]})
   con.execute("INSERT INTO rule_settlements(rule_id,period_key) VALUES(?,?)",(rule_id,key))
  return {"ok":True,"period_key":key,"winners":winners,
          "notice":"Scores are browser-reported. Review results before accepting reward codes."}

 @app.get("/reward-qr/{code}.svg")
 def reward_qr(code:str):
  import io
  import qrcode
  from qrcode.image.svg import SvgPathImage
  from fastapi import Response
  if not CODE_RE.fullmatch(code):raise HTTPException(404,"Unknown reward code")
  with db() as con:
   row=con.execute("SELECT 1 FROM rule_awards WHERE code=?",(code,)).fetchone()
  if not row:raise HTTPException(404,"Unknown reward code")
  img=qrcode.make(code,image_factory=SvgPathImage,box_size=8,border=3)
  out=io.BytesIO();img.save(out)
  return Response(out.getvalue(),media_type="image/svg+xml",headers={"Cache-Control":"no-store"})

 @app.post("/api/brands/{slug}/reward-rules/redeem")
 def redeem(slug:str,data:RedeemInput,request:Request):
  brand=owned_brand(slug,user_from(request))
  code=data.code.strip().upper()
  if not CODE_RE.fullmatch(code):raise HTTPException(422,"Invalid reward code")
  with db() as con:
   con.execute("BEGIN IMMEDIATE")
   item=con.execute("SELECT id,redeemed_at FROM rule_awards WHERE brand_id=? AND code=?",(brand["id"],code)).fetchone()
   if not item:raise HTTPException(404,"Code not found")
   if item["redeemed_at"]:raise HTTPException(409,"Already redeemed")
   con.execute("UPDATE rule_awards SET redeemed_at=CURRENT_TIMESTAMP,staff_note=? WHERE id=? AND redeemed_at IS NULL",
               (data.note.strip(),item["id"]))
  return {"ok":True,"verified":True,"notice":"Merchant-confirmed redemption, not POS data"}
