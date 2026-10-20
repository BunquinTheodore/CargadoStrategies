/**
 * Section base class: one class per <section> that has behaviour
 * (sections/<page>/<name>/<Name>.js). The film stays the only owner of the
 * scenes; a Section only listens to the scene events it already emits
 * (film.js / film-flow.js, api.md §2):
 *
 *   'landed'  { index, id, el, from, cause, mode }   a cut finished (flow: a section came into view)
 *   'cut'     { from, to, dir, tl, fromEl, toEl, … } a cut is about to play; listeners append to tl
 *
 *   import { Section, mountSections } from '../../core/Section.js';
 *
 *   export class Hero extends Section {
 *     static id = 'hero';                         // the <section id> it drives
 *     mount() { … wire DOM once … }
 *     enter(event) { … this scene landed … }
 *     leave(event) { … another scene landed … }
 *     cut(event) { … optional: append to event.tl when the cut enters or leaves this scene … }
 *     destroy() { … undo mount() … }
 *   }
 *
 *   const ctx = boot();                           // { film, chrome, sfx, tier, globe, sheet }
 *   mountSections([Hero, Values], ctx);           // register in the same tick as boot()
 *
 * enter() runs on the 'landed' whose scene is (or holds, or sits in) this
 * section, leave() on the first 'landed' elsewhere after that. cut() is only
 * subscribed when a subclass defines it, so classes without one add no 'cut'
 * listener (listener order sets the order of appended tweens). A section
 * outside every scene (a dialog) never enters.
 */

const fail = (id, what) => (err) => console.error(`section #${id}: ${what} failed`, err);

export class Section {
  /** The id of the <section> this class drives; subclasses set it. */
  static id = '';

  /** `el` is the section element, `ctx` what boot() returned ({ film, chrome, sfx, tier, globe, sheet }). */
  constructor(el, ctx = {}) {
    this.el = el;
    this.ctx = ctx;
    this.film = ctx.film || null;
    this.active = false;
  }

  /** Wire the DOM once (called by mountSections before any scene event). */
  mount() {}

  /** This section's scene landed. */
  enter() {}

  /** Another scene landed after this one. */
  leave() {}

  /** Undo mount(); listeners on the film are removed by the helper. */
  destroy() {}

  /** True when the scene element of a film event belongs to this section. */
  owns(sceneEl) {
    return !!sceneEl && (sceneEl === this.el || this.el.contains(sceneEl) || sceneEl.contains(this.el));
  }
}

/** Subscribe one section to the film's scene events → the unsubscribe functions. */
function wire(section, film) {
  if (!film || typeof film.on !== 'function') return [];
  const offs = [film.on('landed', (event) => {
    const mine = section.owns(event.el);
    if (mine && !section.active) {
      section.active = true;
      section.enter(event);
    } else if (!mine && section.active) {
      section.active = false;
      section.leave(event);
    }
  })];
  if (typeof section.cut === 'function') {
    offs.push(film.on('cut', (event) => {
      if (section.owns(event.toEl) || section.owns(event.fromEl)) section.cut(event);
    }));
  }
  return offs;
}

/**
 * Instantiate each Section class for its element (by static id, in `root`),
 * mount it and wire enter / leave / cut to the film. A missing element is an
 * error (the page lists only its own sections); a failing mount is reported
 * and never stops the others. → { sections, destroy }.
 */
export function mountSections(classes, ctx = {}, root = document) {
  const sections = classes.map((Cls) => {
    if (!Cls.id) throw new Error(`${Cls.name}: static id is not set`);
    const el = root.getElementById ? root.getElementById(Cls.id) : root.querySelector(`#${CSS.escape(Cls.id)}`);
    if (!el) throw new Error(`${Cls.name}: no #${Cls.id} on this page`);
    return new Cls(el, ctx);
  });
  const offs = sections.flatMap((section) => {
    try {
      section.mount();
    } catch (err) {
      fail(section.constructor.id, 'mount')(err);
      return [];
    }
    return wire(section, ctx.film);
  });
  const destroy = () => {
    offs.forEach((off) => off());
    sections.forEach((section) => {
      try {
        section.destroy();
      } catch (err) {
        fail(section.constructor.id, 'destroy')(err);
      }
    });
  };
  return { sections, destroy };
}
