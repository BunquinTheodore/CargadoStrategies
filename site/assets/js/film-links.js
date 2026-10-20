/**
 * Scene targets, aliases and deep-link dialogs (DIRECTION §9.4, api.md §5.2),
 * shared by every mode.
 *
 *   data-alias="a b c"            #a, #b and #c resolve to the section (a real id always wins)
 *   data-open="dialogId:key …"    after a hash lands on the section, each pair whose key is the
 *                                 hash (or '*': any alias, never the section's own id) gets a
 *                                 cancelable 'cs:open' on #dialogId; unless a listener calls
 *                                 preventDefault(), ui-dialog.js opens it.
 * Hashes for the WhatsApp sheet (#wa-sheet, #wa-sheet?contact) are never ours.
 */
import { idFromHash } from './film-events.js';

const SHEET_HASH = /^wa-sheet(\?|$)/;
const WILDCARD = '*';

export const isSheetHash = (hash) => SHEET_HASH.test(idFromHash(hash));

export function createLinks(scenes) {
  const aliases = new Map();
  scenes.forEach((scene, index) => {
    (scene.dataset.alias || '').split(/\s+/).filter(Boolean).forEach((name) => {
      if (!aliases.has(name)) aliases.set(name, index);
    });
  });

  const sceneIndexOf = (node) => {
    const scene = node?.closest?.('.scene');
    return scene ? scenes.indexOf(scene) : -1;
  };

  /** Index of a target: an index, an id or alias (with or without #), or an element inside a scene; -1 if none. */
  function indexOf(target) {
    if (typeof target === 'number') return Number.isInteger(target) && target >= 0 && target < scenes.length ? target : -1;
    if (typeof target === 'string') {
      const name = idFromHash(target.startsWith('#') ? target : `#${target}`);
      if (!name || SHEET_HASH.test(name)) return -1;
      const el = document.getElementById(name);
      if (el) return sceneIndexOf(el);
      return aliases.has(name) ? aliases.get(name) : -1;
    }
    return target instanceof Element ? sceneIndexOf(target) : -1;
  }

  /** data-open pairs of a scene that a hash name opens. */
  function opensFor(scene, name) {
    const isOwnId = name === scene.id;
    return (scene.dataset.open || '').split(/\s+/).filter(Boolean).map((pair) => {
      const cut = pair.lastIndexOf(':');
      return { dialog: pair.slice(0, cut), key: pair.slice(cut + 1) };
    }).filter(({ dialog, key }) => dialog && (key === name || (key === WILDCARD && !isOwnId)));
  }

  /** What a hash points at: the 'deeplink' payload (plus the scene index), or null when it is not ours. */
  function parse(hash) {
    const name = idFromHash(hash);
    if (!name || SHEET_HASH.test(name)) return null;
    const index = indexOf(name);
    if (index < 0) return null;
    const scene = scenes[index];
    const el = document.getElementById(name);
    const alias = el ? null : name;
    const first = opensFor(scene, name)[0];
    return { id: name, alias, el: el || scene, scene, index, open: first ? { dialog: first.dialog, key: name } : null };
  }

  /** Fire the scene's data-open pairs for this hash; opens the dialog unless a listener prevented it. */
  function openFor(link, film) {
    if (!link) return;
    opensFor(link.scene, link.id).forEach(({ dialog: id }) => {
      const dialog = document.getElementById(id);
      if (!dialog) return;
      const event = new CustomEvent('cs:open', { cancelable: true, detail: { key: link.id, scene: link.scene, film } });
      if (!dialog.dispatchEvent(event)) return;
      import('./ui-dialog.js').then(({ openDialog }) => openDialog(dialog, { film }), (err) => {
        console.error('film: ui-dialog.js failed to load; opening the dialog natively', err);
        if (!dialog.open) dialog.showModal();
      });
    });
  }

  return { indexOf, parse, openFor, sceneIndexOf };
}
