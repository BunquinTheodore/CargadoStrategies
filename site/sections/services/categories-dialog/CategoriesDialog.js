/**
 * The categories dialog (#categories-dialog): the rail and one category's
 * detail (services-categories.js). Opened by "See Every Kind of Help →"
 * on S6 and by every deep link that names a category (data-open on #finder,
 * `cs:open`); a category's scene link leaves the dialog for that scene.
 */
import { Section } from '../../../core/Section.js';
import { categoryBySlug } from '../../../assets/js/config.js';
import { openDialog } from '../../../core/ui/ui-dialog.js';
import { initCategories } from './services-categories.js';

export class CategoriesDialog extends Section {
  static id = 'categories-dialog';

  mount() {
    const dialog = this.el;
    this.categories = initCategories({ dialog, onRender: () => this.ctx.fillWhatsAppLinks(dialog) });
    document.querySelector('[data-categories-open]').addEventListener('click', (event) => {
      event.preventDefault();
      this.open({ trigger: event.currentTarget });
    });
    dialog.addEventListener('cs:open', (event) => {
      event.preventDefault();
      const key = event.detail?.key;
      this.open({ slug: categoryBySlug(key) ? key : null });
    });
    dialog.addEventListener('click', (event) => {
      const link = event.target.closest('[data-cat-scene]');
      if (!link) return;
      event.preventDefault();
      this.ctx.leaveDialogsFor(link.getAttribute('href').slice(1));
    });
  }

  open({ slug, trigger } = {}) {
    if (slug) this.categories.select(slug, { drill: true });
    else this.categories.showRail();
    if (!this.el.open) openDialog(this.el, { trigger, film: this.film });
  }
}
