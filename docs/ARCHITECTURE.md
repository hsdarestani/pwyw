# PWYW pilot architecture

Multi-tenant FastAPI + SQLite with original mobile-first games and responsive vanilla HTML/CSS/JS. Public games require no account; businesses register to create independent brands, styles, upload a logo, download QR SVG and view basic analytics. Four art directions: Atelier, Neon, Garden, Pop. No third-party copyrighted game assets. AI is optional and limited to brand tagline suggestions; gameplay itself is deterministic and zero API cost.

Password hashes use PBKDF2, cookie sessions are HttpOnly and SameSite, ownership protects stats and editing, public events are anonymous-ish session IDs and are unverified. No advertising trackers. Game leaderboards rely on self-reported scores and must NOT be used to allocate prizes. No billing, email verification, password reset, full GDPR data deletion/export, production rate limit scaling or automatic event retention yet. Legal pages and privacy review required before commercial launch.
