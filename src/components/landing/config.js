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
  { ff: "'Instrument Serif', Georgia, serif", st: 'italic', w: 400, fs: 1, ls: -0.03 },
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

// Two artboards: desktop, and a 390×844 phone one used below 700px wide. Every layout number comes from here.
// K sizes the whole fan (cards, radius, gap, lift) together; PYb + radius·K is the wheel's hidden centre.
// Phone cards match Interface Craft's front card on a 390px phone (300×420); dragK keeps a drag 1:1 with the
// on-screen card spacing. The phone sheet spans the whole window, MARGIN in from each edge.
// flick caps how many cards a flick can carry past the one under the finger, and spin overrides the fan's spring
// (both phone only).
export const LAYOUTS = {
  desk: {
    W: 1440, H: 900, K: 0.86, PYb: 616, heroTop: 156, heroPad: 0, h1: 72, h1Lh: 1, sub: 18, navPad: '28px 56px', logo: 28, credit: 'pill',
    tgTop: 32, tgW0: 112, tgW1: 148, tgFs: 14, tgRight: null, label: 470, bottom: 34, counterW: 180,
    hint: ' · drag, or pull down to switch deck', dragK: 1, nearY: 430,
    sheet: { row: true, PAD: 40, GAP: 40, TEXTW: 400, ART: 1.2, cy: 470 }, nameFs: 44, nameLh: 48,
    // shader resolution per card pixel (capped by the screen's density)
    shaderScale: 1.5
  },
  phone: {
    W: 390, H: 844, K: 1.17, PYb: 530, heroTop: 112, heroPad: 24, h1: 46, h1Lh: 1.02, sub: 15, navPad: '18px 20px', logo: 24, credit: 'byline',
    tgTop: 16, tgW0: 76, tgW1: 112, tgFs: 13, tgRight: 20, label: 372, bottom: 28, counterW: 72,
    hint: '', dragK: 1.04, flick: 1, spin: { response: 0.55, damping: 0.95 }, nearY: 270,
    sheet: { row: false, PAD: 20, GAP: 20, ART: 0.8, cy: 440, MARGIN: 20 }, nameFs: 34, nameLh: 38,
    shaderScale: 2
  }
};
export const PHONE_QUERY = '(max-width: 700px)';

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
