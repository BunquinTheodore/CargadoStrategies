/**
 * Dialogs (R4 shared.md §6.4, api.md §17.4): native <dialog> with showModal().
 *
 *   openDialog(dialogEl, { trigger, film, onOpen, onClose })
 *   closeDialog(dialogEl, { returnFocus = true })
 *
 * - showModal() gives the focus trap and the inert background.
 * - Escape and a click on the backdrop close it.
 * - film.stop('dialog') on open and film.start('dialog') on close, BEFORE
 *   onClose runs, so a callback may call film.goTo().
 * - The trigger scene's data-field is copied onto the dialog, so its colours
 *   match where it was opened from.
 * - Focus returns to the trigger unless closeDialog(…, { returnFocus: false }).
 */

const STOP_TOKEN = 'dialog';
const state = new WeakMap(); // dialog → { trigger, film, onClose, returnFocus }

function fieldOf(trigger) {
  const scene = trigger?.closest?.('[data-field]');
  return scene?.dataset.field || document.documentElement.dataset.field || '';
}

/**
 * A click on the ::backdrop. The dialog box has no padding and its panel fills
 * it, so a click whose target is the dialog element itself landed outside the
 * panel, on the backdrop.
 */
const isBackdropClick = (dialog, event) => event.target === dialog;

function wire(dialog) {
  if (dialog.csDialogWired) return;
  dialog.csDialogWired = true;
  dialog.addEventListener('click', (event) => {
    if (isBackdropClick(dialog, event)) closeDialog(dialog);
    if (event.target.closest('[data-dialog-close]')) closeDialog(dialog);
  });
  dialog.addEventListener('close', () => {
    const s = state.get(dialog);
    state.delete(dialog);
    if (!s) return;
    if (s.film && typeof s.film.start === 'function') s.film.start(STOP_TOKEN);
    s.onClose?.(dialog);
    const trigger = s.trigger;
    if (s.returnFocus && trigger?.isConnected && typeof trigger.focus === 'function') trigger.focus({ preventScroll: true });
  });
}

export function openDialog(dialog, { trigger, film, onOpen, onClose } = {}) {
  if (!dialog || dialog.open) return;
  wire(dialog);
  const field = fieldOf(trigger);
  if (field) dialog.dataset.field = field;
  state.set(dialog, { trigger: trigger || document.activeElement, film, onClose, returnFocus: true });
  if (film && typeof film.stop === 'function') film.stop(STOP_TOKEN);
  dialog.showModal();
  onOpen?.(dialog);
}

export function closeDialog(dialog, { returnFocus = true } = {}) {
  if (!dialog?.open) return;
  const s = state.get(dialog);
  if (s) s.returnFocus = returnFocus;
  dialog.close();
}
