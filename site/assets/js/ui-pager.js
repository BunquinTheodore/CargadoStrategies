/**
 * Paged lists and paged reading (R4 shared.md §6.2, api.md §17.2; legal.md §5.1).
 *
 *   createPager(list, { mode, maxPerPage, render, noun, status, focusOnTurn, film, onRender, bar, live })
 *     → { setItems(items, { silent }), goTo(page, { animate, announce }), refresh(), page, pages, destroy() }
 *   createPagedReader(root, { film, onTurn, when })
 *     → { goTo(page, { announce, animate, cause }), reveal(el), refresh(), page, pages, active, destroy() }
 *   initPagedReaders(scope, opts) → Map(root → api)
 *
 * Shared markup (both): nav.pager[data-pager-bar] with two .pager__btn
 * (data-dir="-1" / "1"), .pager__status with [data-pager-current] and
 * [data-pager-total], and a [data-pager-live] span outside the bar.
 * Both write el.csPager = api for fit-audit.
 *
 * Rules: button labels never change; Previous/Next use aria-disabled (never
 * disabled) so focus never drops; the live region speaks only on a user turn;
 * nothing measures with getBoundingClientRect (offset* values ignore the
 * film's transforms); turns are silent (DIRECTION §8: no page voice); only
 * opacity and transform animate, and nothing animates in flow mode.
 */

const TOL = 1;
const SWIPE_MIN_PX = 48;
const SWIPE_RATIO = 1.5;
const WHEEL_MIN = 30;
const WHEEL_LOCK_MS = 450;
const MAX_VERIFY = 2;
const TURN_OUT_S = 0.18;
const TURN_IN_S = 0.42;
const TURN_X = 24;
const FOCUSABLE = 'h2[tabindex], h3[tabindex], h4[tabindex], [tabindex="-1"], a[href], button:not([disabled]), input, select, textarea';

const motionOn = () => {
  const h = document.documentElement;
  return h.classList.contains('js') && !h.classList.contains('rm') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
const sum = (arr, a = 0, b = arr.length) => arr.slice(a, b).reduce((s, v) => s + v, 0);
const clampPage = (p, pages) => Math.max(0, Math.min(pages - 1, p));

/** The bar, live region and buttons around a pager. */
function partsOf(scope, { bar, live } = {}) {
  const barEl = bar || scope.querySelector('[data-pager-bar]');
  return {
    bar: barEl,
    live: live || scope.querySelector('[data-pager-live]'),
    prev: barEl?.querySelector('[data-dir="-1"]'),
    next: barEl?.querySelector('[data-dir="1"]'),
    current: barEl?.querySelector('[data-pager-current]'),
    total: barEl?.querySelector('[data-pager-total]'),
    status: barEl?.querySelector('.pager__status'),
  };
}

function writeStatus(parts, current, total) {
  if (parts.current && parts.total) {
    parts.current.textContent = current;
    parts.total.textContent = total;
  } else if (parts.status) parts.status.textContent = `${current} of ${total}`;
}

function setEnds(parts, page, pages) {
  parts.prev?.setAttribute('aria-disabled', String(page <= 0));
  parts.next?.setAttribute('aria-disabled', String(page >= pages - 1));
}

const isDisabled = (btn) => btn?.getAttribute('aria-disabled') === 'true';

/** A short opacity/translate turn (WAAPI: no GSAP dependency, compositor only). */
function playTurn(el, dir) {
  if (!motionOn() || !el.animate) return;
  el.animate([{ opacity: 0, transform: `translateX(${TURN_X * dir}px)` }, { opacity: 1, transform: 'none' }],
    { duration: TURN_IN_S * 1000, easing: 'cubic-bezier(.16,1,.3,1)' });
}

/* ==========================================================================
   createPager: a list paged by count ('static') or by what really fits ('fit')
   ========================================================================== */

export function createPager(list, {
  mode = 'static',
  maxPerPage = () => Infinity,
  render,
  noun = 'items',
  status = 'range',
  focusOnTurn = 'item',
  film,
  onRender,
  bar,
  live,
} = {}) {
  const scope = list.closest('[data-pager-root]') || list.parentElement;
  const parts = partsOf(scope, { bar, live });
  const st = { items: mode === 'static' ? Array.from(list.children) : [], starts: [0], page: 0 };

  const perPage = () => Math.max(1, Number(maxPerPage()) || Infinity);
  const pages = () => st.starts.length;
  const rangeOf = (p) => [st.starts[p], p + 1 < st.starts.length ? st.starts[p + 1] : st.items.length];
  const overflowing = () => list.scrollHeight > list.clientHeight + TOL;

  function showStatic(p) {
    const [a, b] = rangeOf(p);
    st.items.forEach((el, i) => { el.hidden = i < a || i >= b; });
  }

  /** Fit mode: the largest page from `start` that fits, up to perPage(). */
  function fitFrom(start) {
    let count = Math.min(perPage(), st.items.length - start);
    render(st.items.slice(start, start + count));
    while (count > 1 && overflowing()) {
      count -= 1;
      render(st.items.slice(start, start + count));
    }
    return Math.max(1, count);
  }

  function paginate() {
    if (!st.items.length) { st.starts = [0]; return; }
    if (mode === 'static') {
      const n = perPage();
      st.starts = [];
      for (let i = 0; i < st.items.length; i += Number.isFinite(n) ? n : st.items.length) st.starts.push(i);
      return;
    }
    st.starts = [];
    let start = 0;
    while (start < st.items.length) {
      st.starts.push(start);
      start += fitFrom(start);
    }
  }

  function show(p, { announce = false, animate = false, dir = 1 } = {}) {
    st.page = clampPage(p, pages());
    const [a, b] = rangeOf(st.page);
    if (mode === 'static') showStatic(st.page);
    else render(st.items.slice(a, b));
    const n = pages();
    if (parts.bar) parts.bar.hidden = n <= 1;
    setEnds(parts, st.page, n);
    const shown = st.items.length ? `${a + 1}–${b}` : '0';
    if (status === 'page') writeStatus(parts, st.page + 1, n);
    else writeStatus(parts, shown, st.items.length);
    if (announce && parts.live) {
      parts.live.textContent = status === 'page' ? `Page ${st.page + 1} of ${n}`
        : `Showing ${noun} ${a + 1} to ${b} of ${st.items.length}`;
    }
    if (animate) playTurn(list, dir);
    onRender?.({ page: st.page, pages: n });
  }

  function firstNewItem() {
    const visible = mode === 'static' ? st.items.filter((el) => !el.hidden) : Array.from(list.children);
    const item = visible[0];
    if (!item) return null;
    return item.matches(FOCUSABLE) ? item : item.querySelector(FOCUSABLE);
  }

  function turn(dir, cause) {
    const to = st.page + dir;
    if (to < 0 || to >= pages()) return;
    show(to, { announce: true, animate: true, dir });
    if (focusOnTurn === 'item' && cause !== 'key-arrow') firstNewItem()?.focus({ preventScroll: true });
  }

  const onBar = (event) => {
    const btn = event.target.closest('.pager__btn');
    if (!btn || isDisabled(btn)) return;
    turn(Number(btn.dataset.dir) || 1, 'button');
  };
  const onKey = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.target.matches('input, textarea, select, [contenteditable]')) return;
    event.preventDefault();
    turn(event.key === 'ArrowLeft' ? -1 : 1, 'key-arrow');
  };
  parts.bar?.addEventListener('click', onBar);
  scope.addEventListener('keydown', onKey);

  const api = {
    setItems(items, { silent = true } = {}) {
      st.items = mode === 'static' ? Array.from(items || list.children) : Array.from(items || []);
      paginate();
      show(0, { announce: !silent });
    },
    goTo(page, { animate = false, announce = false } = {}) {
      const dir = page >= st.page ? 1 : -1;
      show(page, { animate, announce, dir });
    },
    refresh() {
      const first = rangeOf(st.page)[0];
      paginate();
      const p = st.starts.findIndex((s, i) => s <= first && (i + 1 >= st.starts.length || st.starts[i + 1] > first));
      show(Math.max(0, p));
    },
    get page() { return st.page; },
    get pages() { return pages(); },
    destroy() {
      parts.bar?.removeEventListener('click', onBar);
      scope.removeEventListener('keydown', onKey);
      delete list.csPager;
    },
  };
  list.csPager = api;
  if (mode === 'static' || st.items.length) { paginate(); show(0); }
  return api;
}

/* ==========================================================================
   createPagedReader: measured pages for long text (legal §5.1)
   ========================================================================== */

export function createPagedReader(root, { film, onTurn, when = root.dataset.pagerWhen || 'all' } = {}) {
  const parts = partsOf(root);
  const win = root.querySelector('.pager__window');
  const track = root.querySelector('[data-pager-track]') || win;
  const panel = root.closest('[data-pager-panel], .legal-panel');
  const mql = when === 'all' ? null : window.matchMedia(when);
  const st = { breaks: [[0, 0]], page: 0, active: false, turning: false, pending: false, frame: 0, signature: '', verify: 0, wheelAt: 0 };
  const items = () => Array.from(track.querySelectorAll('[data-page-item]'));

  /** Item heights as offsetTop differences: they telescope to the track height exactly. */
  function heights(list) {
    return list.map((el, i) => (i + 1 < list.length ? list[i + 1].offsetTop : track.offsetHeight) - el.offsetTop);
  }
  function greedy(h, limit) {
    const out = [];
    let a = 0;
    let acc = 0;
    h.forEach((v, i) => {
      if (acc + v > limit + TOL && i > a) { out.push([a, i]); a = i; acc = 0; }
      acc += v;
    });
    out.push([a, h.length]);
    return out;
  }
  function plan(snug, list) {
    root.classList.toggle('is-snug', snug);
    if (parts.bar) parts.bar.hidden = true;
    const full = win.clientHeight;
    const h = heights(list);
    if (sum(h) <= full + TOL) return { snug, h, breaks: [[0, h.length]] };
    if (parts.bar) parts.bar.hidden = false;
    const limit = win.clientHeight;
    const count = greedy(h, limit).length;
    let lo = Math.max(...h);
    let hi = limit;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (greedy(h, mid).length <= count) hi = mid; else lo = mid;
    }
    return { snug, h, breaks: greedy(h, hi) };
  }

  function paginate(limitCut = 0) {
    if (!st.active || !root.getClientRects().length) return;
    const list = items();
    if (!list.length) return;
    root.classList.add('is-measuring');
    list.forEach((el) => el.classList.remove('is-off-page', 'is-page-first'));
    let r = plan(false, list);
    if (r.breaks.length > 1) {
      const s = plan(true, list);
      r = s.breaks.length < r.breaks.length ? s : plan(false, list);
    }
    if (limitCut > 0 && r.breaks.length > 1) r = { ...r, breaks: greedy(r.h, win.clientHeight - limitCut) };
    st.breaks = r.breaks;
    const pageH = Math.ceil(Math.max(...st.breaks.map(([a, b]) => sum(r.h, a, b)))) + 1;
    root.style.setProperty('--page-h', `${pageH}px`);
    root.classList.remove('is-measuring');
    const signature = `${win.clientWidth}|${r.snug}|${r.h.join(',')}`;
    st.signature = signature;
    show(Math.min(st.page, st.breaks.length - 1), { announce: false });
  }

  function schedule() {
    if (st.turning) { st.pending = true; return; }
    if (st.frame) return;
    st.frame = requestAnimationFrame(() => { st.frame = 0; paginate(); });
  }

  function verify() {
    const list = items().filter((el) => !el.classList.contains('is-off-page'));
    const bottom = Math.max(0, ...list.map((el) => el.offsetTop + el.offsetHeight));
    const over = bottom - win.clientHeight;
    if (over <= TOL) { st.verify = 0; return; }
    st.verify += 1;
    if (st.verify <= MAX_VERIFY) schedule();
    else { st.verify = 0; paginate(over); }
  }

  function show(p, { announce = false } = {}) {
    const n = st.breaks.length;
    st.page = clampPage(p, n);
    const [a, b] = st.breaks[st.page];
    items().forEach((el, i) => {
      el.classList.toggle('is-off-page', i < a || i >= b);
      el.classList.toggle('is-page-first', i === a);
    });
    if (parts.bar) parts.bar.hidden = n <= 1;
    writeStatus(parts, st.page + 1, n);
    setEnds(parts, st.page, n);
    if (panel) panel.dataset.left = String(n === 1 ? 2 : Math.min(2, n - 1 - st.page));
    if (announce && parts.live) parts.live.textContent = `Page ${st.page + 1} of ${n}`;
    root.dispatchEvent(new CustomEvent('cs:pager', { detail: { page: st.page, pages: n } }));
    if (!st.turning) verify();
  }

  function goTo(page, { announce = true, animate = true, cause = 'api' } = {}) {
    const next = clampPage(page, st.breaks.length);
    if (!st.active) return;
    if (next === st.page) { show(next, { announce: false }); return; }
    const dir = next > st.page ? 1 : -1;
    const done = () => { onTurn?.({ page: st.page, pages: st.breaks.length, cause }); };
    if (!animate || !motionOn() || !track.animate) {
      show(next, { announce });
      done();
      return;
    }
    st.turning = true;
    const out = track.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-TURN_X * dir}px)` }],
      { duration: TURN_OUT_S * 1000, easing: 'cubic-bezier(.55,0,1,.45)' });
    out.onfinish = () => {
      show(next, { announce });
      const back = track.animate([{ opacity: 0, transform: `translateX(${TURN_X * dir}px)` }, { opacity: 1, transform: 'none' }],
        { duration: TURN_IN_S * 1000, easing: 'cubic-bezier(.16,1,.3,1)' });
      back.onfinish = () => {
        st.turning = false;
        verify();
        if (st.pending) { st.pending = false; schedule(); }
        done();
      };
    };
  }

  function pageOf(el) {
    const index = items().findIndex((item) => item.contains(el));
    if (index < 0) return -1;
    return st.breaks.findIndex(([a, b]) => index >= a && index < b);
  }

  function setActive(on) {
    st.active = on;
    if (on) { schedule(); return; }
    items().forEach((el) => el.classList.remove('is-off-page', 'is-page-first'));
    root.style.removeProperty('--page-h');
    if (parts.bar) parts.bar.hidden = true;
  }

  /* ---------- input ---------- */
  const onBar = (event) => {
    const btn = event.target.closest('.pager__btn');
    if (!btn || isDisabled(btn)) return;
    goTo(st.page + (Number(btn.dataset.dir) || 1), { cause: event.detail === 0 ? 'key' : 'pointer' });
  };
  const onKey = (event) => {
    if (!st.active || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.target.matches('input, textarea, select, [contenteditable]')) return;
    event.preventDefault();
    goTo(st.page + (event.key === 'ArrowLeft' ? -1 : 1), { cause: 'key' });
  };
  const swipe = { x: 0, y: 0, id: null };
  const onDown = (event) => { if (event.pointerType !== 'mouse') Object.assign(swipe, { x: event.clientX, y: event.clientY, id: event.pointerId }); };
  const onUp = (event) => {
    if (swipe.id !== event.pointerId) return;
    swipe.id = null;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > SWIPE_RATIO * Math.abs(dy)) goTo(st.page + (dx < 0 ? 1 : -1), { cause: 'swipe' });
  };
  const onWheel = (event) => {
    if (!st.active || Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) <= WHEEL_MIN) return;
    event.preventDefault();
    const now = performance.now();
    if (now - st.wheelAt < WHEEL_LOCK_MS) return;
    st.wheelAt = now;
    goTo(st.page + (event.deltaX > 0 ? 1 : -1), { cause: 'wheel' });
  };
  const onFocusIn = (event) => {
    const item = event.target.closest?.('[data-page-item].is-off-page');
    if (!item) return;
    const p = pageOf(item);
    if (p >= 0) goTo(p, { animate: false, announce: false, cause: 'focus' });
  };

  parts.bar?.addEventListener('click', onBar);
  root.addEventListener('keydown', onKey);
  root.addEventListener('focusin', onFocusIn);
  if (win) {
    win.setAttribute('data-swipe-x', '');
    win.addEventListener('pointerdown', onDown, { passive: true });
    win.addEventListener('pointerup', onUp, { passive: true });
    win.addEventListener('wheel', onWheel, { passive: false });
  }

  /* ---------- when to paginate ---------- */
  const ro = new ResizeObserver((entries) => {
    if (entries.every((e) => e.target.classList?.contains('is-off-page'))) return;
    schedule();
  });
  ro.observe(root);
  if (panel) ro.observe(panel);
  items().forEach((el) => ro.observe(el));
  const onFonts = () => schedule();
  document.fonts?.addEventListener?.('loadingdone', onFonts);
  const offs = [];
  if (film && typeof film.on === 'function') {
    ['build', 'rebuilt'].forEach((name) => offs.push(film.on(name, schedule)));
  }
  const onMedia = () => setActive(mql ? mql.matches : true);
  mql?.addEventListener('change', onMedia);
  const start = () => setActive(mql ? mql.matches : true);
  if (document.fonts?.ready) document.fonts.ready.then(start); else start();

  const api = {
    goTo,
    reveal(el) {
      const p = pageOf(el);
      if (p >= 0) goTo(p, { animate: false, announce: false, cause: 'deeplink' });
    },
    refresh() { st.signature = ''; schedule(); },
    get page() { return st.page; },
    get pages() { return st.breaks.length; },
    get active() { return st.active; },
    destroy() {
      ro.disconnect();
      mql?.removeEventListener('change', onMedia);
      document.fonts?.removeEventListener?.('loadingdone', onFonts);
      offs.forEach((off) => typeof off === 'function' && off());
      parts.bar?.removeEventListener('click', onBar);
      root.removeEventListener('keydown', onKey);
      root.removeEventListener('focusin', onFocusIn);
      win?.removeEventListener('pointerdown', onDown);
      win?.removeEventListener('pointerup', onUp);
      win?.removeEventListener('wheel', onWheel);
      setActive(false);
      delete root.csPager;
    },
  };
  root.csPager = api;
  return api;
}

export function initPagedReaders(scope = document, opts = {}) {
  const map = new Map();
  scope.querySelectorAll('[data-pager]').forEach((root) => map.set(root, createPagedReader(root, opts)));
  return map;
}
