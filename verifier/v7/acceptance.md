# PEACH v7 — workout cockpit acceptance

Created 2026-11-25 in response to the repeated assessment that the product still feels unfinished. This version measures task-first hierarchy and gym usability, not feature count.

## Release gates

1. At 360×800, a new user's first workout shows the day status, primary set action, active exercise name, prescription and both editable set fields before the bottom navigation; no horizontal overflow.
2. The active workout reads as one ordered flow: session status → exercise plan → current set. Coaching, evidence and novice guidance remain available but do not displace set entry.
3. Completed and upcoming exercises use a quiet continuous list with clear progress states; the current exercise is visually dominant without nested decorative cards.
4. The primary action names the actual next set and exercise. Existing `[data-quickset]`, `[data-firstset]`, focus mode, `[data-done]`, persistence and timer handoff remain the only save path.
5. Full-screen set entry remains usable at 320×568 and 360×800, with 44px minimum touch targets, visible validation, keyboard/Escape/focus-trap support and no clipped CTA.
6. The welcome screen preserves all v6 first-viewport choices and original user logo. Progress, settings, light/dark themes and completion retain v5/v6 behavior.
7. All v6 full-functional and release-flow checks pass, updated only for intentional copy/layout changes. Zero console errors and first-party request failures.
8. Cache is `peach-flagship-10`; every core asset returns HTTP 200 publicly and a repeat offline reload succeeds.
9. Screenshots of welcome, first workout, continued workout, set focus, rest, progress and settings are visually inspected at mobile and desktop sizes. Any defect found is fixed and the affected check rerun.
10. Product, verifier and timestamped successful/failed run logs are committed and published; `flagship-ui-v7` is created only after public acceptance.