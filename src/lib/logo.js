// The logo's shapes, shared by the landing's top bar, the soul pages, the social images and the favicon:
// a soul wisp (a hitodama: a round flame with a curling tail and two eyes) beside the wordmark "giveitasoul",
// set in Gabarito 700 with a grey "it" crossed by a red swoosh.

// the wisp, in a 32×32 box: its flame, the warmer glow inside it and its eyes
export const WISP = {
  flame: 'M16 29.5 C 10.2 29.5, 6.5 25.6, 6.5 20.8 C 6.5 16, 10 13.2, 13.8 11.2 C 17.6 9.2, 19.8 6.4, 18.2 2.5 C 23.6 4.8, 25.6 10.2, 24.6 14.6 C 25.3 16.4, 25.5 18.6, 25.5 20.8 C 25.5 25.6, 21.8 29.5, 16 29.5 Z',
  glow: 'M16 27.6 C 12.6 27.6, 10.4 25.4, 10.4 22.6 C 10.4 19.8, 12.6 18.2, 15 17.2 C 17.4 16.2, 19 15, 19.4 13.4 C 21.2 15, 21.6 17.4, 21.6 19.6 C 21.6 20.6, 21.6 21.6, 21.6 22.6 C 21.6 25.4, 19.4 27.6, 16 27.6 Z',
  eyes: [[13.2, 21.5], [18.8, 21.5]],
  eyeR: 1.5
};
export const LOGO_COLORS = { flame: '#EC4E32', glow: '#F6B26B', ink: '#141210', it: '#999999', paper: '#F4F0E8' };

// the wisp as SVG markup (for the favicon and the social images)
export function wispSvg(size = 32) {
  const c = LOGO_COLORS;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">` +
    `<path d="${WISP.flame}" fill="${c.flame}"/><path d="${WISP.glow}" fill="${c.glow}"/>` +
    WISP.eyes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${WISP.eyeR}" fill="${c.ink}"/>`).join('') + '</svg>';
}

// the swoosh across "it", in a 100×100 box stretched over the letters (its stroke keeps its width as it stretches);
// the page tilts it -11° and drops it 0.02em
export const SWOOSH = 'M-6 66 C 33 60, 83 63, 139 55';
export const SWOOSH_STROKE = 2.25;
