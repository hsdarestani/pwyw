"""Read-only operator admin console; no merchant data mutation via admin endpoints."""
from fastapi import HTTPException, Request
from pydantic import BaseModel, Field

class ChangePassword(BaseModel):
    old_password: str=Field(min_length=10,max_length=256)
    new_password: str=Field(min_length=14,max_length=256)

def install(app,db,user_from):
    def require_admin(request):
        user=user_from(request)
        if user.get("role")!="admin":
            raise HTTPException(403,"Administrator access required")
        return user

    @app.get("/api/admin/overview")
    def overview(request:Request):
        require_admin(request)
        with db() as c:
            users=c.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            brands=c.execute("SELECT COUNT(*) FROM brands").fetchone()[0]
            active=c.execute("SELECT COUNT(*) FROM campaigns WHERE is_active=1").fetchone()[0]
            sessions=c.execute("SELECT COUNT(*) FROM sessions WHERE expires_at>strftime('%s','now')").fetchone()[0]
            stats=c.execute("""SELECT COUNT(*) sessions,
                COALESCE(SUM(CASE WHEN kind='start' THEN 1 ELSE 0 END),0) starts,
                COALESCE(SUM(CASE WHEN kind='complete' THEN 1 ELSE 0 END),0) completions
                FROM events WHERE created_at>=datetime('now','-30 days')""").fetchone()
            claims=c.execute("""SELECT COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN redeemed_at IS NOT NULL THEN 1 ELSE 0 END),0) redeemed
                FROM claims""").fetchone()
            return {"users":users,"brands":brands,"active_campaigns":active,
              "live_sessions":sessions,"events_30d":dict(stats),"claims":dict(claims),
              "disclaimer":"Statistics are client events and merchant-verified claims, not causal incremental revenue."}

    @app.get("/api/admin/users")
    def users(request:Request):
        require_admin(request)
        with db() as c:
            rows=c.execute("""SELECT u.id,u.email,u.role,u.created_at,COUNT(b.id) brands
                FROM users u LEFT JOIN brands b ON b.owner_id=u.id
                GROUP BY u.id ORDER BY u.id DESC LIMIT 300""").fetchall()
        return [dict(row) for row in rows]

    @app.get("/api/admin/brands")
    def brands(request:Request):
        require_admin(request)
        with db() as c:
            rows=c.execute("""SELECT b.slug,b.name,b.industry,b.theme,b.created_at,
                    COALESCE(u.email,'DEMO') owner,
                    (SELECT COUNT(*) FROM campaigns x WHERE x.brand_id=b.id) campaigns,
                    (SELECT COUNT(*) FROM events x WHERE x.brand_id=b.id
                        AND x.kind='start') game_starts,
                    (SELECT COUNT(*) FROM claims q JOIN campaigns x ON x.id=q.campaign_id
                        WHERE x.brand_id=b.id AND q.redeemed_at IS NOT NULL) redemptions
                    FROM brands b LEFT JOIN users u ON u.id=b.owner_id
                    ORDER BY b.id DESC LIMIT 500""").fetchall()
        return [dict(row) for row in rows]

    @app.post("/api/account/change-password")
    def change_password(data:ChangePassword,request:Request):
        import app as main
        user=user_from(request)
        with db() as c:
            stored=c.execute("SELECT password_hash FROM users WHERE id=?",
                (user["id"],)).fetchone()
            if not stored or not main.check_password(data.old_password,stored["password_hash"]):
                raise HTTPException(403,"Incorrect current password")
            if data.old_password==data.new_password:
                raise HTTPException(422,"Choose a different password")
            c.execute("UPDATE users SET password_hash=? WHERE id=?",
                (main.password_hash(data.new_password),user["id"]))
            c.execute("DELETE FROM sessions WHERE user_id=?",(user["id"],))
        return {"ok":True,"note":"Password changed; sign in again."}
