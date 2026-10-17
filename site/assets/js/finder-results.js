/**
 * Finder results (FR26–FR31, CR14, CR16, CR17): approved partners for the
 * chosen category and type, ranked by distance only. When none is close the
 * radius widens step by step up to all of Canada and says so; when none is
 * listed at all, a "Partner spot available" card and a WhatsApp request
 * button are shown. Returns plain { status, html } so the controller decides
 * where it goes.
 */
import { PARTNERS } from './config.js';
import { distanceKm, formatKm } from './finder-geo.js';
import { escapeHtml } from './chrome.js';
import { waLink, categoryMessage } from './whatsapp.js';
import { FOUNDER_OFFERS, FOUNDER_REQUEST, hasPartners, PAGE, subPlaceholderCard } from './services-data.js';
import { profileMarkup, partnerTypeNames } from './partner-profile.js';
import { titleCase } from './text-case.js';

export const RADIUS_STEPS_KM = Object.freeze([25, 50, 100, 250, 500, 1000]);
const MAX_RESULTS = 5;
const ARROW = '<span class="btn__arrow" aria-hidden="true">→</span>';
const NEW_TAB = 'target="_blank" rel="noopener"';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const lower = (text) => text.charAt(0).toLowerCase() + text.slice(1);

/** Approved partners in a category, optionally of one type. */
export function partnersFor(category, type) {
  return PARTNERS.filter((p) => p.category === category.slug && (!type || (p.types || []).includes(type.slug)));
}

/** Partners with their distance from `place`, nearest first. */
export function rankByDistance(partners, place) {
  return partners.map((partner) => ({ partner, km: distanceKm(place, partner) })).sort((a, b) => a.km - b.km);
}

/** The smallest radius step that holds at least one partner (Infinity = all of Canada). */
export function widenRadius(ranked) {
  for (const radius of RADIUS_STEPS_KM) {
    const items = ranked.filter((r) => r.km <= radius);
    if (items.length) return { radius, items: items.slice(0, MAX_RESULTS) };
  }
  return { radius: Infinity, items: ranked.slice(0, MAX_RESULTS) };
}

/* ---------- markup ---------- */

function introduceLink({ category, type, place, partner }) {
  const text = categoryMessage({ category: category.name, type: type?.name, city: place?.label, page: PAGE });
  return waLink(`${text}\nPartner I found in the finder: ${partner.business}`);
}

function resultRow({ partner, km }, ctx) {
  const e = escapeHtml;
  const types = partnerTypeNames(ctx.category, partner);
  const meta = [partner.name, types, `${partner.city}, ${partner.province}`].filter(Boolean).map(e).join(' · ');
  const cred = partner.credential
    ? `Licence or credential: ${e(partner.credential)}${partner.issuingBody ? ` · issued by ${e(partner.issuingBody)}` : ''}`
    : '';
  const distance = Number.isFinite(km) ? `<span class="result__km num">${formatKm(km)}</span>` : '';
  return `
  <article class="result" data-tilt>
    <div class="result__head" data-depth="26"><h4 class="result__name">${e(partner.business)}</h4>${distance}</div>
    <p class="result__meta">${meta}</p>
    ${cred ? `<p class="result__cred">${cred}</p>` : ''}
    <div class="row">
      <a class="btn btn--primary btn--sm" href="${introduceLink({ ...ctx, partner })}" ${NEW_TAB}>Introduce Me<span class="visually-hidden"> to ${e(partner.business)} on WhatsApp (opens in a new tab)</span></a>
    </div>
    ${profileMarkup(partner, ctx.category)}
  </article>`;
}

/** For the founder's own services: ask her about it (no partner to find, CR13). */
function founderAskBlock({ category, place }) {
  const offer = FOUNDER_OFFERS[category.slug];
  const name = escapeHtml(lower(offer?.name || category.name));
  const text = categoryMessage({ category: category.name, city: place?.label, page: PAGE, request: FOUNDER_REQUEST });
  return `
  <div class="results__ask">
    <p class="results__ask-title">Prefer to Ask First?</p>
    <p class="t-small muted">Our founder answers questions about ${name} herself.</p>
    <a class="btn btn--ghost btn--sm" href="${waLink(text)}" ${NEW_TAB}>Ask Our Founder on WhatsApp ${ARROW}<span class="visually-hidden"> about ${name} (opens in a new tab)</span></a>
    <p class="hint">Nothing is sent until you tap send.</p>
  </div>`;
}

function founderBlock(category) {
  const offer = FOUNDER_OFFERS[category.slug];
  if (!offer) return '';
  return `
  <div class="results__ours" data-tilt>
    <p class="eyebrow">From our founder</p>
    <p data-depth="18"><strong>${escapeHtml(offer.name)}</strong>. Our founder's own business, not a partner listing.</p>
    <a class="btn btn--link" href="#${offer.scene}">${escapeHtml(titleCase(`See ${lower(offer.name)}`))} ${ARROW}</a>
  </div>`;
}

/* ---------- view ---------- */

function emptyView(ctx, label) {
  const where = ctx.place ? ` near ${escapeHtml(ctx.place.label)}` : '';
  return {
    status: `No ${label} partner is listed yet${where}.`,
    html: `${founderBlock(ctx.category)}
      <div class="partner-list">${subPlaceholderCard(ctx.category.name)}</div>`,
  };
}

function radiusStatus(radius, count, label, place) {
  const where = escapeHtml(place.label);
  const first = RADIUS_STEPS_KM[0];
  if (radius === first) return `${plural(count, `${label} partner`)} within ${first} km of ${where}.`;
  if (Number.isFinite(radius)) return `No ${label} partner within ${first} km of ${where}. We widened the search to ${radius} km.`;
  const max = RADIUS_STEPS_KM[RADIUS_STEPS_KM.length - 1];
  return `No ${label} partner within ${max} km of ${where}. Showing the nearest across all of Canada.`;
}

function listView(ctx, pool, label) {
  if (!ctx.place) {
    const rows = pool.map((partner) => resultRow({ partner, km: NaN }, ctx)).join('');
    return {
      status: `${plural(pool.length, `${label} partner`)} listed. Choose a place to sort them by distance.`,
      html: `${founderBlock(ctx.category)}<div class="results__rows">${rows}</div>`,
    };
  }
  const { radius, items } = widenRadius(rankByDistance(pool, ctx.place));
  return {
    status: radiusStatus(radius, items.length, label, ctx.place),
    html: `${founderBlock(ctx.category)}<div class="results__rows">${items.map((r) => resultRow(r, ctx)).join('')}</div>`,
  };
}

/** { status, html } for the current finder state { category, type, place }. */
export function resultsView({ category, type, place }) {
  if (!category) {
    return { status: 'Choose what you need first. Then pick a place on the map or search for one.', html: '' };
  }
  const ctx = { category, type, place };
  if (!hasPartners(category)) {
    return {
      status: `${category.name} is our founder's own service, offered across Canada.`,
      html: `${founderBlock(category)}${founderAskBlock(ctx)}`,
    };
  }
  const label = (type ? `${type.name} ${category.name}` : category.name).toLowerCase();
  const pool = partnersFor(category, type);
  return pool.length ? listView(ctx, pool, label) : emptyView(ctx, label);
}
