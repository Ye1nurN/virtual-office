# Centred buildings and visitor placement — 2026-09-29

The screenshot was interpreted as a request to centre each building on its own parcel. Office moved from `(0, -21.4)` to `(0, -23)`, pharmacy from `(-22.1, 0)` to `(-24, 0)`, and ARGUS from `(22.4, 0)` to `(24, 0)`. Parcel centres and streets stay fixed. Facades still face the plaza; entry points, return positions and front landscaping follow the building frame.

The old pharmacy and ARGUS visitors were beside planters at their previous world-space positions. `districtPeople()` now derives each project visitor from its facade, off to one side of the doorway. Six standing visitors have body-sized collision footprints. The eastern plaza visitor was also moved away from the corner tree. Two seated readers now derive their position, orientation and seat height from named benches; the northern bench faces the plaza.

Validation:

- `npm test`: **88/88 passed**, including balanced parcel setbacks, unobstructed entrance/return routes with people present, separation from furniture, actual GLB body bounds and seated-model contact height.
- `npm run build`: passed, with the existing large-chunk advisory only.
- Browser: walked from spawn to ARGUS, returned to the city, walked to the pharmacy, returned, and walked to the office. Arrivals were `(18.280, 0.006)`, `(-18.571, 0.009)` and `(-0.015, -17.288)` respectively, all stopped with the correct interaction available.
- ARGUS and pharmacy opened with E. Returning placed the player at `(16.900, 0)` and `(-17.200, 0)`, clear of visitors and planters.
- Office also opened with E and returned to the city through its normal exit control. Browser console: no JavaScript errors.

The isolated test/preview tree was refreshed with the committed source through `5fd9209`, including the portfolio header, ARGUS wall-joint fix, balanced vegetation and city guide, plus only the changes from this task. Unfinished work in the shared checkout was excluded. Tests and production build were rerun after those integrations; the guide's routes to the newly positioned buildings also pass.

Screenshots are actual captures of the running application: [pharmacy and visitors](city-centered-pharmacy.jpg), [whole district](city-centered-overview.jpg).
