/**
 * H5 · Find (W4): a J-cut, as #situations. The globe → map is dotglobe's;
 * here the engine's in group starts 0.12 s early, with the pan.
 */

import { Section } from '../../../core/Section.js';
import { leadInGroup } from '../_shared.js';

export class Find extends Section {
  static id = 'find';

  /** Film 'cut': only the cut that enters this scene. */
  cut(event) {
    if (event.toEl !== this.el) return;
    leadInGroup(event.tl, event.toEl, event);
  }
}
