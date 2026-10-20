# fit-states · the state-script contract for `tools/fit-audit.mjs`

Owner of this file and of `fixtures/`: stage 2e (tools). Each page agent owns its own `tools/fit-states/<page>.mjs` (home, services, story, partners, legal).

```
node tools/fit-audit.mjs http://localhost:8000/ services.html --vp=all --states=tools/fit-states/services.mjs --fixture=partners-max
node tools/fit-audit.mjs http://localhost:8000/ legal.html --states=tools/fit-states/legal.mjs --ph-repeat=3 --flow
```

## What the audit already does for you (no state needed)

For every scene, after `film.goTo(i, { immediate: true })` (cut mode) or `scrollIntoView` (touch-cut and flow), the audit measures the base state and then, unless `--no-variants`, each of these and keeps the worst value per check:

| automatic variant | how |
|---|---|
| every tab of every `[data-tabs].is-tabbed` root | `root.csTabs.select(k, { cause: 'auto' })` when the root exposes it, else a click on the tab |
| every item of every `details[name]` group | `open = true` on one, the rest closed |
| every page of every pager | elements with `el.csPager`: `goTo(p, { animate: false, announce: false })`, plus the pager clip check (an on-page item ending below `.pager__window`) |
| every unit of every `form.stepper`, then the **all-errors pass** of that unit | `form.csStepper.go(u, { focus: false, cause: 'auto' })` when exposed, else the unit's `.stepper__step` is unhidden and the others hidden. All-errors: every `.error` / `[data-error]` unhidden (an empty one gets a 70-character message), `aria-invalid="true"` on every field, `.stepper__errors` shown |

Every change is undone before the next variant. Open dialogs (`dialog[open]`) found in any variant or state are measured too (spare ≥ 24 px, no Y/X, no inner scroll, no clip, the text floor).

## The states module

A states module exports **an array** (default export, or `export const states`). Each entry:

```js
export default [
  {
    scene: 'finder',            // the scene's id ('finder' or '#finder') or its 0-based index
    name: 'insurance + Winnipeg, map tab',
    run: async ({ film, scene, index, sleep }) => {   // runs IN THE PAGE (serialised with toString)
      scene.querySelector('select[name="need"]').value = 'insurance';
      scene.querySelector('select[name="need"]').dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(300);
    },
    vp: (w, h) => w < 760,      // optional: a filter, or an array like ['390x844', '360x740']
    modes: ['cut', 'touch-cut'], // optional: 'cut' | 'touch-cut' | 'flow' (default: every mode)
    errors: true,               // optional: this state shows form errors, so the 40 px form spare applies
  },
];
```

Rules:
1. **`run` is serialised.** It cannot use anything from the module scope: no imports, no outer constants. Put helpers inside `run`. Arrow functions, `async function` and method shorthand (`async run({ scene }) {}`) all work.
2. Its arguments: `film` (the engine object, `null` if the hook failed), `scene` (the `section.scene`), `index`, and `sleep(ms)`.
3. The audit reaches the scene first, runs `run`, waits two frames plus 400 ms, then measures the scene and every open dialog.
4. **States are independent.** Before each state after the first, the audit reloads the page (with the same fixture and `--ph-repeat`), so a state never inherits another's leftovers. Do not undo in `run`.
5. Do not navigate away, do not call `window.open`, and do not submit a form for real (the WhatsApp link would open). Steppers: drive them with `form.csStepper` when the page exposes it, otherwise through the Back and Next buttons.
6. No `console.log` in states (console-check counts warnings and errors, not logs, but keep them clean).

## Fixtures and flags

- `--fixture=partners-max` serves `fixtures/partners-max.json` as `PARTNERS` by rewriting `assets/js/config.js` in flight (CDP Fetch). Nothing in `site/` changes. Run it on `site/` (the dev server), not on `dist/`, where config.js is bundled; the report notes when the fixture was not served. The fixture holds 5 test partners at every R4 services §7.7 cap; `node tools/check-config.mjs --fixture=partners-max` validates it.
- `--ph-repeat=3` repeats the text of every plain-text `.ph` three times, before the page modules run and again after the engine is ready (then `film.refresh()`), standing in for counsel's longer wording (legal S6).
- `--flow` emulates `prefers-reduced-motion: reduce`. `--touch` emulates a coarse pointer with no hover before load, so the head script picks `touch-cut`; the report says so when the engine reports another mode.

## What the page must expose (or the audit falls back)

- `export function initFilm(` keeps exactly that signature (the audit hooks it).
- `html.film-ready`, and `film.current` (Round 4: `film.active`).
- Pagers: `el.csPager = api` (R4 shared §6.2, already required).
- Optional, for exact worst cases: `form.csStepper = api` and `root.csTabs = api` (filed with 2b in `plan/round5/shared-requests.md`).
- Markup the R5 budgets read: `data-archetype` on every scene, `data-group="head|body|action"` on its top-level groups, `.fineprint` / `[data-compliance]` on compliance copy (excluded from the word count), and `[data-fit-ignore]` on decoration that clips on purpose.
