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
if __name__=="__main__": unittest.main()
