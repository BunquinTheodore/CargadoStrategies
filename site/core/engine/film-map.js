/**
 * Scroll slots (cut mode), internal to the engine.
 *
 * The document scroll is a position holder: one stage-height slot per scene,
 * so the scrollbar, #hash and find-in-page stay meaningful. Scenes never read
 * scroll progress.
 *
 * The pan fallback (R4 B1, stage height < 560 px only): a scene taller than
 * the stage gets a longer slot, and scrolling inside that slot pans its
 * .scene__pan 1:1; leaving the slot cuts to the next scene. Above 560 px every
 * pan is 0 and the slots are equal.
 */

/** Slot starts (px from the top of the spacer) for scenes with the given pan heights. */
export function buildSlots(pans, slotH) {
  const starts = [];
  let total = 0;
  pans.forEach((pan) => {
    starts.push(total);
    total += slotH + Math.max(0, pan);
  });
  return { starts, pans: pans.map((p) => Math.max(0, p)), slotH, total };
}

/** The scene whose slot holds scroll position y, and how far into its pan y is. */
export function locate(slots, y) {
  const { starts, pans } = slots;
  let index = 0;
  for (let i = starts.length - 1; i >= 0; i -= 1) {
    if (y >= starts[i] - slots.slotH / 2) { index = i; break; }
  }
  const offset = Math.min(pans[index], Math.max(0, y - starts[index]));
  return { index, offset };
}

/** The slot nearest to y (where an unasked scroll settles). */
export function nearestSlot(slots, y) {
  let best = 0;
  slots.starts.forEach((start, i) => {
    if (Math.abs(start - y) < Math.abs(slots.starts[best] - y)) best = i;
  });
  return best;
}
