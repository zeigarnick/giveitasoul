// Fragment shaders for soul-card artwork, one per card pattern `kind`. GLSL ES 1.00, so they run on WebGL 1 and 2.
// Every shader works in card pixels (p: x 0..232, y 0..324 from the top), draws only its pattern with alpha over the
// card's own background, and gets the soul's colours: u_ac (accent), u_bg, u_fg. Motion comes from wave functions
// of u_time (seconds on one shared clock), so every copy of a soul shows the same moment.

export const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const HEAD = `
// highp: the clock keeps growing, and half-precision floats (common on phone GPUs) would make motion step
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform vec3 u_ac, u_bg, u_fg;
uniform vec3 u_param;
// u_frame: x = the middle of the space between the type label and the name, y = where the name starts (card px)
uniform vec2 u_frame;
const float TAU = 6.2831853;
float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 q) {
  vec2 i = floor(q), f = fract(q); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 q) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(q); q *= 2.03; a *= 0.5; } return s; }
vec2 rawPx() { return vec2(v_uv.x * 232.0, (1.0 - v_uv.y) * 324.0); }
// The pattern lives between the type label (ends y 30) and the name (starts u_frame.y, lower on cards whose line
// wraps): it fades in over the 12px under the label and out over the 12px before the 12px above the name, so both
// gaps match. Measured on the card itself, whatever the pattern's own coordinates.
float area(vec2 p) { float y = rawPx().y; return smoothstep(30.0, 42.0, y) * (1.0 - smoothstep(u_frame.y - 24.0, u_frame.y - 12.0, y)); }
// fine film grain so flat colour reads as material, not a screen
float grain(vec2 p) { return (hash(p + fract(u_time * 7.0) * 97.0) - 0.5) * 0.06; }
// Card pixels for drawing, shifted so the pattern's own middle (MID, set per pattern below) sits in the middle of
// the space between the label and the name.
vec2 cardPx() { return rawPx() + vec2(0.0, MID - u_frame.x); }
// antialiased stroke for a distance d from a line of half-width w (in card px)
float stroke(float d, float w) { return 1.0 - smoothstep(w - 0.6, w + 0.6, d); }
float fill(float d) { return 1.0 - smoothstep(-0.6, 0.6, d); }
float segment(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
float roundBox(vec2 p, vec2 c, vec2 hs, float r) { vec2 q = abs(p - c) - hs + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
// SVG-style rotation about c by a (radians, clockwise on screen)
vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
// a there-and-back loop, 0 → 1 → 0 over period seconds, eased like a wave
float breathe(float t, float period) { return 0.5 - 0.5 * cos(TAU * t / period); }
// The pen every card draws with (the Tidewatcher's): a fine line with a soft glow under it. d = distance to the line.
float ink(float d) { return stroke(d, 0.75) + exp(-d * 0.22) * 0.05; }
vec4 paint(vec3 col, float a, vec2 p) { a = clamp(a + grain(p), 0.0, 1.0) * area(p); return vec4(col * a, a); }
`;

// The Tidewatcher: a calm field of wave lines, each a sum of two sines drifting against each other, swelling with
// depth; soft glow under the lines.
const tide = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time;
  float line = 0.0, glow = 0.0;
  for (int i = 0; i < 15; i++) {
    float fi = float(i);
    float swell = 0.35 + 0.65 * fi / 14.0;
    float y = 48.0 + fi * 10.6
      + swell * (6.0 * sin(p.x * 0.034 + t * 0.8 + fi * 0.42) + 3.5 * sin(p.x * 0.012 - t * 0.55 + fi * 0.9));
    float d = abs(p.y - y);
    float w = 1.0 - smoothstep(0.55, 1.5, d);
    line = max(line, w * (0.45 + 0.55 * (1.0 - fi / 15.0)));
    glow += exp(-d * 0.22) * 0.035;
  }
  float a = clamp(line + glow + grain(p), 0.0, 1.0) * area(p);
  gl_FragColor = vec4(u_ac * a, a);
}
`;

// The Ember: Josh Puckett's wave-field bars. Bar heights ride two waves with a phase offset per bar, so energy rolls
// across; tips spark brighter.
const ember = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time;
  float k = floor((p.x - 18.0) / 7.0);
  float cx = 18.0 + k * 7.0 + 3.5;
  float inRange = step(0.0, k) * step(k, 27.0);
  float h = 48.0 + 64.0 * (0.5 + 0.5 * sin(k * 0.38 - t * 1.5)) + 22.0 * sin(k * 0.93 + t * 1.0);
  float top = 210.0 - h;
  float dx = abs(p.x - cx);
  float bar = (1.0 - smoothstep(1.0, 1.9, dx)) * step(top, p.y) * step(p.y, 210.0);
  // brighter toward the tip, like heat rising
  float heat = mix(0.55, 1.0, 1.0 - clamp((p.y - top) / h, 0.0, 1.0));
  float tip = exp(-length(vec2(dx, p.y - top)) * 0.55) * 0.9;
  float a = clamp((bar * heat + tip) * inRange + grain(p), 0.0, 1.0) * area(p);
  vec3 col = mix(u_ac, vec3(1.0, 0.97, 0.9), clamp(tip * 1.2, 0.0, 1.0));
  gl_FragColor = vec4(col * a, a);
}
`;

// The Night Owl: a quiet field of fine horizontal lines carrying one slow, constant wave, calmer than the tide.
// A still crescent moon is drawn by the lines themselves, brighter where they flow through it, and a few short
// stretches of line glow like stars, gliding steadily along the rows.
const owl = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, sp = 8.0;
  float row = floor(p.y / sp + 0.5);
  float y0 = row * sp + 1.6 * sin(p.x * 0.035 - t * 0.6 + row * 0.45);
  float d = abs(p.y - y0);
  // the crescent: inside the moon, outside the bite
  vec2 mc = vec2(138.0, 104.0);
  float moon = (1.0 - smoothstep(41.0, 43.0, length(p - mc))) * smoothstep(35.0, 37.0, length(p - mc - vec2(18.0, -13.0)));
  // stars: short bright stretches of line drifting left at 9px/s, each row at its own offset
  float xs = p.x + t * 9.0 + row * 17.0;
  float cell = floor(xs / 34.0), cx = cell * 34.0 + 17.0;
  float star = step(0.88, hash(vec2(cell, row))) * (1.0 - smoothstep(2.5, 6.5, abs(xs - cx))) * (1.0 - moon);
  float lit = 0.18 + 0.75 * moon + 0.7 * star;
  float a = stroke(d, 0.6) * lit + exp(-d * 0.22) * 0.05 * (moon + star);
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Foreman: eight conveyor rows of dashes marching right; a "done" glow runs down the list row by row.
const dashes = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i), y = 48.0 + 20.0 * fi;
    float u = mod(p.x - t * 13.85 + 9.0 * mod(fi, 4.0), 36.0);
    float d = length(vec2(max(abs(u - 14.0) - 14.0, 0.0), p.y - y));
    float done = smoothstep(0.55, 1.0, 0.5 + 0.5 * sin(t * 1.6 - fi * 0.8));
    a = max(a, stroke(d, 1.0) * (0.55 + 0.45 * done) + exp(-abs(p.y - y) * 0.5) * 0.12 * done * step(u, 30.0));
  }
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Trickster: dotted orbits and an arm that swings out and back (eased), planets trailing light.
const orbit = HEAD + `
void main() {
  vec2 p = cardPx(), c = vec2(116.0, 118.0), q = p - c;
  float t = u_time, r = length(q), ang = atan(q.y, q.x);
  float a = 0.0;
  for (int i = 0; i < 2; i++) {
    float R = i == 0 ? 72.0 : 50.0;
    float s = mod(ang * R, 8.0) - 4.0;
    a = max(a, stroke(length(vec2(s, r - R)), 1.0) * 0.8);
  }
  a = max(a, stroke(abs(r - 28.0), 0.75));
  float th = radians(mix(-40.0, 220.0, breathe(t, 14.0)));
  vec2 p1 = c + rot(vec2(0.0, -72.0), th), p2 = c + rot(vec2(0.0, 72.0), th);
  a = max(a, stroke(segment(p, p1, p2), 0.5) * 0.35);
  a = max(a, fill(length(p - p1) - 7.0));
  a = max(a, fill(length(p - p2) - 4.0));
  a += exp(-length(p - p1) * 0.12) * 0.35 + exp(-length(p - p2) * 0.18) * 0.2;
  // trail along the outer orbit, behind the planet in the direction it is moving; it fades as the arm slows to turn
  float dir = sign(sin(TAU * t / 14.0));
  float pa = atan(p1.y - c.y, p1.x - c.x);
  float behind = mod((pa - ang) * dir + TAU, TAU);
  a += exp(-behind * 3.0) * stroke(abs(r - 72.0), 1.6) * 0.5 * smoothstep(0.0, 0.3, abs(sin(TAU * t / 14.0)));
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Tinkerer: two meshing gears drawn in outline, turning in opposite directions at the ratio of their teeth
// (20 and 12), each with a hub ring and a small bright axle.
const gears = HEAD + `
float profile(float ang, float rIn, float rOut, float teeth) {
  float w = 0.5 + 0.5 * cos(ang * teeth);
  return mix(rIn, rOut, smoothstep(0.3, 0.7, w));
}
// distance to a gear's toothed outline, corrected for the slope of the teeth so the line keeps one width
float gearLine(vec2 p, vec2 c, float rIn, float rOut, float teeth, float spin) {
  vec2 q = p - c; float r = length(q), ang = atan(q.y, q.x) + spin;
  float pr = profile(ang, rIn, rOut, teeth), pr2 = profile(ang + 0.01, rIn, rOut, teeth);
  float slope = (pr2 - pr) / (0.01 * max(r, 1.0));
  return abs(r - pr) / sqrt(1.0 + slope * slope);
}
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0;
  vec2 c1 = vec2(92.0, 96.0), c2 = vec2(166.0, 166.0);
  a = max(a, ink(gearLine(p, c1, 45.0, 55.0, 20.0, -t * TAU / 14.0)));
  a = max(a, ink(abs(length(p - c1) - 30.0)) * 0.6);
  a = max(a, ink(gearLine(p, c2, 24.0, 33.0, 12.0, t * TAU / 8.4 + 0.13)));
  a = max(a, ink(abs(length(p - c2) - 12.0)) * 0.6);
  a = max(a, fill(length(p - c1) - 4.0));
  a = max(a, fill(length(p - c2) - 3.0));
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Stoic: faint vertical rules and one circle, drawn in a single line, that barely breathes and sends out a slow
// ripple; the rules run brighter inside it.
const still = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0;
  float u = mod(p.x - 12.0, 14.0);
  float k = floor((p.x - 12.0) / 14.0 + 0.5);
  vec2 c = vec2(116.0, 104.0);
  float r = length(p - c), R = 46.0 + 1.4 * breathe(t, 9.0);
  // faint rules, brighter where they pass through the circle
  float inside = 1.0 - smoothstep(R - 1.0, R + 1.0, r);
  a = stroke(min(u, 14.0 - u), 0.5) * (0.18 + 0.06 * sin(t * 0.4 + k * 0.5) + 0.45 * inside) * step(-0.5, k) * step(k, 15.0);
  a = max(a, ink(abs(r - R)));
  float ring = mod(t * 5.0, 60.0);
  a = max(a, stroke(abs(r - 46.0 - ring), 0.6) * 0.3 * smoothstep(0.0, 8.0, ring) * (1.0 - ring / 60.0));
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Muse: six petals turning slowly, each breathing at its own pace around a pulsing heart.
const petals = HEAD + `
void main() {
  vec2 p = cardPx(), c = vec2(116.0, 118.0);
  float t = u_time, a = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 q = rot(p - c, -(radians(fi * 30.0) + t * TAU / 48.0));
    vec2 ab = vec2(19.0, 68.0 + 4.0 * sin(t * 0.7 + fi * 1.1));
    float f = length(q / ab) - 1.0;
    float g = length(q / (ab * ab)) / max(length(q / ab), 1e-3);
    a = max(a, stroke(abs(f) / max(g, 1e-3), 0.75));
  }
  float heart = length(p - c) - (8.0 + 5.0 * breathe(t, 4.0));
  a = max(a, fill(heart));
  a += exp(-max(heart, 0.0) * 0.15) * 0.25;
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Cartographer: clean topographic lines over three smooth hills that drift very slowly, higher contours
// drawn stronger, a small marker on the summit, and a dashed route flowing along the bottom.
const contours = HEAD + `
float hill(vec2 p, vec2 c, float s) { vec2 d = p - c; return exp(-dot(d, d) / (2.0 * s * s)); }
float height(vec2 p, float t) {
  return 0.95 * hill(p, vec2(120.0, 96.0) + 5.0 * vec2(sin(t * 0.13), cos(t * 0.11)), 28.0)
       + 0.72 * hill(p, vec2(68.0, 140.0) + 5.0 * vec2(cos(t * 0.09), sin(t * 0.12)), 19.0)
       + 0.6 * hill(p, vec2(170.0, 140.0) + 4.0 * vec2(sin(t * 0.1 + 1.0), cos(t * 0.08)), 17.0);
}
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0;
  float h = height(p, t);
  vec2 g = vec2(height(p + vec2(1.0, 0.0), t) - h, height(p + vec2(0.0, 1.0), t) - h);
  // eight evenly spaced levels; distance to the nearest one in pixels, so every line keeps one width
  float v = h * 8.0;
  float d = abs(fract(v + 0.5) - 0.5) / max(length(g) * 8.0, 1e-3);
  float level = floor(v + 0.5);
  float lines = ink(d) * step(0.5, level) * (0.4 + 0.08 * level);
  a = max(a, lines * (1.0 - smoothstep(168.0, 180.0, p.y)));
  // the summit
  vec2 top = vec2(120.0, 96.0) + 5.0 * vec2(sin(t * 0.13), cos(t * 0.11));
  a = max(a, fill(length(p - top) - 2.5));
  // the route: a dashed line flowing along the bottom
  float ry = 190.0 - 8.0 * sin(p.x * 0.03 + 0.6) - 5.0 * sin(p.x * 0.011);
  float span = smoothstep(20.0, 34.0, p.x) * (1.0 - smoothstep(198.0, 212.0, p.x));
  float along = mod(p.x - t * 18.0, 9.0);
  a = max(a, stroke(abs(p.y - ry), 0.7) * step(along, 3.0) * span);
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Spark: rays wheeling around a pulsing core, each ray flaring on its own beat, sparks blinking at the edges.
const burst = HEAD + `
void main() {
  vec2 p = cardPx(), c = vec2(116.0, 118.0), q = p - c;
  float t = u_time, a = 0.0;
  float spin = t * radians(10.0);
  for (int k = 0; k < 12; k++) {
    float fk = float(k);
    float len = (mod(fk, 2.0) < 0.5 ? 64.0 : 48.0) + 7.0 * sin(t * 1.6 + fk * 1.7);
    vec2 dir = rot(vec2(1.0, 0.0), radians(fk * 30.0) + spin);
    a = max(a, ink(segment(p, c + dir * 26.0, c + dir * len)));
  }
  float core = length(q) - (13.0 + 6.0 * breathe(t, 1.5));
  a = max(a, fill(core));
  a += exp(-max(core, 0.0) * 0.08) * 0.35;
  vec3 sp[4];
  sp[0] = vec3(38.0, 56.0, 1.8); sp[1] = vec3(196.0, 66.0, 2.2); sp[2] = vec3(192.0, 180.0, 2.0); sp[3] = vec3(34.0, 172.0, 1.6);
  for (int i = 0; i < 4; i++) {
    float blink = breathe(t + float(i) * 0.7, sp[i].z);
    a = max(a, fill(length(p - sp[i].xy) - 3.0) * blink);
    a += exp(-length(p - sp[i].xy) * 0.25) * 0.4 * blink;
  }
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Neighbour: straight, evenly spaced lines with smooth little waves passing along them in turns, each line
// the other way from the one above, like friendly chatter going back and forth down the street.
const dots = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0, glow = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i), y0 = 52.0 + 13.0 * fi, dir = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;
    // one wave per line, travelling 18px/s over a 320px loop that starts and ends off the card
    float c = mod(t * 18.0 + fi * 71.0, 320.0) - 44.0;
    float px = dir > 0.0 ? c : 232.0 - c;
    float g = exp(-pow((p.x - px) / 11.0, 2.0));
    float bump = 5.0 * g, slope = -2.0 * (p.x - px) / 121.0 * bump;
    float d = abs(p.y - (y0 - bump)) / sqrt(1.0 + slope * slope);
    a = max(a, stroke(d, 0.75) * (0.4 + 0.55 * g));
    glow += exp(-d * 0.22) * 0.03 * (0.5 + g);
  }
  gl_FragColor = paint(u_ac, a + glow, p);
}
`;

// The Wildflower: a field of fine stems of varying height, bending together as a breeze travels through, each
// swaying a little on its own too; brighter toward their tips.
const zigzag = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0, ground = 214.0;
  for (int i = 0; i < 26; i++) {
    float fi = float(i);
    float x0 = 14.0 + 8.0 * fi + 3.0 * (hash(vec2(fi, 1.0)) - 0.5);
    float hgt = 70.0 + 55.0 * (0.5 + 0.5 * sin(fi * 0.55 + 1.0)) + 30.0 * hash(vec2(fi, 2.0));
    float sway = 0.16 * sin(t * 0.8 - x0 * 0.025) + 0.05 * sin(t * 1.9 + fi * 1.7);
    float s = clamp((ground - p.y) / hgt, 0.0, 1.0);
    float xs = x0 + sway * hgt * s * s;
    float d = abs(p.x - xs) / sqrt(1.0 + pow(2.0 * sway * s, 2.0));
    a = max(a, ink(d) * step(ground - hgt, p.y) * (0.3 + 0.65 * s));
  }
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Vanguard: nested wide chevrons pointing up, marching forward in step, straight and sharp; the lines at the
// front burn brightest, each point catches the light, and every few seconds a glint sweeps across like a blade edge. They enter at the bottom and leave at the top behind the card's fades, so it loops unseen.
const slash = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, slope = 0.42, sp = 15.0;
  // constant along each chevron; the chevrons march up by one spacing every 1.1s
  float v = p.y + slope * abs(p.x - 116.0) + t * 16.0;
  float d = abs(fract(v / sp) - 0.5) * sp / sqrt(1.0 + slope * slope);
  float lineY = p.y + (0.5 - fract(v / sp)) * sp;
  float front = 0.35 + 0.65 * (1.0 - smoothstep(50.0, 200.0, lineY + slope * abs(p.x - 116.0)));
  // each chevron's point catches the light, and every few seconds a glint sweeps across like light along a blade
  float point = exp(-abs(p.x - 116.0) * 0.08) * 0.35;
  float gx = mix(-60.0, 292.0, clamp(fract(t / 4.5) / 0.55, 0.0, 1.0));
  float glint = exp(-pow((p.x + 0.35 * p.y - gx) / 16.0, 2.0)) * 0.9;
  float a = ink(d) * min(front + point + glint, 1.4);
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Hearth: horizontal lines rising slowly like heat, bowing upward over a warm centre and shimmering gently,
// strongest near the bottom where the warmth comes from, with a soft glow beneath.
const grid = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0, glow = 0.0, sp = 11.0;
  float lift = t * 12.0;
  for (int i = 0; i < 24; i++) {
    float fi = float(i);
    // each line rises and wraps from top to bottom, out of sight behind the fades
    float yb = 250.0 - mod(fi * sp + lift, 24.0 * sp);
    float heat = smoothstep(20.0, 230.0, yb);
    float bow = 12.0 * exp(-pow((p.x - 116.0) / 62.0, 2.0)) * heat;
    float y = yb - bow - 2.6 * heat * sin(p.x * 0.065 + t * 1.1 + fi * 1.7);
    float d = abs(p.y - y);
    a = max(a, stroke(d, 0.75) * (0.3 + 0.6 * heat));
    glow += exp(-d * 0.22) * 0.03 * heat;
  }
  glow += exp(-length((p - vec2(116.0, 214.0)) * vec2(1.0, 1.8)) * 0.02) * 0.16 * (0.85 + 0.15 * breathe(t, 5.0));
  gl_FragColor = paint(u_ac, a + glow, p);
}
`;

// The Mentor: arcs spreading continuously from a point below the card, like a voice carrying; every third arc rings
// stronger, a beat of encouragement, and the arcs grow brighter as they travel out.
const nest = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, sp = 13.0;
  vec2 S = vec2(116.0, 236.0);
  float r = length(p - S);
  float u = (r - t * 15.0) / sp;
  float d = abs(fract(u) - 0.5) * sp;
  float beat = mod(floor(u + 0.5), 3.0) < 0.5 ? 1.0 : 0.5;
  float out_ = smoothstep(20.0, 170.0, r);
  float a = ink(d) * beat * (0.35 + 0.65 * out_) * smoothstep(12.0, 30.0, r);
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Showrunner: rows of chevrons pushing right in quick, eased beats (move, hold, move), each row a beat behind
// the one above; a fine tail runs out behind each chevron while it moves.
const chevrons = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i), y0 = 50.0 + 52.0 * fi;
    // one slot (36px) per beat: a fast ease-out push, then a hold
    float bt = t * 1.0 - fi * 0.18, f = fract(bt), m = 1.0 - pow(1.0 - clamp(f / 0.45, 0.0, 1.0), 3.0);
    float off = 36.0 * (floor(bt) + m);
    float speed = f < 0.45 ? 3.0 * pow(1.0 - f / 0.45, 2.0) : 0.0;
    float x = mod(p.x - off, 36.0);
    vec2 q = vec2(x, p.y);
    float d = min(segment(q, vec2(6.0, y0), vec2(20.0, y0 + 14.0)), segment(q, vec2(20.0, y0 + 14.0), vec2(6.0, y0 + 28.0)));
    a = max(a, ink(d));
    // while it moves, a fine tail runs out behind the chevron's point
    float tail = smoothstep(-8.0, 18.0, x) * (1.0 - smoothstep(18.0, 20.0, x));
    a = max(a, ink(abs(p.y - y0 - 14.0)) * tail * 0.6 * min(speed, 1.0));
  }
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Enneagram figure: 9 at the top, clockwise. The type's two lines draw in, hold and draw out; its point pulses.
// u_param = (type, one connected point, the other).
const ennea = HEAD + `
vec2 pt(float k) { float a = radians(-90.0 + 40.0 * mod(k, 9.0)); return vec2(116.0, 112.0) + 72.0 * vec2(cos(a), sin(a)); }
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0;
  a = max(a, stroke(abs(length(p - vec2(116.0, 112.0)) - 72.0), 0.75) * 0.32);
  // triangle 9-3-6 and hexad 1-4-2-8-5-7
  float dl = min(segment(p, pt(9.0), pt(3.0)), min(segment(p, pt(3.0), pt(6.0)), segment(p, pt(6.0), pt(9.0))));
  dl = min(dl, min(segment(p, pt(1.0), pt(4.0)), min(segment(p, pt(4.0), pt(2.0)), segment(p, pt(2.0), pt(8.0)))));
  dl = min(dl, min(segment(p, pt(8.0), pt(5.0)), min(segment(p, pt(5.0), pt(7.0)), segment(p, pt(7.0), pt(1.0)))));
  a = max(a, stroke(dl, 0.75) * 0.32);
  for (int k = 1; k <= 9; k++) a = max(a, fill(length(p - pt(float(k))) - 3.0) * 0.55);
  // the type's path a → n → b, drawn in over 45% of the loop, held, then drawn out
  vec2 A = pt(u_param.y), N = pt(u_param.x), B = pt(u_param.z);
  float l1 = length(N - A), l2 = length(B - N);
  vec2 ba1 = N - A, ba2 = B - N;
  float h1 = clamp(dot(p - A, ba1) / dot(ba1, ba1), 0.0, 1.0), h2 = clamp(dot(p - N, ba2) / dot(ba2, ba2), 0.0, 1.0);
  float d1 = length(p - A - ba1 * h1), d2 = length(p - N - ba2 * h2);
  float s = d1 < d2 ? h1 * l1 / (l1 + l2) : (l1 + h2 * l2) / (l1 + l2);
  float f = fract(t / 5.0);
  float lo = f < 0.75 ? 0.0 : smoothstep(0.75, 1.0, f), hi = f < 0.45 ? smoothstep(0.0, 0.45, f) : 1.0;
  a = max(a, stroke(min(d1, d2), 1.25) * step(lo, s) * step(s, hi));
  float ring = fract(t / 2.5);
  a = max(a, stroke(abs(length(p - N) - mix(7.0, 16.0, ring)), 0.75) * (0.9 * (1.0 - ring)));
  a = max(a, fill(length(p - N) - 6.0));
  a += exp(-length(p - N) * 0.12) * 0.3;
  gl_FragColor = paint(u_ac, a, p);
}
`;

// connected points for each Enneagram type
const ENNEA_LINES = { 1: [4, 7], 2: [4, 8], 3: [6, 9], 4: [1, 2], 5: [7, 8], 6: [3, 9], 7: [1, 5], 8: [2, 5], 9: [3, 6] };
export const paramsFor = (soul) => (soul.kind === 'ennea' ? [soul.num || 9, ...ENNEA_LINES[soul.num || 9]] : [0, 0, 0]);

// Each pattern's own vertical middle (the middle of what it draws, in its coordinates), which cardPx() centres
// between the type label and the name. Night Owl's sky has no middle: it stays where it is.
const MIDS = {
  tide: 122, ember: 143, owl: 'u_frame.x', dashes: 118, orbit: 118, gears: 120, still: 104, petals: 118, contours: 118,
  burst: 118, dots: 124, zigzag: 124, slash: 124, grid: 124, nest: 124, chevrons: 116, ennea: 112
};
const RAW = { tide, ember, owl, dashes, orbit, gears, still, petals, contours, burst, dots, zigzag, slash, grid, nest, chevrons, ennea };
export const PROGRAMS = Object.fromEntries(Object.entries(RAW).map(([k, src]) => {
  const mid = typeof MIDS[k] === 'number' ? MIDS[k].toFixed(1) : MIDS[k];
  return [k, '#define MID ' + mid + '\n' + src];
}));

// which card patterns have a shader
export const SHADER_FOR_KIND = {
  waves: 'tide', bars: 'ember', stars: 'owl', dashes: 'dashes', orbit: 'orbit', gears: 'gears', still: 'still', petals: 'petals',
  contours: 'contours', burst: 'burst', dots: 'dots', zigzag: 'zigzag', slash: 'slash', grid: 'grid', nest: 'nest', chevrons: 'chevrons', ennea: 'ennea'
};
