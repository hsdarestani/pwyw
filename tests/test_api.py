import importlib
import os
import tempfile
import unittest
from fastapi.testclient import TestClient

class PilotTests(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    cls.tmp=tempfile.TemporaryDirectory()
    os.environ["DATA_DIR"]=cls.tmp.name
    os.environ["PUBLIC_BASE_URL"]="https://pwyw.smarbiz.sbs"
    os.environ["COOKIE_SECURE"]="0"
    os.environ.pop("PWYW_OPENAI_API_KEY",None)
    import app
    cls.mod=importlib.reload(app)
    cls.client=TestClient(cls.mod.app)
  def setUp(self):
    # Each isolated test starts with fresh in-memory request rate buckets.
    self.mod.hit_log.clear()

  @classmethod
  def tearDownClass(cls):
    cls.client.close();cls.tmp.cleanup()
  def test_site_and_public_demo(self):
    self.assertEqual(self.client.get("/api/health").status_code,200)
    self.assertEqual(self.client.get("/").status_code,200)
    self.assertEqual(self.client.get("/play/luna-cafe").status_code,200)
    self.assertEqual(self.client.get("/static/play.js").status_code,200)
    self.assertEqual(self.client.get("/api/public/brands/luna-cafe").json()["theme"],"atelier")
    self.assertIn(b"<svg",self.client.get("/qr/luna-cafe.svg").content)
  def test_brand_permissions(self):
    a=TestClient(self.mod.app);b=TestClient(self.mod.app)
    self.assertEqual(a.post("/api/register",json={"email":"one@sample.de","password":"safePassword123"}).status_code,200)
    self.assertEqual(b.post("/api/register",json={"email":"two@sample.de","password":"safePassword123"}).status_code,200)
    brand={"name":"Sample Cafe","slug":"sample-cafe","industry":"cafe","theme":"pop","accent":"#EF6C68","tagline":"Welcome!"}
    self.assertEqual(a.post("/api/brands",json=brand).status_code,200)
    self.assertEqual(b.get("/api/brands").json(),[])
    self.assertEqual(b.get("/api/brands/sample-cafe/stats").status_code,404)
    self.assertEqual(b.put("/api/brands/sample-cafe",json=brand).status_code,404)
    self.assertEqual(a.put("/api/brands/sample-cafe",json={**brand,"theme":"garden"}).status_code,200)
    self.assertEqual(self.client.get("/api/public/brands/sample-cafe").json()["theme"],"garden")
    a.close();b.close()
  def test_events_and_origin(self):
    ev={"kind":"visit","sid":"123456789abc","game":""}
    self.assertEqual(self.client.post("/api/public/brands/luna-cafe/events",json=ev).status_code,200)
    self.assertEqual(self.client.post("/api/public/brands/luna-cafe/events",json={**ev,"kind":"complete","game":"memory","score":999999}).status_code,422)
    self.assertEqual(self.client.post("/api/public/brands/luna-cafe/events",json={**ev,"kind":"complete","game":"memory","score":80,"nickname":"P1"}).status_code,200)
    self.assertEqual(self.client.get("/api/public/brands/luna-cafe/leaderboard/memory").json()[0]["score"],80)
    self.assertEqual(self.client.post("/api/register",json={"email":"x@sample.de","password":"anylongpassword"},headers={"Origin":"https://bad.invalid"}).status_code,403)
    self.assertEqual(self.client.get("/api/brands").status_code,401)
  def test_qr_campaign_targets(self):
    normal=self.client.get("/qr/luna-cafe.svg")
    comeback=self.client.get("/qr/luna-cafe.svg?objective=return&lang=fa")
    invite=self.client.get("/qr/luna-cafe.svg?objective=refer&lang=fa")
    self.assertEqual(normal.status_code,200)
    self.assertEqual(comeback.status_code,200)
    self.assertEqual(invite.status_code,200)
    self.assertIn("svg",invite.headers["content-type"])
    self.assertNotEqual(normal.content,comeback.content)
    self.assertNotEqual(comeback.content,invite.content)
    self.assertEqual(self.client.get("/qr/luna-cafe.svg?objective=unknown").status_code,422)
    self.assertEqual(self.client.get("/qr/luna-cafe.svg?lang=unknown").status_code,422)

  def test_persistent_reward_rules_budget_owner_and_redemption(self):
    from fastapi.testclient import TestClient
    merchant=TestClient(self.mod.app);outsider=TestClient(self.mod.app)
    self.assertEqual(merchant.post("/api/register",json={"email":"rule-owner@test.de","password":"StrongEnoughPassword99"}).status_code,200)
    self.assertEqual(outsider.post("/api/register",json={"email":"rule-stranger@test.de","password":"StrongEnoughPassword88"}).status_code,200)
    brand={"name":"Rule Lab","slug":"rule-lab","industry":"cafe","theme":"atelier","accent":"#CCAA77","tagline":"Games"}
    self.assertEqual(merchant.post("/api/brands",json=brand).status_code,200)
    template=self.client.get("/api/reward-rule-templates").json()
    self.assertTrue(any(x["key"]=="weekly" for x in template))
    suggestions=merchant.get("/api/brands/rule-lab/reward-recommendations")
    self.assertEqual(suggestions.status_code,200)
    self.assertIn("welcome",suggestions.json()["recommended"])
    rule={"title":"First game bonus","rule_type":"first_play","game":"all","period":"lifetime",
      "target_count":1,"reward_title":"Free topping","delivery":"code",
      "reward_cost_cents":100,"budget_cents":200,"max_awards":10,"is_active":True}
    self.assertEqual(outsider.post("/api/brands/rule-lab/reward-rules",json=rule).status_code,404)
    self.assertEqual(merchant.post("/api/brands/rule-lab/reward-rules",json={**rule,"budget_cents":0}).status_code,422)
    created=merchant.post("/api/brands/rule-lab/reward-rules",json=rule)
    self.assertEqual(created.status_code,200)
    rule_id=created.json()["id"]
    self.assertEqual(outsider.get("/api/brands/rule-lab/reward-rules").status_code,404)
    self.assertEqual(len(self.client.get("/api/public/brands/rule-lab/reward-rules").json()),1)
    for index in range(3):
      sid=f"player-rules-{index:05}"
      start={"kind":"start","game":"memory","sid":sid}
      finish={"kind":"complete","game":"memory","sid":sid,"score":200+index}
      self.assertEqual(self.client.post("/api/public/brands/rule-lab/events",json=start).status_code,200)
      response=self.client.post("/api/public/brands/rule-lab/events",json=finish)
      self.assertEqual(response.status_code,200)
      self.assertEqual(self.client.get("/api/public/brands/rule-lab/rewards",params={"sid":sid}).json(),[])
      ticket=self.client.post("/api/public/brands/rule-lab/play-attempts/start",json={"sid":sid,"game":"memory"}).json()["ticket"]
      with self.mod.db() as con:
        con.execute("UPDATE play_attempts SET started_epoch=started_epoch-10 WHERE ticket_hash=?",
          (__import__("hashlib").sha256(ticket.encode()).hexdigest(),))
      valid=self.client.post("/api/public/brands/rule-lab/play-attempts/finish",json={
        "sid":sid,"game":"memory","ticket":ticket,"score":200+index})
      self.assertEqual(valid.status_code,200)
      self.assertEqual(self.client.post("/api/public/brands/rule-lab/play-attempts/finish",json={
        "sid":sid,"game":"memory","ticket":ticket,"score":200+index}).status_code,409)
      awards=self.client.get("/api/public/brands/rule-lab/rewards",params={"sid":sid}).json()
      self.assertEqual(len(awards),1 if index<2 else 0)
      if index==0:
        code=awards[0]["code"]
        self.assertEqual(len(code),26)
        self.assertEqual(self.client.get(f"/reward-qr/{code}.svg").status_code,200)
        self.assertEqual(outsider.post("/api/brands/rule-lab/reward-rules/redeem",json={"code":code}).status_code,404)
        self.assertEqual(merchant.post("/api/brands/rule-lab/reward-rules/redeem",json={"code":code}).status_code,200)
        self.assertEqual(merchant.post("/api/brands/rule-lab/reward-rules/redeem",json={"code":code}).status_code,409)
      again=self.client.post("/api/public/brands/rule-lab/events",json=finish)
      self.assertEqual(again.status_code,200)
      self.assertEqual(len(self.client.get("/api/public/brands/rule-lab/rewards",params={"sid":sid}).json()),1 if index<2 else 0)
    listed=merchant.get("/api/brands/rule-lab/reward-rules").json()[0]
    self.assertEqual(listed["awards_issued"],2)
    self.assertEqual(listed["awards_redeemed"],1)
    self.assertEqual(merchant.put(f"/api/brands/rule-lab/reward-rules/{rule_id}",json={**rule,"game":"snake"}).status_code,409)
    self.assertEqual(merchant.put(f"/api/brands/rule-lab/reward-rules/{rule_id}",json={**rule,"is_active":False}).status_code,200)
    self.assertEqual(self.client.get("/api/public/brands/rule-lab/reward-rules").json(),[])
    manual={**rule,"title":"Verified referral","rule_type":"verified_referral",
      "reward_title":"Friend gift","budget_cents":1000,"max_awards":10}
    result=merchant.post("/api/brands/rule-lab/reward-rules",json=manual)
    self.assertEqual(result.status_code,200)
    rid=result.json()["id"]
    self.assertEqual(self.client.post(f"/api/brands/rule-lab/reward-rules/{rid}/verify",
      json={"sid":"player-rules-00000"}).status_code,401)
    ok=merchant.post(f"/api/brands/rule-lab/reward-rules/{rid}/verify",
      json={"sid":"player-rules-00000"})
    self.assertEqual(ok.status_code,200)
    self.assertTrue(ok.json()["code"].startswith("RW"))
    merchant.close();outsider.close()

  def test_competition_requires_merchant_settlement_after_period(self):
    from datetime import datetime,timedelta,timezone
    from fastapi.testclient import TestClient
    owner=TestClient(self.mod.app)
    self.assertEqual(owner.post("/api/register",json={"email":"contest-owner@test.de","password":"StrongContestPassword123"}).status_code,200)
    brand={"name":"Contest Lab","slug":"contest-lab","industry":"cafe","theme":"neon","accent":"#CCAA77","tagline":"Games"}
    self.assertEqual(owner.post("/api/brands",json=brand).status_code,200)
    rule={"title":"Daily Top","rule_type":"leaderboard_daily","game":"breaker","period":"daily",
      "target_count":3,"reward_title":"Daily free drink","delivery":"qr",
      "reward_cost_cents":250,"budget_cents":500,"max_awards":3,"is_active":True}
    bad=owner.post("/api/brands/contest-lab/reward-rules",json={**rule,"game":"all"})
    self.assertEqual(bad.status_code,422)
    rid=owner.post("/api/brands/contest-lab/reward-rules",json=rule).json()["id"]
    self.assertEqual(owner.post(f"/api/brands/contest-lab/reward-rules/{rid}/settle",
      json={"period_key":datetime.now(timezone.utc).strftime("%Y-%m-%d")}).status_code,409)
    yesterday=(datetime.now(timezone.utc)-timedelta(days=1)).strftime("%Y-%m-%d")
    with self.mod.db() as con:
      brand_id=con.execute("SELECT id FROM brands WHERE slug='contest-lab'").fetchone()["id"]
      for i,score in enumerate([120,340,210]):
        sid=f"contest-player-{i:05}"
        con.execute("""INSERT INTO play_attempts(brand_id,sid,game,ticket_hash,started_epoch,created_at,completed_at,score,eligible)
          VALUES(?,?,?,?,?,?,?,?,1)""",(brand_id,sid,"breaker",f"sample-ticket-{i}",0,
            yesterday+" 15:00:00",yesterday+" 15:00:10",score))
    outcome=owner.post(f"/api/brands/contest-lab/reward-rules/{rid}/settle",json={"period_key":yesterday})
    self.assertEqual(outcome.status_code,200)
    self.assertEqual(len(outcome.json()["winners"]),2)  # Budget for only two prizes
    self.assertEqual([x["score"] for x in outcome.json()["winners"]],[340,210])
    self.assertEqual(owner.post(f"/api/brands/contest-lab/reward-rules/{rid}/settle",json={"period_key":yesterday}).status_code,409)
    self.assertEqual(len(self.client.get("/api/public/brands/contest-lab/rewards",params={"sid":"contest-player-00001"}).json()),1)
    owner.close()

  def test_four_business_objectives_and_verified_claims(self):
    owner=TestClient(self.mod.app)
    stranger=TestClient(self.mod.app)
    self.assertEqual(owner.post("/api/register",json={"email":"campaign-owner@test.de","password":"StrongEnoughPassword1"}).status_code,200)
    self.assertEqual(stranger.post("/api/register",json={"email":"campaign-stranger@test.de","password":"StrongEnoughPassword2"}).status_code,200)
    brand={"name":"Intent Lab","slug":"intent-lab","industry":"auto","theme":"chrome","accent":"#80FFFF","tagline":"Go!"}
    self.assertEqual(owner.post("/api/brands",json=brand).status_code,200)
    self.assertEqual(self.client.get("/api/public/brands/intent-lab/campaigns").json(),[])
    expected={"upsell":"orbit","return":"bloom","refer":"lane","learn":"sequence"}
    for name,game in expected.items():
      payload={"objective":name,"title":"Play to "+name.title(),"description":"Enjoy this game, then act.",
        "cta":"Go","offer":"A useful next step","product_name":"New service",
        "reward_cost":3,"margin_per_sale":20,"destination":"https://example.com/service",
        "game":game,"is_active":True}
      self.assertEqual(owner.put(f"/api/brands/intent-lab/campaigns/{name}",json=payload).status_code,200)
      self.assertEqual(stranger.put(f"/api/brands/intent-lab/campaigns/{name}",json=payload).status_code,404)
    public=self.client.get("/api/public/brands/intent-lab/campaigns")
    self.assertEqual(len(public.json()),4)
    self.assertEqual(self.client.get("/api/public/brands/intent-lab/campaigns/learn").json()["game"],"sequence")
    self.assertEqual(self.client.post("/api/public/brands/intent-lab/campaigns/upsell/claim",
      json={"sid":"visitorunique001"}).status_code,200)
    reward=self.client.post("/api/public/brands/intent-lab/campaigns/upsell/claim",json={"sid":"visitorunique001"}).json()
    self.assertTrue(reward["code"].startswith("PW"))
    self.assertEqual(owner.post("/api/brands/intent-lab/campaigns/upsell/redeem",
      json={"code":reward["code"],"verified_value":20}).status_code,200)
    self.assertEqual(owner.post("/api/brands/intent-lab/campaigns/upsell/redeem",
      json={"code":reward["code"],"verified_value":20}).status_code,409)
    self.assertEqual(stranger.post("/api/brands/intent-lab/campaigns/upsell/redeem",
      json={"code":reward["code"],"verified_value":20}).status_code,404)
    outcomes=owner.get("/api/brands/intent-lab/campaigns/outcomes").json()
    self.assertEqual(len(outcomes["campaigns"]),4)
    upsell=next(c for c in outcomes["campaigns"] if c["objective"]=="upsell")
    self.assertEqual(upsell["redeemed"],1)
    self.assertEqual(upsell["net_claimed_contribution"],17)
    self.assertEqual(self.client.post("/api/public/brands/intent-lab/campaigns/learn/claim",
      json={"sid":"learnerunique001"}).status_code,422)
    self.assertEqual(self.client.post("/api/public/brands/intent-lab/campaigns/learn/track",
      json={"sid":"learnerunique001","event":"learn_answer","game":"sequence"}).status_code,200)
    owner.close();stranger.close()

  def test_persian_brand_and_campaign_copy(self):
    self.mod.hit_log.clear()
    owner=TestClient(self.mod.app)
    self.assertEqual(owner.post("/api/register",json={"email":"fa-owner@sample.de","password":"GermanPersian123456"}).status_code,200)
    data={"name":"Two Worlds","slug":"two-worlds","industry":"cafe","theme":"atelier",
          "accent":"#778899","tagline":"Willkommen","tagline_fa":"خوش آمدید"}
    self.assertEqual(owner.post("/api/brands",json=data).status_code,200)
    public=self.client.get("/api/public/brands/two-worlds").json()
    self.assertEqual(public["tagline_fa"],"خوش آمدید")
    body={"objective":"return","title":"Noch ein Besuch","game":"bloom",
          "description":"Spiel mit","offer":"Komm wieder","product_name":"Kaffee","cta":"Code zeigen",
          "translations":{"fa":{"title":"دوباره بیا","description":"بازی کن",
             "offer":"باز هم ببینیمت","product_name":"قهوه","cta":"نمایش کد"}}}
    self.assertEqual(owner.put("/api/brands/two-worlds/campaigns/return",json=body).status_code,200)
    public=self.client.get("/api/public/brands/two-worlds/campaigns").json()
    self.assertEqual(public[0]["translations"]["fa"]["title"],"دوباره بیا")
    single=self.client.get("/api/public/brands/two-worlds/campaigns/return").json()
    self.assertEqual(single["translations"]["fa"]["offer"],"باز هم ببینیمت")
    bad={**body,"translations":{"fa":{"title":"x"*101}}}
    self.assertEqual(owner.put("/api/brands/two-worlds/campaigns/return",json=bad).status_code,422)
    owner.close()

  def test_curated_campaigns_are_relevant_and_explain_merchant_value(self):
    import campaign_suggestions
    from campaign_concepts import UPSELL
    for category, options in UPSELL.items():
      brand={"name":"Business Example","industry":category}
      previous=set()
      for i, idea in enumerate(options):
        p=campaign_suggestions.template(brand,"upsell",i)
        fa=p["translations"]["fa"]
        self.assertEqual(p["product_name"],idea[3])
        self.assertEqual(fa["product_name"],idea[0])
        self.assertNotIn("برای تنوع",fa["title"])
        self.assertNotIn("پیشنهاد فروشگاه",fa["product_name"])
        self.assertNotIn("از کارکنان بپرس",fa["offer"])
        self.assertNotIn("قبل از انتشار باید مطمئن",p["owner_explanation"]["fa"])
        self.assertIn(fa["product_name"],fa["offer"])
        self.assertIn("کد",fa["offer"])
        self.assertIn("سفارش",p["owner_explanation"]["fa"])
        self.assertIn("Käuf",p["owner_explanation"]["de"])
        self.assertIn("Code",p["offer"])
        self.assertNotIn("تخفیف",fa["offer"])
        self.assertTrue(p["owner_explanation"]["fa"])
        self.assertTrue(p["owner_explanation"]["de"])
        self.assertTrue(p["review_needed"])
        self.assertNotIn(fa["title"],previous,"Curated proposals must differ by actual concept")
        previous.add(fa["title"])
      for objective in ("return","refer","learn"):
        proposal=campaign_suggestions.template(brand,objective,0)
        self.assertIn("owner_explanation",proposal)
        self.assertTrue(proposal["translations"]["fa"]["title"])
        self.assertTrue(proposal["title"])
        self.assertNotIn("باید مطمئن شوید",proposal["owner_explanation"]["fa"])
        self.assertNotIn("بررسی",proposal["translations"]["fa"]["title"])
        self.assertTrue(proposal["translations"]["fa"]["offer"])
        if objective=="learn":
          self.assertEqual(len(proposal["quiz_options"]),3)
          self.assertEqual(len(proposal["translations"]["fa"]["quiz_options"]),3)

  def test_campaign_proposals_require_explicit_approval(self):
    # No AI credentials needed: safe bilingual drafts always work.
    owner=TestClient(self.mod.app)
    other=TestClient(self.mod.app)
    self.assertEqual(owner.post("/api/register",json={"email":"idea-owner@test.de","password":"StrongIdeaOwner12345"}).status_code,200)
    self.assertEqual(other.post("/api/register",json={"email":"idea-other@test.de","password":"StrongIdeaOther12345"}).status_code,200)
    brand={"name":"Idea Cafe","slug":"idea-cafe","industry":"cafe","theme":"atelier","accent":"#AABBCC","tagline":"Welcome"}
    self.assertEqual(owner.post("/api/brands",json=brand).status_code,200)
    url="/api/brands/idea-cafe/campaigns/"
    self.assertEqual(other.post(url+"propose",json={"objective":"return"}).status_code,404)
    self.assertEqual(self.client.post(url+"propose",json={"objective":"return"}).status_code,401)
    first=owner.post(url+"propose",json={"objective":"return"})
    self.assertEqual(first.status_code,200,first.text)
    a=first.json()
    self.assertFalse(a["published"])
    self.assertEqual(a["campaign"]["objective"],"return")
    self.assertTrue(a["campaign"]["translations"]["fa"]["title"])
    self.assertEqual(owner.get(url).json(),[])
    second=owner.post(url+"propose",json={"objective":"return","reject_id":a["proposal_id"]})
    self.assertEqual(second.status_code,200,second.text)
    b=second.json()
    self.assertNotEqual(a["campaign"]["title"],b["campaign"]["title"])
    self.assertEqual(owner.get(url).json(),[])
    self.assertEqual(owner.post(url+"approve",json={"proposal_id":a["proposal_id"]}).status_code,409)
    self.assertEqual(other.post(url+"approve",json={"proposal_id":b["proposal_id"]}).status_code,404)
    result=owner.post(url+"approve",json={"proposal_id":b["proposal_id"]})
    self.assertEqual(result.status_code,200,result.text)
    self.assertTrue(result.json()["published"])
    self.assertEqual(owner.post(url+"approve",json={"proposal_id":b["proposal_id"]}).status_code,409)
    live=owner.get(url).json()
    self.assertEqual(len(live),1)
    self.assertEqual(live[0]["title"],b["campaign"]["title"])
    self.assertEqual(live[0]["translations"]["fa"]["title"],b["campaign"]["translations"]["fa"]["title"])
    self.assertEqual(self.client.get("/api/public/brands/idea-cafe/campaigns").json()[0]["title"],b["campaign"]["title"])
    learn=owner.post(url+"propose",json={"objective":"learn"}).json()
    self.assertEqual(len(learn["campaign"]["quiz_options"]),3)
    self.assertEqual(len(learn["campaign"]["translations"]["fa"]["quiz_options"]),3)
    self.assertEqual(owner.post(url+"approve",json={"proposal_id":learn["proposal_id"]}).status_code,200)
    question=self.client.get("/api/public/brands/idea-cafe/campaigns/learn").json()
    self.assertEqual(len(question["quiz"]["options"]),3)
    owner.close();other.close()

  def test_operator_secret_provision_rotation(self):
    import admin_bootstrap
    import io, sys, contextlib
    def run(email,password):
      previous=sys.stdin
      try:
        sys.stdin=io.StringIO(email+"\n"+password+"\n")
        with contextlib.redirect_stdout(io.StringIO()):
          admin_bootstrap.main()
      finally: sys.stdin=previous
    email="bootstrap-manager@sample.de"
    run(email,"Operator-First-Password-123456789")
    operator=TestClient(self.mod.app)
    self.assertEqual(operator.post("/api/login",json={"email":email,"password":"Operator-First-Password-123456789"}).status_code,200)
    self.assertEqual(operator.get("/api/admin/overview").status_code,200)
    run(email,"Operator-Second-Password-123456789")
    self.assertEqual(operator.get("/api/me").status_code,401)
    self.assertEqual(operator.post("/api/login",json={"email":email,"password":"Operator-First-Password-123456789"}).status_code,401)
    self.assertEqual(operator.post("/api/login",json={"email":email,"password":"Operator-Second-Password-123456789"}).status_code,200)
    self.assertEqual(operator.get("/api/admin/overview").status_code,200)
    operator.close()

  def test_admin_roles_and_password_rotation(self):
    c=TestClient(self.mod.app)
    created=c.post("/api/register",json={"email":"operator@pwyw.test","password":"SafeInitialOperator12345"})
    self.assertEqual(created.status_code,200)
    self.assertEqual(c.get("/api/admin/overview").status_code,403)
    with self.mod.db() as db:
      db.execute("UPDATE users SET role='admin' WHERE email=?",("operator@pwyw.test",))
    overview=c.get("/api/admin/overview")
    self.assertEqual(overview.status_code,200)
    self.assertIn("brands",overview.json())
    self.assertEqual(c.get("/api/admin/users").status_code,200)
    self.assertEqual(c.get("/api/admin/brands").status_code,200)
    changed=c.post("/api/account/change-password",json={"old_password":"SafeInitialOperator12345",
      "new_password":"NewUniquePassword123456789"})
    self.assertEqual(changed.status_code,200)
    self.assertEqual(c.get("/api/admin/overview").status_code,401)
    self.assertEqual(c.post("/api/login",json={"email":"operator@pwyw.test","password":"SafeInitialOperator12345"}).status_code,401)
    self.assertEqual(c.post("/api/login",json={"email":"operator@pwyw.test","password":"NewUniquePassword123456789"}).status_code,200)
    self.assertEqual(c.get("/api/admin/overview").status_code,200)
    c.close()
if __name__=="__main__": unittest.main()
