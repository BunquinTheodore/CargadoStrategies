/**
 * P3 · Tiers (partners.html): the panels pick a tier and the one "Join Us" carries it,
 * the panels are dealt in on the cut, and "Compare All" opens #tiers-dialog
 * (sections/partners/tiers-dialog). The choice lives in the application form: the page hands
 * over ctx.selectTier(tier) (pages/partners.js), so this section never reaches into Apply.
 */
import { Section } from '../../../core/Section.js';
import { createTabs } from '../../../core/ui/ui-tabs.js';
import { closeDialog, openDialog } from '../../../core/ui/ui-dialog.js';

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

/* ---------- P3 tier choice: the panels pick a tier, the one "Join Us" carries it ---------- */

function wireTiers(scene, film, selectTier) {
  const picks = $$('.tier__pick', scene);
  const pick = (value) => {
    const input = picks.find((p) => p.value === value);
    if (input && !input.checked) input.checked = true;
    selectTier(value);
  };
  scene.addEventListener('change', (event) => {
    if (event.target.matches('.tier__pick')) selectTier(event.target.value);
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

/* ---------- the P3 "Compare All" dialog ---------- */

function wireCompare(film, pick) {
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
}

export class Tiers extends Section {
  static id = 'tiers';

  mount() {
    const pick = wireTiers(this.el, this.film, this.ctx.selectTier);
    wireCompare(this.film, pick);
  }

  cut({ toEl, tl }) {
    if (toEl === this.el) dealTiers(tl, toEl);
  }
}
