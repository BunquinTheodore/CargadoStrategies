/**
 * Accessible combobox for the finder's place search (WAI-ARIA 1.2 list
 * autocomplete): typing suggests places, arrow keys move through them,
 * Enter picks, Escape closes. Submitting the form resolves free text.
 */
import { suggestPlaces, kindLabel } from './finder-search.js';
import { escapeHtml } from './chrome.js';

const OPTION_ID = 'finder-option-';

function optionMarkup(place, i) {
  return `<li class="combo__option" id="${OPTION_ID}${i}" role="option" aria-selected="false" data-index="${i}">
    <span class="combo__label">${escapeHtml(place.label)}</span>
    <span class="combo__kind">${kindLabel(place)}</span></li>`;
}

export function createCombobox({ input, list, onPick }) {
  let options = [];
  let active = -1;

  function close() {
    list.hidden = true;
    list.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    options = [];
    active = -1;
  }

  function open(places) {
    options = places;
    active = -1;
    if (!places.length) {
      close();
      return;
    }
    list.innerHTML = places.map(optionMarkup).join('');
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function highlight(index) {
    active = (index + options.length) % options.length;
    list.querySelectorAll('[role="option"]').forEach((el, i) => el.setAttribute('aria-selected', String(i === active)));
    input.setAttribute('aria-activedescendant', `${OPTION_ID}${active}`);
  }

  function pick(index) {
    const place = options[index];
    if (!place) return;
    input.value = place.label;
    close();
    onPick(place);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape' && !list.hidden) {
      event.preventDefault();
      close();
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && options.length) {
      event.preventDefault();
      highlight(active + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      pick(active);
    }
  }

  input.addEventListener('input', () => open(suggestPlaces(input.value)));
  input.addEventListener('keydown', onKeyDown);
  input.addEventListener('blur', () => setTimeout(close, 0));
  // mousedown (not click) so the input's blur does not close the list first
  list.addEventListener('mousedown', (event) => {
    const option = event.target.closest('[role="option"]');
    if (!option) return;
    event.preventDefault();
    pick(Number(option.dataset.index));
  });

  return { close };
}
