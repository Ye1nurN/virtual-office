# City perimeter — 2026-09-29

The paving now ends at an 84 × 84 m stone-edged platform. A low stone and metal fence encloses the quarter, with exterior planting, closed gates on the four street axes, district expansion signs and a main entrance arch. Side approach trees were removed to keep the gateways accessible. The existing projects, reserve plots and city interface retain their positions.

`src/city/cityBoundary.js` supplies both the visible geometry and solid footprints. The fence is at ±40.6 m, inside the ±41 m navigation safety bounds. Gateways remain closed until an actual neighbouring district is connected; an apparently open road never ends at an invisible wall.

Validation used the isolated `city-facing-plaza` worktree with the previously verified building-facing changes and only this task's additional source changes. Unrelated work in the main checkout was not included.

- `npm test`: **63/63 passed**. New coverage samples the entire perimeter, gate seams and corners; checks high-speed and diagonal escape attempts, routes to and from all four gateways, outside click targets, and agreement between visible bases and solid footprints. Existing entrance, return-spawn and reserve-plot routes still pass.
- `npm run build`: passed; only the existing large-chunk advisory remains.
- Production build at `http://127.0.0.1:4181/`: inspected full perimeter at 70% overview zoom and followed the southern approach on foot.
- Keyboard approach stopped at `(1.844, 40.040)`. Further Shift+S input slid along the closed gate to `(2.380, 40.040)` without crossing it. W moved freely back into the city to `(1.019, 37.682)`.
- A click on the outside grass left the player at `(1.019, 37.682)` with `moving=false` and displayed the existing free-path hint.
- Browser console: no JavaScript errors. Missing-model list empty.

Screenshots: [whole quarter](city-boundaries-overview.jpg), [main gate](city-boundaries-gate.jpg). These are captures of the running 3D application.

Integration check: the portfolio interface (`7775749`) arrived while this task was being verified. The exact committed source at `698fe2d`, including that interface, was then exported into the same isolated preview and rebuilt: **66/66 tests passed**, production build passed, and the current portfolio view displayed the perimeter without JavaScript errors. The overview screenshot was refreshed from this combined build; the gate close-up records the earlier movement check with unchanged scene and navigation code.
