# PWYW open-source game library and licensing

## What is actually in this repository

Ten complete, playable browser mini-game modes with independent business-purpose flows:

| Key | Game | Input | Engine |
| --- | --- | --- | --- |
| memory | Memory Match | touch | original DOM/CSS |
| merge | Merge Lab 2048 | swipe / arrows | original DOM/CSS |
| rush | Quick Tap | touch | original DOM/CSS |
| snake | Snake Circuit | touch swipe / arrows | original Canvas |
| breaker | Block Breaker | touch pointer / arrows | original Canvas |
| hop | Sky Hop | touch / space | original Canvas |
| orbit | Orbit Catch | touch / arrows | original Canvas |
| bloom | Bloom Pop | touch | original Canvas |
| lane | Neon Lane | touch / arrows | original Canvas |
| sequence | Sequence | touch / keys 1-4 | original Canvas |

These are independent PWYW rewrites of familiar public-domain game *mechanics*, NOT unlicensed copies of another studio's artwork or executables. The in-repository source is openly licensed under MIT (see LICENSE). The engine is self-hosted and needs no external game servers. If the commercial rights holder for A+Solution requires different licensing before resale, confirm with the repo owner first.

**Important distinction:** We have *not* claimed to ingest ten separate external GitHub games. Instead the source for all ten modes is in this public repository and available under its license. This avoids broken upstream dependencies and unclear game-asset licenses. Reuse of third-party games in future requires a per-repo code + asset + font + trademark audit and license notices.

## Sources evaluated for the broader engine decision

- Phaser game engine: https://github.com/phaserjs/phaser (MIT). Its framework can be used commercially.
- Phaser examples: https://github.com/phaserjs/examples (example code MIT, but **not assets**; do NOT copy embedded game artwork or audio into commercial campaigns without separate licenses).
- 2048 by Gabriele Cirulli: https://github.com/gabrielecirulli/2048 (MIT). PWYW has its own implementation; this repo is an inspiration/reference only.

## Branded artwork

Generated in Canvas or CSS at runtime, plus business-provided authorized PNG/JPEG/WebP files in isolated tenant storage. Businesses must hold rights to logos/photos/illustrations they upload. The production app never relies on live AI image generation.

Google Fonts are loaded via standard font CSS from the font service under their published font licences (mostly SIL OFL); verify fonts before distributing a self-hosted bundle.

## Competitive and legal limitation

The pilot provides gameplay and campaign instrumentation, but scores and visits are client-reported and not tamper proof. Do not issue monetary rewards based on raw scores. Claimed redemptions require merchant verification, and are **not** proof of incremental revenue; business experiments require a credible control group. No payment, GDPR final review or contractual service-level guarantees are provided in this pilot.
