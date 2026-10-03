# Portfolio interface

The city entrance now uses `PortfolioCity`. The existing `CityApp` still owns
interior destinations and their demo state. Returning from an interior passes
the entrance spawn back into the portfolio city.

- `content.js`: public name (Елнур), project stories, skill-to-project mapping,
  optional direct contacts and CV, and validated shareable routes.
- `resume.js`: author-approved professional profile, project contributions,
  education and BRICS achievement. Existing development periods stay in `content.js`.
- `ResumeSections.jsx` / `resume.css`: shared profile, project results and
  education/achievement sections for the document and city panels.
- `PortfolioHome.jsx` / `home.css`: the approved six-section homepage, with a
  separate projects entrance instead of embedded project cards. The latest
  visual target is `design/home-warm-restored-reference.png`: warm charcoal,
  cream stone accents, locally packaged Roboto and a measured three-track grid.
  The full resume is reachable from About; the footer matches the reference date.
- `GalleryHeader.jsx` / `gallery-theme.css`: shared home/projects navigation,
  warm charcoal/cream tokens, Roboto body type, Times display headings,
  common material rasters, drawer colours and reduced-motion support. Both routes
  share navigation, palette and detail panels.
- `../collection/collection.css`: restored open project presentation beside
  the model, cream actions, responsive shelf overview and keyboard focus states.
  `collectionRenderer.js` keeps shared 3D cameras/shadows and existing building
  colours; the gallery furniture uses walnut shelves, textured travertine plinths
  and warm lighting restored from `a06d8e2`. Existing rotation and project
  crossfades are preserved. The explicit rotate button remains removed.
- `PortfolioCity.jsx`: home/city/resume/collection switch, navigation, accessible
  modal project details, search, contact panel and city controls.
- `portfolio.css`: styles scoped to `.pf-*`; no redesign of interior demo UIs.

Routes: `/` and `?view=home` open the homepage on all screen sizes.
`?view=collection` opens the projects shelf; `?view=collection&item=all` shows all
five buildings. `?view=city` retains the walkable city and `?view=resume` retains
the full document. Project links such as `?view=resume&project=pharmacy` still
work (also `office`, `argus`, `autofix` and `tynysh`). No 3D scene, model loading
or WebGL context is created while the homepage or document is open. JavaScript dependencies
are still shared with the main application bundle.

The public identity uses only author-provided facts, without invented employment
dates, skill percentages or business metrics. The author supplied Telegram,
email and phone contacts on 2026-10-01; `PROFILE` provides the shared values for
the resume, contact drawer and guide. Email uses `mailto:` and phone uses `tel:`.
`PROFILE.resume` stays null until a real downloadable CV is supplied.
Uniqs Detailing is a team project (autumn 2025–spring 2026), not a diploma project;
the diploma designation applies to ARGUS-AMI.

The thumbnail in `public/portfolio` is a screenshot of the real city.

Tynysh is a portfolio case for the banquet venue management application.
Its description and stack are based on that application's source and README.
It has no city destination or connected public demo. `hasCityDemo` is derived
from the city catalogue: only those cases show demo/walking actions and building
shortcuts. All cases appear in the resume, project search, experience and skills.

## ARGUS evidence checked on 2026-10-01

Reviewed `Ye1nurN/argus-ami-ids` at commit
`d7b2e6b9cbc1dd218bf233179f52bab9657a5f03`:

- `backend/scripts/train.py` generates synthetic NSL-KDD-style data with 41
  features and nine classes. Its default is 60,000 records; `backend/Dockerfile`
  launches training on 40,000 records. Neither default proves a completed run.
- The script holds out a stratified 15% test set (`random_state=42`) and uses
  `validation_split=0.1` on the remaining 85%: approximately 76.5/8.5/15 overall.
  The frontend's fixed 70/15/15 caption does not match this code.
- `frontend/src/data.js` hard-codes accuracy 0.9853, FPR 0.0072 and latency 4.8 ms.
  The tree has no saved evaluation report establishing these as measured results.
  These numbers are therefore not published as resume achievements.
- The training script logs test accuracy and weighted F1, but fits its scaler
  before splitting the data. A new evaluation should fit preprocessing only on
  training data before reporting generalization metrics. This task does not alter
  the separate ARGUS repository or claim to have retrained its model.

The resume shows the verified model dimensions and the actual training workflow.
Education lists Hof as a double-degree programme without asserting that a second
degree was awarded. No languages, internship, contact or certificate is invented.
