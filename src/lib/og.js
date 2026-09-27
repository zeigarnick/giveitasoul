// Social preview images (1200×630), drawn at build time with Satori and rendered to PNG with resvg. They use the
// site's typefaces and each soul's own colours; a field of fine wave lines in the soul's accent echoes its card.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const font = (file) => readFileSync(require.resolve(file));
let fonts;
const loadFonts = () =>
  (fonts ||= [
    { name: 'Instrument Serif', data: font('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'Instrument Serif', data: font('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff'), weight: 400, style: 'italic' },
    { name: 'Geist', data: font('@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'Geist', data: font('@fontsource/geist-sans/files/geist-sans-latin-500-normal.woff'), weight: 500, style: 'normal' },
    { name: 'Geist Mono', data: font('@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff'), weight: 400, style: 'normal' },
  ]);

export const OG_W = 1200, OG_H = 630;
const INK = '#141210', PAPER = '#F4F0E8', MUTED = '#6B6358';

// a tiny element builder, so the layouts read like markup without JSX
const h = (type, style, ...children) => ({ type, props: { style: { display: 'flex', ...style }, children: children.flat() } });

// the wave-line field, as an SVG image
function waves(w, hgt, colour, seed = 0) {
  const lines = [];
  for (let i = 0; i < 12; i++) {
    const y0 = 22 + i * ((hgt - 44) / 11), swell = 0.35 + 0.65 * (i / 11);
    let d = '';
    for (let x = 0; x <= w; x += 6) {
      const y = y0 + swell * (6 * Math.sin(x * 0.034 + seed + i * 0.42) + 3.5 * Math.sin(x * 0.012 - seed * 0.7 + i * 0.9));
      d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
    }
    lines.push(`<path d="${d}" fill="none" stroke="${colour}" stroke-width="2" stroke-linecap="round" opacity="${(0.45 + 0.55 * (1 - i / 12)).toFixed(2)}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}">${lines.join('')}</svg>`;
  return svgImg(svg, w, hgt);
}

// an SVG as an image element
const svgImg = (svg, w, hgt, style = {}) =>
  ({ type: 'img', props: { src: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'), width: w, height: hgt, style: { display: 'flex', ...style } } });

// A soul card, like the ones on the wheel, resting on a soft floor shadow. The shadow is a gradient image rather than
// a box-shadow: resvg can't draw a box-shadow on a rotated element (or one with a negative spread) and crashes.
function card(s, w, rotate = 0, seed = 0) {
  const k = w / 232, hgt = 324 * k, sw = w * 1.3, sh = 70 * k;
  const shadow = `<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#141210" stop-opacity="0.28"/><stop offset="1" stop-color="#141210" stop-opacity="0"/></radialGradient></defs><ellipse cx="${sw / 2}" cy="${sh / 2}" rx="${sw / 2}" ry="${sh / 2}" fill="url(#g)"/></svg>`;
  return h('div', { position: 'relative', width: w, height: hgt },
    svgImg(shadow, sw, sh, { position: 'absolute', left: (w - sw) / 2, top: hgt - sh * 0.45 }),
    cardFace(s, w, hgt, k, rotate, seed));
}
function cardFace(s, w, hgt, k, rotate, seed) {
  return h('div', {
    position: 'absolute', left: 0, top: 0, width: w, height: hgt, borderRadius: 20 * k, background: s.bg, color: s.fg, flexDirection: 'column',
    transform: `rotate(${rotate}deg)`, overflow: 'hidden',
  },
    h('div', { position: 'absolute', left: 0, top: 44 * k }, waves(Math.round(w), Math.round(150 * k), s.ac, seed)),
    h('div', { position: 'absolute', left: 18 * k, top: 14 * k, fontFamily: 'Geist Mono', fontSize: 11 * k }, s.anchor),
    h('div', { position: 'absolute', left: 18 * k, right: 18 * k, bottom: 18 * k, flexDirection: 'column', gap: 4 * k },
      h('div', { fontFamily: 'Instrument Serif', fontSize: 30 * k, lineHeight: 1 }, s.name),
      h('div', { fontFamily: 'Geist', fontSize: 13 * k, lineHeight: 1.35 }, s.line)),
  );
}

// the wordmark: "give", a grey "it" struck through with a red stroke, "asoul"
const logo = () => h('div', { fontFamily: 'Instrument Serif', fontSize: 40, color: INK, letterSpacing: -1, alignItems: 'baseline' },
  'give',
  h('div', { position: 'relative', color: '#8A8174' }, 'it',
    svgImg('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="10" viewBox="0 0 30 10"><path d="M2 7 C 9 5, 18 6, 28 3" stroke="#D22E1E" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg>', 30, 10, { position: 'absolute', left: -3, top: 19 })),
  'asoul');

export function soulImage(s) {
  return h('div', { width: OG_W, height: OG_H, background: PAPER, padding: '64px 80px', justifyContent: 'space-between', alignItems: 'center' },
    h('div', { flexDirection: 'column', width: 620, height: '100%', justifyContent: 'space-between' },
      logo(),
      h('div', { flexDirection: 'column' },
        h('div', { fontFamily: 'Geist Mono', fontSize: 22, color: MUTED, letterSpacing: 1 }, `${s.deck.toUpperCase()} · ${s.type.toUpperCase()}`),
        h('div', { fontFamily: 'Instrument Serif', fontSize: 104, lineHeight: 1, color: INK, marginTop: 14, letterSpacing: -3 }, s.name),
        h('div', { fontFamily: 'Geist', fontSize: 34, lineHeight: 1.3, color: '#4A443C', marginTop: 22 }, s.line)),
      h('div', { fontFamily: 'Geist Mono', fontSize: 20, color: MUTED }, 'A SOUL.md for your AI agent')),
    card(s, 330, 3, s.name.length));
}

export function homeImage(souls) {
  const fan = souls.slice(0, 5);
  return h('div', { width: OG_W, height: OG_H, background: PAPER, padding: '64px 80px', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' },
    logo(),
    h('div', { flexDirection: 'column', width: 620 },
      h('div', { fontFamily: 'Instrument Serif', fontSize: 92, lineHeight: 1, color: INK, letterSpacing: -3 }, 'Give your AI agents'),
      h('div', { fontFamily: 'Instrument Serif', fontSize: 92, lineHeight: 1, color: INK, letterSpacing: -3 },
        'a\u00a0', h('span', { fontStyle: 'italic' }, 'soul.')),
      h('div', { fontFamily: 'Geist', fontSize: 28, lineHeight: 1.35, color: '#4A443C', marginTop: 22, width: 520 }, '16 MBTI and 9 Enneagram personalities, each a SOUL.md for your agent.')),
    h('div', { fontFamily: 'Geist Mono', fontSize: 20, color: MUTED }, 'giveitasoul.com'),
    ...fan.map((s, i) => h('div', { position: 'absolute', left: 716 + i * 86, top: 160 + Math.abs(i - 2) * 32 }, card(s, 220, (i - 2) * 7, i * 1.3))));
}

export async function png(tree) {
  const svg = await satori(tree, { width: OG_W, height: OG_H, fonts: loadFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_W } }).render().asPng();
}
