/**
 * H2 · One message: a J-cut, as H3. The searches rest struck through (the
 * markup's .is-struck, fx.css §4); the strike sequence and the answer replay
 * are gone (client 2026-11-07: calm). The engine's in group starts 0.12 s
 * early, with the pan, inside the opening circle (T5: no bare field at 25%).
 */

import { Section } from '../../../core/Section.js';
import { leadInGroup } from '../_shared.js';

export class OneMessage extends Section {
  static id = 'one-message';

  /** Film 'cut': only the cut that enters this scene. */
  cut(event) {
    if (event.toEl !== this.el) return;
    leadInGroup(event.tl, event.toEl, event);
  }
}
