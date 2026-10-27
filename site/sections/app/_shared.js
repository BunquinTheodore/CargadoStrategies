/**
 * Helpers shared by the app pages (account and dashboards; v2 §8).
 *
 *   startApp() → false when FIREBASE is empty (the "coming soon" card is shown)
 *   showMain(user?)    reveal [data-app-main], fill the header user, wire Log Out
 *   h(tag, props, ...children)   a DOM element; text is always set as text (no HTML)
 *   fillList(list, empty, items, render)   setStatus(el, text, tone)   formValues(form)
 *
 * Nothing here logs: failures become a line in the page's [data-status].
 */
import { isFirebaseConfigured } from '../../assets/js/config.js';
import { signOut } from '../../core/account/auth.js';
import { LOGIN_PAGE } from '../../core/account/guard.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'text') el.textContent = value;
    else if (key === 'className') el.className = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : String(value));
  });
  el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false && c !== ''));   // '' adds nothing, so a blank cell stays :empty
  return el;
}

export function setStatus(el, text, tone = 'info') {
  if (!el) return;
  el.textContent = text || '';
  el.dataset.tone = tone;
}

/** Replace a list's rows; show its empty line when there are none. */
export function fillList(list, empty, items, render) {
  list.replaceChildren(...items.map(render));
  if (empty) empty.hidden = items.length > 0;
}

/** Trimmed string values of a form's named fields. */
export const formValues = (form) => Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));

/** Disable a form's submit button while `task` runs. */
export async function busy(form, task) {
  const button = $('[type="submit"]', form);
  if (button) button.disabled = true;
  try {
    return await task();
  } finally {
    if (button) button.disabled = false;
  }
}

const hideLoading = () => { const el = $('[data-app-loading]'); if (el) el.hidden = true; };

/** False (and the "coming soon" card) when accounts are not configured. */
export function startApp(configured = isFirebaseConfigured()) {
  if (configured) return true;
  hideLoading();
  $$('[data-app-main], [data-app-signed]').forEach((el) => { el.hidden = true; });
  $('[data-app-soon]').hidden = false;
  return false;
}

async function logOut() {
  try {
    await signOut();
  } finally {
    location.replace(LOGIN_PAGE);
  }
}

/** Show the signed-in name (header and dashboard sidebar), its initial, and the header's Log Out. */
export function showUser(user) {
  if (!user) return;
  const name = user.name || user.email || '';
  $$('[data-app-name]').forEach((el) => { el.textContent = name; });
  $$('[data-app-initial]').forEach((el) => { el.textContent = name.trim().charAt(0).toUpperCase(); });
  const box = $('[data-app-user]');
  if (box) box.hidden = false;
}

/** Reveal the page's main block; wire every Log Out button once. A .dash block puts the page in dashboard mode. */
export function showMain(user, main = $('[data-app-main]')) {
  hideLoading();
  if (main) main.hidden = false;
  if (main?.classList.contains('dash')) document.body.classList.add('is-dash');
  showUser(user);
  $$('[data-sign-out]').forEach((b) => {
    if (b.dataset.wired) return;
    b.dataset.wired = '1';
    b.addEventListener('click', logOut);
  });
}

/** Last resort for a page whose start failed (the SDK did not load, offline): one calm line. */
export function showFailure() {
  const line = $('[data-app-loading]');
  if (!line) return;
  line.hidden = false;
  line.textContent = 'This page could not load. Please check your connection and reload.';
}

/** Copy buttons: [data-copy="<input id>"] copies that input's value. */
export function wireCopy(root = document) {
  $$('[data-copy]', root).forEach((button) => button.addEventListener('click', async () => {
    const input = document.getElementById(button.dataset.copy);
    try {
      await navigator.clipboard.writeText(input.value);
      button.textContent = 'Copied';
    } catch {
      input.select();   // clipboard blocked: leave it selected to copy by hand
    }
  }));
}

export { $, $$ };
