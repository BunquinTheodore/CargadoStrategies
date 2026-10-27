# sections/app: account and dashboard pages (v2 §8)

App pages are ordinary scrolling pages, **not scroll films**: no head mode script, no `boot()`, engine, splash, GSAP or word splits, and they are exempt from fit-audit, seek-test and the scene budgets. Brand rules still hold: black and gold (navy only in the ink background wash), Times New Roman display in Title Case, Manrope body, Poppins labels, 14 px floor, 44 px targets, works from 360 px. They are the only pages that load Firebase.

| Page | Shell | Logic | Role |
|---|---|---|---|
| Log in / sign up / reset | `account.html` | `account/account-page.js` | anyone |
| Client dashboard | `dashboard.html` | `dashboard/dashboard-page.js` | client |
| Partner dashboard | `partner-dashboard.html` | `partner/partner-page.js` | partner |
| Admin | `admin.html` | `admin/admin-page.js` | admin |

- Shells use the section markers like film pages: `app/header`, `app/soon` (the "Accounts Are Coming Soon" card and the loading line), the page's partial, `app/footer`. `pages/<page>.js` calls the init function; `pages/<page>.css` imports `core/design/app.css` and the partial's CSS. `build.mjs` marks them `kind: 'app'` (base.css only as shared CSS, no vendor chunk, noindex, not in the sitemap).
- Shared modules: `core/account/` (`firebase.js` lazy SDK 10.12.2 from gstatic, never Analytics; `auth.js`; `guard.js` `routeFor`/`requireRole`; `model.js` pure view models; `db.js` Firestore reads; `admin-api.js` `/api/admin/<action>`; `schema.js` collection and field names, matching `firestore.rules` and `api/_lib/store.js`). `_shared.js` here: DOM helpers, `startApp`, `showMain`.
- States: `FIREBASE` empty → the coming-soon card, no SDK. Configured but signed out → forms at once, the SDK loads on submit; dashboards redirect to `account.html` without loading it. Provider not enabled → "Sign-in is being set up. Please try again soon." Firestore reads that fail → empty lists and a calm line. No console output.
- **Dashboard shell** (dashboard, partner-dashboard, admin): each partial is a `.dash[data-app-main]` with a sidebar (`app/dash-brand`, the user, the section nav, `app/dash-foot` with Back to Site and Log Out) and a body (top bar, KPI tiles, a 12-column grid of panels, tables). CSS in `core/design/dash.css` (imported after app.css). `showMain()` adds `body.is-dash`, which hides the app header and footer. ≥ 1024 px sidebar, 760–1023 icon rail, < 760 sticky top bar with a scrolling tab strip and tables stacked as cards (`td[data-label]`). `dash.js`: `wireShell` (nav `aria-current` via IntersectionObserver, `[data-dash-tabs]`), `kpi`, `markPreview`. `chart.js`: inline SVG line charts (pure geometry, tested). Every figure comes from `model.js` (`clientStats`, `nextBooking`, `pointsSeries`, `partnerStats`, `partnerStatus`, `adminStats`).
- **Local preview:** `preview.js` `isPreview()` is true only on `localhost` / `127.0.0.1` with `?preview=1`; then the page skips Firebase, dynamically imports `preview-data.js` ("Sample" names, example.com) and shows the "Preview · sample data" badge. Saves and admin actions send nothing. Tests: `tests/dashboard.test.mjs`.
- Sessions persist in localStorage (`firebase:authUser:*`), which `core/chrome/account-button.js` and `guard.js` read without the SDK.
- Page checks are only steering. Roles and data access are enforced by `firestore.rules` and `api/`; pages never write `role` or `points`.
- Tests: `tests/auth-guard.test.mjs`, `tests/app-pages.test.mjs`. Gate: `node tools/console-check.mjs http://127.0.0.1:<port>/ account.html dashboard.html partner-dashboard.html admin.html` (`APP_PAGES` in `tools/lib/cdp.mjs`).
