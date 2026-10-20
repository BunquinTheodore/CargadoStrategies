/**
 * Touch-cut (DIRECTION §9.3; api.md §1, §4.2), internal to the engine.
 *
 * On a coarse primary pointer the scenes are in flow, one 100svh section
 * each, and native mandatory scroll snap makes one swipe one scene: no Lenis,
 * no wheel or touch interception. Sections are transparent; the fixed .fields
 * layer behind them shows the field. Two thresholds of one IntersectionObserver
 * drive the film:
 *   0.35  the section becomes the field owner: the engine opens its field
 *         (irisTo, or a crossfade on tier C) and fades out the text of the
 *         sections that would otherwise sit on the wrong field;
 *   0.6   the section becomes current: the engine plays its cut (the in group).
 * Programmatic cuts (nav links, deep links, film.next) suspend the observer,
 * jump the scroll and let the engine play the cut itself.
 */

const FIELD_AT = 0.35;
const ENTER_AT = 0.6;
const THRESHOLDS = [0, FIELD_AT, ENTER_AT, 1];
const RESUME_FRAMES = 2; // frames for the observer to report the jumped-to layout before it may act again

/** engine: { onField(index), onEnter(index) } */
export function createTouchCut(scenes, engine) {
  const ratios = new Map();
  let owner = -1;
  let armed = false;
  let suspended = 0;

  function chooseOwner(changed) {
    const rising = changed.filter(({ target, before, now }) => before < FIELD_AT && now >= FIELD_AT && target !== owner);
    if (rising.length) return rising[rising.length - 1].target;
    if (owner >= 0 && (ratios.get(owner) || 0) >= FIELD_AT) return owner;
    let best = -1;
    ratios.forEach((r, i) => { if (best < 0 || r > ratios.get(best)) best = i; });
    return best >= 0 && ratios.get(best) > 0 ? best : owner;
  }

  const observer = new IntersectionObserver((entries) => {
    const changed = entries.map((entry) => {
      const target = scenes.indexOf(entry.target);
      const before = ratios.get(target) || 0;
      const now = entry.isIntersecting ? entry.intersectionRatio : 0;
      ratios.set(target, now);
      return { target, before, now };
    });
    if (!armed || suspended) return;
    const next = chooseOwner(changed);
    if (next !== owner && next >= 0) {
      owner = next;
      engine.onField(next);
    }
    const entering = changed.filter(({ before, now }) => before < ENTER_AT && now >= ENTER_AT).pop();
    if (entering) engine.onEnter(entering.target);
  }, { threshold: THRESHOLDS });
  scenes.forEach((scene) => observer.observe(scene));

  /** Start acting on crossings (after the first landing), with `index` as the field owner. */
  function arm(index) {
    owner = index;
    armed = true;
  }

  /** Jump the document to a section with the observer muted; it resumes once the new layout is reported. */
  function jumpTo(index) {
    suspended += 1;
    owner = index;
    scenes[index].scrollIntoView({ block: 'start', behavior: 'instant' });
    let frames = RESUME_FRAMES;
    const resume = () => {
      frames -= 1;
      if (frames > 0) requestAnimationFrame(resume);
      else suspended -= 1;
    };
    requestAnimationFrame(resume);
  }

  return {
    arm,
    jumpTo,
    destroy: () => observer.disconnect(),
    get owner() { return owner; },
  };
}
