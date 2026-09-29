# AutoFix Hub / YX-1

Added on 2026-09-29 after the author confirmed responsibility across the project and supplied the working deployment: https://yx-uniq-77f4c.web.app/ (public name: Uniqs Detailing). The source repository, https://github.com/Uniqcorns/YX-1, is private. Portfolio copy identifies this as a team pet project with full-stack involvement, without invented employment dates, commercial metrics or sole-author claims.

## Visitor flow

- Resume: AutoFix Hub is the first case, with a role/contribution section, technology tags and a direct link to Uniqs Detailing. Shareable route: `?view=resume&project=autofix`.
- City: the former southeast reserve plot 07 contains a detailing centre. Its facade faces west towards the central entrance avenue. Building, entrance, return position and visitors share the existing cardinal coordinate frame and collision helpers. Three reserve plots remain.
- Interior: `?place=autofix` opens the walkable two-bay scene and a local client/company/analytics demonstration. The three tabs share reducer state.
- Create a booking; view it as the company; start and complete work; inspect the updated metrics. Cancellation releases the time slot. Reset restores the two seeded example bookings.
- The guide recognises AutoFix/Uniqs/детейлинг, links to the public service and includes it in the tour. The server action schema derives valid projects from the same fact catalogue.

## Boundaries

The city does not embed or call the real service. No accounts, phone numbers, payments or external bookings are created. All local cars, bookings, prices and revenue are explicitly demonstration data. Scheduling checks service duration, closing time, bay capacity and overlapping use of the same car. Completed and cancelled bookings cannot be transitioned again. State resets when the interior is remounted.

## Verification

- `npm test` using bundled Node 24: 98 tests passed, including conflict/cancellation/status/metrics tests, all city entrance routes and the guide routes.
- `npm run build`: production build succeeds. Existing shared Three.js chunk warning remains.
- Browser: desktop booking → company → start → complete changes demo revenue from 12,000 to 24,000 ₸; cancellation on a 390×844 viewport updates cancellation count without adding revenue.
- Desktop and mobile layouts, direct resume link, public-service link and the new city entrance are checked in the browser before publishing.

Implementation is in `src/city/AutofixExperience.jsx`, `autofixDemo.js`, `autofix.js`, `autofixBuilding.js` and `autofixLayout.js`; the original `office-demo` is untouched.
