# PWYW premium product experience

The public landing, business workspace and player share violet, deep plum, lime accents, rounded surfaces and locally served Manrope/Vazirmatn fonts. Merchant-specific player themes remain intact.

## Changes

- Landing: larger editorial hero, interactive three-game artwork preview, raised primary action, product stage, contrasting benefit cards and a clearer closing section. Existing concise German/Persian copy and registration links are preserved.
- Signup: branded welcome panel, polished form and tab states, password length feedback, visible focus and consistent spacing.
- Workspace: overview metrics, reward rules, QR sharing and settings use the same visual system. Localized shortcuts open the appropriate collapsed tool and move keyboard focus to it.
- Player: game cards, start action, scoreboard, touch surfaces, result dialog and reward code have consistent shapes and depth. Existing merchant colors remain authoritative.
- Gameplay: actual score changes receive brief visual feedback. Canvas catches show floating points, with bounded lifetime. Finishing a round displays a short celebration, without making a claim about prize eligibility. Finished canvas loops stop. Reduced-motion preferences disable decorative motion.
- Performance: remove four external Google Fonts imports; bundle the required Latin and Arabic font subsets with their OFL licenses.

## Validation

- 13 API tests pass, including tenant isolation, reward budgets, claims and redemption.
- Final GitHub Actions browser run 40126452611 passed on the exact release content: German/Persian, mobile/desktop, all ten games, touch controls, signup, brand creation, campaign publishing and claim issuance.
- Additional browser checks passed for preview selection, workspace shortcut expansion, language switching and logout contrast.
- Visual inspection covered landing, signup, merchant workspace, player selection and canvas gameplay.

## Release

Merged through PR #11 as commit 0a36b7b98b1c7522ff7a845395af6afe3181fa6e.
The isolated PWYW Publisher deployment 40126598780 completed successfully on 24 October 2026, including origin and public HTTPS health checks.
The deployment workflow is pinned to this tested release commit. Update that pin for future releases.

