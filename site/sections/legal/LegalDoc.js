/**
 * L2-L5 documents (and the L6 Q&A answers on phones): measured paged readers
 * (ui-pager.js createPagedReader). The text pages, it never scrolls in a box,
 * and a deep link opens a document on its first page. Shared by the document
 * sections; each sets only its id.
 */
import { Section } from '../../core/Section.js';
import { initPagedReaders } from '../../core/ui/ui-pager.js';

export class LegalDoc extends Section {
  mount() {
    this.readers = initPagedReaders(this.el, { film: this.film });
  }

  /** A document link landed on `scene`: its document readers go back to page 1. */
  rewind(scene) {
    scene.querySelectorAll('.legal-reader[data-pager]').forEach((reader) => {
      this.readers.get(reader)?.goTo(0, { animate: false, announce: false });
    });
  }
}
