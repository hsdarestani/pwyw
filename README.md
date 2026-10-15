# PWYW® — Purpose-first branded business games

**Site:** https://pwyw.smarbiz.sbs

One reusable game engine, four business outcomes:
- **Play to Upsell:** a merchant-configured relevant add-on offer shown after a game, with merchant-verified codes and declared contribution.
- **Play to Return:** a next-visit incentive, claimed and verified by the business on real redemption.
- **Play to Refer:** shareable friend challenges and merchant-confirmed referred buyers; sharing alone does not count as a purchase.
- **Play to Learn:** play, then answer a merchant-authored knowledge check with validation on the server. Learning metrics do not prove lower support costs.

## Ten playable games

Orbit Catch · Memory Match · Merge Lab 2048 · Neon Lane · Bloom Pop · Block Breaker · Snake Circuit · Sky Hop · Quick Tap · Sequence.

All ten game modes are implemented in this repository and MIT licensed (see `LICENSE` and `OPEN_SOURCE.md` for the exact distinction from importing ten outside repositories). Artwork is procedural and/or supplied by the business.

## Visually distinctive brand worlds

Atelier · Neon · Garden · Pop · Noir · Chrome · Dream · Heritage.

Brand owners can change their name, tagline, industry, accent, logo, **illustrated/photo scene**, and **branded in-game object**. The games' canvas background, scene motifs and collectibles adapt; the experience uses distinct typography, geometry, UI patterns and brand treatment, not just a hex code.

## Pilot dashboard

Create accounts and up to five brands; select objective *before* game; publish objective-specific campaign, set default game and CTA, upload images, download QR SVG, view anonymous engagement counts and track manually verified claims. AI tagline suggestions are optional and disabled without a dedicated key. Nothing in a player's game depends on live AI.

## Safety / what is not yet production complete

- **Monetary outcome limitations:** There is no POS integration or A/B control. Claims and business-declared contribution are not causal proof of incremental profit. Never use self-reported scores to allocate rewards.
- **Commercialization:** Billing, true fraud prevention, account recovery/email verification, extended GDPR retention/export/deletion workflows, German Impressum/Datenschutz and professional legal review remain incomplete. Do not call this a launch-ready commercial SaaS.
- **Uploads:** PNG/JPG/WebP only, normalized server-side; authorization and per-tenant isolation on write.
- **Server:** Separate Docker Compose project `pwyw` with memory/CPU bounds; existing STRATO Caddy only adds a new PWYW hostname. Never restart Publisher or other tenants to deploy PWYW.

## Local development

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt httpx==0.28.1
DATA_DIR=$PWD/data COOKIE_SECURE=0 PUBLIC_BASE_URL=http://localhost:8080 uvicorn app:app --port 8080
python -m unittest discover -s tests -v
```

Browser automation: `.github/workflows/qa.yml` covers all 10 gameplay boards and studio flows using Playwright.

To deploy, use the `pwyw-strato-deploy.yml` workflow in [publisher](https://github.com/hsdarestani/publisher/actions/workflows/pwyw-strato-deploy.yml) — SSH secrets remain **only** in the publisher repository.

The product is a software experiment, not proven ROI. Measure verified redemptions and customer retention through real pilots before claiming business outcomes.
