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

export const DECK_LABELS = { mbti: ['MBTI', '16 SOULS'], ennea: ['Enneagram', '9 SOULS'] };

// Card artwork size on the artboard.
export const CARD_W = 232, CARD_H = 324;
