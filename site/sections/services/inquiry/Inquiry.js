/**
 * S7 inquiry (#inquiry): the 3-step stepper on paper (services-inquiry.js).
 * Every link that names a category (a[data-inquiry-category], but not the
 * profile dialog's own button, which goes through inquireAbout) preselects it.
 */
import { Section } from '../../../core/Section.js';
import { initInquiry } from './services-inquiry.js';

export class Inquiry extends Section {
  static id = 'inquiry';

  mount() {
    this.form = initInquiry({ panel: this.el.querySelector('#inquiry-panel'), film: this.film, sound: this.ctx.sound });
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-inquiry-category]:not([data-profile-inquiry])');
      if (link) this.form.setCategory(link.dataset.inquiryCategory);
    });
  }

  setCategory(slug) {
    this.form.setCategory(slug);
  }

  /** What the concierge was told ({ category, city }); the stepper then opens on its next step. */
  prefill(values) {
    this.form.prefill(values);
  }

  focusTitle() {
    this.el.querySelector('.stepper__title')?.focus({ preventScroll: true });
  }
}
