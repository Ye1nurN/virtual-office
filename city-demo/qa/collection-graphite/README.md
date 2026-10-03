# Shared graphite projects theme — 2026-10-04

Request: adapt the existing projects gallery to the approved homepage. The source of the visual language is `design/home-graphite-approved.png` and the working homepage. Preserve real 3D buildings, rotation, project changes and case/demo routes.

## Changes verified

- Shared neutral graphite/white palette, Roboto body, Times display headings, header sizing, white monogram, focus treatment, drawer and toast styling. These now live in `gallery-theme.css`; home no longer maintains a divergent override set.
- Reused existing charcoal wall and panel raster assets. Project copy sits in a rounded graphite card with white/outlined actions, matching home.
- Replaced gallery-only timber and warm stone colouring with matte graphite shelves, white ceramic plinths and neutral lighting. Building colours, windows, foliage, camera framing, contact geometry and shadow infrastructure are preserved.
- Removed historical collection CSS overrides and obsolete header/shelf/quote styles; kept one responsive layout and existing 460 ms WebGL crossfade.

## Browser evidence

- `desktop.jpg`, `overview.jpg`, `case.jpg` and `home-regression.jpg`: 1485 x 1059. Opened and visually inspected matching header, typography and neutral surfaces. Home retained its measured layout after extracting the shared theme.
- `final.jpg`: 1485 x 1240, complete featured pharmacy and miniature shelf visible.
- `rotated.jpg`: ARGUS after ArrowRight, with visible rotation and keyboard focus.
- `mobile-top.jpg`, `mobile-controls.jpg`: 390 x 844, model, copy, CTAs and two-column miniature shelves.
- `before.jpg`: historical 1280 x 720 warm gallery capture; not used as a pixel comparison with the wider final viewport.
- Checked 320, 390, 900, 1280 and 1485 px views. No overflowing text, project controls, headings, header or breadcrumbs found in the inspected states.
- Home -> Projects; pharmacy -> ARGUS -> all five projects -> Home; mobile pharmacy -> Uniqs; case opening and Escape; ArrowRight rotation; Uniqs demo launch and browser Back all worked. The live demo loaded its original 3D room and controls.
- Fresh final browser tab: no console errors, one canvas for the collection. An earlier development-only hot reload error occurred while replacing the CSS file, then disappeared on the fresh page.
- Reduced-motion rules retained in shared CSS and renderer; reviewed, not OS-emulated.

## Validation

`npm test`: 124/124 passed. `npm run build`: passed. The existing large shared city/GLTF chunk warning remains an advisory. No dependencies were added. City and interior source/materials were not changed.

## Findings

- Resolved: incompatible warm material/font/button palette between home and projects.
- Resolved during iteration: repeating panel albedo created obvious seams on the shelf; use a neutral material with subtle bump relief instead.
- Resolved during iteration: shared hover selector could obscure the white CTA label; the collection CTA now explicitly keeps dark text.
- No remaining P0/P1/P2 visual or interaction issues in tested states. Small 3D labels remain model-scale details on narrow screens; accessible button names identify every project.

final result: passed
