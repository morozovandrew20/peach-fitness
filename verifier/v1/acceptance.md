# PEACH flagship acceptance v1

1. Core flow: fresh onboarding, level selection, first workout, set editing, set completion, rest controls, progress and settings all work.
2. Workout UX: current exercise and next action are obvious; active set is usable with one hand at 360 px; rest offers pause, ±30 seconds, minimize and skip.
3. Technique: every programmed exercise has readable technique guidance; primary compound lifts have polished visual guidance without external runtime dependencies.
4. Visual system: cohesive light/dark themes, readable type, clear selected/completed states, no horizontal overflow at 360/768/1440 px.
5. Accessibility: visible focus, keyboard-operable dialogs and controls, touch targets at least 44 px, reduced-motion support.
6. Reliability: JavaScript parses, zero browser console errors, zero failed first-party requests, local fonts and assets load, service worker updates and offline reload work.
7. Data safety: existing localStorage records survive the update; training calculations and programme structure are unchanged unless separately documented.
8. Delivery: public GitHub Pages version matches the verified source and repeats the core smoke test successfully.