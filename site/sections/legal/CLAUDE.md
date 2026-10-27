# Legal (`legal.html`): sections/legal

Entry `pages/legal.js` (plus `pages/legal-fx.js`, its own chunk), styles `pages/legal.css`, spec `plan/round5/DIRECTION.md` §7.5 (L1-L8; FR16, SRS Appendix B). **Calm on purpose:** tier C locked (`<html data-tier="C" data-tier-lock>`), one bone field, and no splash, globe, stars, grain, cursor or sound. Every word here is compliance copy, and a lawyer in Canada must review it before launch.

## Scenes, in order

| # | id | field · archetype | Partial / class | What it does |
|---|---|---|---|---|
| L1 | `contents` | bone · R | `contents/` | The five documents as index rows, with a short general-information note as fine print |
| L2 | `disclosure` | bone · P | `disclosure/` · `Disclosure.js` | Professional disclosure, a paged reader (`LegalDoc`) |
| L3 | `privacy` | bone · P | `privacy/` · `Privacy.js` | Privacy policy, paged (CR06, CR07, CR10) |
| L4 | `terms` | bone · P | `terms/` · `Terms.js` | Terms of use, paged |
| L5 | `conduct` | bone · P | `conduct/` · `Conduct.js` | Partner code of conduct, paged (CR04) |
| L6 | `faq` | bone · R | `faq/` · `Faq.js` | The Q&A. One `ui-tabs` root in drill mode: from 760 px an exclusive accordion paged by height; on phones the list, then one answer ("All Questions", "Next Question") |
| L7 | `close` | bone · M | `close/` | A static medallion, one statement, and the sheet CTA (context "legal") |
| L8 | `credits` | bone · credits | `credits/` | The footer that chrome.js fills, on legal's bone field |

Page-level files: `_page.css` (first), `_documents.css` (rules shared by L2-L5, between contents and faq in cascade order), `_bands.css` (last), `LegalDoc.js` (base class of the documents and Faq: `ui-pager` `createPagedReader`; `rewind(scene)` opens page 1 on a deep link).

## Config and core used

- No config keys directly. The footer and the sheet read config through chrome.js and wa-sheet.js. `pages/legal.js` fills the `main a[data-wa-sheet]` no-JS hrefs.
- Flow: `legal.js` boots, then `import('./legal-fx.js')` → `initLegal(ctx)` → `mountSections([Disclosure, Privacy, Terms, Conduct, Faq], ctx)`. `film.on('deeplink')` waits for it, then `reveal()`: a Q&A answer opens, a clause turns to its page, a document opens on page 1. `legal-fx.js` imports `mountSections` from `core/main.js` on purpose (keeps the chunk count).
- Core: `Section`, `ui-pager`, `ui-tabs`, `film.refreshReach`. main.js skips layers, sfx, cursor and the globe on `page === 'legal'`.
- Deep links: `legal.html#disclosure`, `#privacy`, `#terms`, `#conduct`, `#faq`.

## Known open issues (plan/round5/final-audit.txt)

- Fit flow: #7 `credits` spare 21 < 24 at 360x740. Film and touch are clean.
- Always run with the counsel-length stand-in: `node tools/fit-audit.mjs <url> legal.html --states=tools/fit-states/legal.mjs --ph-repeat=3` (also `--flow` and `--touch`).
- Perf: initial JS gzip 51.3 KB against the legal budget of 40 KB (FAIL). Never add imports to legal's entry path. Keep heavy modules dynamic.
- Final copy (owner, 2026-10-20): no visible draft markers and no bracket placeholders. The privacy contact (Lee Holgado, the email) is written into `privacy/privacy.html`; update it there if it changes.

## Drafts pending lawyer review (v2, 2026-10-25)

The owner approved the third-person rewrite and asked the builder to draft the clauses that match what the site now does (spec §6.8). Each new or changed sentence's element carries `data-draft="pending-lawyer-review"` and is preceded by `<!-- draft: pending lawyer review -->`; neither is visible. A Canadian lawyer reviews every one before launch. Once a clause is approved, remove its attribute and comment, then regenerate the baseline (`node tools/compliance-diff.mjs --dist --regenerate`, then the plain diff). Find them all with `grep -rn 'data-draft' site`.

| Where | Clause | What changed |
|---|---|---|
| `contents/` | fine print | Third person ("how it handles your information and what its partners agree to"); updated date 2026-10-25, row counts 6 / 9 / 8 |
| `disclosure/` | 03 | The services Cargado Strategies provides directly (all ten "Ours" services incl. the four contractor items), replacing "offered by the founder through her own businesses" |
| `disclosure/` | 04 | Third person ("You never pay Cargado Strategies", "it discloses") |
| `disclosure/` | 06 (new) | Insurance inquiries continue on a separate policy review website under its own terms |
| `privacy/` | 01-09 (all) | Third person throughout; 01 adds booking, account, points, referral and partner-application data; 02 adds booking, accounts and points, applications; 04 names Google Firebase, Google Calendar and Meet, Resend, and storage that may be outside Canada; 05 adds "while your account stays open"; 06 adds closing the account; 07 adds booking and account emails; 08 drops the stale "sound and motion choices" sentence and adds the Firebase sign-in state on the device; 09 (new) accounts and Google sign-in, passwords handled by Firebase |
| `terms/` | 04 | Third person ("Cargado Strategies may change …") |
| `terms/` | 05 (new) | Consultations: free, 10 minutes, Google Meet, Central Time, no professional relationship, prices quoted only after it, may be confirmed, moved or cancelled by email |
| `terms/` | 06 (new) | Accounts and points: 5 per qualifying event (completed booked consultation, service acquired, referred friend's first consultation), once per event, no cash value, cannot yet be spent, corrections, misuse |
| `faq/` | Why free (both answers), My information (first answer), Advice (second answer) | Third person; the advice answer lists the services Cargado Strategies provides directly |
| `faq/` | Become a partner (third answer, new) | The approval process: an invitation to sign up with the application's email address opens the partner dashboard |
| `contact/book/book.html` | consent line | The booking consent (links to the Privacy Policy) |
| `app/account/account.html` | consent line | The sign-up and sign-in consent (links to the Terms and the Privacy Policy) |

Unchanged (no marker): disclosure 01, 02, 05; terms 01-03, Limit of Liability, Governing Law; the whole code of conduct; the other FAQ answers.
