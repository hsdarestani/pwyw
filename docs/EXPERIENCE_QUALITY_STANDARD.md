# PWYW Experience Quality Standard

Status: **quality program in progress**, not a certified 100/100 score.

## Product-wide promise
A first-time shop owner can choose a budget, review conservative/base/optimistic scenario assumptions, and publish a **capped 30-day pilot** without learning campaign jargon. An expert owner can edit the business identity, games, rules, offers and campaign settings without losing control. Customers can scan once and immediately choose a playable game.

## Scoring rubric (each page evaluated separately, no averaging away critical failures)
| Dimension | Weight | Acceptance expectation |
|---|---:|---|
| Task completion & information architecture | 30 | Obvious primary action, short flows, no dead-ends or misleading steps |
| Visual consistency & typography | 20 | Shared tokens, legible at 360–1440 px, consistent hierarchy and whitespace |
| Accessibility & RTL/localization | 20 | Keyboard and assistive-tech names, FA/DE, good contrast, WCAG AA target |
| Responsive behavior & performance | 15 | No accidental horizontal overflow, 44 px targets, stable layout and reduced motion |
| Data clarity & trust | 15 | No false ROI claims; forecast labeled as illustrative, actual data distinguished, budget cap verified |

**A page does not receive 100/100 based solely on screenshots or automated checks.** A 100 requires zero unresolved severe defects, independent usability testing and verified real data accuracy. WCAG scans do not substitute for screen reader tests or real human feedback.

## Mandatory release gates
1. Server tests for tenant separation, 30-day hard caps, pause, and award authorization.
2. 390px mobile E2E across signup, brand setup, budget pilot, expert mode, reward publication, QR, claim, and the game library.
3. Authenticated desktop E2E for managed and expert modes.
4. Dual-language cross-device audit: **360 / 390 / 768 / 1365** on landing, signup, arcade and admin, checking page errors, root overflow, broken images, headings and WCAG 2.1 AA issues.
5. Screenshot artifact review; visual discrepancies are fixed before promoting to main/STRATO.
6. Production deploy restricted to PWYW, then separate origin/public health checks. No unrelated services restarted.

## Working backlog for independent acceptance
- Conduct timed usability tests with a first-time café owner (budget-to-activation) and a marketer (custom rules) and time 80% success rate.
- Compare manual screen-reader use (Android TalkBack and iOS VoiceOver) with the automated audit.
- Validate the quality and integrity of historical sales attribution; do **not** label modeled sales uplift as measured ROI without verified POS data.
- Audit p75 mobile load time and core web vitals on real devices and networks.
- Audit all brand themes and actual user-uploaded assets for legibility and brand consistency.

The automated reports are created as a JSON GitHub Actions artifact; count of violations is not itself the UX score.
