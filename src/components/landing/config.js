// The tuned feel. Springs are SwiftUI-style (response in seconds, damping ratio); fx/fy is the side-card fade curve.
export const FEEL = {
  response: 0.63, damping: 0.86, decel: 0.998, dragPx: 245, wheelPx: 120, snapMs: 60,
  radius: 1160, spacing: 6.7, lean: 2.5, lift: 32, scale: 1.105, dim: 0.5, shadow: 0.3,
  fadeIn: 0.05, fadeOut: 0.28, sideScale: 0.82, depthRange: 5, turn: -21.5, gap: 84,
  fadeRange: 6, fx1: 0.336, fy1: 0.101, fx2: 0.251, fy2: 1.015,
  mResp: 0.53, mDamp: 0.74, mClose: 0.42, mCloseDamp: 0.8, squash: 0, blur: 14, tint: 0.63, drop: 80
};

// The hero word "soul" swaps typeface toward the pointer; index 0 is the resting face.
export const FACES = [
  { ff: 'var(--serif)', st: 'italic', w: 'var(--serif-w)', fs: 1, ls: -0.03 },
  { ff: "'Bodoni Moda', Didot, serif", st: 'italic', w: 700, fs: 0.92, ls: -0.03 },
  { ff: "'Bricolage Grotesque', sans-serif", st: 'normal', w: 800, fs: 0.86, ls: -0.05 },
  { ff: "Caveat, cursive", st: 'normal', w: 700, fs: 1.12, ls: -0.01 },
  { ff: "'Young Serif', Georgia, serif", st: 'normal', w: 400, fs: 0.86, ls: -0.03 },
  { ff: "'Space Mono', monospace", st: 'normal', w: 700, fs: 0.8, ls: -0.06 },
  { ff: "'DM Serif Display', Georgia, serif", st: 'normal', w: 400, fs: 0.9, ls: -0.03 },
  { ff: "Quicksand, sans-serif", st: 'normal', w: 600, fs: 0.9, ls: -0.04 },
  { ff: "Unbounded, sans-serif", st: 'normal', w: 700, fs: 0.72, ls: -0.05 },
  { ff: "Anton, Impact, sans-serif", st: 'normal', w: 400, fs: 0.96, ls: 0 }
];

// The hero word's colour for each pointer direction, clockwise from straight up.
export const GLOW = [[198, 43, 39], [224, 80, 26], [156, 111, 0], [95, 122, 14], [46, 125, 79], [28, 128, 116], [30, 95, 208], [106, 82, 217], [201, 37, 96]];

// The page lays out at the window's own size; nothing is scaled to fit. Type and chrome step between fixed tiers
// (picked by window width and height, never interpolated), and only the card fan sizes itself to the space left.
// A tier's numbers are CSS pixels. Vertically the hero text and the centre card are one group, spaced on an 8px
// grid: `sp.top` under the top bar (navH tall), `sp.fan` from the hero text to the centre card (the pill sits in it)
// and `sp.bar` from the card to the bottom bar. The card grows into what's left (K, clamped to fan.Kmin..Kmax);
// space still left over goes 40% above the hero, 20% between hero and card and 40% below, so the group sits balanced
// in a tall window rather than pinned to the top. Phone cards match Interface Craft's front card on a 390px phone (300×420); dragK keeps a drag
// 1:1 with the on-screen card spacing. The phone sheet spans the window, MARGIN in from each edge. flick caps how
// many cards a flick can carry past the one under the finger, and spin overrides the fan's spring (both phone only).
const DESK = {
  phone: false, heroPad: 0, h1Lh: 1, credit: 'pill', tgW0: 102, tgW1: 146, tgFs: 16, tgGap: 10, tgRight: null, counterW: 180,
  hint: ' · drag, or pull down to switch deck', dragK: 1, shaderScale: 1.5,
  fan: { Kmin: 0.42, Kmax: 1.05 }
};
const PHONE = {
  phone: true, heroPad: 24, h1Lh: 1.02, credit: 'byline', tgW0: 77, tgW1: 112, tgFs: 13, tgGap: 6, tgRight: 20, counterW: 72,
  hint: '', dragK: 1.04, flick: 1, spin: { response: 0.55, damping: 0.95 }, shaderScale: 2,
  fan: { Kmin: 0.7, Kmax: 1.3 }
};
export const TIERS = {
  // big monitors (1440p and up)
  xl: { ...DESK, fan: { ...DESK.fan, Kmax: 1.3 }, navH: 104, sp: { top: 80, fan: 176, bar: 64 }, h1: 80, sub: 20, navPad: '32px 64px', logo: 30, tgTop: 30, bottom: 40,
    sheet: { row: true, PAD: 44, GAP: 44, TEXTW: 440, ART: 1.3 }, nameFs: 48, nameLh: 52 },
  // the original 1440×900 design
  lg: { ...DESK, navH: 96, sp: { top: 64, fan: 160, bar: 64 }, h1: 64, sub: 18, navPad: '28px 56px', logo: 28, tgTop: 26, bottom: 34,
    sheet: { row: true, PAD: 40, GAP: 40, TEXTW: 400, ART: 1.2 }, nameFs: 44, nameLh: 48 },
  // small laptops, tablets and narrow desktop windows
  md: { ...DESK, fan: { ...DESK.fan, Kmax: 1.2 }, navH: 80, sp: { top: 48, fan: 128, bar: 48 }, h1: 50, sub: 16, navPad: '22px 32px', logo: 26, tgTop: 20, bottom: 28,
    sheet: { row: true, PAD: 32, GAP: 32, TEXTW: 340, ART: 1 }, nameFs: 38, nameLh: 42 },
  // short landscape windows (phones on their side)
  short: { ...DESK, navH: 56, sp: { top: 8, fan: 48, bar: 8 }, h1: 32, sub: 14, navPad: '12px 24px', logo: 22, tgTop: 10, bottom: 12,
    tgW0: 89, tgW1: 126, tgFs: 14, hint: '', counterW: 72, sheet: { row: true, PAD: 16, GAP: 24, TEXTW: 380, ART: 0.72 }, nameFs: 28, nameLh: 32 },
  phone: { ...PHONE, navH: 88, sp: { top: 24, fan: 72, bar: 32 }, h1: 40, sub: 15, navPad: '18px 20px', logo: 24, tgTop: 20.5, bottom: 28,
    sheet: { row: false, PAD: 20, GAP: 20, ART: 0.8, MARGIN: 20, textH: 370 }, nameFs: 34, nameLh: 38 },
  // small or short phones (iPhone SE, 360px Androids)
  phoneSm: { ...PHONE, fan: { ...PHONE.fan, Kmax: 1.05 }, navH: 80, sp: { top: 16, fan: 56, bar: 24 }, h1: 34, sub: 14, navPad: '16px 16px', logo: 22, tgTop: 17.5, bottom: 20, tgRight: 16, tgW0: 64, tgW1: 96, tgFs: 12,
    sheet: { row: false, PAD: 16, GAP: 16, ART: 0.6, MARGIN: 16, textH: 360 }, nameFs: 30, nameLh: 34 }
};
export const PHONE_MAX = 700;

export function tierFor(w, h) {
  if (w < PHONE_MAX) return w < 375 || h < 700 ? 'phoneSm' : 'phone';
  if (h < 600) return 'short';
  if (w >= 1800 && h >= 1050) return 'xl';
  if (w >= 1200 && h >= 800) return 'lg';
  return 'md';
}

// The card's height at the centre of the wheel is CARD_H · K · FEEL.scale; its centre sits FEEL.lift · K above PYb.
// heroH is the hero block's measured height (an estimate until it has been measured).
// The open card's window sits below the top bar (`top`, which leaves room for the pull handle) and above the window's
// bottom edge. On phones the card art inside it shrinks with the window's height so the whole window fits.
const SHEET_BOTTOM = 16;
function sheetFor(T, h) {
  const S = { ...T.sheet, cy: Math.round(h * 0.52), top: T.navH, bottom: SHEET_BOTTOM };
  if (!S.row) {
    const room = h - S.top - S.bottom - 2 * S.PAD - S.GAP - S.textH;
    S.ART = Math.max(0.42, Math.min(T.sheet.ART, Math.floor((room / CARD_H) * 100) / 100));
  }
  return S;
}

export function layoutFor(w, h, heroH) {
  const tier = tierFor(w, h), T = TIERS[tier], f = T.fan, sp = T.sp;
  const hH = heroH || T.h1 * T.h1Lh * (T.phone ? 2 : 1) + 14 + T.sub * 1.4;
  const barTop = h - T.bottom - 44;
  // the room between the top bar and the bottom bar, less the fixed spacing
  const free = barTop - T.navH - sp.top - hH - sp.fan - sp.bar;
  const perK = CARD_H * FEEL.scale;
  // phones: keep the centre card clear of the window's sides
  const wCap = T.phone ? (w - 2 * T.sheet.MARGIN - 30) / (CARD_W * FEEL.scale) : Infinity;
  const K = Math.max(f.Kmin, Math.min(f.Kmax, wCap, free / perK));
  const extra = Math.max(0, free - perK * K);
  const heroTop = Math.round(T.navH + sp.top + extra * 0.4);
  const cardTop = heroTop + hH + sp.fan + extra * 0.2, cy = cardTop + perK * K / 2;
  return {
    // Kc: the centre card's size; cards are laid out at it (CSS zoom) so the centre card's text is drawn 1:1
    ...T, tier, W: w, H: h, K, Kc: K * FEEL.scale, heroTop,
    PYb: cy + FEEL.lift * K,
    // the deck name sits in the space the sinking fan leaves; the pointer counts as over the cards below nearY
    label: Math.round(cy - 118), nearY: Math.round(cardTop - 6),
    sheet: sheetFor(T, h)
  };
}

// Open/close motion variants; MOTION picks the one in use. Tuned is the original hand-tuned motion.
// `text` is how the details text arrives, `exit` how it leaves on close, `feel` overrides springs in FEEL.
// The Island variants follow Emil Kowalski's Dynamic Island morph (animations.dev, 06 Dynamic Island): new content
// blends in from scale 0.9–1 with a 5px blur and a 50ms delay on a spring, old content shrinks and blurs out with its
// shrinking container, and bigger views get less bounce than small ones.
export const MOTIONS = {
  tuned: {
    text: { kind: 'rise', delay: 120, stagger: 50, dur: 420, rise: 10, blur: 4 },
    exit: { dur: 110, scale: 1, blur: 4 },
    feel: {}
  },
  island: {
    text: { kind: 'spring', delay: 50, stagger: 40, response: 0.5, damping: 0.82, scale: 0.94, blur: 5 },
    exit: { dur: 160, scale: 0.94, blur: 5 },
    feel: {}
  },
  islandBounce: {
    text: { kind: 'spring', delay: 50, stagger: 40, response: 0.5, damping: 0.82, scale: 0.94, blur: 5 },
    exit: { dur: 160, scale: 0.94, blur: 5 },
    // the window is big, so less bounce opening; it shrinks back to a small card, so a little more closing
    feel: { mDamp: 0.84, mCloseDamp: 0.7 }
  }
};

export const MOTION = 'islandBounce';

export const DECK_LABELS = { mbti: ['MBTI', '16 SOULS'], ennea: ['Enneagram', '9 SOULS'] };

// Card artwork size on the artboard.
export const CARD_W = 232, CARD_H = 324;
