/**
 * Step 1 of the booking form: a month calendar of Winnipeg dates (ARIA grid).
 *
 *   [←]  November 2026 · Central Time  [→]
 *   Sun Mon Tue Wed Thu Fri Sat
 *    1   2   3   4   5   6   7  …
 *
 * The bookable range is `days` (today in Winnipeg, then BOOKING.horizonDays
 * more); a date outside it, or one with no open slot left, is shown but disabled.
 * One roving tab stop: arrows move a day or a week, Home/End the week's ends,
 * PageUp/PageDown a month, and focus crosses into the next or previous month.
 * Selection follows focus onto an open day, as the old radio chips did, so the
 * day a keyboard visitor lands on is the day that gets booked. The grid role
 * also keeps those keys from cutting the scroll film (film-snap EDITOR_ROLES).
 * Pure date maths live in booking-ui.js (monthGrid, shiftDate, …).
 */
import { WEEKDAYS, clampDate, dayLabel, monthGrid, monthKeyOf, shiftDate, shiftMonth } from './booking-ui.js';

const WEEK = 7;
/** Key → days to move (PageUp/PageDown move a month, handled apart). */
const KEY_STEP = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -WEEK, ArrowDown: WEEK };
const SELECT_KEYS = new Set(['Enter', ' ']);

function cellHTML(cell, { today, selected, focus, isOpen, inRange }) {
  if (!cell) return '<span class="book-cal__cell" role="gridcell"></span>';
  const open = inRange(cell.date) && isOpen(cell.date);
  const attrs = [
    `data-date="${cell.date}"`,
    `tabindex="${cell.date === focus ? 0 : -1}"`,
    `aria-label="${dayLabel(cell.date)}"`,
    `aria-selected="${cell.date === selected}"`,
    open ? '' : 'aria-disabled="true"',
    cell.date === today ? 'aria-current="date"' : '',
  ].filter(Boolean).join(' ');
  return `<span class="book-cal__cell book-cal__day" role="gridcell" ${attrs}><span class="book-cal__num" aria-hidden="true">${cell.day}</span></span>`;
}

const headHTML = () => `<div class="book-cal__row book-cal__wds" role="row">${WEEKDAYS
  .map((d) => `<span class="book-cal__wd" role="columnheader" aria-label="${d.long}">${d.short}</span>`).join('')}</div>`;

/**
 * Wire the calendar in `root` ([data-calendar]). `days` is the ordered list of
 * bookable dates; `isOpen(date)` says whether a date still has a slot;
 * `onChoose(date)` runs when the chosen day changes.
 * Returns { select(date), focusCell() }.
 */
export function createCalendar(root, { days, isOpen, onChoose }) {
  const ui = {
    grid: root.querySelector('[data-days]'),
    prev: root.querySelector('[data-days-prev]'),
    next: root.querySelector('[data-days-next]'),
    month: root.querySelector('[data-days-month]'),
  };
  const first = days[0];
  const last = days[days.length - 1];
  const today = first;
  const inRange = (date) => date >= first && date <= last;
  const st = { month: monthKeyOf(first), selected: '', focus: first };

  /** The day that holds the tab stop in the shown month: the chosen day, else the first open one. */
  function anchorOf(key) {
    if (monthKeyOf(st.selected) === key) return st.selected;
    const cells = monthGrid(key).weeks.flat().filter((c) => c && inRange(c.date));
    return (cells.find((c) => isOpen(c.date)) || cells[0])?.date || clampDate(`${key}-01`, first, last);
  }

  function render() {
    const grid = monthGrid(st.month);
    ui.month.textContent = grid.label;
    const ctx = { today, selected: st.selected, focus: st.focus, isOpen, inRange };
    ui.grid.innerHTML = headHTML() + grid.weeks
      .map((week) => `<div class="book-cal__row" role="row">${week.map((c) => cellHTML(c, ctx)).join('')}</div>`).join('');
    setArrow(ui.prev, st.month <= monthKeyOf(first), ui.next);
    setArrow(ui.next, st.month >= monthKeyOf(last), ui.prev);
  }

  /** Disable a month arrow; when it holds focus, hand focus to the other arrow first, so it
   *  never falls to <body> (where the next arrow key would cut the film away from the form). */
  function setArrow(arrow, off, other) {
    if (off && arrow === document.activeElement) other.focus({ preventScroll: true });
    arrow.disabled = off;
  }

  const cellOf = (date) => ui.grid.querySelector(`[data-date="${date}"]`);
  const openDay = (date) => inRange(date) && isOpen(date);

  function select(date, { notify = false } = {}) {
    if (!openDay(date)) return;
    const changed = date !== st.selected;
    st.selected = date;
    st.focus = date;
    st.month = monthKeyOf(date);
    render();
    if (changed && notify) onChoose(date);
  }

  /** Move the tab stop to `date` (held in range), selecting it when it is open. */
  function moveTo(date) {
    const target = clampDate(date, first, last);
    if (openDay(target)) select(target, { notify: true });
    else {
      st.focus = target;
      st.month = monthKeyOf(target);
      render();
    }
    cellOf(target)?.focus({ preventScroll: true });
  }

  function showMonth(n) {
    st.month = shiftMonth(st.month, n);
    st.focus = anchorOf(st.month);
    render();
  }

  function weekEnd(date, toEnd) {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    return shiftDate(date, toEnd ? WEEK - 1 - weekday : -weekday);
  }

  function targetOf(event, date) {
    if (event.key in KEY_STEP) return shiftDate(date, KEY_STEP[event.key]);
    if (event.key === 'Home' || event.key === 'End') return weekEnd(date, event.key === 'End');
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      const key = shiftMonth(monthKeyOf(date), event.key === 'PageUp' ? -1 : 1);
      const day = Math.min(Number(date.slice(8)), monthGrid(key).weeks.flat().filter(Boolean).length);
      return `${key}-${String(day).padStart(2, '0')}`;
    }
    return '';
  }

  ui.grid.addEventListener('keydown', (event) => {
    const date = event.target.closest?.('[data-date]')?.dataset.date;
    if (!date) return;
    if (SELECT_KEYS.has(event.key)) {
      event.preventDefault();
      select(date, { notify: true });
      cellOf(date)?.focus({ preventScroll: true });
      return;
    }
    const target = targetOf(event, date);
    if (!target) return;
    event.preventDefault();
    moveTo(target);
  });
  ui.grid.addEventListener('click', (event) => {
    const date = event.target.closest?.('[data-date]')?.dataset.date;
    if (!date || !openDay(date)) return;
    select(date, { notify: true });
    cellOf(date)?.focus({ preventScroll: true });
  });
  ui.prev.addEventListener('click', () => showMonth(-1));
  ui.next.addEventListener('click', () => showMonth(1));

  render();

  return {
    /** Show and mark `date` as chosen (no onChoose: the caller already knows). */
    select: (date) => select(date),
    /** The cell that holds the tab stop (the stepper focuses it on an error). */
    focusCell: () => ui.grid.querySelector('[tabindex="0"]'),
  };
}
