/**
 * The partner profile dialog (#profile-dialog): one dialog, filled from
 * PARTNERS by the trigger (partner-profile.js); its inquiry button hands the
 * category to the page (inquireAbout).
 */
import { Section } from '../../../core/Section.js';
import { initProfiles } from './partner-profile.js';

export class ProfileDialog extends Section {
  static id = 'profile-dialog';

  mount() {
    initProfiles({ dialog: this.el, film: this.film, onInquiry: this.ctx.inquireAbout });
  }
}
