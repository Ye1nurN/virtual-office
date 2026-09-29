# ARGUS wall flicker — 2026-09-29

The screenshot matches the original ARGUS interior in `geometry.js` (the slanted overview and sage entrance parapets). The flicker is z-fighting: side walls end at z=7, while the parapets at z=6.9 with depth 0.2 have the same front plane. Their x extents overlap by 0.225 units at both corners.

The parapets now terminate at the inner side-wall face (x=±8.775). They meet the walls without overlapping front surfaces. The central 3.2-unit opening, wall heights, colours, lighting and navigation are unchanged.

Validation used an isolated export, refreshed to commit `14f7b95`, plus only this geometry change. Unrelated unfinished camera, guide and ARGUS bot work was not needed for the checks or included in the fix.

- Browser: reproduced the same striped corner before the fix; both joints are clean after reload and after click-to-walk / A / D move the camera.
- Console errors: none; missing models: none.
- `npm test`: 66 passed.
- `npm run build`: passed (existing large Three.js bundle warning).
- Before/after screenshots: `argus-corner-before.png`, `argus-corner-after.png`.
