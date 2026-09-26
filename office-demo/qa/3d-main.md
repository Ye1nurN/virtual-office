# 3D as the default — 2026-09-26

- `/` now mounts `WorldScene` unconditionally. The image-backed component, its stylesheet, and the version switch were removed. Reference images and the independent model catalogue remain.
- Keyboard input now accepts a recognised physical control first, then the printed movement key (including D/В) for unknown/remapped codes, and a numeric fallback only when the printed key is unavailable. Captured key events and held-key identities protect propagation and release handling. Text entry and blocked UI still suppress movement.
- 37 movement, rendering, world and hosting tests passed. Vite production build and Sites preparation passed.
- In-app browser at `/`: D moved the player from (0.000, 8.900) to (0.104, 8.840); uppercase D to (0.161, 8.807); ArrowRight to (0.265, 8.747). Typing `dd` into search left that position unchanged.
- Floor menu successfully switched 1 → 2 → 1; no missing models were reported. The old image-version switch is absent.
- Cyrillic В compatibility is covered by automated input tests. The browser automation does not support sending that character as a key press, so it was not validated through a physical Russian-layout keyboard.
- The user's original regular-browser D failure was not reproduced; this is a compatibility fix, not a confirmed diagnosis of their browser or keyboard.
- Screenshot: `3d-main.png`.
