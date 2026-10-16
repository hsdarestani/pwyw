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
