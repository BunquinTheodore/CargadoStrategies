# Contact (`contact.html`): sections/contact

Entry `pages/contact.js`, styles `pages/contact.css`, spec `docs/superpowers/specs/2026-10-25-cargado-v2-design.md` §6.4 (booking) and §6.7 (the poster). Two scenes plus credits. **No gold field on this page.** Field rhythm: ink, bone, ink.

## Scenes, in order

| # | id | field · archetype | Partial / class | What it does |
|---|---|---|---|---|
| C1 | `book` | ink · P | `book/` · `Book.js`, `book-form.js`, `book-calendar.js`, `booking-ui.js` | The founder's seated poster (`FOUNDER_PHOTOS.poster`, shown whole, never cropped) large on the left, and beside it the head with the paper under it (layout below). A 3-step `ui-stepper`: 1 Day (a month calendar, `book-calendar.js`), 2 Time (a native select of the open slots, labelled Central Time), 3 Your Details (name, email, phone optional, service optional, note, consent linking `legal.html#privacy`, honeypot `website`). From 760 px step 3 is one page; phones split it into "Your Details" and "Note and Consent" |
| C2 | `reach` | bone · R | `reach/` | WhatsApp (opens the sheet), email, the Facebook page name and the address as rows, filled by `pages/contact.js` from config. No Call item |
| C3 | `credits` | ink · credits | `credits/` | The footer that chrome.js fills |

Page-level files: `_page.css` (first), `_bands.css` (last).

## #book layout (owner, 2026-10-25: a bigger photo with the text beside it)

Markup: `figure.book__poster` (group media) then `.book__main` holding `.book__head` (group head) and `.paper.book__paper` (group body). The poster's height is `--poster-h`, its width follows the 2:3 ratio; the source is 480 x 720, so 720 px tall is the cap (no further upscaling).

- **Wide (>= 1100, taller than 760):** one centred row, poster at `min(scene-safe-h, 720px)` beside a 640 px column (`--book-col`): head on top, the paper filling the rest of the poster's height, so the paper and its buttons hold still across steps.
- **Laptop-short (>= 760 wide, <= 760 tall):** the same row with the poster capped at 540 px (the 18% whitespace budget at 1280 x 720), a one-line title (max 3rem), tighter paper and 44 px calendar cells.
- **Tablet landscape (760-1099):** the same row, poster `min(scene-safe-h, 50vw)`, a 520 px column, d2 title.
- **Tablet portrait:** poster (`min(28svh, 320px)`) and head side by side on top, the paper across both under them (`.book__main` is `display: contents`).
- **Phone (< 760):** step 1 shows a small whole poster band (104-150 px tall) beside the head, the paper under it; later steps show the paper only. Under 700 px tall the poster is hidden. With no poster in config, the head and paper stand alone (`:has(.book__poster[hidden])`).

## The calendar (step 1)

`book-calendar.js` renders an ARIA grid (`role="grid"`, which also stops film-snap from taking its keys): the month and "Central Time" between ← → month arrows (`data-days-prev` / `data-days-next`, disabled at the ends of the bookable window), a Sun-Sat header, and only the 4-6 week rows the month needs. Days outside `bookableDays()` or with no open slot are `aria-disabled` (faded); today (Winnipeg) has `aria-current="date"` (gold ring); the chosen day is `aria-selected` (gold fill). One roving tab stop: arrows move a day or a week, Home/End to the week's ends, PageUp/PageDown a month, crossing months as needed; selection follows focus onto an open day (as the old radios did), Enter/Space and click select too. Cells are spans with `tabindex` (not buttons) and have no borders, so the scene's element budget counts only the tab stop. Cells are >= 44 px both ways; on phones they touch (`--cal-gap: 0`) and the grid reaches 8 px into the paper's padding, so 7 columns are >= 44 px from 360 px. Pure date maths (`monthGrid`, `shiftMonth`, `shiftDate`, `clampDate`, `dayLabel`) live in `booking-ui.js`.

## Booking behaviour

- Dates and times are always Winnipeg (`BOOKING.timeZone`) and labelled "Central Time", whatever the visitor's zone. Calendar days come from `bookableDays()`; a day with no open slot left (late today) is disabled. The first open day is chosen at load.
- Slots are computed locally with `openSlots()` (same rules as `api/`: 2 h lead, 60-day horizon). On reaching the time step, `GET /api/slots?date=` replaces them with the owner's live free/busy (once per day; a failure keeps the local list silently).
- `POST /api/book` answers become messages through `resultMessage()` (`booking-ui.js`): confirmed (time + "Open Google Meet"), pending ("will confirm … by email"), `slot_taken` (back to the time step, slots reloaded), `already_booked`, `invalid` (fields marked), `rate_limited` and network or server failure (message + WhatsApp sheet link).
- **Local static previews have no `api/`.** On `127.0.0.1` and `localhost` (`serve.mjs`) the page never calls `/api/*` (a 404 would fail console-check); it keeps the local slots and a submit shows the WhatsApp fallback. Add `?api=1` to call the API locally (for example under `vercel dev`).
- `?service=<slug>` preselects the service (the "Book a Free Consultation" CTAs link to `contact.html?service=<slug>#book`). The payload sends the category name.
- `idToken` is not sent yet: when accounts land (Task 12), pass the signed-in user's ID token into `buildBookingPayload` (it is included only when given).

## Config and core used

- Config: `BOOKING`, `CATEGORIES` (`categoryBySlug`), `FOUNDER_PHOTOS.poster`, `FOUNDER_NAME`, `FOUNDER_LAST_NAME`, `PHONE`, `CONTACT_EMAIL` (`CONTACT_EMAIL_LABEL`), `FACEBOOK_URL`, `FACEBOOK_PAGE_NAME`, `ADDRESS_LINE`, `SITE_NAME`.
- Core: `Section`, `ui-stepper` (`form.csStepper`), `core/lib/slots.js`, `chrome.js` (`escapeHtml`), `whatsapp.js` (`pageLink`, `buildIntro`, `waLink`). Mount order: `Book`.
- Tests: `tests/booking-ui.test.mjs` (labels, the date boundary near midnight UTC, the month grid across DST, month and year boundaries, the Winnipeg opening month, validation, payload, every API answer). Fit states: `tools/fit-states/contact.mjs`.

## Known open issues

- Not yet run in a browser: fit-audit (film, flow, touch), console-check and seek-test are for the gate agent. The 2026-10-25 layout and calendar were sized by arithmetic only; the tightest cases to check are 1280 x 720 (step 1 with a six-week month, and whitespace), 1536 x 864 (step 1 height beside a two-line title), 768 x 1024 and 360 x 740 (step 1).
- Phones: the six-week calendar makes step 1 taller than the old chip strip, so the 18% whitespace budget may fail at 360 x 740 and 390 x 844 (a month grid cannot be made smaller and keep 44 px cells).
- `PAGE_NAMES` in config has no `contact` key, so the generic WhatsApp message says "the contact page" (lower case). Add `contact: 'Contact'` to `PAGE_NAMES` in config.js.
- The header still has no Contact link (Task 10 adds it to every shell).
