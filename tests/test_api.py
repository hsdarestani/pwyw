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
