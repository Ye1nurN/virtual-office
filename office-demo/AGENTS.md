# Prototype Instructions

Keyboard compatibility (2026-09-26): the user reports D failing everywhere in a regular browser while ArrowRight works. Preserve physical WASD codes; also resolve D/В and the other movement letters from KeyboardEvent.key when code is empty or Unidentified. Use the same resolution for keydown and keyup, without moving while typing or inside blocked UI. The exact user-side failure was not reproduced in IAB; do not describe its cause as confirmed.

Diagonal office view (2026-09-26): the user asks to add an inclination to the office itself. Show the office diagonally using a 30° horizontal camera azimuth while retaining the restored approximately 40° elevation, zoom and continuous player following. Map keyboard movement to screen directions; preserve floor geometry and collisions.

Camera angle restored (2026-09-26): after previewing 30°, the user asks to return to the previous angle. Use the prior rig: height 15 m over the target and horizontal distance 18 m (approximately 39.8° to the horizon). Keep the zoom and player-follow behaviour.

Follow-camera refinement (2026-09-26): use a closer, slightly lower-angle camera locked to the player. The camera follows continuously, and the self label must remain stable during movement. Increase furniture/decor colour richness toward the reference. Remove exterior plants, close missing room boundaries, keep walls within the floor perimeter, and retain an exterior entrance only on floor 1. These changes apply to `?view=3d`; preserve the original image demo and model catalogue.

Implementation authorized (2026-09-26): the user now explicitly requests execution of `design/four-floor-vision/implementation-prompt.md`. Assemble and test all four floors in `?view=3d` using the supplied model library; preserve `/` and `models.html`. This supersedes earlier instructions to stop at model production or prompt writing.

UI reference clarified (2026-09-26): for the future interactive 3D office, match the floating interface in `design/four-floor-vision/ui-reference.png` (new user attachment). The four-floor layout and corrected reception approach remain separate spatial references. The requested Codex/Cursor implementation prompt is saved at `design/four-floor-vision/implementation-prompt.md`; writing that prompt does not itself authorize executing it or replacing the default image demo.

Full model kit request (2026-09-26): prepare all reusable object types visible in `asset-library/review/four-floor-plan.png`, following `four-floor-audit.md`. Deliver separate GLBs, editable Blender source and a browsable catalogue. Do not assemble the four floors yet. Preserve the original image demo. Ambiguous tiny equipment may have explicitly documented modular interpretations; do not call these exact recovered originals. Keep earlier atrium-only assets as a labelled reserve.

Entrance circulation feedback (2026-09-26): the user requires a direct unobstructed route from the first-floor entrance to reception. Waiting sofas and tables belong at the sides, clear of the entrance and meeting-room doorways. Revised concept: `design/four-floor-vision/02-company-map-entry-v2.png`. This is a concept edit, not yet implemented in the 3D demo.

Current user decisions: retain the chosen floating UI and daytime 3D office. Keyboard movement must support physical WASD keys (including Russian layouts) and arrow keys. Keep text entry and open panels/dialogs from moving the player. Prioritize efficient rendering without changing the office's appearance.

Latest visual decision (2026-09-26): the user explicitly rejected the simplified visual result and requires the attached design exactly. Authoritative reference: `public/assets/approved-design.png` (1280 × 910), copied from `codex-clipboard-539f8924-943c-4080-9453-09f42c49488d.png`. Match the entire image, including scene art, lighting, character proportions, furniture, camera, and UI. Do not declare the design matched by evaluating only UI and excluding major scene differences. The earlier visual QA pass is superseded by this requirement.

The user then explicitly chose: «Сделать точное демо на основе изображения», after being told this provides working UI but no free 3D movement. The default app is therefore an image-backed interactive prototype, using the original supplied pixels plus semantic buttons, fields, and panels. Preserve its full aspect ratio instead of stretching/cropping the approved starting view. Do not claim it is live 3D. Keep the previous actual 3D scene and its WASD/rendering work available at `?view=3d` for later development; do not reintroduce it into the default view without a new user decision.

Next user request (2026-09-26): reconstruct reusable actual 3D objects from that same reference for later assembly of the complete office. Build a separate editable asset library and browser inspection page; preserve the approved image demo as the default. Single-view reconstructions cannot establish hidden surfaces or true dimensions. Describe the models as reconstructions and distinguish visual similarity from an exact recovered original. Use metre scale, ground-level origins, semantic component names, portable materials, and separate GLB exports with Blender source.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
