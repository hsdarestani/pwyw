"""Optional brand artwork: real visual scenes and item sprites, isolated by tenant."""
import io
import re
import secrets
from fastapi import HTTPException, Request, UploadFile, File
from fastapi.responses import FileResponse
from PIL import Image, ImageOps

SLOTS={"scene","token"}

def install(app,db,user_from,owned_brand,public_brand,throttle,data_dir):
    root=data_dir/"art"
    root.mkdir(parents=True,exist_ok=True)
    with db() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS brand_art (
            brand_id INTEGER NOT NULL REFERENCES brands(id),
            slot TEXT NOT NULL,
            filename TEXT NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (brand_id,slot)
        )""")

    @app.get("/api/public/brands/{slug}/art")
    def art(slug:str):
        public_brand(slug)
        with db() as conn:
            rows=conn.execute("""SELECT a.slot,a.filename FROM brand_art a
              JOIN brands b ON b.id=a.brand_id WHERE b.slug=?""",(slug,)).fetchall()
        return {r["slot"]:"/brand-art/"+r["filename"] for r in rows}

    @app.post("/api/brands/{slug}/art/{slot}")
    async def upload(slug:str,slot:str,request:Request,file:UploadFile=File(...)):
        if slot not in SLOTS:raise HTTPException(404,"Unknown image slot")
        throttle(request,"brand-art",14,3600)
        owner=user_from(request)
        brand=owned_brand(slug,owner)
        raw=await file.read(2_000_001)
        if len(raw)>2_000_000:raise HTTPException(413,"Maximum image size is 2 MB")
        try:
            im=Image.open(io.BytesIO(raw))
            if im.format not in {"PNG","JPEG","WEBP"}:raise ValueError("Format")
            im=ImageOps.exif_transpose(im)
            if im.width*im.height>18_000_000:raise ValueError("Oversized")
            if slot=="scene":im.thumbnail((1600,1200))
            else:im.thumbnail((420,420))
            im=im.convert("RGBA")
            # Normalize metadata and prevent untrusted vector/script uploads.
            filename=slot+"-"+secrets.token_hex(16)+".png"
            im.save(root/filename,"PNG",optimize=True)
        except (ValueError,OSError,Image.DecompressionBombError):
            raise HTTPException(422,"Use a valid JPG, PNG or WebP image")
        with db() as conn:
            old=conn.execute("SELECT filename FROM brand_art WHERE brand_id=? AND slot=?",
                             (brand["id"],slot)).fetchone()
            conn.execute("""INSERT INTO brand_art(brand_id,slot,filename) VALUES(?,?,?)
              ON CONFLICT(brand_id,slot) DO UPDATE SET filename=excluded.filename,
              updated_at=CURRENT_TIMESTAMP""",(brand["id"],slot,filename))
        if old and re.fullmatch(r"(scene|token)-[0-9a-f]{32}\.png",old["filename"]):
            (root/old["filename"]).unlink(missing_ok=True)
        return {"ok":True,"slot":slot,"url":"/brand-art/"+filename}

    @app.get("/brand-art/{filename}")
    def art_image(filename:str):
        if not re.fullmatch(r"(scene|token)-[0-9a-f]{32}\.png",filename):
            raise HTTPException(404)
        path=root/filename
        if not path.is_file():raise HTTPException(404)
        return FileResponse(path,media_type="image/png",headers={"Cache-Control":"public,max-age=3600"})
