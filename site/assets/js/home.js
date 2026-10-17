/**
 * Home page (index.html): 12 scenes on the shared film engine.
 *
 * Order (see ENGINE.md §2): render JS content first, then boot(), then
 * register film listeners in the same tick. Every extra tween below is added
 * to the master timeline in a `build` listener, so it is scrubbed and
 * reversible; only transform, opacity and clip-path are animated.
 */
import { boot } from './main.js';
import { CATEGORIES, VIDEO } from './config.js';
import { categoryMessage, waLink } from './whatsapp.js';
import { MONOGRAM, escapeHtml } from './chrome.js';
import { titleCase } from './text-case.js';
import { renderCanadaMap } from './home-map.js';
import { NEEDS, needsMarkup } from './home-needs.js';
import { yieldToMain } from './perf.js';
import { initVideo } from './home-video.js';
import { addSceneTweens } from './home-tweens.js';
import { initHomeSounds } from './home-sfx.js';

const PAGE = 'home';
const NEW_TAB = '_blank';

const OWNERSHIP_LABEL = {
  founder: 'From our founder',
  partner: 'Partner network',
  both: 'Founder + partners',
};

/** The founder's own services: the message asks about the service, not for an introduction. */
const ASK_LINKS = [
  { id: 'ask-insurance', category: 'Insurance · the family protection review' },
  { id: 'ask-outsourcing', category: 'Outsourcing · a back-office team' },
];
const ASK_REQUEST = "I'd like to ask about this service.";

const $ = (sel, root = document) => root.querySelector(sel);
const pad2 = (n) => String(n).padStart(2, '0');

/* ---------- content rendered before boot ---------- */

/** Intro form choices (wireframe 5a, home-needs.js). The production build writes them into the HTML already. */
function renderNeeds(holder) {
  if (holder && !holder.querySelector('input[name="need"]')) holder.innerHTML = needsMarkup();
}

/** Tile layers lift by these depths (px) while the tile tilts toward the pointer. */
const TILE_DEPTH = { name: 26, go: 44 };

function renderTiles(list) {
  list.innerHTML = CATEGORIES.map((c, i) => `
    <li><a class="tile" href="services.html#${encodeURIComponent(c.slug)}" data-cursor-label="Open">
      <span class="tile__n num">${pad2(i + 1)}</span>
      <span class="tile__name" data-depth="${TILE_DEPTH.name}">${escapeHtml(titleCase(c.name))}</span>
      <span class="tile__own ui">${OWNERSHIP_LABEL[c.ownership] || ''}</span>
      <span class="tile__go" aria-hidden="true" data-depth="${TILE_DEPTH.go}">→</span>
    </a></li>`).join('');
}

function renderContent() {
  renderNeeds($('#intro-needs'));
  renderTiles($('#service-tiles'));
  const hub = renderCanadaMap($('#canada-map'));
  if (hub) $('#find').dataset.mapHub = `${hub.x.toFixed(1)}% ${hub.y.toFixed(1)}%`;
  const mark = $('[data-monogram]');
  if (mark) mark.innerHTML = MONOGRAM;
  return initVideo(VIDEO, {
    media: $('#video-media'), ui: $('#video-ui'), cap: $('#video-cap'), status: $('#video-status'),
  });
}

/* ---------- intro form → WhatsApp ---------- */

function introMessage(form) {
  const value = form.querySelector('input[name="need"]:checked')?.value;
  const need = NEEDS.find((n) => n.value === value);
  const city = form.elements.city.value.trim();
  return categoryMessage({ category: need ? need.ask : '', city, page: PAGE });
}

function wireIntroForm(chrome) {
  const form = $('#intro-form');
  if (!form) return;
  const targets = [$('#intro-go'), $('#how-go'), $('#close-go')].filter(Boolean);
  const sync = () => {
    const href = waLink(introMessage(form));
    targets.forEach((a) => { a.href = href; });
    chrome.setBar({ label: 'Get My Introduction', href });
    return href;
  };
  form.addEventListener('input', sync);
  form.addEventListener('change', sync);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.open(sync(), NEW_TAB, 'noopener');
  });
  sync();
}

function wireAskLinks() {
  ASK_LINKS.forEach(({ id, category }) => {
    const link = document.getElementById(id);
    if (!link) return;
    link.href = waLink(categoryMessage({ category, page: PAGE, request: ASK_REQUEST }));
    link.target = NEW_TAB;
    link.rel = 'noopener';
  });
}

/* ---------- start ---------- */

const video = renderContent();
await yieldToMain(); // the content above and the engine start below are two short tasks, not one long one
const { film, chrome } = boot({ page: PAGE });

film.on('build', addSceneTweens);
film.on('scene', ({ id }) => {
  if (id !== 'video') video.pause();
});
wireIntroForm(chrome);
wireAskLinks();
initHomeSounds();
