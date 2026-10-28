"""Merchant-managed starter campaign, 30-day hard cap, and transparent scenario simulator.

The forecast is a what-if arithmetic example. It is NOT a trained sales forecast:
no POS integration exists and the system never claims proven incremental sales.
"""
import json
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Request
from pydantic import BaseModel, Field
from reward_rules import TEMPLATES

GOALS = {"welcome", "return", "refer"}
DEFAULTS = {
 "monthly_reach": 500,
 "average_basket_toman": 250000,
 "gross_margin_percent": 35,
 "participation_percent": 28,
 "qualification_percent": 24,
 "redemption_percent": 55,
 "incremental_purchase_percent": 35,
}

class PlanInput(BaseModel):
 goal: str = "welcome"
 budget_toman: int = Field(default=500000, ge=50000, le=100000000)
 monthly_reach: int = Field(default=500, ge=10, le=1000000)
 average_basket_toman: int = Field(default=250000, ge=10000, le=100000000)
 gross_margin_percent: int = Field(default=35, ge=1, le=95)
 participation_percent: int = Field(default=28, ge=1, le=100)
 qualification_percent: int = Field(default=24, ge=1, le=100)
 redemption_percent: int = Field(default=55, ge=1, le=100)
 incremental_purchase_percent: int = Field(default=35, ge=1, le=100)

class ActivateInput(PlanInput):
 replace_active_rules: bool = False
 confirm_estimate: bool = False

def calculate(data):
 if data.goal not in GOALS:
  raise HTTPException(422, "Unknown business goal")
 t = next(x for x in TEMPLATES if x["key"] == data.goal)
 unit_cost = t["reward_cost_cents"]
 cap = min(100, data.budget_toman // unit_cost)
 if cap < 1: raise HTTPException(422, "Budget does not cover one prize")
 def scenario(mult):
  participation = min(1, data.participation_percent / 100 * mult)
  qualified = min(1, data.qualification_percent / 100 * mult)
  redemption = min(1, data.redemption_percent / 100 * mult)
  # Counterfactual additional sales are hypothetical, not attributable actual sales.
  incremental = min(1, data.incremental_purchase_percent / 100 * mult)
  eligible = min(cap, round(data.monthly_reach * participation * qualified))
  used = round(eligible * redemption)
  extra_purchases = round(used * incremental)
  revenue = extra_purchases * data.average_basket_toman
  reward_cost = eligible * unit_cost  # reserved on issuance, even if unredeemed
  contribution = round(revenue * data.gross_margin_percent / 100) - reward_cost
  return {"eligible_prizes":eligible,"estimated_redeemed":used,
          "additional_purchases":extra_purchases,
          "illustrative_revenue_toman":revenue,
          "estimated_reward_liability_toman":reward_cost,
          "illustrative_contribution_toman":contribution}
 scenarios = {name:scenario(mult) for name,mult in [("conservative",.55),("base",1.0),("optimistic",1.35)]}
 return {"goal":data.goal,"budget_toman":data.budget_toman,
         "reward_cost_toman":unit_cost,"award_cap":cap,
         "unallocated_toman":data.budget_toman-cap*unit_cost,
         "duration_days":30,"currency":"IRT","scenario_data":scenarios,
         "assumptions":{k:getattr(data,k) for k in DEFAULTS},
         "assumptions_source":"Illustrative, user-editable defaults; not measured merchant sales or conversion rates.",
         "notice":"No forecast is guaranteed. No POS attribution, tax, operating overhead or subscription costs are included.",
         "verification_required":t["rule_type"] in ("verified_referral","verified_visit"),
         "no_automatic_renewal":True}

def install(app,db,user_from,owned_brand,throttle):
 with db() as con:
  cols={row["name"] for row in con.execute("PRAGMA table_info(reward_rules)")}
  if "expires_at" not in cols:
   con.execute("ALTER TABLE reward_rules ADD COLUMN expires_at TEXT")
  con.execute("""CREATE TABLE IF NOT EXISTS managed_programs(
   brand_id INTEGER PRIMARY KEY REFERENCES brands(id),
   rule_id INTEGER NOT NULL REFERENCES reward_rules(id),
   goal TEXT NOT NULL,
   budget_toman INTEGER NOT NULL,
   assumptions_json TEXT NOT NULL,
   status TEXT NOT NULL DEFAULT 'active',
   started_at TEXT NOT NULL,
   expires_at TEXT NOT NULL,
   updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )""")

 @app.post("/api/brands/{slug}/managed-program/preview")
 def preview(slug:str,data:PlanInput,request:Request):
  owned_brand(slug,user_from(request))
  throttle(request,"managed-preview",180,3600)
  return calculate(data)

 @app.get("/api/brands/{slug}/managed-program")
 def get_program(slug:str,request:Request):
  brand=owned_brand(slug,user_from(request))
  with db() as con:
   row=con.execute("""SELECT p.*,r.is_active,r.currency,r.reward_title,r.expires_at rule_expires_at,
     (SELECT COUNT(*) FROM rule_awards a WHERE a.rule_id=p.rule_id) issued
     FROM managed_programs p JOIN reward_rules r ON r.id=p.rule_id
     WHERE p.brand_id=?""",(brand["id"],)).fetchone()
  if not row:return {"program":None}
  state=dict(row)
  state["effective_status"]=("expired" if min(state["expires_at"],state["rule_expires_at"] or state["expires_at"])<=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
          else "paused" if state["status"]!="active" or not state["is_active"] else "active")
  state["assumptions"]=json.loads(state.pop("assumptions_json"))
  return {"program":state}

 @app.post("/api/brands/{slug}/managed-program/activate")
 def activate(slug:str,data:ActivateInput,request:Request):
  throttle(request,"managed-activate",10,3600)
  brand=owned_brand(slug,user_from(request))
  if not data.confirm_estimate:
   raise HTTPException(422,"Confirm that the forecast is illustrative, not guaranteed")
  forecast=calculate(data)
  template=next(t for t in TEMPLATES if t["key"]==data.goal)
  now=datetime.now(timezone.utc)
  started=now.strftime("%Y-%m-%d %H:%M:%S")
  expires=(now+timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
  with db() as con:
   con.execute("BEGIN IMMEDIATE")
   others=con.execute("SELECT id FROM reward_rules WHERE brand_id=? AND is_active=1",(brand["id"],)).fetchall()
   if others and not data.replace_active_rules:
    raise HTTPException(409,"Other reward rules are active. Explicitly choose to pause them before enabling managed mode.")
   if others:
    con.execute("UPDATE reward_rules SET is_active=0 WHERE brand_id=? AND is_active=1",(brand["id"],))
   con.execute("""INSERT INTO reward_rules
     (brand_id,title,rule_type,game,period,target_count,reward_title,delivery,
      reward_cost_cents,budget_cents,max_awards,is_active,currency,expires_at)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
     (brand["id"],template["title_fa"],template["rule_type"],template["game"],
      template["period"],template["target_count"],template["reward_title_fa"],
      template["delivery"],forecast["reward_cost_toman"],data.budget_toman,
      forecast["award_cap"],1,"IRT",expires))
   rule_id=con.execute("SELECT last_insert_rowid()").fetchone()[0]
   assumptions={k:getattr(data,k) for k in DEFAULTS}
   con.execute("""INSERT INTO managed_programs
    (brand_id,rule_id,goal,budget_toman,assumptions_json,status,started_at,expires_at)
    VALUES(?,?,?,?,?,'active',?,?)
    ON CONFLICT(brand_id) DO UPDATE SET
    rule_id=excluded.rule_id,goal=excluded.goal,budget_toman=excluded.budget_toman,
    assumptions_json=excluded.assumptions_json,status='active',started_at=excluded.started_at,
    expires_at=excluded.expires_at,updated_at=CURRENT_TIMESTAMP""",
    (brand["id"],rule_id,data.goal,data.budget_toman,json.dumps(assumptions),started,expires))
  return {"ok":True,"rule_id":rule_id,"started_at":started,"expires_at":expires,
          "status":"active","forecast":forecast,
          "notice":"A single 30-day capped reward program is active. No automatic renewals or automatic POS verification."}

 @app.post("/api/brands/{slug}/managed-program/pause")
 def pause(slug:str,request:Request):
  brand=owned_brand(slug,user_from(request))
  with db() as con:
   con.execute("BEGIN IMMEDIATE")
   row=con.execute("SELECT rule_id FROM managed_programs WHERE brand_id=?",(brand["id"],)).fetchone()
   if not row:raise HTTPException(404,"No managed program")
   con.execute("UPDATE managed_programs SET status='paused',updated_at=CURRENT_TIMESTAMP WHERE brand_id=?",(brand["id"],))
   con.execute("UPDATE reward_rules SET is_active=0 WHERE id=? AND brand_id=?",(row["rule_id"],brand["id"]))
  return {"ok":True,"status":"paused"}
