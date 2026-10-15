# PWYW — Play While You Wait

A standalone, brand-native browser game lounge for small German businesses, launched by QR code. Built for fast mobile play, no app download, no player registration.

## Included in pilot

- Original playable Memory Match, 2048 and Quick Tap challenge
- Four art directions: Atelier, Neon, Garden and Pop
- Business accounts, multiple brands, logo, brand copy, QR SVG, anonymous engagement statistics
- Optional AI tagline assistant, never AI dependency at game time
- Demo /demo; dashboard /dashboard; branded lounge /play/{slug}

## Local

Install requirements.txt and httpx==0.28.1 for tests. Run with DATA_DIR pointing to a writable directory, COOKIE_SECURE=0, then uvicorn app:app --port 8080. Execute python -m unittest discover -s tests -v.

## Safety

Production deploy automation lives in Publisher because STRATO SSH credentials are stored there. Use isolated Compose project; never run full Publisher deploy for a PWYW change. See docs/DEPLOYMENT.md. This is a PILOT: do not sell as legally complete SaaS; see docs/ARCHITECTURE.md.
