/**
 * H3 · Situations: a J-cut. The engine's in group starts 0.12 s early, with
 * the pan, inside the opening circle (T5: no bare field at 25%).
 */

import { Section } from '../../../core/Section.js';
import { leadInGroup } from '../_shared.js';

export class Situations extends Section {
  static id = 'situations';

  /** Film 'cut': only the cut that enters this scene. */
  cut(event) {
    if (event.toEl !== this.el) return;
    leadInGroup(event.tl, event.toEl, event);
  }
}
