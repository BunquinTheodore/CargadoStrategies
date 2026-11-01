/**
 * The packages dialog (#packages-dialog, owner 2026-11-01): any [data-packages="<slug>"]
 * button on the page fills it with that service's three PACKAGES from config (name,
 * price, what is included, the bonus and the free extra) and opens it. Copy still in
 * [brackets] shows as a placeholder (.ph). Each card books a free consultation.
 */
import { Section } from '../../../core/Section.js';
import { openDialog } from '../../../core/ui/ui-dialog.js';
import { escapeHtml } from '../../../core/chrome/chrome.js';
import { titleCase } from '../../../core/lib/text-case.js';
import { PACKAGES, categoryBySlug } from '../../../assets/js/config.js';
import { BOOK_CTA, bookingHref } from '../services-data.js';

const TRIGGER = '[data-packages]';
const PLACEHOLDER = /^\[[^\]]*\]$/;
/** The service photo shown over the cards (the scene photos, assets/img/services/). */
export const photoFor = (slug) => `assets/img/services/${slug}-1600.webp`;

/** Owner copy, escaped; a whole-[bracket] value is marked as a placeholder. */
const text = (value) => {
  const safe = escapeHtml(value);
  return PLACEHOLDER.test(String(value).trim()) ? `<span class="ph">${safe}</span>` : safe;
};

/** One package card: tier name, price, inclusions, the bonus and the free extra, the CTA. */
export function packageCard(pack, slug, index) {
  const includes = pack.includes.map((line) => `<li>${text(line)}</li>`).join('');
  return `<article class="pkg" aria-labelledby="pkg-${index}">
    <h3 class="pkg__name" id="pkg-${index}">${text(pack.name)}</h3>
    <p class="pkg__price">${text(pack.price)}</p>
    <ul class="pkg__list">${includes}</ul>
    <dl class="pkg__extras">
      <div><dt>Bonus</dt><dd>${text(pack.bonus)}</dd></div>
      <div><dt>Free</dt><dd>${text(pack.free)}</dd></div>
    </dl>
    <a class="btn btn--primary pkg__cta" href="${escapeHtml(bookingHref(slug))}">${BOOK_CTA} <span class="btn__arrow" aria-hidden="true">→</span></a>
  </article>`;
}

/** The dialog title for a service slug (the category name, as a title). */
export const packagesTitle = (slug) => titleCase(categoryBySlug(slug)?.name || 'Packages');

export class PackagesDialog extends Section {
  static id = 'packages-dialog';

  mount() {
    this.title = this.el.querySelector('#packages-title');
    this.body = this.el.querySelector('[data-packages-body]');
    this.onClick = (event) => {
      const trigger = event.target.closest(TRIGGER);
      if (!trigger) return;
      event.preventDefault();
      this.open(trigger.dataset.packages, trigger);
    };
    document.addEventListener('click', this.onClick);
  }

  /** Fill and open for one service; an unknown slug does nothing. */
  open(slug, trigger) {
    const packs = PACKAGES[slug];
    if (!packs) return;
    this.title.textContent = `${packagesTitle(slug)} Packages`;
    this.body.innerHTML = `<img class="pkg__photo" src="${photoFor(slug)}" alt="" width="1600" height="1000" decoding="async">
      <div class="pkg__grid">${packs.map((pack, i) => packageCard(pack, slug, i + 1)).join('')}</div>`;
    openDialog(this.el, { trigger, film: this.film });
  }

  destroy() {
    document.removeEventListener('click', this.onClick);
  }
}
