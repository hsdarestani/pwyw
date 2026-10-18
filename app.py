"""PWYW pilot API — isolated single-process FastAPI + SQLite."""
import base64
import hashlib
import io
import json
import os
import re
import secrets
import sqlite3
import time
import urllib.request
from collections import defaultdict
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import qrcode
from fastapi import FastAPI, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel, Field
from PIL import Image, ImageOps
from starlette.staticfiles import StaticFiles

BASE = Path(__file__).resolve().parent
DATA = Path(os.getenv("DATA_DIR", "/data"))
DATA.mkdir(parents=True, exist_ok=True)
(DATA / "logos").mkdir(exist_ok=True)
DB = DATA / "pwyw.sqlite3"
PUBLIC_URL = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "1") == "1"
GAMES = {"memory", "merge", "rush", "snake", "breaker", "hop", "orbit", "bloom", "lane", "sequence"}
THEMES = {"atelier", "neon", "garden", "pop", "noir", "chrome", "dream", "heritage"}
CATEGORIES = {"cafe", "restaurant", "salon", "auto", "hotel", "health", "other"}
app = FastAPI(title="PWYW API", docs_url=None, redoc_url=None)
hit_log = defaultdict(list)

@contextmanager
def db():
    c = sqlite3.connect(DB, timeout=5)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    c.execute("PRAGMA busy_timeout=5000")
    try:
        yield c
        c.commit()
    finally:
        c.close()

def init_db():
    with db() as c:
        c.execute("PRAGMA journal_mode=WAL")
        c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
          expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS brands (
          id INTEGER PRIMARY KEY, owner_id INTEGER REFERENCES users(id),
          slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, industry TEXT NOT NULL,
          theme TEXT NOT NULL, accent TEXT NOT NULL, tagline TEXT NOT NULL,
          logo_path TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY, brand_id INTEGER NOT NULL REFERENCES brands(id),
          kind TEXT NOT NULL, game TEXT NOT NULL, sid TEXT NOT NULL,
          score INTEGER DEFAULT NULL, nickname TEXT DEFAULT '',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS events_brand_time ON events(brand_id, created_at);
        CREATE TABLE IF NOT EXISTS ai_calls (
          brand_id INTEGER NOT NULL, day TEXT NOT NULL, calls INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (brand_id, day)
        );
        """)
        columns=[row["name"] for row in c.execute("PRAGMA table_info(users)").fetchall()]
        if "role" not in columns:
            c.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'merchant'")
        brand_columns={r["name"] for r in c.execute("PRAGMA table_info(brands)").fetchall()}
        if "tagline_fa" not in brand_columns:
            c.execute("ALTER TABLE brands ADD COLUMN tagline_fa TEXT NOT NULL DEFAULT ''")
        c.execute("DELETE FROM sessions WHERE expires_at < ?", (int(time.time()),))
        # Demo tenants are public read-only, not assigned to any sign-in.
        for slug, name, industry, theme, accent, tagline in [
          ("luna-cafe","Luna Coffee","cafe","atelier","#CBA66C","A little play while your coffee brews."),
          ("volt-garage","VOLT Garage","auto","neon","#A8FF60","Your pit stop. Your high score."),
          ("little-forest","Little Forest","restaurant","garden","#638B62","Tiny moments, big smiles."),
          ("poppy-studio","Poppy Studio","salon","pop","#F66D68","Good things are worth the wait."),
        ]:
            c.execute("""INSERT OR IGNORE INTO brands
               (slug,name,industry,theme,accent,tagline) VALUES (?,?,?,?,?,?)""",
               (slug,name,industry,theme,accent,tagline))
init_db()

@app.middleware("http")
async def security_headers(request: Request, call_next):
    # JSON writes only, same-origin browser requests (public event API included).
    if request.method in ("POST","PUT","PATCH","DELETE"):
        origin = request.headers.get("origin")
        if origin:
            expected = PUBLIC_URL or str(request.base_url).rstrip("/")
            if urlparse(origin).netloc != urlparse(expected).netloc:
                return Response('{"detail":"Cross-origin request blocked"}',status_code=403,media_type="application/json")
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response

def throttle(request, key, limit=18, window=60):
    remote = request.client.host if request.client else "unknown"
    now = time.monotonic()
    k = (remote, key)
    hit_log[k] = [t for t in hit_log[k] if now - t < window]
    if len(hit_log[k]) >= limit:
        raise HTTPException(429,"Too many requests; try again later")
    hit_log[k].append(now)
    if len(hit_log) > 30000: hit_log.clear()

def user_from(request: Request):
    token = request.cookies.get("pwyw_session", "")
    if not token:
        raise HTTPException(401, "Please sign in")
    with db() as c:
        row = c.execute("""SELECT u.id,u.email,u.role FROM sessions s
            JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?""",
            (hashlib.sha256(token.encode()).hexdigest(),int(time.time()))).fetchone()
    if not row: raise HTTPException(401, "Session expired")
    return dict(row)

def owned_brand(slug, user):
    with db() as c:
        row = c.execute("SELECT * FROM brands WHERE slug=? AND owner_id=?",
                        (slug,user["id"])).fetchone()
    if not row: raise HTTPException(404, "Brand not found")
    return dict(row)

def public_brand(slug):
    with db() as c:
        row = c.execute("SELECT * FROM brands WHERE slug=?", (slug,)).fetchone()
    if not row: raise HTTPException(404, "Brand not found")
    return {k:row[k] for k in ("slug","name","industry","theme","accent","tagline","tagline_fa","logo_path")}

def password_hash(value, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256",value.encode(),bytes.fromhex(salt),260000)
    return salt + ":" + digest.hex()

def check_password(value, stored):
    try:
        salt, hashed = stored.split(":",1)
        return secrets.compare_digest(password_hash(value,salt),stored)
    except (ValueError,TypeError):
        return False

class Credentials(BaseModel):
    email: str = Field(min_length=5,max_length=160)
    password: str = Field(min_length=10,max_length=256)

def issue_session(response, user_id):
    token = secrets.token_urlsafe(36)
    with db() as c:
        c.execute("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)",
                  (hashlib.sha256(token.encode()).hexdigest(),user_id,int(time.time())+30*86400))
    response.set_cookie("pwyw_session",token,httponly=True,secure=COOKIE_SECURE,
                        samesite="lax",max_age=30*86400,path="/")

@app.post("/api/register")
def register(credentials: Credentials,request:Request,response:Response):
    throttle(request,"register",5,3600)
    email=credentials.email.strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+",email):
        raise HTTPException(422,"Invalid email address")
    with db() as c:
        try:
            c.execute("INSERT INTO users(email,password_hash) VALUES(?,?)",
                      (email,password_hash(credentials.password)))
            user_id=c.execute("SELECT id FROM users WHERE email=?",(email,)).fetchone()["id"]
        except sqlite3.IntegrityError:
            raise HTTPException(409,"Account already exists")
    issue_session(response,user_id)
    return {"ok":True,"email":email}

@app.post("/api/login")
def login(credentials:Credentials,request:Request,response:Response):
    throttle(request,"login",12,300)
    with db() as c:
        row=c.execute("SELECT * FROM users WHERE email=?",(credentials.email.lower().strip(),)).fetchone()
    if not row or not check_password(credentials.password,row["password_hash"]):
        raise HTTPException(401,"Invalid email or password")
    issue_session(response,row["id"])
    return {"ok":True,"email":row["email"]}

@app.post("/api/logout")
def logout(request:Request,response:Response):
    token=request.cookies.get("pwyw_session","")
    if token:
        with db() as c:
            c.execute("DELETE FROM sessions WHERE token_hash=?",
                      (hashlib.sha256(token.encode()).hexdigest(),))
    response.delete_cookie("pwyw_session",path="/")
    return {"ok":True}

@app.get("/api/me")
def me(request:Request):
    return user_from(request)

class BrandInput(BaseModel):
    name: str = Field(min_length=2,max_length=65)
    slug: str = Field(default="",max_length=45)
    industry: str = "cafe"
    theme: str = "atelier"
    accent: str = "#CBA66C"
    tagline: str = Field(default="",max_length=140)
    tagline_fa: str = Field(default="",max_length=140)

def normalize_brand(data):
    p=data.model_dump()
    if p["industry"] not in CATEGORIES: raise HTTPException(422,"Invalid industry")
    if p["theme"] not in THEMES: raise HTTPException(422,"Invalid theme")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}",p["accent"]):
        raise HTTPException(422,"Color must be a six-digit hex code")
    p["name"]=p["name"].strip()
    p["tagline"]=p["tagline"].strip()
    p["tagline_fa"]=p["tagline_fa"].strip()
    return p

def slugify(name):
    slug=re.sub(r"[^a-z0-9-]","-",name.lower())
    slug=re.sub(r"-+","-",slug).strip("-")
    return slug[:45] or "my-brand"

@app.get("/api/brands")
def brands(request:Request):
    user=user_from(request)
    with db() as c:
        rows=c.execute("SELECT * FROM brands WHERE owner_id=? ORDER BY id DESC",
                       (user["id"],)).fetchall()
    return [dict(row) for row in rows]

@app.post("/api/brands")
def add_brand(data:BrandInput,request:Request):
    user=user_from(request)
    p=normalize_brand(data)
    slug=slugify(p["slug"] or p["name"])
    with db() as c:
        if c.execute("SELECT COUNT(*) n FROM brands WHERE owner_id=?",(user["id"],)).fetchone()["n"] >= 5:
            raise HTTPException(403,"Pilot supports up to five brands per account")
        try:
            c.execute("""INSERT INTO brands(owner_id,slug,name,industry,theme,accent,tagline,tagline_fa)
              VALUES(?,?,?,?,?,?,?,?)""",(user["id"],slug,p["name"],p["industry"],p["theme"],p["accent"],p["tagline"],p["tagline_fa"]))
        except sqlite3.IntegrityError:
            raise HTTPException(409,"This URL is already taken")
    return {"ok":True,"slug":slug}

@app.put("/api/brands/{slug}")
def edit_brand(slug:str,data:BrandInput,request:Request):
    user=user_from(request)
    owned_brand(slug,user)
    p=normalize_brand(data)
    with db() as c:
        c.execute("""UPDATE brands SET name=?,industry=?,theme=?,accent=?,tagline=?,tagline_fa=?
          WHERE slug=? AND owner_id=?""",
          (p["name"],p["industry"],p["theme"],p["accent"],p["tagline"],p["tagline_fa"],slug,user["id"]))
    return {"ok":True,"slug":slug}

@app.post("/api/brands/{slug}/logo")
async def upload_logo(slug:str,request:Request,file:UploadFile=File(...)):
    user=user_from(request)
    owned_brand(slug,user)
    throttle(request,"logo",15,3600)
    raw=await file.read(1_000_001)
    if len(raw)>1_000_000: raise HTTPException(413,"Maximum logo size is 1 MB")
    try:
        im=Image.open(io.BytesIO(raw))
        if im.format not in ("PNG","JPEG","WEBP"): raise ValueError("format")
        im=ImageOps.exif_transpose(im)
        im.thumbnail((600,600))
        im=im.convert("RGBA")
        dst=DATA/"logos"/(slug+"-"+secrets.token_hex(8)+".png")
        im.save(dst,"PNG",optimize=True)
    except (OSError,ValueError,Image.DecompressionBombError):
        raise HTTPException(422,"Please upload a valid PNG, JPEG or WebP image")
    with db() as c:
        old=c.execute("SELECT logo_path FROM brands WHERE slug=?",(slug,)).fetchone()["logo_path"]
        c.execute("UPDATE brands SET logo_path=? WHERE slug=?",(dst.name,slug))
    if old and re.fullmatch(r"[a-z0-9-]+\.png",old):
        (DATA/"logos"/old).unlink(missing_ok=True)
    return {"ok":True,"logo_url":"/brand-logo/"+dst.name}

@app.get("/brand-logo/{filename}")
def brand_logo(filename:str):
    if not re.fullmatch(r"[a-z0-9-]+\.png",filename):
        raise HTTPException(404)
    path=DATA/"logos"/filename
    if not path.is_file(): raise HTTPException(404)
    return FileResponse(path,media_type="image/png",headers={"Cache-Control":"public, max-age=3600"})

@app.get("/api/public/brands/{slug}")
def get_public_brand(slug:str):
    return public_brand(slug)

class EventInput(BaseModel):
    kind: str
    game: str = ""
    sid: str = Field(min_length=12,max_length=80)
    score: int | None = None
    nickname: str = Field(default="",max_length=20)

@app.post("/api/public/brands/{slug}/events")
def record_event(slug:str,data:EventInput,request:Request):
    throttle(request,"event",90,60)
    if data.kind not in ("visit","start","complete"):
        raise HTTPException(422,"Invalid event")
    if data.kind!="visit" and data.game not in GAMES:
        raise HTTPException(422,"Invalid game")
    if data.game and data.game not in GAMES: raise HTTPException(422,"Invalid game")
    if not re.fullmatch(r"[a-zA-Z0-9_-]{12,80}",data.sid):
        raise HTTPException(422,"Invalid session")
    score=data.score if data.kind=="complete" else None
    if score is not None and not (0<=score<=100000):
        raise HTTPException(422,"Invalid score")
    name=re.sub(r"[\x00-\x1f<>]","",data.nickname).strip()[:20]
    with db() as c:
        brand=c.execute("SELECT id FROM brands WHERE slug=?",(slug,)).fetchone()
        if not brand: raise HTTPException(404,"Brand not found")
        c.execute("""INSERT INTO events(brand_id,kind,game,sid,score,nickname)
          VALUES(?,?,?,?,?,?)""",(brand["id"],data.kind,data.game,data.sid,score,name))
    return {"ok":True}

@app.get("/api/public/brands/{slug}/leaderboard/{game}")
def leaderboard(slug:str,game:str):
    if game not in GAMES: raise HTTPException(404)
    with db() as c:
        brand=c.execute("SELECT id FROM brands WHERE slug=?",(slug,)).fetchone()
        if not brand: raise HTTPException(404)
        rows=c.execute("""SELECT nickname,MAX(score) score FROM events
          WHERE brand_id=? AND game=? AND kind='complete' AND nickname<>'' AND score IS NOT NULL
          AND created_at>=datetime('now','-7 days')
          GROUP BY lower(nickname) ORDER BY score DESC LIMIT 10""",(brand["id"],game)).fetchall()
    return [dict(x) for x in rows]

@app.get("/api/brands/{slug}/stats")
def brand_stats(slug:str,request:Request):
    user=user_from(request)
    brand=owned_brand(slug,user)
    with db() as c:
        totals=c.execute("""SELECT kind, COUNT(*) n FROM events WHERE brand_id=?
           AND created_at>=datetime('now','-30 days') GROUP BY kind""",(brand["id"],)).fetchall()
        games=c.execute("""SELECT game,COUNT(*) n FROM events WHERE brand_id=? AND kind='start'
           AND created_at>=datetime('now','-30 days') GROUP BY game""",(brand["id"],)).fetchall()
        days=c.execute("""SELECT substr(created_at,1,10) day,
           SUM(CASE WHEN kind='visit' THEN 1 ELSE 0 END) visits,
           SUM(CASE WHEN kind='start' THEN 1 ELSE 0 END) starts
           FROM events WHERE brand_id=? AND created_at>=datetime('now','-14 days')
           GROUP BY substr(created_at,1,10) ORDER BY day""",(brand["id"],)).fetchall()
        unique=c.execute("""SELECT COUNT(DISTINCT sid) n FROM events WHERE brand_id=?
           AND kind='visit' AND created_at>=datetime('now','-30 days')""",(brand["id"],)).fetchone()["n"]
    return {"totals":{r["kind"]:r["n"] for r in totals},"unique_sessions":unique,
            "games":{r["game"]:r["n"] for r in games},"days":[dict(r) for r in days],
            "note":"Anonymous client-supplied events. Not verified unique people or sales attribution."}

class AIInput(BaseModel):
    audience: str = Field(default="",max_length=100)
    mood: str = Field(default="",max_length=100)

@app.post("/api/brands/{slug}/ai-suggest")
def ai_suggest(slug:str,data:AIInput,request:Request):
    user=user_from(request)
    brand=owned_brand(slug,user)
    throttle(request,"ai",6,3600)
    key=os.getenv("PWYW_OPENAI_API_KEY","")
    if not key:
        return {"ai":False,"tagline":brand["tagline"] or "A little play makes the wait brighter.",
                "accent":brand["accent"],"note":"AI not configured. Your brand is fully usable without it."}
    day=datetime.now(timezone.utc).date().isoformat()
    with db() as c:
        count=c.execute("SELECT calls FROM ai_calls WHERE brand_id=? AND day=?",
                        (brand["id"],day)).fetchone()
        if count and count["calls"]>=3:
            raise HTTPException(429,"Daily AI suggestion limit reached")
        c.execute("""INSERT INTO ai_calls(brand_id,day,calls) VALUES(?,?,1)
          ON CONFLICT(brand_id,day) DO UPDATE SET calls=calls+1""",(brand["id"],day))
    prompt=f"""Generate ONE short, playful but not salesy tagline for a waiting-room mini-game lounge.
    Brand: {brand['name'][:65]}. Industry: {brand['industry']}. Audience: {data.audience}.
    Mood: {data.mood}. Existing tagline: {brand['tagline']}.
    Output only tagline plain text, maximum 85 characters. No claims, discounts, or prizes."""
    try:
        body=json.dumps({"model":os.getenv("PWYW_OPENAI_MODEL","gpt-4o-mini"),
                         "messages":[{"role":"system","content":"You write tasteful German or English microcopy for families and businesses. No markdown."},
                                     {"role":"user","content":prompt}],
                         "max_tokens":70,"temperature":0.7}).encode()
        req=urllib.request.Request("https://api.openai.com/v1/chat/completions",
            data=body,headers={"Authorization":"Bearer "+key,"Content-Type":"application/json"})
        with urllib.request.urlopen(req,timeout=12) as response:
            result=json.load(response)
        tagline=result["choices"][0]["message"]["content"].strip().strip('"')[:85]
        return {"ai":True,"tagline":tagline,"accent":brand["accent"]}
    except Exception:
        raise HTTPException(503,"AI unavailable. Current branding is unaffected.")

@app.get("/qr/{slug}.svg")
def qr_svg(slug:str,request:Request):
    public_brand(slug)
    from qrcode.image.svg import SvgPathImage
    from urllib.parse import urlencode
    # A QR on an objective-specific campaign must open that exact campaign.
    # Reject unknown values rather than embedding arbitrary untrusted query content.
    objective=request.query_params.get("objective","")
    language=request.query_params.get("lang","")
    if objective and objective not in {"upsell","return","refer","learn"}:
        raise HTTPException(422,"Invalid campaign objective")
    if language and language not in {"de","fa"}:
        raise HTTPException(422,"Invalid language")
    params={"src":"qr"}
    if objective:params["objective"]=objective
    if language:params["lang"]=language
    url=(PUBLIC_URL or str(request.base_url).rstrip("/"))+"/play/"+slug+"?"+urlencode(params)
    img=qrcode.make(url, image_factory=SvgPathImage, box_size=12,border=3)
    out=io.BytesIO()
    img.save(out)
    return Response(out.getvalue(),media_type="image/svg+xml",
                    headers={"Content-Disposition":f'attachment; filename="{slug}-qr.svg"',
                             "Cache-Control":"no-store"})

@app.get("/api/health")
def health():
    with db() as c:
        count=c.execute("SELECT COUNT(*) n FROM brands").fetchone()["n"]
    return {"ok":True,"service":"pwyw","brands":count}

@app.get("/")
def homepage():
    return FileResponse(BASE/"static"/"index.html")

@app.get("/admin")
def admin_page():
    return FileResponse(BASE/"static"/"admin.html")

@app.get("/dashboard")
def dashboard():
    return FileResponse(BASE/"static"/"dashboard.html")

@app.get("/play/{slug}")
def play(slug:str):
    public_brand(slug)
    return FileResponse(BASE/"static"/"play.html")

@app.get("/demo")
def demo():
    return RedirectResponse("/play/luna-cafe")

import campaigns
campaigns.install(app, db, user_from, owned_brand, public_brand, throttle)
import brandpack
brandpack.install(app, db, user_from, owned_brand, public_brand, throttle, DATA)
import admin_api
admin_api.install(app, db, user_from)

app.mount("/static",StaticFiles(directory=BASE/"static"),name="static")
