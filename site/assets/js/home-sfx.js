/**
 * Home page sounds for the actions that matter, on top of the automatic click,
 * pop, hover and scroll voices from sfx.js (which also handles mute, unlock
 * and throttling, so every call here is safe and silent when muted).
 *
 *   choosing a need in the intro form → a tick whose pitch rises with the chip
 *   sending the introduction (form or any WhatsApp intro link) → success chime
 *   opening an FAQ answer → a soft tone in the bone field's key
 *   pressing play on the founder video → whoosh
 */
import { sfx } from './sfx.js';

const FORM = '#intro-form';
const NEED_INPUT = 'input[name="need"]';
const SEND_LINKS = '#intro-go, #how-go, #close-go';
const FAQ_ITEMS = '#faq details.acc';
const PLAY_BUTTON = '.vframe__play';
const CHIP_PITCH_STEP = 4; // tick index steps between neighbouring chips (55 Hz each)
const FAQ_FIELD = 'bone';

function onNeedChosen(form) {
  const inputs = Array.from(form.querySelectorAll(NEED_INPUT));
  form.addEventListener('change', (event) => {
    const index = inputs.indexOf(event.target);
    if (index >= 0) sfx.play('tick', { index: (index + 1) * CHIP_PITCH_STEP });
  });
}

function onSend(form) {
  form.addEventListener('submit', () => sfx.play('success'));
  document.addEventListener('click', (event) => {
    const target = event.target.closest?.(`${SEND_LINKS}, ${PLAY_BUTTON}`);
    if (!target) return;
    sfx.play(target.matches(PLAY_BUTTON) ? 'whoosh' : 'success');
  });
}

function onAnswerOpen() {
  document.querySelectorAll(FAQ_ITEMS).forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) sfx.play('tone', { field: FAQ_FIELD });
    });
  });
}

export function initHomeSounds() {
  const form = document.querySelector(FORM);
  if (form) {
    onNeedChosen(form);
    onSend(form);
  }
  onAnswerOpen();
}
