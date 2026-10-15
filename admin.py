"""Server-authorized platform administration and account password rotation."""
from fastapi import HTTPException, Request, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

class PasswordChange(BaseModel):
    current_password: str = Field(min_length=10, max_length=256)
    new_password: str = Field(min_length=14, max_length=256)

def install(app, db, user_from, throttle, check_password, password_hash, base):
    with db() as conn:
        columns=[row["name"] for row in conn.execute("PRAGMA table_info(users)").fetchall()]
        if "is_admin" not in columns:
            conn.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")

    def require_admin(request):
        user=user_from(request)
        if not user.get("is_admin"):
            raise HTTPException(403, "Platform admin access required")
        return user

    @app.get("/admin")
    def admin_home():
        return FileResponse(base / "static"/"admin.html")

    @app.get("/api/admin/overview")
    def overview(request: Request):
        require_admin(request)
        with db() as con:
            users=con.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            brands=con.execute("SELECT COUNT(*) FROM brands WHERE owner_id IS NOT NULL").fetchone()[0]
            campaigns=con.execute("SELECT COUNT(*) FROM campaigns").fetchone()[0]
            visits=con.execute("SELECT COUNT(*) FROM events WHERE kind='visit'").fetchone()[0]
            completions=con.execute("SELECT COUNT(*) FROM events WHERE kind='complete'").fetchone()[0]
            claims=con.execute("SELECT COUNT(*) FROM claims").fetchone()[0]
            redemptions=con.execute("SELECT COUNT(*) FROM claims WHERE redeemed_at IS NOT NULL").fetchone()[0]
            top=con.execute("""SELECT b.slug,b.name,b.industry,b.theme,u.email AS owner,
              (SELECT COUNT(*) FROM campaigns WHERE brand_id=b.id) AS active_campaigns,
              (SELECT COUNT(*) FROM events WHERE brand_id=b.id AND kind='visit') AS visits
              FROM brands b LEFT JOIN users u ON u.id=b.owner_id
              ORDER BY b.id DESC LIMIT 150""").fetchall()
        return {"users":users,"brands":brands,"campaigns":campaigns,"visits":visits,
                "completions":completions,"claims":claims,"redemptions":redemptions,
                "recent_brands":[dict(row) for row in top],
                "disclaimer":"Usage and redemptions are not verified incremental business revenue."}

    @app.post("/api/account/password")
    def rotate(data: PasswordChange, request: Request, response: Response):
        user=user_from(request)
        throttle(request,"password-change",5,3600)
        with db() as con:
            existing=con.execute("SELECT password_hash FROM users WHERE id=?",(user["id"],)).fetchone()
            if not existing or not check_password(data.current_password,existing["password_hash"]):
                raise HTTPException(401,"Incorrect current password")
            if data.new_password==data.current_password:
                raise HTTPException(422,"Choose a new password")
            con.execute("UPDATE users SET password_hash=? WHERE id=?",
                        (password_hash(data.new_password),user["id"]))
            con.execute("DELETE FROM sessions WHERE user_id=?",(user["id"],))
        response.delete_cookie("pwyw_session",path="/")
        return {"ok":True,"message":"Password changed. Sign in again."}
