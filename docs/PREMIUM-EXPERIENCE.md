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
- Existing browser suite passes on Chromium: German/Persian, mobile/desktop, all ten games, touch controls, signup, brand creation, campaign publishing and claim issuance.
- Added browser checks for preview selection, workspace shortcut expansion, language switching and logout contrast. The first supplemental run exposed an open settings dialog in the test setup; the test now closes it before using the workspace. Final rerun is pending because the fresh runtime Chromium process exits with SIGSEGV before opening a page. The earlier complete existing browser suite passed before these final localization/contrast/test adjustments.
- Visual inspection covered landing, signup, merchant workspace, player selection and canvas gameplay.

## Release

This branch has not been pushed or deployed. When releasing, push the branch, verify CI, integrate into main, and use the existing isolated PWYW Publisher deployment workflow. Do not restart adjacent services.
