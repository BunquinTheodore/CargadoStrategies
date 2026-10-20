/**
 * The WhatsApp sheet (DIRECTION C22, §6.5): one <dialog id="wa-sheet"> per page,
 * opened by every client CTA. Three steps on ui-stepper.js (need → city →
 * open WhatsApp), the message written by whatsapp.js buildIntro().
 *
 *   const sheet = initWaSheet({ film, sfx });   // main.js, once, lazily
 *   sheet.open({ need: 'insurance', context: 'founder', trigger: button });
 *
 * Markup: plan/round5/snippets/wa-sheet.html, pasted into the page's
 * <dialog id="wa-sheet">. The need chips are rendered here from NEED_CHIPS.
 * Triggers carry data-wa-sheet (step), data-need, data-context and data-city
 * (api.md §13); open({ trigger }) reads them when the call does not pass them.
 * A hash of #wa-sheet (or #wa-sheet?contact) opens the sheet too.
 *
 * data-wa-sheet="contact" opens the contact view, not the steps: a full-width
 * Call button, the email, then a quiet "Prefer WhatsApp? →" into step 1.
 * Step 1 also ends on a quiet "Just open WhatsApp →": the opener's own wa.me
 * href (or the page's message), for a visitor who only wants to chat.
 * An opener with data-need titles the sheet "Ask About [need]" (the trigger's
 * own "Ask About …" text when it has one) and shows the need as a removable
 * chip; an opener without data-need starts from a clear selection.
 *
 * Side effects: the city goes to sessionStorage['cs-city'] (the W4 arc), and
 * "Open WhatsApp" dispatches document `cs:wa-opened` { need, city, context }
 * (sfx.js plays the chime on it). The link itself is a real wa.me link in a
 * new tab, so the browser opens it, never a script popup.
 */
import { openDialog, closeDialog } from '../ui/ui-dialog.js';
import { createStepper } from '../ui/ui-stepper.js';
import { buildIntro, waLink, pageMessage } from './whatsapp.js';
import { PHONE, CONTACT_EMAIL, CONTACT_EMAIL_LABEL, FOUNDER_NAME, categoryBySlug } from '../../assets/js/config.js';
import { sendInquiry } from '../lib/send-inquiry.js';

const CITY_KEY = 'cs-city';
const HASH = '#wa-sheet';
const CONTACT_HASH = '#wa-sheet?contact';
const NEW_TAB = '_blank';
const STEPS = ['need', 'city', 'send'];
const STEP_LABELS = { need: 'What You Need', city: 'Your City', send: 'Open WhatsApp' };
const CONTEXTS = new Set(['home', 'founder', 'network', 'services', 'story', 'partners', 'legal']);
const CONTACT_TITLE = 'Call or Email Us';
const ASK = 'Ask About';
const WA_HREF = /^https:\/\/wa\.me\//;

/** The step 1 chips, in DIRECTION §6.5 order. `founder`: labelled "From [First name]". */
const NEED_CHIPS = Object.freeze([
  { slug: 'insurance', label: 'Insurance' },
  { slug: 'business-strategy', label: 'Business Strategy' },
  { slug: 'outsourcing', label: 'Outsourcing', founder: true },
  { slug: 'mortgage', label: 'Mortgage' },
  { slug: 'legal', label: 'Lawyer' },
  { slug: 'real-estate', label: 'Real Estate' },
  { slug: 'accounting-and-tax', label: 'Accounting and Tax' },
  { slug: 'financial-planning', label: 'Financial Planning' },
  { slug: 'not-sure', label: 'Not Sure' },
]);
/** Any CATEGORIES slug is a valid need (the concierge lists all of them); only these have a chip. */
const validNeed = (slug) => slug === 'not-sure' || !!categoryBySlug(slug);

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

const founderName = () => (FOUNDER_NAME ? escapeHtml(FOUNDER_NAME) : '<span class="ph">[First name]</span>');
const emailHtml = () => (CONTACT_EMAIL
  ? `<a class="link" href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a>`
  : `<span class="ph">${escapeHtml(CONTACT_EMAIL_LABEL)}</span>`);
const phoneHtml = () => `<a class="link" href="tel:${PHONE.e164}">${PHONE.display}</a>`;
const needLabel = (slug) => NEED_CHIPS.find((c) => c.slug === slug)?.label || categoryBySlug(slug)?.name || '';

/** The trigger's visible text ("Ask About the Clean-Up"), arrows and screen-reader extras left out. */
function askText(trigger) {
  if (!trigger) return '';
  const copy = trigger.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"], .visually-hidden').forEach((el) => el.remove());
  const text = copy.textContent.replace(/\s+/g, ' ').trim();
  return text.startsWith(`${ASK} `) ? text : '';
}

/** The contact view. Built here, so a sheet pasted before it existed gets it too. */
function reachHtml() {
  const email = CONTACT_EMAIL
    ? `<a class="btn btn--ghost sheet__email" href="mailto:${escapeHtml(CONTACT_EMAIL)}">Email ${escapeHtml(CONTACT_EMAIL)}</a>`
    : `<p class="sheet__note sheet__email">Email <span class="ph">${escapeHtml(CONTACT_EMAIL_LABEL)}</span></p>`;
  return `<a class="btn btn--primary sheet__call" href="tel:${PHONE.e164}" data-sheet-call>Call ${PHONE.display}</a>
    ${email}
    <p class="sheet__note"><button type="button" class="link sheet__to-wa" data-sheet-to-wa>Prefer WhatsApp? <span aria-hidden="true">→</span></button></p>`;
}

/** The quiet way out of the steps on step 1: WhatsApp with no questions asked. */
function ensureDirect(form) {
  let direct = form.querySelector('[data-sheet-direct]');
  if (direct) return direct;
  const step = form.querySelector('[data-step="need"]');
  if (!step) return null;
  const note = document.createElement('p');
  note.className = 'sheet__note sheet__direct';
  note.innerHTML = `<a class="link" data-sheet-direct data-sfx="none" href="${escapeHtml(waLink(pageMessage('home')))}" target="${NEW_TAB}" rel="noopener">Just open WhatsApp <span aria-hidden="true">→</span><span class="visually-hidden"> (opens in a new tab)</span></a>`;
  step.append(note);
  return note.querySelector('a');
}

/** The parts the snippet may lack (pasted before they existed): the picked-need chip, the contact view and the direct link. */
function ensureParts(dialog, form) {
  const title = dialog.querySelector('#wa-sheet-title, .sheet__title');
  let picked = dialog.querySelector('[data-sheet-picked]');
  if (!picked && title) {
    picked = document.createElement('button');
    Object.assign(picked, { type: 'button', className: 'chip sheet__picked', hidden: true });
    picked.dataset.sheetPicked = '';
    title.after(picked);
  }
  let reach = dialog.querySelector('[data-sheet-reach]');
  if (!reach) {
    reach = document.createElement('div');
    Object.assign(reach, { className: 'sheet__form sheet__reach', hidden: true });
    reach.dataset.sheetReach = '';
    form.before(reach);
  }
  if (!reach.childElementCount) reach.innerHTML = reachHtml();
  return { title, picked, reach, direct: ensureDirect(form) };
}

function readCity() {
  try {
    return sessionStorage.getItem(CITY_KEY) || '';
  } catch {
    return '';
  }
}

function storeCity(city) {
  try {
    if (city) sessionStorage.setItem(CITY_KEY, city);
  } catch {
    /* storage blocked: the W4 arc falls back to Winnipeg */
  }
}

/* ---------- rendering ---------- */

function renderChips(box, name) {
  box.innerHTML = NEED_CHIPS.map(({ slug, label, founder }) => `
    <label class="chip sheet__chip"><input type="radio" name="${name}" value="${slug}">
      <span class="chip__label">${label}</span>${founder ? `<span class="chip__tag">From ${founderName()}</span>` : ''}
    </label>`).join('');
}

/**
 * The owner's email copy (api/inquiry.js) of a WhatsApp opening: 'introduction' for the
 * steps' "Open WhatsApp" (with the written message), 'contact' for the direct link.
 */
function emailCopy(kind, { need, city, context }) {
  sendInquiry(kind, {
    Service: needLabel(need),
    City: city,
    'Opened from': context,
    Message: kind === 'introduction' ? buildIntro({ need, city, context }) : '',
  });
}

/** The message as lines (no innerHTML: the city is visitor text). */
function renderMessage(el, text) {
  el.replaceChildren(...text.split('\n').flatMap((line, i) => (i ? [document.createElement('br'), line] : [line])));
}

function fillContactSlots(dialog) {
  dialog.querySelectorAll('[data-sheet-phone]').forEach((el) => { el.innerHTML = phoneHtml(); });
  dialog.querySelectorAll('[data-sheet-email]').forEach((el) => { el.innerHTML = emailHtml(); });
  dialog.querySelectorAll('[data-sheet-founder]').forEach((el) => { el.innerHTML = founderName(); });
}

/* ---------- trigger data ---------- */

function stepOf(value) {
  if (value === 'contact') return { step: '', contact: true };
  return { step: STEPS.includes(value) ? value : '', contact: false };
}

/** Explicit options win; a trigger's data-* fill the rest. */
function resolveOptions(opts) {
  const data = opts.trigger?.dataset || {};
  const pick = (key) => (opts[key] !== undefined ? opts[key] : data[key === 'step' ? 'waSheet' : key]);
  const context = pick('context');
  return {
    need: validNeed(pick('need')) ? pick('need') : '',
    city: typeof pick('city') === 'string' ? pick('city').trim() : '',
    context: CONTEXTS.has(context) ? context : document.body.dataset.page || 'home',
    ...stepOf(pick('step') || ''),
  };
}

/* ---------- the sheet ---------- */

/** No sheet markup on this page: every open falls back to the plain wa.me link. */
function fallbackSheet() {
  return {
    open({ context } = {}) { window.open(waLink(pageMessage(context || document.body.dataset.page || 'home')), NEW_TAB, 'noopener'); },
    close() {},
    get isOpen() { return false; },
  };
}

export function initWaSheet({ film, sfx, dialog = document.getElementById('wa-sheet') } = {}) {
  const form = dialog?.querySelector('form.stepper');
  if (!form) return fallbackSheet();
  const $ = (sel) => dialog.querySelector(sel);
  const ui = {
    chips: $('[data-sheet-needs]'),
    city: form.elements.city,
    message: $('[data-sheet-message]'),
    go: $('[data-sheet-go]'),
    hint: $('.stepper__send-hint'),
    contact: $('[data-sheet-contact]'),
    done: $('[data-sheet-done]'),
    tag: $('[data-sheet-tag]'),
  };
  dialog.classList.add('sheet');
  renderChips(ui.chips, 'need');
  fillContactSlots(dialog);
  const parts = ensureParts(dialog, form);
  const defaultTitle = parts.title?.textContent.trim() || '';
  /* need: a preset without a chip; asked/askTitle: the opener's data-need and its "Ask About …" text */
  const state = { context: 'home', trigger: null, need: '', asked: '', askTitle: '', contact: false };

  const need = () => form.elements.need?.value || state.need;
  const city = () => ui.city.value.trim();
  const intro = () => ({ need: need(), city: city(), context: state.context });

  /** The title and the picked chip follow the need while the opener asked about one. */
  function renderHead() {
    const slug = need();
    const asking = !state.contact && !!state.asked && slug !== 'not-sure' && !!needLabel(slug);
    let title = defaultTitle;
    if (state.contact) title = CONTACT_TITLE;
    else if (asking) title = (slug === state.asked && state.askTitle) || `${ASK} ${needLabel(slug)}`;
    if (parts.title) parts.title.textContent = title;
    if (!parts.picked) return;
    parts.picked.hidden = !asking;
    if (!asking) return;
    parts.picked.innerHTML = `${escapeHtml(needLabel(slug))}<span aria-hidden="true">&nbsp;×</span>`;
    parts.picked.setAttribute('aria-label', `Remove ${needLabel(slug)}`);
  }

  function sync() {
    const text = buildIntro(intro());
    renderMessage(ui.message, text);
    ui.go.href = waLink(text);
    renderHead();
  }

  /** Every unit change resets the last step's lines; the success line replaces the contact line. */
  function showLast(isLast) {
    [ui.hint, ui.contact].forEach((el) => { if (el) el.hidden = !isLast; });
    if (ui.done) ui.done.textContent = '';
  }

  const stepper = createStepper(form, {
    validateUnit: () => [],
    onStep: ({ unit }) => {
      const name = STEPS[unit] || '';
      form.dataset.sheetStep = name;
      if (name === 'send') { storeCity(city()); sync(); }
      showLast(name === 'send');
    },
    onSubmit: () => ui.go.click(),
    focusTo: (el) => el.focus({ preventScroll: true }),
    film,
    sound: (name) => sfx?.play(name),
    countText: ({ unit, total, name }) => {
      const index = STEPS.includes(name) ? STEPS.indexOf(name) : unit;
      return `Step ${index + 1} of ${total} · ${STEP_LABELS[STEPS[index]] || ''}`;
    },
  });

  function opened(detail = intro()) {
    storeCity(detail.city);
    document.dispatchEvent(new CustomEvent('cs:wa-opened', { detail }));
    if (ui.done) {
      if (ui.contact) ui.contact.hidden = true; // the success line carries the same call / email options
      ui.done.innerHTML = `WhatsApp opened in a new tab. Didn't open? Call ${phoneHtml()} or email ${emailHtml()}.`;
    }
  }

  /** The contact view (call, email, "Prefer WhatsApp?") or the steps. */
  function showView(contact) {
    state.contact = contact;
    form.hidden = contact;
    parts.reach.hidden = !contact;
    renderHead();
  }

  function selectNeed(slug) {
    const radios = [...form.querySelectorAll('input[name="need"]')];
    const radio = slug ? radios.find((r) => r.value === slug) : null;
    radios.forEach((r) => { r.checked = r === radio; });
    state.need = slug && !radio ? slug : '';
  }

  /** The picked chip's ×: back to a clear step 1, the default title and the page's own message. */
  function removeNeed() {
    selectNeed('');
    Object.assign(state, { asked: '', askTitle: '', context: document.body.dataset.page || 'home' });
    if (ui.tag) ui.tag.hidden = true;
    sync();
    stepper.go(0, { cause: 'api' });
  }

  form.addEventListener('input', sync);
  form.addEventListener('change', sync);
  ui.go.addEventListener('click', () => {
    opened();
    emailCopy('introduction', intro());
  });
  /* The direct link opens WhatsApp with the opener's own message; no need, the city as typed so far. */
  parts.direct?.addEventListener('click', () => {
    const detail = { need: '', city: city(), context: state.context };
    opened(detail);
    emailCopy('contact', detail);
    api.close();
  });
  /* A pointer tap on a chip is the answer: go straight to the city. Keyboard arrows only select. */
  ui.chips.addEventListener('click', (event) => {
    if (event.detail > 0 && event.target.matches('input[name="need"]')) stepper.next();
  });
  $('[data-sheet-close]')?.addEventListener('click', () => api.close());
  parts.picked?.addEventListener('click', removeNeed);
  parts.reach.querySelector('[data-sheet-to-wa]')?.addEventListener('click', () => {
    showView(false);
    stepper.go(0, { cause: 'api' });
  });

  function clearHash() {
    if (!location.hash.startsWith(HASH)) return;
    history.replaceState(history.state, '', `${location.pathname}${location.search}`);
  }

  /** Every open starts from the opener: its need (or none), its city or the stored one, its context. */
  function prefill({ need: slug, city: town, context }, trigger) {
    state.context = context;
    selectNeed(slug);
    state.asked = slug;
    state.askTitle = slug && trigger?.dataset?.need === slug ? askText(trigger) : '';
    if (town) ui.city.value = town;
    else if (!ui.city.value) ui.city.value = readCity();
    if (ui.tag) ui.tag.hidden = context !== 'founder';
    if (parts.direct) {
      const href = trigger?.getAttribute?.('href') || '';
      parts.direct.href = WA_HREF.test(href) ? href : waLink(pageMessage(context));
    }
    sync();
  }

  function startStep({ step, need: slug, city: town }) {
    if (step) return STEPS.indexOf(step);
    if (!slug) return 0;
    return town ? 2 : 1;
  }

  const api = {
    open(opts = {}) {
      const resolved = resolveOptions(opts);
      state.trigger = opts.trigger || document.activeElement;
      prefill(resolved, opts.trigger);
      showView(resolved.contact);
      if (!dialog.open) {
        openDialog(dialog, { trigger: state.trigger, film, onClose: clearHash });
      }
      stepper.go(resolved.contact ? 0 : startStep(resolved), { focus: !resolved.contact, cause: 'open' });
      if (resolved.contact) parts.reach.querySelector('[data-sheet-call]')?.focus({ preventScroll: true });
    },
    close({ returnFocus = true } = {}) {
      if (dialog.open) closeDialog(dialog, { returnFocus });
    },
    get isOpen() { return dialog.open; },
  };

  const fromHash = () => {
    if (!location.hash.startsWith(HASH) || dialog.open) return;
    api.open({ step: location.hash === CONTACT_HASH ? 'contact' : '' });
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();
  return api;
}
