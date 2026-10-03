# Shared gallery textures

WebP derivatives of this project's existing generated textures in `public/collection`:

- `plaster.webp`: `plaster.png`, resized to 768 × 768.
- `stone.webp`: `travertine.png`, resized to 640 × 640.
- `walnut.webp`: `walnut.png`, resized to 768 × 768.
- `wall.webp`: `gallery-backdrop-v2.png`, 1536 × 1024.

The original files remain intact for the 3D stage. These smaller derivatives
serve the homepage and shared header; the gallery also uses the compressed wall.
No external stock imagery or remote image dependency was added.

## Graphite homepage — 2026-10-03

Source style reference: `design/home-graphite-approved.png`. The homepage uses
`charcoal-wall-v2.webp` (1485 x 1059, 34 KB) and `charcoal-panel-v2.webp`
(1536 x 1024, 159 KB). Generated with the built-in ImageGen tool; saved in the
repository and WebP-encoded without programmatic recolouring. Typography and
controls remain HTML; no screenshot is used as a substitute for live UI.

As of 2026-10-04 these two neutral textures also serve the projects gallery:
the same wall and detail-card surface are shared with home. At the user's
request, the real 3D shelves use the existing `collection/walnut.png` albedo
and bump map, with a dark matte walnut material. The existing
travertine texture contributes only surface relief to white ceramic plinths;
its warm albedo is no longer used by the gallery furniture. No new generated
assets or recoloured bitmap copies were needed. City building materials stay
in the shared building catalogue.

Wall prompt:
> Use case: style-transfer. Asset type: text-free raster material background for a portfolio homepage, landscape aspect ratio 1485:1059. Input image is a style reference ONLY: use the subtle near-black embossed background material visible around the outer edges of the supplied screenshot. Produce ONLY that empty material background across the entire canvas. Neutral charcoal base approximately #0d0f10, delicate low-relief swirling leather/plaster grain and extremely faint soft tonal variation. Texture should be most perceptible along the outer perimeter and very understated at the center, suitable underneath HTML cards. Keep the whole image nearly black, subtle and neutral grayscale. No brown, bronze, gold, green or blue color cast. NO interface panels, cards, borders, buttons, letters, numbers, text, logo, symbols, icons, objects, framing, gradient spotlights or bright areas. Do not reproduce the screenshot layout. Show only the fine dark charcoal surface; no sharp noise, no flat empty black. Opaque background.

Panel prompt:
> Use case: stylized-concept. Asset type: text-free material raster for a dark premium portfolio homepage card, intended to sit under live UI text. Generate a wide 1536x1024 rectangular edge-to-edge material image only. Quiet neutral charcoal graphite brushed/plaster glass surface: nearly black #141617 base, very subtle broad diffuse diagonal illumination increasing toward upper right to #242627, lower left around #111314. Fine microscopic grain and almost imperceptible fine brushed diagonal texture. It must be understated, smooth, low contrast, professional, closely resembling softly illuminated graphite card material. Neutral grayscale appearance throughout, no hue cast. Flat front view, whole image filled by material. No borders, no corners, no bevel, no frame, no object edge, no drop shadows, no text, no letters, no icons, no UI, no objects, no visible bright stripe, no strong noise, no dramatic light, no blue, brown, green, gold, or silver metallic glare. This is a quiet panel texture, not an illustration or a showpiece.
