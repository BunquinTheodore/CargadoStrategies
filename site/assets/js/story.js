/**
 * Our Story (story.html): 5 scenes + credits on the Round 5 cut engine
 * (DIRECTION §7.3, T1-T6).
 *
 * Order (api.md §2): fill the copy that depends on config first, then boot(),
 * then register the film listeners in the same tick. The founder's name only
 * fills plain lines and labels, never a split heading (slice lesson 9).
 *
 *   #logo    W5: the globe collapses into the C ring (dotglobe 'ring' mode);
 *            here the drawn C follows the dots round and the W draws inside
 *            it. Both are stroke draws on the cut timeline, by label, so the
 *            same code runs in cut and touch-cut mode and seeks cleanly.
 *            The scene carries data-out-hold, so leaving it on a same-field
 *            cut the engine holds the mark until 0.45 s (a J-cut): its thin
 *            strokes alone would leave the frame bare (T5). With no live globe
 *            (posters: tier C, reduced motion, flow) there are no dots to
 *            follow, so the mark draws inside the engine part (by 'settled'):
 *            a longer timeline would put the 25% seek frame of the cut in
 *            past 'in', after the out group has gone and before the in group
 *            shows (T5).
 *   #values  on phones the three bodies are an exclusive accordion (01 open).
 *
 * The words, the stop, the medallion and the chapter breath are the engine's,
 * dotglobe's and sfx.js's; this page adds no voices of its own.
 */
import { boot } from './main.js';
import { FOUNDER_LAST_NAME, FOUNDER_NAME, FOUNDER_PHOTO, FOUNDER_SIGNATURE } from './config.js';
import { buildIntro, waLink } from './whatsapp.js';

const PAGE = 'story';
const PHONE_QUERY = '(max-width: 759px)';
/** The mark draws while the dots collapse (dotglobe RING_S 1.2 s from 'in'). Seconds after 'in'. */
const MARK = Object.freeze({
  cFrom: 0, // the C traces round with the dots, fast at first so the frame is never bare (T5)
  cDuration: 1,
  wFrom: 0.12, // the W draws inside it as the ring forms
  wDuration: 0.7,
  scaleFrom: 0.94,
  scaleDuration: 1,
});
/** No dots to follow: the same draw, ending by 'settled' (cut.js: 0.65 s after 'in'). */
const MARK_POSTER = Object.freeze({ ...MARK, cDuration: 0.6, wFrom: 0.08, wDuration: 0.5, scaleDuration: 0.6 });
const DRAWN = 0;
const UNDRAWN = 100; // the paths carry pathLength="100"

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- copy that depends on config ---------- */

function slotImage(src, alt) {
  const img = new Image();
  img.src = src;
  img.alt = alt;
  img.decoding = 'async';
  return img;
}

function fillCopy() {
  const fullName = [FOUNDER_NAME, FOUNDER_LAST_NAME].filter(Boolean).join(' ');
  if (fullName) {
    $$('[data-founder-full]').forEach((el) => {
      el.textContent = fullName;
      el.classList.remove('ph');
    });
  }
  // T5: "Get My Introduction" becomes "Message [First name]" once the name is known.
  if (FOUNDER_NAME) $$('[data-cta-label]').forEach((el) => { el.textContent = `Message ${FOUNDER_NAME}`; });
  // Her face ([data-when="FOUNDER_PHOTO"] slots) and her signature: the owner's files, never a stand-in.
  if (FOUNDER_PHOTO) {
    $$('[data-founder-photo]').forEach((slot) => {
      slot.replaceChildren(slotImage(FOUNDER_PHOTO, slot.matches('figure') ? fullName : ''));
    });
  }
  if (FOUNDER_SIGNATURE) {
    $$('[data-founder-signature]').forEach((slot) => {
      slot.replaceChildren(slotImage(FOUNDER_SIGNATURE, `${fullName}'s signature`));
    });
  }
}

/** The no-JS hrefs of the sheet triggers: the message the sheet would write. */
function fillWhatsAppLinks() {
  $$('a[data-wa-sheet][href^="https://wa.me/"]').forEach((a) => {
    const { need = '', context = PAGE } = a.dataset;
    a.href = waLink(buildIntro({ need, context }));
  });
}

/* ---------- T4 values on phones: an exclusive accordion, one body open ---------- */

function wireValues(root) {
  const values = $$('.value', root);
  if (!values.length) return;
  const phone = window.matchMedia(PHONE_QUERY);
  const setOpen = (value) => {
    values.forEach((v) => {
      const open = v === value;
      v.classList.toggle('is-open', open);
      $('.value__toggle', v)?.setAttribute('aria-expanded', String(open));
    });
  };
  root.addEventListener('click', (event) => {
    if (!phone.matches) return;
    const value = event.target.closest('.value');
    if (value && !value.classList.contains('is-open')) setOpen(value);
  });
}

/* ---------- T3 #logo: the mark draws as the globe becomes its ring ---------- */

function drawMark({ tl, toEl }) {
  const c = $('.logo__c path', toEl);
  const w = $('.logo__w path', toEl);
  const mono = $('.logo__mono', toEl);
  if (!c || !w || !mono) return;
  const mark = document.getElementById('globe')?.hidden === false ? MARK : MARK_POSTER;
  tl.fromTo(mono, { scale: mark.scaleFrom }, { scale: 1, duration: mark.scaleDuration, ease: 'expo.out' }, `in+=${mark.cFrom}`);
  tl.fromTo(c, { strokeDashoffset: UNDRAWN }, {
    strokeDashoffset: DRAWN, duration: mark.cDuration, ease: 'power2.out',
  }, `in+=${mark.cFrom}`);
  tl.fromTo(w, { strokeDashoffset: UNDRAWN }, {
    strokeDashoffset: DRAWN, duration: mark.wDuration, ease: 'power2.out',
  }, `in+=${mark.wFrom}`);
}

const CHOREOGRAPHY = { logo: drawMark };

/* ---------- start ---------- */

fillCopy();
fillWhatsAppLinks();
const { film } = boot({ page: PAGE });

film.on('cut', (event) => {
  CHOREOGRAPHY[event.toEl?.id]?.(event);
});
wireValues($('#values .values__rows'));
