# Home and projects QA — 2026-10-03

Source: `../../design/home-approved.jpg`, the user's selected warm charcoal,
dark walnut and warm-white homepage. It is 1485 × 1059 pixels. The browser was
set to 1486 × 1059 CSS pixels and produced 1486 × 1059 pixels (1:1 density).
The one-pixel width difference is retained, not stretched. State: home, all
panels closed, settled entrance animation, top of page.

## Visual comparison

- `comparison-initial.jpg`: approved reference left, initial implementation right.
- `comparison.jpg`: approved reference left, final browser implementation right.
- `typography-comparison.jpg`: matching 810 × 425 crops of the intro panel,
  reference left / implementation right, inspected at readable size.
- `desktop.jpg`, `mobile-top.jpg`, `mobile-bottom.jpg`: browser captures.
- `projects.jpg`: real 3D collection with the shared header and white plaques.

Initial P2 findings: overly bright backdrop with peripheral plants, high-contrast
stone on the monogram and button, too-wide display font, cold/green accents in
the collection. The implementation now uses a dark plaster backdrop, screened
stone surfaces, corrected serif typography, warm-white buttons and physical
ceramic plaques. Subsequent mobile checks found a misplaced Telegram link and
wrapping year ranges; explicit header grid placement and two-line education rows
fixed them. A fourth legacy navigation tab would overflow at 390 px; the existing
brand now provides the home link while preserving three legacy tabs.

Final full and focused comparisons were opened together with the reference.
No outstanding P0/P1/P2 findings.

## Required fidelity surfaces

- Typography: serif display headings and Inter body, correct hierarchy and
  readable Russian copy. Small OS font-rendering differences remain (P3).
- Layout: six sections, 16 px desktop gutters, roughly 7:5 upper grid and 5:7
  footer grid. Main frame fits at the comparison size. Responsive checks at
  320, 390, 900 and 1486 px show no overflowing cards or header controls.
- Colour: warm charcoal/plaster, dark walnut and matte warm white. Shared
  header, navigation, modal panels and project CTAs no longer have green accents.
- Imagery: genuine existing raster stone/wood/plaster textures, compressed for
  the homepage. Existing Phosphor icon set and typographic E. identity reused.
  Buildings are the existing interactive 3D models, not flattened mock imagery.
- Content: existing author-approved facts, five projects, education, award and
  contact destinations retained. No new employment or metrics invented. The
  mock's decorative date is replaced by a useful full-resume link. Projects
  are separate from the homepage.

## Browser verification

- Home → projects → ARGUS miniature → case drawer → ARGUS demo → city → home.
- Browser Back/Forward restores city/home and collection selections.
- Education and About panels open; Escape closes and restores trigger focus.
- Telegram href is `https://t.me/ye1nurn`; mail href is the supplied email.
  No message was sent and no mail application was launched.
- Full resume accessible on mobile; brand returns home. Demo routes retained.
- City ArrowLeft/A input changed the rendered scene from overview to follow.
- Mobile education and contact sections inspected, with no cut-off years/links.
- Home creates zero canvas elements. Rendered browser console: no error entries.
- Entrance and hover motion use opacity/transform. Reduced-motion rules reviewed
  in code; an OS-level reduced-motion emulation was not available in this browser.

## Follow-up polish

P3 only: illustrative lighting, exact serif rasterization and stone microtexture
cannot be pixel-identical to an image-generated screenshot. The existing voxel
buildings intentionally retain their live 3D geometry and controls.

final result: passed
