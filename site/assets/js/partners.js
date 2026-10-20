/**
 * For Professionals (partners.html): 6 scenes + credits on the Round 5 cut engine
 * (DIRECTION §7.4, P1-P7).
 *
 * Order (api.md §2): fill what depends on config, then boot(), then register
 * the film listeners in the same tick. The globe (P1 "You" joins the map, P6
 * the medallion), the in groups and the stops are the engine's and dotglobe's;
 * this file adds the P3 deal-in, the tier choice, the two dialogs and the
 * application stepper (partners-form.js). Sound is automatic (sfx.js), apart
 * from the success chime the form plays.
 */
import { boot } from './main.js';
import { partnerQuestionMessage, waLink } from './whatsapp.js';
import { createTabs } from './ui-tabs.js';
import { closeDialog, openDialog } from './ui-dialog.js';
import { initPartnerForm, renderCategoryOptions, selectTier } from './partners-form.js';

const PAGE = 'partners';
const PHONE_QUERY = '(max-width: 759px)';
/** P3: the tier panels are dealt in like the Home doors, at most 12° (DIRECTION §7.4). */
const DEAL = Object.freeze({
  y: 48,
  rotationY: 12,
  perspective: 1100,
  duration: 0.6,
  stagger: 0.07,
  after: 0.04, // seconds after the 'in' label (deal-ins start by 0.36 s, slice lesson 5)
});

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const isPhone = () => window.matchMedia(PHONE_QUERY).matches;

/* ---------- P3 choreography (film 'cut' listener, api.md §4.3) ---------- */

function dealTiers(tl, el) {
  const panels = $$('.tier', el);
  if (!panels.length) return;
  const flat = isPhone();
  const from = flat
    ? { opacity: 0, y: DEAL.y }
    : {
      opacity: 0,
      y: (i) => (i % 2 ? DEAL.y : -DEAL.y),
      rotationY: (i) => (i % 2 ? -DEAL.rotationY : DEAL.rotationY),
      transformPerspective: DEAL.perspective,
    };
  const to = flat
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 0, rotationY: 0, transformPerspective: DEAL.perspective };
  tl.fromTo(panels, from, {
    ...to, duration: DEAL.duration, ease: 'expo.out', stagger: DEAL.stagger, clearProps: 'transform',
  }, `in+=${DEAL.after}`);
}

/**
 * P6: the question rows lead the close in, from the 'iris' label rather than 'in', so the 25%
 * frame of a cut into #close already shows them (slice lesson 5; the small medallion carries
 * less of the frame than Home's). The engine's own row tweens are replaced, not doubled.
 */
const EARLY_ROWS = Object.freeze({ after: 0.04, duration: 0.45, stagger: 0.06, rise: 24 });

function leadRows(tl, el, dir) {
  const rows = $$('.close__rows > li', el);
  if (!rows.length || tl.labels.iris === undefined) return;
  tl.getTweensOf(rows).forEach((tween) => tween.kill());
  tl.fromTo(rows, { opacity: 0, y: EARLY_ROWS.rise * dir }, {
    opacity: 1, y: 0, duration: EARLY_ROWS.duration, ease: 'expo.out', stagger: EARLY_ROWS.stagger,
  }, `iris+=${EARLY_ROWS.after}`);
}

/**
 * P5 on a swap (tier C, reduced motion: 'iris' and 'in' share one early time, cut.js): the paper
 * and its frame start at 'in' with the head, so the 25% frame shows more than the eyebrow. The
 * circle cut keeps the head-then-paper order from the markup's data-delay.
 */
function leadPaper(tl, el) {
  const { iris, in: at } = tl.labels;
  if (!(at > 0) || iris !== at) return;
  const paper = $('.apply__paper', el);
  if (!paper) return;
  tl.getTweensOf([paper, $('[data-frame]', paper)].filter(Boolean))
    .forEach((tween) => { if (tween.startTime() > at) tween.startTime(at); });
}

function addCutTweens({ toEl, tl, dir = 1 }) {
  if (toEl?.id === 'tiers') dealTiers(tl, toEl);
  if (toEl?.id === 'apply') leadPaper(tl, toEl);
  if (toEl?.id === 'close') leadRows(tl, toEl, dir);
}

/* ---------- P3 tier choice: the panels pick a tier, the one "Apply to Join" carries it ---------- */

function wireTiers(film, form) {
  const scene = $('#tiers');
  if (!scene) return () => {};
  const picks = $$('.tier__pick', scene);
  const pick = (value) => {
    const input = picks.find((p) => p.value === value);
    if (input && !input.checked) input.checked = true;
    selectTier(form, value);
  };
  scene.addEventListener('change', (event) => {
    if (event.target.matches('.tier__pick')) selectTier(form, event.target.value);
  });
  // The whole panel picks (pointer convenience); selecting text never does.
  scene.addEventListener('click', (event) => {
    const panel = event.target.closest('.tier');
    if (!panel || event.target.closest('a, button, input, label') || String(window.getSelection?.() || '')) return;
    $('.tier__pick', panel)?.click();
  });
  const root = $('.tabs[data-tabs]', scene);
  const tabs = root && createTabs(root, {
    activeWhen: root.dataset.tabs,
    label: root.dataset.tabsLabel,
    fixedHeight: true,
    swipe: true,
    film,
    onChange: ({ key, cause }) => { if (cause !== 'mode' && cause !== 'auto') pick(key.replace('tier-', '')); },
    onModeChange: () => film.refreshReach(),
  });
  // On phones the tab on show is the choice, so Apply carries it even when nobody tapped a tab.
  $('[data-tier-apply]', scene)?.addEventListener('click', () => {
    if (tabs?.tabbed && tabs.current) pick(tabs.current.replace('tier-', ''));
  });
  // Links from elsewhere (partners.html?tier=growth#apply) arrive with the tier chosen.
  const asked = new URLSearchParams(window.location.search).get('tier');
  if (asked) pick(asked);
  return pick;
}

/* ---------- dialogs: P3 "Compare All" and the P6 questions ---------- */

function wireDialogs(film, pick) {
  const tiers = document.getElementById('tiers-dialog');
  $$('[data-tiers-open]').forEach((btn) => btn.addEventListener('click', () => openDialog(tiers, { trigger: btn, film })));
  // "Apply for Growth →" in the comparison: close it, keep the choice, cut to the application.
  tiers.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-tier]');
    if (!link) return;
    event.preventDefault();
    const r = link.getBoundingClientRect(); // the iris opens from the link, measured before the dialog closes
    pick(link.dataset.tier);
    closeDialog(tiers, { returnFocus: false });
    film.goTo('apply', { cause: 'click', origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
  });
  const faq = document.getElementById('partner-faq');
  const answers = $$('details.acc', faq);
  $$('[data-faq]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const n = Number(btn.dataset.faq) - 1;
      answers.forEach((d, i) => { d.open = i === n; });
      openDialog(faq, { trigger: btn, film });
    });
  });
}

function wirePartnerLinks() {
  const href = waLink(partnerQuestionMessage());
  $$('a[data-wa-partner]').forEach((a) => { a.href = href; });
}

/**
 * Every scene lays out from its .scene__pan. The build writes it into dist and the engine adds it
 * in cut and touch-cut mode; flow mode on the readable source has none, so add it here first.
 */
function ensurePans() {
  $$('.scene > .scene__inner').forEach((inner) => {
    if (inner.querySelector(':scope > .scene__pan')) return;
    const pan = document.createElement('div');
    pan.className = 'scene__pan';
    pan.append(...inner.childNodes);
    inner.append(pan);
  });
}

/* ---------- start ---------- */

ensurePans();
const form = document.getElementById('apply-form');
renderCategoryOptions(form.elements.category);
wirePartnerLinks();

const { film, sfx } = boot({ page: PAGE });
if (typeof film.refreshReach !== 'function') {
  console.error('[partners] film.refreshReach() is missing: tab and step controls in parked scenes stay reachable by Tab.');
}

film.on('cut', addCutTweens);
const pickTier = wireTiers(film, form);
wireDialogs(film, pickTier);
initPartnerForm({ form, success: document.getElementById('apply-success'), film, sfx });
