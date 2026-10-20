/**
 * H6 · Close (W5). The engine plays the words and the stop, dotglobe the arc
 * and the medallion; the section wires its FAQ link.
 *
 * FAQ dialog (H6): #faq deep links open it through data-open on #close. The
 * answers are one exclusive group through the native details[name="faq"] (no
 * script: the dialog sits outside every scene, so ui-accordion.js is not needed).
 */

import { Section } from '../../../core/Section.js';
import { openDialog } from '../../../core/ui/ui-dialog.js';

export class Close extends Section {
  static id = 'close';

  mount() {
    const dialog = document.getElementById('faq-dialog');
    if (!dialog) return;
    document.querySelectorAll('[data-faq-open]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        openDialog(dialog, { trigger: link, film: this.film });
      });
    });
  }
}
