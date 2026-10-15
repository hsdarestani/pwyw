"""Idempotent, STDIN-only operator provisioning.

This file intentionally contains no passwords, hashes or credentials.
The Publisher workflow passes GitHub Actions secrets over SSH stdin.
"""
import os
import re
import sys

def main():
    email=sys.stdin.readline().strip().lower()
    password=sys.stdin.readline().rstrip("\n")
    if email.count("@")!=1 or any(ch.isspace() for ch in email) or "." not in email.split("@")[1]:
        raise SystemExit("Invalid admin email")
    if len(password)<20 or len(password)>256:
        raise SystemExit("Operator password must have at least 20 characters")
    import app
    with app.db() as con:
        row=con.execute("SELECT id,role FROM users WHERE email=?",(email,)).fetchone()
        if row:
            if row["role"]!="admin":
                raise SystemExit("Existing merchant account cannot be silently promoted")
            print("Existing operator retained; password unchanged")
            return
        con.execute("INSERT INTO users(email,password_hash,role) VALUES(?,?,?)",
                    (email,app.password_hash(password),"admin"))
    print("PWYW operator created; password never written to logs or source")

if __name__=="__main__":
    main()
