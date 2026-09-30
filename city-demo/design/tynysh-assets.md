# Tynysh assets

- Selected visual truth: `tynysh-reference.png`, the second displayed image from the user's ideation set, 1487 × 1058.
- Full scene: real Three.js geometry and the existing office GLB employees. Furniture/collision service points live in `src/city/tynyshLayout.js`; animation uses the same task state as React.
- Floor raster: `public/textures/tynysh-parquet-albedo.png`, ImageGen, 1254 × 1254, flat seamless honey oak herringbone, repeats every 4 metres. Consumed by `tynysh.js` through `loadTynyshSurfaces` and sceneKit.surface.
- Floating card portrait: `public/textures/tynysh-staff-avatar.png`, ImageGen, 128 × 128, dark hair, white shirt and sage vest on mint. Displayed at 42 × 45 desktop and 32 × 36 mobile by `TynyshExperience.jsx`.
- Icons: existing `@phosphor-icons/react`. Font: existing Inter Variable. No new runtime dependency.
- Reference composition: top navigation 57 px; floating task card approximately 284 × 210; bottom transport approximately 560 × 65; scene spans the viewport. Mobile replaces the side card with a low compact status strip and a scrollable management dialog.
