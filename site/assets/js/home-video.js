/**
 * Home page video (FR24): poster, play button, captions, no autoplay with sound.
 *
 * - VIDEO.url empty → "Founder video coming soon" state (no player at all).
 * - A file url (.mp4/.webm/.m3u8) → <video controls> with a WebVTT captions track.
 * - Any other url (a video host's embed link) → an iframe, created only on click.
 * Nothing loads until the visitor presses play; playback only starts on that click.
 */
import { escapeHtml } from './chrome.js';

const FILE_PATTERN = /\.(mp4|webm|m3u8)(\?|#|$)/i;
const SOURCE_LABEL = { stock: 'Licensed stock footage for now', founder: 'From our founder' };
/* The cursor ring's label over the still frame (cursor.js reads data-cursor-label).
   With a player there is no label: the whole frame is the play button (home.css). */
const SOON_LABEL = 'Soon';

function setCursorLabel(ui, label) {
  const frame = ui.closest('.vframe');
  if (!frame) return;
  if (label) frame.dataset.cursorLabel = label;
  else delete frame.dataset.cursorLabel;
}

const PLAY_ICON = `
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor"/></svg>`;

const EMPTY_POSTER = '<div class="vframe__poster vframe__poster--empty" aria-hidden="true"><span>C·W</span></div>';

/** Poster image, or the empty C·W block (also if the image fails to load). */
function setPoster(media, poster) {
  if (!poster) {
    media.innerHTML = EMPTY_POSTER;
    return;
  }
  const img = document.createElement('img');
  // 16:9 size hints so the lazy image reserves its box (CSS sizes it to the frame).
  Object.assign(img, { className: 'vframe__poster', src: poster, alt: '', loading: 'lazy', width: 1600, height: 900 });
  img.addEventListener('error', () => { media.innerHTML = EMPTY_POSTER; }, { once: true });
  media.replaceChildren(img);
}

/** The still frame with a message instead of a player: "coming soon" or "unavailable". */
function stillFrame({ media, ui, cap, status }, { text, caption, lead, label = '' }) {
  setPoster(media, '');
  ui.innerHTML = `
    <div class="vframe__soon">
      <span class="vframe__play vframe__play--off" aria-hidden="true">${PLAY_ICON}</span>
      <p class="vframe__soon-text ui">${escapeHtml(text)}</p>
    </div>`;
  cap.textContent = caption;
  setCursorLabel(ui, label);
  // A real link here also keeps this scene in the keyboard tab order.
  status.innerHTML = `${lead}: <a href="#hero">tell us what you need and your city</a>, and we will do the rest.`;
}

const comingSoon = (nodes) => stillFrame(nodes, {
  text: 'Founder video coming soon', caption: 'One minute · captions included when it arrives', lead: 'Until then', label: SOON_LABEL,
});

const unavailable = (nodes) => stillFrame(nodes, {
  text: 'The video is unavailable right now', caption: 'Please try again later', lead: 'Meanwhile',
});

/** Media errors fire on the <source> (bad url, unsupported format), or on the <video> itself. */
function onVideoFailure(video, source, handler) {
  source.addEventListener('error', handler, { once: true });
  video.addEventListener('error', handler, { once: true });
}

function videoElement({ url, captions, poster }) {
  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  if (poster) video.poster = poster;
  video.className = 'vframe__player';
  const source = document.createElement('source');
  source.src = url;
  video.append(source);
  if (captions) {
    const track = document.createElement('track');
    Object.assign(track, { kind: 'captions', srclang: 'en', label: 'English', src: captions, default: true });
    video.append(track);
  }
  return video;
}

function embedElement(url) {
  const frame = document.createElement('iframe');
  frame.className = 'vframe__player';
  frame.src = url;
  frame.title = 'What We Do, in One Minute (Video)';
  frame.allow = 'autoplay; fullscreen; picture-in-picture';
  frame.allowFullscreen = true;
  return frame;
}

/** Swap the poster for the player and start it (the click is the visitor's consent to sound). */
function startPlayer(config, nodes) {
  const isFile = FILE_PATTERN.test(config.url);
  const player = isFile ? videoElement(config) : embedElement(config.url);
  if (isFile) {
    onVideoFailure(player, player.querySelector('source'), () => {
      unavailable(nodes);
      nodes.status.querySelector('a')?.focus(); // the player that held focus is gone
    });
  }
  nodes.media.replaceChildren(player);
  nodes.ui.replaceChildren();
  if (isFile) {
    player.play().catch(() => player.isConnected && player.focus());
  } else {
    player.focus();
  }
  return player;
}

/**
 * Render the frame. Returns { pause } so the page can stop playback when the
 * visitor scrolls to another scene.
 */
export function initVideo(config, nodes) {
  if (!nodes.media) return { pause() {} };
  if (!config.url) {
    comingSoon(nodes);
    return { pause() {} };
  }
  let player = null;
  const showPoster = () => {
    player = null;
    setPoster(nodes.media, config.poster);
    nodes.ui.innerHTML = `<button class="vframe__play" type="button">${PLAY_ICON}<span class="visually-hidden">Play the One-Minute Video</span></button>`;
    setCursorLabel(nodes.ui, '');
    nodes.ui.querySelector('button').addEventListener('click', () => {
      player = startPlayer(config, nodes);
    });
  };
  showPoster();
  nodes.cap.textContent = ['One minute · captions available', SOURCE_LABEL[config.source]].filter(Boolean).join(' · ');
  nodes.status.textContent = '';
  return {
    pause() {
      if (player instanceof HTMLVideoElement) player.pause();
      else if (player) showPoster(); // a host's embed cannot be paused from here, so unload it
    },
  };
}
