# Portfolio interface

The city entrance now uses `PortfolioCity`. The existing `CityApp` still owns
interior destinations and their demo state. Returning from an interior passes
the entrance spawn back into the portfolio city.

- `content.js`: public name (Елнур), project stories, skill-to-project mapping,
  optional direct contacts and CV, and validated shareable routes.
- `PortfolioCity.jsx`: city/resume switch, first screen, navigation, accessible
  modal project details, search, contact panel and city controls.
- `portfolio.css`: styles scoped to `.pf-*`; no redesign of interior demo UIs.

Routes: `?view=city`, `?view=resume`, and
`?view=resume&project=pharmacy` (also `office` and `argus`). Without an explicit
view, screens up to 720px start with the document view. No 3D scene, model loading
or WebGL context is created while that view is open. JavaScript dependencies
are still shared with the main application bundle.

The public identity deliberately has no invented job title, employment dates,
skill percentages or business metrics. `PROFILE.email`, `PROFILE.telegram` and
`PROFILE.resume` stay null until the author provides them. A configured resume
must point to a real downloadable file. The contact panel currently links to
the confirmed GitHub profile and explains that no direct contact is supplied.

The thumbnail in `public/portfolio` is a screenshot of the real city.
