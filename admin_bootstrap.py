"""Idempotent, stdin-only operator provisioning using Publisher Actions secrets.

Secrets are never logged, committed or returned over HTTP. A fingerprint of the
last *deployed* secret prevents ordinary redeployments from overwriting a
password that an administrator has deliberately changed in the UI.
"""
import sys

def main():
    email=sys.stdin.readline().strip().lower()
    password=sys.stdin.readline().rstrip("\n").rstrip("\r")
    if email.count("@")!=1 or any(ch.isspace() for ch in email) or "." not in email.split("@")[1]:
        raise SystemExit("Invalid admin email")
    if len(password)<20 or len(password)>256:
        raise SystemExit("Operator password must have at least 20 characters")
    import app
    with app.db() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS operator_secret_sync (
          email TEXT PRIMARY KEY, deployed_secret_hash TEXT NOT NULL
        )""")
        synced=con.execute("SELECT deployed_secret_hash FROM operator_secret_sync WHERE email=?",(email,)).fetchone()
        row=con.execute("SELECT id,role,password_hash FROM users WHERE email=?",(email,)).fetchone()
        if row and row["role"]!="admin":
            raise SystemExit("Existing merchant account cannot be silently promoted")
        if synced and app.check_password(password,synced["deployed_secret_hash"]):
            print("Operator secret unchanged; existing account credentials preserved")
            return
        if row:
            if not app.check_password(password,row["password_hash"]):
                con.execute("UPDATE users SET password_hash=? WHERE id=?",
                            (app.password_hash(password),row["id"]))
                con.execute("DELETE FROM sessions WHERE user_id=?",(row["id"],))
                print("Operator password synced from updated Actions secret; sessions revoked")
            else:
                print("Existing operator credentials already match configured secret")
        else:
            con.execute("INSERT INTO users(email,password_hash,role) VALUES(?,?,?)",
                        (email,app.password_hash(password),"admin"))
            print("PWYW operator created")
        con.execute("""INSERT INTO operator_secret_sync(email,deployed_secret_hash) VALUES (?,?)
           ON CONFLICT(email) DO UPDATE SET deployed_secret_hash=excluded.deployed_secret_hash""",
           (email,app.password_hash(password)))

if __name__=="__main__":
    main()
