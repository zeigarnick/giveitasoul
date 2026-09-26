import { VERTEX, PROGRAMS, paramsFor } from './programs.js';
import { CARD_W, CARD_H } from '../config.js';

// One WebGL context draws every shader card. Browsers cap how many WebGL contexts a page may hold, so instead of a
// context per card, each visible card is drawn in turn into this shared canvas and copied into the card's own 2D
// canvas (a GPU-to-GPU copy). Cards that are hidden or off-screen stop drawing; with nothing to draw the loop stops.
// All cards read one clock, so the wheel card and the open window show the same moment.

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
// Resolution relative to card pixels, never above the screen's own density. The wheel sets it per layout: phone
// cards are shown large, desktop ones small.
const clampScale = (s) => Math.max(1, Math.min(s, window.devicePixelRatio || 1));
// the centre card and the open window redraw at up to 60fps (not 120 on ProMotion phones: the patterns move slowly,
// and it halves their cost); neighbours at 30fps, far cards (small and dimmed) at 15fps
const frameMs = (dist) => (dist < 0.5 ? 1000 / 60 - 2 : dist <= 2.5 ? 1000 / 30 - 2 : 1000 / 15 - 2);

class ShaderRenderer {
  constructor() {
    this.targets = new Map();
    this.programs = {};
    this.raf = 0;
    this.t0 = performance.now();
    this.rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.scale = clampScale(1.5);
    this.loop = (now) => { this.raf = 0; this.frame(now); };
  }

  // WebGL available? (Checked once; cards fall back to their SVG pattern otherwise.)
  supported() {
    if (this.ok == null) this.init();
    return this.ok;
  }

  init() {
    // ?art=svg draws the SVG patterns instead, to compare performance on a device
    if (new URLSearchParams(location.search).get('art') === 'svg') { this.ok = false; return; }
    const canvas = document.createElement('canvas');
    this.size(canvas);
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
    this.ok = !!gl;
    if (!gl) return;
    this.canvas = canvas; this.gl = gl;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; cancelAnimationFrame(this.raf); this.raf = 0; });
    canvas.addEventListener('webglcontextrestored', () => { this.lost = false; this.programs = {}; this.setup(); this.targets.forEach((t) => this.draw(t, this.now())); this.wake(); });
    this.setup();
  }

  setup() {
    const gl = this.gl;
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
  }

  program(name) {
    if (this.programs[name]) return this.programs[name];
    const gl = this.gl;
    const shader = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`shader ${name}: ${gl.getShaderInfoLog(s)}`);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, PROGRAMS[name]));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`shader ${name}: ${gl.getProgramInfoLog(prog)}`);
    const u = (n) => gl.getUniformLocation(prog, n);
    return (this.programs[name] = { prog, pos: gl.getAttribLocation(prog, 'a_pos'), time: u('u_time'), ac: u('u_ac'), bg: u('u_bg'), fg: u('u_fg'), param: u('u_param') });
  }

  size(canvas) { canvas.width = Math.ceil(CARD_W * this.scale); canvas.height = Math.ceil(CARD_H * this.scale); }
  setScale(s) {
    s = clampScale(s);
    if (s === this.scale) return;
    this.scale = s;
    if (!this.gl) return;
    this.size(this.canvas);
    this.targets.forEach((t) => { this.size(t.canvas); this.draw(t, this.now()); });
  }
  // how far the card is from the centre (in cards) sets how often it redraws
  setDistance(canvas, dist) { const t = this.targets.get(canvas); if (t) t.every = frameMs(dist); }

  now() {
    // reduced motion: one still moment
    return this.rm.matches ? 1.2 : (performance.now() - this.t0) / 1000;
  }

  // A card's canvas joins; it draws straight away and keeps drawing while running.
  attach(canvas, name, soul) {
    if (!this.supported()) return;
    canvas.width = this.canvas.width; canvas.height = this.canvas.height;
    const t = { canvas, ctx: canvas.getContext('2d'), name, ac: hex(soul.ac), bg: hex(soul.bg), fg: hex(soul.fg), param: paramsFor(soul), running: true, every: 0, last: 0 };
    this.targets.set(canvas, t);
    this.draw(t, this.now());
    this.wake();
  }
  detach(canvas) { this.targets.delete(canvas); }
  // the wheel pauses cards nobody can see, exactly as it pauses SVG patterns
  setRunning(canvas, on) {
    const t = this.targets.get(canvas);
    if (!t || t.running === on) return;
    t.running = on;
    if (on) this.wake();
  }

  wake() {
    if (!this.raf && !this.lost) this.raf = requestAnimationFrame(this.loop);
  }

  frame() {
    if (this.lost) return;
    const time = this.now(), ms = performance.now();
    let any = false;
    this.targets.forEach((t) => {
      if (!t.running) return;
      any = true;
      if (ms - t.last >= t.every) { t.last = ms; this.draw(t, time); }
    });
    if (any && !this.rm.matches) this.wake();
  }

  draw(t, time) {
    if (this.lost) return;
    const gl = this.gl, P = this.program(t.name);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(P.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(P.pos);
    gl.vertexAttribPointer(P.pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(P.time, time);
    gl.uniform3fv(P.ac, t.ac); gl.uniform3fv(P.bg, t.bg); gl.uniform3fv(P.fg, t.fg); gl.uniform3fv(P.param, t.param);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    t.ctx.clearRect(0, 0, t.canvas.width, t.canvas.height);
    t.ctx.drawImage(this.canvas, 0, 0);
  }
}

let shared;
export const renderer = () => {
  if (!shared) { shared = new ShaderRenderer(); if (import.meta.env.DEV) window.__shaders = shared; }
  return shared;
};
