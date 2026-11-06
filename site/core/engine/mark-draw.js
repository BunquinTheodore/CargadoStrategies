/**
 * The C/W mark's shared data: its stroke paths and the shared .mark markup's selectors
 * (the splash card draws the mark from these; splash.js imports them). The mark draw on
 * the cut was removed (client 2026-11-07, calm): the mark shows fully drawn.
 *
 * Markup contract (pathLength="100", stroke-dasharray 100 and no offset, so drawn):
 *   <div class="mark" aria-hidden="true">
 *     <svg class="mark__c" viewBox="0 0 48 48" focusable="false"><path d="{MARK_PATHS.c}" pathLength="100" …/></svg>
 *     <svg class="mark__w" viewBox="0 0 48 48" focusable="false"><path d="{MARK_PATHS.w}" pathLength="100" …/></svg>
 *   </div>
 */

/** The stroke paths, in a 48 × 48 viewBox. */
export const MARK_PATHS = Object.freeze({
  c: 'M37.4 10.6A19 19 0 1 0 37.4 37.4',
  w: 'M13.5 17 19.2 31.5 24 21.5 28.8 31.5 34.5 17',
});

/** The shared .mark markup's selectors. */
export const MARK_PARTS = Object.freeze({ c: '.mark__c path', w: '.mark__w path', mono: '.mark' });
