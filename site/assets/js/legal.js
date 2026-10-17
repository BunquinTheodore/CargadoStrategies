/**
 * Legal page (legal.html, FR16, SRS Appendix B).
 *
 * Page-only behaviour on top of the shared film:
 *  - the persistent draft banner reports its height (--draft-h, passed to the
 *    engine as --banner-h) so scenes start below it;
 *  - legal-fx.js adds the scrubbed 3D choreography (heading rules, ghost numerals,
 *    fanned paper stacks, clause cascades, the contents fold) and panel feedback.
 * Narrow-screen globe poses (data-pose-sm) are picked by the shared globe.
 * Everything scroll-linked stays on the film timeline (reversible, transform only).
 */
import { boot } from './main.js';
import {
  addRuleDraw, addNumeralDepth, addSheetFan, addItemCascade, addIndexFold, initPanelFeedback,
} from './legal-fx.js';

/** Publish the banner's height, its bottom gap included, as --draft-h (it wraps to two lines on phones). */
function trackBannerHeight(banner) {
  if (!banner) return;
  const apply = () => {
    const height = Math.ceil(banner.getBoundingClientRect().height);
    document.body.style.setProperty('--draft-h', `${height}px`);
  };
  apply();
  new ResizeObserver(apply).observe(banner);
}

/** Flow mode (reduced motion): panels show all their text, so they need no tab stop of their own. */
function dropPanelTabStops() {
  document.querySelectorAll('.scene__scroll[tabindex]').forEach((panel) => panel.removeAttribute('tabindex'));
}

trackBannerHeight(document.querySelector('.legal-draft'));

const { film } = boot();
[addRuleDraw, addNumeralDepth, addSheetFan, addItemCascade, addIndexFold].forEach((tween) => film.on('build', tween));
initPanelFeedback({ film });
if (!film.enabled) dropPanelTabStops();
