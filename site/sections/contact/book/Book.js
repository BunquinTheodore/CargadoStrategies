/**
 * #book: the free consultation picker (book-form.js) beside the founder's poster.
 * `?service=<slug>` (the "Book a Free Consultation" CTAs on Services) preselects
 * the service; the page entry reads it and passes it in ctx.service.
 */
import { Section } from '../../../core/Section.js';
import { initBooking } from './book-form.js';

export class Book extends Section {
  static id = 'book';

  mount() {
    this.form = initBooking({
      panel: this.el.querySelector('#book-panel'),
      film: this.film,
      sound: this.ctx.sound,
      service: this.ctx.service || '',
    });
  }

  focusTitle() {
    this.el.querySelector('.stepper__title')?.focus({ preventScroll: true });
  }
}
