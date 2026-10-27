/**
 * Small inline SVG charts for the dashboards, drawn in currentColor classes (dash.css).
 * The geometry is pure (unit tested); the builders only turn it into nodes.
 *
 *   lineGeometry(values, box) → { points, line, area } | null     (0 values: null; 1 value: a flat line)
 *   lineChart(values, { label, start, end })   → <figure>
 *
 * Text never goes inside the SVG (it would scale below 14 px on phones): the labels
 * are HTML under the chart.
 */
const SVG_NS = 'http://www.w3.org/2000/svg';
export const CHART_BOX = Object.freeze({ width: 600, height: 180, pad: 12 });
const GRID_LINES = 3;
const round = (n) => Math.round(n * 10) / 10;

/** Scale values to y (top = max). A flat series (or 0 to max) keeps its line on the lower third. */
function scaleY(values, { height, pad }) {
  const min = Math.min(0, ...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return (v) => round(height - pad - ((v - min) / span) * (height - 2 * pad));
}

export function lineGeometry(values = [], box = CHART_BOX) {
  if (!values.length) return null;
  const { width, height, pad } = box;
  const y = scaleY(values, box);
  const step = values.length > 1 ? (width - 2 * pad) / (values.length - 1) : 0;
  const points = values.length > 1
    ? values.map((v, i) => ({ x: round(pad + i * step), y: y(v) }))
    : [{ x: pad, y: y(values[0]) }, { x: width - pad, y: y(values[0]) }];
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const base = height - pad;
  const area = `${line} L${points.at(-1).x} ${base} L${points[0].x} ${base} Z`;
  return { points: values.length > 1 ? points : [points[1]], line, area };
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  return el;
}

function frame(label) {
  const { width, height, pad } = CHART_BOX;
  const svg = svgEl('svg', { class: 'dash-chart__svg', viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': label, focusable: 'false' });
  for (let i = 0; i <= GRID_LINES; i += 1) {
    const y = round(pad + (i * (height - 2 * pad)) / GRID_LINES);
    svg.append(svgEl('line', { class: 'dash-chart__grid', x1: pad, x2: width - pad, y1: y, y2: y }));
  }
  return svg;
}

function figure(svg, captions) {
  const fig = document.createElement('figure');
  fig.className = 'dash-chart';
  const cap = document.createElement('figcaption');
  cap.className = 'dash-chart__axis';
  captions.forEach((text) => { const s = document.createElement('span'); s.textContent = text; cap.append(s); });
  fig.append(svg, cap);
  return fig;
}

export function lineChart(values, { label, start = '', end = '' }) {
  const geo = lineGeometry(values);
  const svg = frame(label);
  if (geo) {
    svg.append(svgEl('path', { class: 'dash-chart__area', d: geo.area }), svgEl('path', { class: 'dash-chart__line', d: geo.line }));
    const last = geo.points.at(-1);
    svg.append(svgEl('circle', { class: 'dash-chart__dot', cx: last.x, cy: last.y, r: 5 }));
  }
  return figure(svg, [start, end]);
}
