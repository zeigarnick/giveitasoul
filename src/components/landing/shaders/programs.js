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
const float TAU = 6.2831853;
float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 q) {
  vec2 i = floor(q), f = fract(q); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 q) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(q); q *= 2.03; a *= 0.5; } return s; }
// the pattern lives in the top of the card; fade it out above the name
float area(vec2 p) { return 1.0 - smoothstep(196.0, 214.0, p.y); }
// fine film grain so flat colour reads as material, not a screen
float grain(vec2 p) { return (hash(p + fract(u_time * 7.0) * 97.0) - 0.5) * 0.06; }
vec2 cardPx() { return vec2(v_uv.x * 232.0, (1.0 - v_uv.y) * 324.0); }
// antialiased stroke for a distance d from a line of half-width w (in card px)
float stroke(float d, float w) { return 1.0 - smoothstep(w - 0.6, w + 0.6, d); }
float fill(float d) { return 1.0 - smoothstep(-0.6, 0.6, d); }
float segment(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
float roundBox(vec2 p, vec2 c, vec2 hs, float r) { vec2 q = abs(p - c) - hs + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
// SVG-style rotation about c by a (radians, clockwise on screen)
vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
// a there-and-back loop, 0 → 1 → 0 over period seconds, eased like a wave
float breathe(float t, float period) { return 0.5 - 0.5 * cos(TAU * t / period); }
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
  float h = 48.0 + 64.0 * (0.5 + 0.5 * sin(k * 0.38 - t * 2.1)) + 22.0 * sin(k * 0.93 + t * 1.3);
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

// Night Owl: stars on a jittered grid that twinkle at their own pace, a nebula drifting slowly, and a crescent moon
// with a soft halo.
const owl = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time;
  // stars: one per 22px cell, jittered, some brighter
  vec2 cell = floor(p / 22.0), f = fract(p / 22.0);
  float h = hash(cell);
  vec2 sp = vec2(hash(cell + 3.1), hash(cell + 7.7)) * 0.7 + 0.15;
  float r = mix(0.02, 0.06, h * h);
  float tw = 0.35 + 0.65 * (0.5 + 0.5 * sin(t * (0.8 + 2.2 * hash(cell + 1.3)) + h * 6.283));
  float star = smoothstep(r, 0.0, length(f - sp)) * tw * step(0.35, h);
  // moon at (150, 80) r 34, bitten by a circle at (166, 68) r 30
  float dm = length(p - vec2(150.0, 80.0)), db = length(p - vec2(166.0, 68.0));
  float moon = smoothstep(34.5, 33.5, dm) * smoothstep(29.5, 30.5, db);
  float halo = exp(-max(dm - 34.0, 0.0) * 0.07) * 0.22 * (1.0 - moon);
  star *= smoothstep(40.0, 48.0, dm);
  // nebula
  float neb = fbm(p * 0.018 + vec2(t * 0.03, -t * 0.02));
  neb = smoothstep(0.45, 0.85, neb) * 0.16;
  float a = clamp(star + moon + halo + neb + grain(p), 0.0, 1.0) * area(p);
  gl_FragColor = vec4(u_ac * a, a);
}
`;

// The Foreman: eight conveyor rows of dashes marching right; a "done" glow runs down the list row by row.
const dashes = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i), y = 44.0 + 20.0 * fi;
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
  vec2 p = cardPx(), c = vec2(116.0, 110.0), q = p - c;
  float t = u_time, r = length(q), ang = atan(q.y, q.x);
  float a = 0.0;
  for (int i = 0; i < 2; i++) {
    float R = i == 0 ? 84.0 : 58.0;
    float s = mod(ang * R, 8.0) - 4.0;
    a = max(a, stroke(length(vec2(s, r - R)), 1.0) * 0.8);
  }
  a = max(a, stroke(abs(r - 32.0), 0.75));
  float th = radians(mix(-40.0, 220.0, breathe(t, 14.0)));
  vec2 p1 = c + rot(vec2(0.0, -84.0), th), p2 = c + rot(vec2(0.0, 84.0), th);
  a = max(a, stroke(segment(p, p1, p2), 0.5) * 0.35);
  a = max(a, fill(length(p - p1) - 7.0));
  a = max(a, fill(length(p - p2) - 4.0));
  a += exp(-length(p - p1) * 0.12) * 0.35 + exp(-length(p - p2) * 0.18) * 0.2;
  // trail along the outer orbit, behind the planet in the direction it is moving
  float dir = sign(sin(TAU * t / 14.0));
  float pa = atan(p1.y - c.y, p1.x - c.x);
  float behind = mod((pa - ang) * dir + TAU, TAU);
  a += exp(-behind * 3.0) * stroke(abs(r - 84.0), 1.6) * 0.5 * step(0.02, abs(sin(TAU * t / 14.0)));
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Tinkerer: two meshing gears turning in opposite directions, lit from the top left like machined metal.
const gears = HEAD + `
float gear(vec2 p, vec2 c, float rIn, float rOut, float period, float tooth, float spin) {
  vec2 q = p - c; float r = length(q), ang = atan(q.y, q.x) + spin;
  float s = mod(ang * (rIn + rOut) * 0.5, period);
  float band = step(rIn, r) * step(r, rOut) * step(s, tooth);
  float shade = 0.75 + 0.25 * cos(atan(q.y, q.x) + 2.4);
  return band * (1.0 - smoothstep(rOut - 0.8, rOut + 0.4, r)) * shade;
}
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0;
  vec2 c1 = vec2(92.0, 96.0), c2 = vec2(166.0, 166.0);
  a = max(a, gear(p, c1, 43.0, 57.0, 15.7, 9.5, -t * TAU / 14.0));
  a = max(a, stroke(abs(length(p - c1) - 34.0), 1.5));
  a = max(a, fill(length(p - c1) - 8.0));
  a = max(a, gear(p, c2, 22.0, 34.0, 14.6, 7.6, t * TAU / 8.4));
  a = max(a, fill(length(p - c2) - 6.0));
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Stoic: faint vertical rules and one circle that barely breathes, sending out a slow ripple.
const still = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0;
  float u = mod(p.x - 12.0, 14.0);
  float k = floor((p.x - 12.0) / 14.0 + 0.5);
  a = stroke(min(u, 14.0 - u), 0.5) * (0.18 + 0.06 * sin(t * 0.4 + k * 0.5)) * step(p.y, 206.0) * step(-0.5, k) * step(k, 15.0);
  vec2 c = vec2(116.0, 104.0);
  float r = length(p - c);
  a = max(a, fill(r - (46.0 + 1.4 * breathe(t, 9.0))));
  float ring = mod(t * 5.0, 60.0);
  a = max(a, stroke(abs(r - 46.0 - ring), 0.6) * 0.3 * (1.0 - ring / 60.0));
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Muse: six petals turning slowly, each breathing at its own pace around a pulsing heart.
const petals = HEAD + `
void main() {
  vec2 p = cardPx(), c = vec2(116.0, 110.0);
  float t = u_time, a = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 q = rot(p - c, -(radians(fi * 30.0) + t * TAU / 48.0));
    vec2 ab = vec2(22.0, 80.0 + 4.0 * sin(t * 0.7 + fi * 1.1));
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

// The Cartographer: contour lines over a slowly shifting terrain, a dashed route flowing along the bottom, and a
// marker at the summit.
const contours = HEAD + `
float height(vec2 p, float t) {
  vec2 c = vec2(120.0, 114.0);
  float d = length((p - c) * vec2(1.0, 1.25));
  return exp(-d * d / 7000.0) * 0.8 + fbm(p * 0.012 + vec2(t * 0.012, -t * 0.008)) * 0.35;
}
void main() {
  vec2 p = cardPx();
  float t = u_time;
  float h = height(p, t);
  vec2 g = vec2(height(p + vec2(1.0, 0.0), t) - h, height(p + vec2(0.0, 1.0), t) - h);
  float v = h * 9.0;
  float d = abs(fract(v + 0.5) - 0.5) / max(length(g) * 9.0, 1e-3);
  // contours fade out toward the card's edges, clear of the type label
  float edge = 1.0 - smoothstep(78.0, 108.0, length((p - vec2(120.0, 110.0)) * vec2(1.0, 1.2)));
  float a = stroke(d, 0.7) * step(p.y, 176.0) * 0.9 * edge;
  // the route
  float ry = 190.0 - 10.0 * sin(p.x * 0.03 + 0.6) - 6.0 * sin(p.x * 0.011);
  float along = mod(p.x - t * 18.0, 9.0);
  a = max(a, stroke(abs(p.y - ry), 0.7) * step(along, 3.0));
  a = max(a, fill(length(p - vec2(120.0, 114.0)) - 3.0));
  a += exp(-length(p - vec2(120.0, 114.0)) * 0.2) * 0.3 * breathe(t, 2.5);
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Spark: rays wheeling around a pulsing core, each ray flaring on its own beat, sparks blinking at the edges.
const burst = HEAD + `
void main() {
  vec2 p = cardPx(), c = vec2(116.0, 110.0), q = p - c;
  float t = u_time, a = 0.0;
  float spin = t * radians(10.0);
  for (int k = 0; k < 12; k++) {
    float fk = float(k);
    float len = (mod(fk, 2.0) < 0.5 ? 78.0 : 58.0) + 8.0 * sin(t * 2.6 + fk * 1.7);
    vec2 dir = rot(vec2(1.0, 0.0), radians(fk * 30.0) + spin);
    a = max(a, stroke(segment(p, c + dir * 30.0, c + dir * len), 2.0));
  }
  float core = length(q) - (13.0 + 6.0 * breathe(t, 1.5));
  a = max(a, fill(core));
  a += exp(-max(core, 0.0) * 0.08) * 0.35;
  vec3 sp[4];
  sp[0] = vec3(40.0, 40.0, 1.8); sp[1] = vec3(196.0, 58.0, 2.2); sp[2] = vec3(190.0, 190.0, 2.0); sp[3] = vec3(34.0, 178.0, 1.6);
  for (int i = 0; i < 4; i++) {
    float blink = breathe(t + float(i) * 0.7, sp[i].z);
    a = max(a, fill(length(p - sp[i].xy) - 3.0) * blink);
    a += exp(-length(p - sp[i].xy) * 0.25) * 0.4 * blink;
  }
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Gardener: a grid of seeds swelling and settling in a diagonal wave, each with a soft halo.
const dots = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time;
  vec2 cell = floor((p - vec2(26.0, 25.0)) / vec2(36.0, 42.0));
  cell = clamp(cell, vec2(0.0), vec2(4.0, 3.0));
  vec2 c = vec2(44.0, 46.0) + cell * vec2(36.0, 42.0);
  float r = 2.0 + 6.0 * breathe(t + 0.3 * (cell.x + cell.y), 3.2);
  float d = length(p - c) - r;
  float a = fill(d) + exp(-max(d, 0.0) * 0.3) * 0.25 * r / 8.0;
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Scout: four zigzag trails heading right, as if tracking a path across the map.
const zigzag = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0;
  for (int i = 0; i < 4; i++) {
    float base = 50.0 + 40.0 * float(i);
    float u = (p.x + 40.0 - t * 25.0) / 40.0;
    float y = base - 12.0 * (1.0 - abs(2.0 * fract(u) - 1.0));
    a = max(a, stroke(abs(p.y - y) * 0.857, 1.1));
  }
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Critic: diagonal rules and a red-pen stroke sweeping across; the lines it has marked glow and fade.
const slash = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time;
  float cpos = p.x + p.y;
  float k = floor((cpos - 30.0) / 30.0 + 0.5);
  float lc = 30.0 + 30.0 * k;
  float inside = step(10.0, p.y) * step(p.y, 210.0) * step(-0.5, k) * step(k, 13.5);
  float pen = 210.0 + mix(-260.0, 260.0, fract(t / 3.4));
  float lit = exp(-max(pen - lc, 0.0) / 70.0) * step(lc, pen + 8.0);
  float a = stroke(abs(cpos - lc) / 1.4142, 0.75) * inside * (0.55 + 0.45 * lit);
  float penD = segment(p, vec2(pen - 210.0, 210.0), vec2(pen - 10.0, 10.0));
  a = max(a, fill(penD - 6.0));
  a += exp(-max(penD - 6.0, 0.0) * 0.12) * 0.3;
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Keeper: a 4×4 grid of tiles filling in reading order and holding, like a checklist kept.
const grid = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time;
  vec2 cell = clamp(floor((p - vec2(34.0, 22.0)) / 40.0), vec2(0.0), vec2(3.0));
  vec2 c = vec2(54.0, 42.0) + cell * 40.0;
  float i = cell.y * 4.0 + cell.x;
  float f = fract(t / 6.0 + i * 0.35 / 6.0);
  float on = f < 0.15 ? smoothstep(0.0, 0.15, f) : (f < 0.7 ? 1.0 : 1.0 - smoothstep(0.7, 1.0, f));
  float d = roundBox(p, c, vec2(14.0), 7.0);
  float a = fill(d) * (0.15 + 0.85 * on) + exp(-max(d, 0.0) * 0.35) * 0.2 * on;
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Confidant: nested rounded squares whose outlines pulse inward toward a solid centre, like holding space.
const nest = HEAD + `
void main() {
  vec2 p = cardPx(), c = vec2(116.0, 112.0);
  float t = u_time, a = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float hs = 90.0 - 18.0 * fi;
    float d = roundBox(p, c, vec2(hs), 40.0 - 8.0 * fi);
    float o = 0.25 + 0.75 * breathe(t - 0.3 * fi, 3.0);
    a = max(a, stroke(abs(d), 0.8) * o);
    a += exp(-abs(d) * 0.3) * 0.08 * o;
  }
  a = max(a, fill(roundBox(p, c, vec2(18.0), 10.0)));
  gl_FragColor = paint(u_ac, a, p);
}
`;

// The Showrunner: rows of chevrons rushing right, with a streak behind each.
const chevrons = HEAD + `
void main() {
  vec2 p = cardPx();
  float t = u_time, a = 0.0;
  for (int i = 0; i < 3; i++) {
    float y0 = 38.0 + 58.0 * float(i);
    float x = mod(p.x - t * 51.4, 36.0);
    vec2 q = vec2(x, p.y);
    float d = min(segment(q, vec2(4.0, y0), vec2(18.0, y0 + 14.0)), segment(q, vec2(18.0, y0 + 14.0), vec2(4.0, y0 + 28.0)));
    a = max(a, stroke(d, 2.5));
    float streak = step(y0, p.y) * step(p.y, y0 + 28.0) * smoothstep(0.0, 14.0, x) * (1.0 - step(18.0, x));
    a = max(a, streak * 0.12 * (1.0 - abs(p.y - y0 - 14.0) / 14.0));
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

export const PROGRAMS = { tide, ember, owl, dashes, orbit, gears, still, petals, contours, burst, dots, zigzag, slash, grid, nest, chevrons, ennea };

// which card patterns have a shader
export const SHADER_FOR_KIND = {
  waves: 'tide', bars: 'ember', stars: 'owl', dashes: 'dashes', orbit: 'orbit', gears: 'gears', still: 'still', petals: 'petals',
  contours: 'contours', burst: 'burst', dots: 'dots', zigzag: 'zigzag', slash: 'slash', grid: 'grid', nest: 'nest', chevrons: 'chevrons', ennea: 'ennea'
};
