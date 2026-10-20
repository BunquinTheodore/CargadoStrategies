/**
 * In-page measurement code for tools/fit-audit.mjs. Every export is a self-contained
 * function: fit-audit serialises it with `${fn}` and evaluates it in the page, so nothing
 * here may reference module scope.
 *
 * measureBox(target, cfg)  one scene (target = { kind: 'scene', i }) or one open dialog
 *                          ({ kind: 'dialog', i }): Y, X, header, scroll, clipped,
 *                          small-text, overlap, spare and (scenes, cfg.r5) the DIRECTION
 *                          §4.2 / §13 budgets: words, elements, groups, whitespace, longword.
 * pageFacts()              per-page facts for archetype-repeat, gold-fields and irises.
 */

/** Measure one scene or one open dialog. cfg: { mode, activated, now, why, r5, errorsPass }. */
export function measureBox(target, cfg) {
  const TEXT_FLOOR_PX = 14; // DIRECTION §3 --fs-label: nothing visible renders below it
  const FLOOR_SLACK_PX = 0.25;
  const READING_MIN_WORDS = 4; // shorter strings are labels, not reading text
  const LONGWORD_LETTERS = 9;
  const WHITE_MIN = 0.18; // DIRECTION §3 --white-min
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const isDialog = target.kind === 'dialog';
  const root = isDialog ? document.querySelectorAll('dialog[open]')[target.i] : document.querySelectorAll('section.scene')[target.i];
  if (!root) return { missing: true };
  const inner = isDialog ? root : (root.querySelector(':scope > .scene__inner') || root);
  const pan = isDialog ? root : (inner.querySelector(':scope > .scene__pan') || inner);
  const flow = cfg.mode === 'flow';
  const neutral = document.createElement('style');
  const reset = 'transform:none!important;translate:none!important;rotate:none!important;scale:none!important;';
  neutral.textContent = cfg.activated || flow || cfg.mode === 'touch-cut'
    ? `section.scene[style],section.scene>.scene__inner[style],.scene__inner>.scene__pan[style]{${reset}}`
    : `section.scene,section.scene [style*="transform"],section.scene [style*="translate"],section.scene [style*="rotate"],section.scene [style*="scale"]{${reset}}
       section.scene,section.scene [style*="opacity"]{opacity:1!important}`;
  if (!isDialog) document.head.appendChild(neutral);
  try {
    const desc = (el) => {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
      const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
      return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls}` : ''}${txt ? ` "${txt}"` : ''}`;
    };
    /* Resolve a length token in this scene's context (scoped token overrides apply). */
    const resolve = (prop, decl) => {
      const probe = document.createElement('div');
      probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;${decl}`;
      inner.appendChild(probe);
      const cs = getComputedStyle(probe);
      const v = prop === 'font' ? parseFloat(cs.fontSize) : prop === 'w' ? probe.offsetWidth : probe.offsetHeight;
      const defined = getComputedStyle(inner).getPropertyValue(decl.match(/var\((--[\w-]+)/)[1]).trim() !== '';
      probe.remove();
      return defined ? v : null;
    };
    const header = document.querySelector('.site-header');
    const hs = header && getComputedStyle(header);
    const headerBottom = !isDialog && hs && hs.display !== 'none' && hs.visibility !== 'hidden' && hs.position === 'fixed'
      ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    const fsNote = resolve('font', 'font-size:var(--fs-note)') || (vw >= 760 ? 16 : 15);

    /* Clip rect from every clipping ancestor below inner (inner itself is not a clip: what it cuts is the defect). */
    const clipCache = new Map();
    function clipOf(el) {
      if (!el || el === inner || el === root || !root.contains(el)) return [-Infinity, -Infinity, Infinity, Infinity];
      if (clipCache.has(el)) return clipCache.get(el);
      const up = clipOf(el.parentElement);
      const cs = getComputedStyle(el);
      let c = up;
      const paint = /paint|strict|content/.test(cs.contain || '') || cs.clipPath !== 'none' || (cs.clip && cs.clip !== 'auto');
      const clipX = paint || cs.overflowX !== 'visible';
      const clipY = paint || cs.overflowY !== 'visible';
      if (clipX || clipY) {
        const r = el.getBoundingClientRect();
        c = [clipX ? Math.max(up[0], r.left) : up[0], clipY ? Math.max(up[1], r.top) : up[1],
          clipX ? Math.min(up[2], r.right) : up[2], clipY ? Math.min(up[3], r.bottom) : up[3]];
      }
      clipCache.set(el, c);
      return c;
    }
    const opCache = new Map();
    function opacityOf(el) {
      if (!el || !root.contains(el)) return 1;
      if (opCache.has(el)) return opCache.get(el);
      const o = parseFloat(getComputedStyle(el).opacity) * (el === root ? 1 : opacityOf(el.parentElement));
      opCache.set(el, o);
      return o;
    }
    const REPLACED = /^(IMG|SVG|VIDEO|CANVAS|IFRAME|INPUT|SELECT|TEXTAREA|BUTTON|PICTURE|OBJECT|EMBED)$/i;
    const clear = (c) => /rgba\(.*,\s*0\)|transparent/.test(c);
    const painted = (cs) => cs.backgroundImage !== 'none' || !clear(cs.backgroundColor)
      || ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs[`border${s}Width`]) > 0 && !clear(cs[`border${s}Color`]));
    const LABEL_SEL = 'button,.btn,label,legend,.eyebrow,.label,.tags,.tag,.chip,nav,[role="tab"],[role="tablist"],.pager,'
      + '.num,.num-outline,dt,.stepper__status,.site-footer__copy,.legal-draft,select,option,h1,h2,h3,h4,h5,h6,[data-fit-label]';
    const EXEMPT_WORDS = '.fineprint,[data-compliance]';
    /* A closed <details> still lays out its body (Chrome's ::details-content), but nothing of it is painted. */
    const CLOSED_BODY = 'details:not([open]) > :not(summary)';

    const items = []; // visible boxes { l, t, r, b, el }
    const smallText = [];
    let minText = Infinity;
    let words = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (el) => (el.getAttribute('aria-hidden') === 'true' || el.parentElement?.closest('svg')
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let el = walker.nextNode(); el; el = walker.nextNode()) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility !== 'visible' || opacityOf(el) < 0.02 || el.closest(CLOSED_BODY)) continue;
      const rects = [];
      if (REPLACED.test(el.tagName) || el.getAttribute('role') === 'img' || painted(cs)) rects.push(el.getBoundingClientRect());
      const boxCount = rects.length;
      const own = clipOf(el);
      for (const node of el.childNodes) {
        if (node.nodeType !== 3 || !node.textContent.trim() || el.matches('details:not([open])')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const glyphs = [...range.getClientRects()].filter((r) => {
          const l = Math.max(r.left, own[0]), t = Math.max(r.top, own[1]), rr = Math.min(r.right, own[2]), b = Math.min(r.bottom, own[3]);
          return r.width >= 0.5 && r.height >= 0.5 && rr - l >= 0.5 && b - t >= 0.5;
        });
        if (!glyphs.length) continue;
        rects.push(...glyphs);
        const fs = parseFloat(cs.fontSize);
        const n = (node.textContent.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) || []).length;
        minText = Math.min(minText, fs);
        if (fs < TEXT_FLOOR_PX - FLOOR_SLACK_PX) smallText.push({ px: fs, floor: TEXT_FLOOR_PX, el: desc(el) });
        else if (n >= READING_MIN_WORDS && fs < fsNote - FLOOR_SLACK_PX && !el.closest(LABEL_SEL)) {
          smallText.push({ px: fs, floor: fsNote, el: desc(el) });
        }
        if (!el.closest(EXEMPT_WORDS)) words += n;
      }
      if (!rects.length) continue;
      const outer = clipOf(el.parentElement);
      rects.forEach((r, k) => {
        const [cl, ct, cr, cb] = k < boxCount ? outer : own;
        if (r.width < 0.5 || r.height < 0.5) return;
        const l = Math.max(r.left, cl), t = Math.max(r.top, ct), rr = Math.min(r.right, cr), b = Math.min(r.bottom, cb);
        if (rr - l < 0.5 || b - t < 0.5) return;
        items.push({ l, t, r: rr, b, el });
      });
    }

    /* The box. Dialogs: the viewport. Flow: the section from its own top, one screen. */
    const rootRect = root.getBoundingClientRect();
    const innerRect = inner.getBoundingClientRect();
    const availTop = isDialog ? 0 : flow ? rootRect.top : Math.max(headerBottom, innerRect.top);
    const availBottom = isDialog ? vh : flow ? rootRect.top + vh : cfg.now ? innerRect.bottom : (cfg.mode === 'touch-cut' ? innerRect.top + vh : vh);
    const box = Math.round(availBottom - availTop);
    const lowest = items.reduce((m, it) => Math.max(m, it.b), -Infinity);
    const top = items.reduce((m, it) => Math.min(m, it.t), Infinity);
    let content;
    let overflowY;
    if (isDialog) {
      content = Math.max(root.scrollHeight, rootRect.height);
      if (/hidden|clip/.test(getComputedStyle(root).overflowY)) content = Math.max(content, lowest - rootRect.top);
      overflowY = Math.max(rootRect.bottom - vh, -rootRect.top, root.scrollHeight - root.clientHeight);
    } else if (flow) {
      content = root.offsetHeight;
      overflowY = Math.max(content - vh, lowest - availBottom);
    } else {
      /* Content height = the pan's child extent plus its bottom padding (R4 §8.2). */
      const pcs = getComputedStyle(pan);
      let extent = [...pan.children].reduce((m, c) => {
        const ccs = getComputedStyle(c);
        if (ccs.display === 'none' || ccs.position === 'absolute' || ccs.position === 'fixed') return m;
        return Math.max(m, c.getBoundingClientRect().bottom);
      }, -Infinity) - pan.getBoundingClientRect().top + parseFloat(pcs.paddingBottom || 0);
      if (!Number.isFinite(extent)) extent = 0;
      content = Math.max(pan.offsetHeight, extent);
      const panExcess = pan === inner ? inner.scrollHeight - inner.clientHeight : content - inner.clientHeight;
      overflowY = Math.max(panExcess, lowest - availBottom);
    }
    /* Spare = the room between the lowest visible content and the box bottom. Dialogs: vh - dialog,
       the room above a bottom sheet or around a centred dialog (a sheet's own panel reaches the bottom). */
    const byItems = Number.isFinite(lowest) ? availBottom - lowest : box;
    const spare = Math.round(isDialog ? vh - content : byItems);
    const headerOverlap = flow || isDialog ? 0 : Math.max(0, headerBottom - top);
    const left = items.reduce((m, it) => Math.min(m, it.l), Infinity);
    const right = items.reduce((m, it) => Math.max(m, it.r), -Infinity);
    const overL = Math.max(0, -left), overR = Math.max(0, right - vw);

    /* Inner scrollers (R4 §8.3) and clipped boxes (R4 §8.4). */
    const innerScroll = [];
    const clipped = [];
    const SKIP_CLIP = '.visually-hidden,.hp,[aria-hidden="true"],[data-fit-ignore],[data-page-item].is-off-page,[data-pager],.pager__window';
    const clipScope = isDialog ? root : pan;
    clipScope.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility !== 'visible') return;
      if (!/^(TEXTAREA|SELECT)$/.test(el.tagName)) {
        const sy = /auto|scroll/.test(cs.overflowY) && el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1;
        const sx = /auto|scroll/.test(cs.overflowX) && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1;
        if (sy) innerScroll.push({ axis: 'y', el: desc(el), px: el.scrollHeight - el.clientHeight });
        if (sx) innerScroll.push({ axis: 'x', el: desc(el), px: el.scrollWidth - el.clientWidth });
      }
      if (!/hidden|clip/.test(cs.overflowX + cs.overflowY)) return;
      if (/^(INPUT|TEXTAREA|SELECT|IMG|SVG|CANVAS|VIDEO|IFRAME)$/i.test(el.tagName) || /^inline(-block)?$/.test(cs.display)) return;
      if (el.clientWidth <= 2 || el.clientHeight <= 2 || /inset\(50%/.test(cs.clipPath) || (cs.clip && cs.clip !== 'auto')) return;
      if (el.closest(SKIP_CLIP) || opacityOf(el) < 0.02) return;
      const cy = /hidden|clip/.test(cs.overflowY) ? el.scrollHeight - el.clientHeight : 0;
      const cx = /hidden|clip/.test(cs.overflowX) ? el.scrollWidth - el.clientWidth : 0;
      if (cy > 1) clipped.push({ axis: 'y', el: desc(el), px: cy });
      if (cx > 1) clipped.push({ axis: 'x', el: desc(el), px: cx });
    });

    /* Overlap between consecutive rows of a .scene--fill grid (R4 §8.7). */
    const overlap = [];
    if (!isDialog && root.classList.contains('scene--fill')) {
      pan.querySelectorAll('*').forEach((grid) => {
        if (getComputedStyle(grid).display !== 'grid') return;
        const rows = [];
        [...grid.children].forEach((c) => {
          const r = c.getBoundingClientRect();
          if (!r.height || getComputedStyle(c).position === 'absolute') return;
          const row = rows.find((x) => Math.abs(x.top - r.top) <= 1);
          if (row) row.bottom = Math.max(row.bottom, r.bottom); else rows.push({ top: r.top, bottom: r.bottom });
        });
        rows.sort((a, b) => a.top - b.top);
        for (let k = 1; k < rows.length; k++) {
          if (rows[k - 1].bottom > rows[k].top + 1) overlap.push({ el: desc(grid), px: Math.round(rows[k - 1].bottom - rows[k].top) });
        }
      });
    }

    const res = {
      kind: target.kind, i: target.i, id: root.id || '',
      title: isDialog ? (root.getAttribute('aria-label') || root.querySelector('h2,h3')?.textContent.trim().slice(0, 40) || '')
        : (root.dataset.title || root.querySelector('h1,h2')?.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) || ''),
      box, content: Math.round(content), spare,
      overflowY: Math.max(0, Math.round(overflowY)),
      overflowX: Math.round(Math.max(overL, overR)), sideX: overL > overR ? 'left' : 'right',
      headerOverlap: Math.round(headerOverlap),
      innerScroll, clipped, overlap,
      smallText: smallText.filter((x, k, a) => a.findIndex((y) => y.el === x.el) === k).slice(0, 6),
      minText: Number.isFinite(minText) ? minText : null,
      hasForm: !!root.querySelector('form'),
    };

    if (cfg.r5 && !isDialog) {
      const archetype = root.dataset.archetype || '';
      const exempt = archetype === 'credits' || root.id === 'credits';
      const isGroup = (el) => el.matches('[data-group]') && !el.parentElement.closest('[data-group]');
      const groups = [...root.querySelectorAll('[data-group]')].filter((el) => isGroup(el) && getComputedStyle(el).display !== 'none');
      /* Interactive or framed elements (DIRECTION §4.2 rule 5). */
      const INTERACTIVE = 'a[href],button,input:not([type="hidden"]),select,textarea,summary,[role="button"],[role="tab"],[tabindex]:not([tabindex="-1"])';
      const seen = new Set();
      root.querySelectorAll('*').forEach((el) => {
        if (el.closest('[aria-hidden="true"]')) return;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility !== 'visible' || opacityOf(el) < 0.02) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        const sides = ['Top', 'Right', 'Bottom', 'Left'].filter((s) => parseFloat(cs[`border${s}Width`]) >= 1 && !clear(cs[`border${s}Color`])).length;
        const framed = el.matches('.paper,[data-frame]') || (sides >= 3 && !/^(HR|INPUT|SELECT|TEXTAREA)$/.test(el.tagName));
        if (el.matches(INTERACTIVE) || framed) seen.add(el.matches('[data-frame]') ? (el.closest('svg') || el) : el);
      });
      /* Whitespace: the union of the group boxes against the scene's safe box (rule 3). */
      const safeW = resolve('w', 'width:var(--scene-safe-w)') || innerRect.width;
      const safeH = resolve('h', 'height:var(--scene-safe-h)') || box;
      const padTop = resolve('h', 'height:var(--scene-pad-top)') || 0;
      const sx0 = (vw - safeW) / 2, sy0 = (flow ? rootRect.top + headerBottom : availTop) + padTop;
      const rects = groups.map((g) => g.getBoundingClientRect())
        .map((r) => [Math.max(r.left, sx0), Math.max(r.top, sy0), Math.min(r.right, sx0 + safeW), Math.min(r.bottom, sy0 + safeH)])
        .filter(([l, t, r, b]) => r > l && b > t);
      const xs = [...new Set(rects.flatMap((r) => [r[0], r[2]]))].sort((a, b) => a - b);
      let area = 0;
      for (let k = 0; k + 1 < xs.length; k++) {
        const spans = rects.filter((r) => r[0] <= xs[k] && r[2] >= xs[k + 1]).map((r) => [r[1], r[3]]).sort((a, b) => a[0] - b[0]);
        let covered = 0, end = -Infinity;
        spans.forEach(([t, b]) => { if (b > end) { covered += b - Math.max(t, end); end = b; } });
        area += covered * (xs[k + 1] - xs[k]);
      }
      const empty = safeW * safeH > 0 ? 1 - area / (safeW * safeH) : 1;
      /* Longest-word rule (DIRECTION §4.1): a mega word over 9 letters steps down below 760 px. */
      const longword = [];
      if (vw < 760) {
        const megaPx = resolve('font', 'font-size:var(--fs-mega)');
        const statementPx = resolve('font', 'font-size:var(--fs-statement)');
        if (megaPx && statementPx) {
          root.querySelectorAll('.t-mega, h1, h2, p, span, strong, em').forEach((el) => {
            if (el.closest('[aria-hidden="true"]') || !(el.classList.contains('t-mega') || parseFloat(getComputedStyle(el).fontSize) >= megaPx - 0.5)) return;
            const fs = parseFloat(getComputedStyle(el).fontSize);
            const long = (el.textContent.match(/\p{L}+/gu) || []).find((w) => w.length > LONGWORD_LETTERS);
            if (long && fs > statementPx + 0.5 && !longword.some((x) => x.word === long)) longword.push({ word: long, px: Math.round(fs), max: Math.round(statementPx) });
          });
        }
      }
      res.r5 = {
        archetype, exempt, words, groups: groups.length, elements: seen.size,
        empty: Math.round(empty * 1000) / 1000, whiteMin: WHITE_MIN, longword,
        safe: [Math.round(safeW), Math.round(safeH)],
      };
    }

    if (cfg.why) {
      const worst = (score) => items.map((it) => ({ px: Math.round(score(it)), el: desc(it.el) }))
        .filter((x) => x.px > 1).sort((a, b) => b.px - a.px)
        .filter((x, k, arr) => arr.findIndex((y) => y.el === x.el) === k).slice(0, 4);
      res.why = { y: worst((it) => it.b - availBottom), header: worst((it) => headerBottom - it.t), x: worst((it) => Math.max(it.r - vw, -it.l)) };
    }
    return res;
  } finally {
    neutral.remove();
  }
}

/** Page-level facts: the scene sequence of archetypes and fields (DIRECTION §4.2-4.3, §13 T1). */
export function pageFacts() {
  const scenes = [...document.querySelectorAll('section.scene')];
  return {
    page: (location.pathname.split('/').pop() || 'index.html'),
    scenes: scenes.map((s) => ({ id: s.id || '', archetype: s.dataset.archetype || '', field: s.dataset.field || '' })),
    dialogs: document.querySelectorAll('dialog').length,
  };
}
