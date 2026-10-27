/**
 * T3 #logo (W5): the globe collapses into the C ring (dotglobe 'ring' mode);
 * here the drawn C follows the dots round and the W draws inside it. Both are
 * stroke draws on the cut timeline, by label, so the same code runs in cut and
 * touch-cut mode and seeks cleanly. The scene carries data-out-hold, so leaving
 * it on a same-field cut the engine holds the mark until 0.45 s (a J-cut): its
 * thin strokes alone would leave the frame bare (T5). With no live globe
 * (posters: tier C, reduced motion, flow) there are no dots to follow, so the
 * mark draws inside the engine part (by 'settled'): a longer timeline would put
 * the 25% seek frame of the cut in past 'in', after the out group has gone and
 * before the in group shows (T5). The draw itself is shared (core/engine/mark-draw.js).
 */
import { Section } from '../../../core/Section.js';
import { drawMark } from '../../../core/engine/mark-draw.js';

export class Logo extends Section {
  static id = 'logo';

  /** Only the cut into #logo draws the mark. */
  cut(event) {
    if (event.toEl?.id === Logo.id) drawMark(event);
  }
}
