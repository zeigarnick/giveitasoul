import React from 'react';
import { DCLogic } from './dc.jsx';
import SoulCard from './SoulCard.jsx';
import { MBTI, ENNEAGRAM } from '../../data/souls.js';

// The tuned feel. Springs are SwiftUI-style (response in seconds, damping ratio); fx/fy is the side-card fade curve.
const CFG = { response: 0.63, damping: 0.86, decel: 0.998, dragPx: 245, wheelPx: 120, snapMs: 60, radius: 1160, spacing: 6.7, lean: 2.5, lift: 32, scale: 1.105, dim: 0.5, shadow: 0.3, fadeIn: 0.05, fadeOut: 0.28, sideScale: 0.82, depthRange: 5, turn: -21.5, gap: 84, fadeRange: 6, fx1: 0.336, fy1: 0.101, fx2: 0.251, fy2: 1.015, mResp: 0.53, mDamp: 0.74, mClose: 0.42, mCloseDamp: 0.8, squash: 0, blur: 14, tint: 0.63, drop: 80 };

// The hero word "soul" swaps typeface toward the pointer; index 0 is the resting face.
const FACES = [
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
const GLOW = [[198,43,39],[224,80,26],[156,111,0],[95,122,14],[46,125,79],[28,128,116],[30,95,208],[106,82,217],[201,37,96]];

const kebab = (k) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

// The landing stage: a 1440×900 artboard (scaled to the viewport by the page).
// Physics runs in a rAF loop (tick) with springs integrated at 240 Hz. Each moving frame, frame() turns state into
// styles and apply() writes them straight to the elements; React only re-renders when the deck, the open state or
// the centre soul changes. The loop sleeps when nothing moves and wakes on input.
export default class Landing extends DCLogic {
  constructor(p) {
    super(p);
    this.mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.rm = this.mq.matches;
    this.state = { deck: 'mbti', open: false, key: '' };
    this.p = { pos: this.rm ? 0 : -4, v: 0, target: 0, drag: null, moved: 0, open: 0, ov: 0, rest: 0, rv: 0, sv: 0, last: 0 };
    this.SOULS = MBTI;
    this.DECKS = { mbti: MBTI, ennea: ENNEAGRAM };
    this.els = {};
    this.refs = {};
    this.paused = [];
    this.loop = (now) => {
      this.raf = 0;
      if (this.tick(now)) this.raf = requestAnimationFrame(this.loop);
      else this.sleep(now);
    };
  }
  componentDidMount() {
    this.onRm = () => { this.rm = this.mq.matches; this.paused = []; this.artPaused = null; this.dirty = true; this.wake(); };
    // how far the window reaches past the artboard (set by the page), so cards out there still count as on screen
    this.readExt = () => { const cs = this.els.root ? getComputedStyle(this.els.root) : null; this.ext = cs ? +cs.getPropertyValue('--ext') || 0 : 0; this.exty = cs ? +cs.getPropertyValue('--exty') || 0 : 0; };
    this.onResize = () => { this.soulRect = null; this.rootRect = null; this.readExt(); this.measureDue = true; this.dirty = true; this.wake(); };
    this.onFonts = () => { this.measureDue = true; this.wake(); };
    this.mq.addEventListener('change', this.onRm);
    window.addEventListener('resize', this.onResize);
    if (document.fonts) { document.fonts.addEventListener('loadingdone', this.onFonts); document.fonts.ready.then(this.onFonts); }
    this.readExt();
    this.measureDue = true; this.dirty = true;
    this.wake();
  }
  componentDidUpdate() {
    // React just wrote its own copy of the styles and may have swapped card artwork: forget what we wrote, write it again
    this.w = null; this.paused = []; this.artPaused = null;
    this.apply(this.frame());
    this.measureDue = true;
    this.wake();
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.raf); clearTimeout(this.wt); clearTimeout(this.sleepT);
    this.mq.removeEventListener('change', this.onRm);
    window.removeEventListener('resize', this.onResize);
    if (document.fonts) document.fonts.removeEventListener('loadingdone', this.onFonts);
  }
  wake() {
    if (this.raf) return;
    clearTimeout(this.sleepT);
    this.raf = requestAnimationFrame(this.loop);
  }
  sleep(now) {
    this.p.last = 0;
    // come back for the idle nudge
    if (!this.learned && !this.rm) {
      const at = Math.max((this.lastInput || 0) + 2400, (this.nudgeAt || 0) + 3600);
      this.sleepT = setTimeout(() => this.wake(), Math.max(16, at - now + 20));
    }
  }
  // a stable ref callback per element name
  R(name) {
    return this.refs[name] || (this.refs[name] = (el) => { this.els[name] = el; });
  }
  springK(resp, damp) { const k = Math.pow(2 * Math.PI / resp, 2); return { k, c: 4 * Math.PI * damp / resp }; }
  tick(now) {
    const p = this.p, cfg = CFG, rm = this.rm;
    if (!p.last) p.last = now;
    const dt = Math.max(0, Math.min(0.05, (now - p.last) / 1000));
    p.last = now;
    // reduced motion: no overshoot anywhere
    const { k, c } = this.springK(cfg.response, rm ? Math.max(1, cfg.damping) : cfg.damping);
    const o = this.state.open ? this.springK(cfg.mResp, rm ? 1 : cfg.mDamp) : this.springK(cfg.mClose, rm ? 1 : cfg.mCloseDamp);
    const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    if (this.state.open !== this.lastOpen) {
      this.lastOpen = this.state.open;
      if (this.state.open) { this.openAt = now; this.phaseB = false; this.openB = false; this.openBAt = 0; } else { this.closeAt = now; this.phaseB = !!this.gCommit; this.gCommit = false; }
    }
    if (p.col == null) { p.col = 0; p.colv = 0; }
    if (!this.state.open && !this.phaseB && p.col < 0.4) this.phaseB = true;
    if (this.state.open && !this.openB && p.open > 0.62) { this.openB = true; this.openBAt = now; }
    const ot = this.state.open ? 1 : (this.phaseB ? 0 : 1);
    const ct = this.state.open ? (this.openB ? 1 : 0) : 0;
    const cs = this.state.open ? this.springK(0.42, 0.84) : this.springK(0.26, 0.9);
    const rs = this.springK(this.state.open ? cfg.mResp : cfg.mClose, 1);
    if (p.dy == null) { p.dy = 0; p.dyv = 0; }
    if (p.wdy == null) { p.wdy = 0; p.wdyv = 0; p.lift = 0; p.liftv = 0; p.liftT = 0; p.hov = 0; p.hovv = 0; }
    const ds = this.springK(0.38, 0.82), gOn = !!(p.gd && p.gd.on);
    const tether = this.springK(0.17, 0.72), nud = this.springK(0.46, 0.6), hs = this.springK(0.25, 0.9);
    // idle nudge: the centre card lifts a little when nobody has touched anything for a while
    const settled = !this.state.open && !p.drag && !p.gy && !p.gs && !this.swapPending && !(p.sink > 0.001) && p.v === 0 && p.open === 0 && p.rest === 0 && Math.abs(p.sv) < 0.01;
    if (settled && !rm && !this.learned && now - (this.lastInput || 0) > 2400 && now - (this.nudgeAt || 0) > 3600) { this.nudgeAt = now; p.liftT = 12; this.liftHold = now + 190; }
    if ((this.liftHold && now > this.liftHold) || !settled) { p.liftT = 0; this.liftHold = 0; }
    const hovT = (this.state.open && this.pillHover) || gOn ? 1 : 0;
    // deck swap: p.sink 0..1 sinks the fan; at the bottom the deck changes and it rises again
    if (p.sink == null) { p.sink = 0; p.sinkv = 0; p.sinkT = 0; p.tog = 0; p.togv = 0; }
    if (this.swapPending && p.sink > 0.9 && this.cs && this.cs.every((c) => c.s > 0.62)) {
      const nd = this.state.deck === 'mbti' ? 'ennea' : 'mbti';
      // a 9-card deck is laid out twice round the ring so the fan runs to the screen edges like the 16-card one
      this.SOULS = this.DECKS[nd].length < 16 ? this.DECKS[nd].concat(this.DECKS[nd]) : this.DECKS[nd]; this.fv = null;
      this.cs = this.SOULS.map(() => ({ s: 1, v: 0 })); p.sink = 1;
      p.pos = -1.5; p.target = 0; p.v = 0;
      p.sinkT = 0; p.sinkv = 0; this.swapPending = false; this.swapAt = now; this.postSwap = true;
      this.setState({ deck: nd });
    }
    const curIdx = this.state.deck === 'mbti' ? 0 : 1;
    const togT = this.swapPending ? 1 - curIdx : curIdx; // flips once the switch is committed, on its own spring
    const sks = p.sinkT ? this.springK(0.4, 0.95) : this.springK(0.62, 0.84), tgs = this.springK(0.32, 0.86);
    for (let i = 0; i < n; i++) {
      if (!gOn && this.state.open) { const ad = -ds.k * p.dy - ds.c * p.dyv; p.dyv += ad * h; p.dy += p.dyv * h; }
      { const aw = -tether.k * (p.wdy - p.dy) - tether.c * p.wdyv; p.wdyv += aw * h; p.wdy += p.wdyv * h; }
      { const al = -nud.k * (p.lift - p.liftT) - nud.c * p.liftv; p.liftv += al * h; p.lift += p.liftv * h; }
      { const ah = -hs.k * (p.hov - hovT) - hs.c * p.hovv; p.hovv += ah * h; p.hov += p.hovv * h; }
      if (!p.gs) { const as = -sks.k * (p.sink - p.sinkT) - sks.c * p.sinkv; p.sinkv += as * h; p.sink += p.sinkv * h; }
      { const at = -tgs.k * (p.tog - togT) - tgs.c * p.togv; p.togv += at * h; p.tog += p.togv * h; }
      if (!p.drag) { const a = -k * (p.pos - p.target) - c * p.v; p.v += a * h; p.pos += p.v * h; }
      if (!p.gy && !gOn) {
        const ao = -o.k * (p.open - ot) - o.c * p.ov; p.ov += ao * h; p.open += p.ov * h;
        const ar = -rs.k * (p.rest - ot) - rs.c * p.rv; p.rv += ar * h; p.rest += p.rv * h;
      }
      { const ac = -cs.k * (p.col - ct) - cs.c * p.colv; p.colv += ac * h; p.col += p.colv * h; }
    }
    if (!p.drag && Math.abs(p.v) < 0.002 && Math.abs(p.pos - p.target) < 0.0006) { p.pos = p.target; p.v = 0; }
    if (Math.abs(p.ov) < 0.002 && Math.abs(p.open - ot) < 0.0006) { p.open = ot; p.ov = 0; }
    if (Math.abs(p.rv) < 0.002 && Math.abs(p.rest - ot) < 0.0006) { p.rest = ot; p.rv = 0; }
    if (Math.abs(p.colv) < 0.002 && Math.abs(p.col - ct) < 0.0006) { p.col = ct; p.colv = 0; }
    if (this.state.open && !gOn && Math.abs(p.dyv) < 1 && Math.abs(p.dy) < 0.3) { p.dy = 0; p.dyv = 0; }
    if (!this.state.open && this.phaseB && p.open === 0 && p.ov === 0) { p.dy = 0; p.dyv = 0; p.wdy = 0; p.wdyv = 0; }
    if (Math.abs(p.wdyv) < 0.5 && Math.abs(p.wdy - p.dy) < 0.2) { p.wdy = p.dy; p.wdyv = 0; }
    if (!p.liftT && Math.abs(p.liftv) < 0.05 && Math.abs(p.lift) < 0.03) { p.lift = 0; p.liftv = 0; }
    if (Math.abs(p.hovv) < 0.002 && Math.abs(p.hov - hovT) < 0.002) { p.hov = hovT; p.hovv = 0; }
    if (!p.gs && Math.abs(p.sinkv) < 0.002 && Math.abs(p.sink - p.sinkT) < 0.0006) { p.sink = p.sinkT; p.sinkv = 0; if (p.sink === 0) this.postSwap = false; }
    if (Math.abs(p.togv) < 0.002 && Math.abs(p.tog - togT) < 0.0006) { p.tog = togT; p.togv = 0; }
    const liveV = p.drag ? p.drag.vel : p.v;
    p.sv += (liveV - p.sv) * Math.min(1, dt * 14);
    const N = this.SOULS.length;
    if (!this.fv) this.fv = new Array(N).fill(1);
    // each card hangs off its neighbour nearer the centre: a chain of springs, so the fan drapes and ripples
    if (!this.cs || this.cs.length !== N) this.cs = Array.from({ length: N }, () => ({ s: 0, v: 0 }));
    this.csMoving = false;
    {
      const order = [];
      for (let i = 0; i < N; i++) { let d = i - p.pos; d = ((d % N) + N * 1.5) % N - N / 2; order.push({ i, d, ad: Math.abs(d) }); }
      order.sort((x, y) => x.ad - y.ad);
      order.forEach((o) => { o.par = o.ad < 0.5 ? -1 : (((o.i - Math.sign(o.d)) % N) + N) % N; o.k = this.springK(0.19 + 0.022 * Math.min(8, o.ad), rm ? 1 : 0.64); });
      for (let j = 0; j < n; j++) {
        for (const o of order) {
          const c = this.cs[o.i], tg = o.par < 0 ? (p.sink || 0) : this.cs[o.par].s;
          const a = -o.k.k * (c.s - tg) - o.k.c * c.v; c.v += a * h; c.s += c.v * h;
        }
      }
      for (const o of order) {
        const c = this.cs[o.i], tg = o.par < 0 ? (p.sink || 0) : this.cs[o.par].s;
        if (Math.abs(c.v) < 0.002 && Math.abs(c.s - tg) < 0.0006 && tg === (p.sink || 0) && !p.gs) { c.s = tg; c.v = 0; }
        if (c.s !== 0 || c.v !== 0) this.csMoving = true;
      }
      this.centreI = order[0].i;
    }
    let fading = false;
    for (let i = 0; i < N; i++) {
      let d = i - p.pos; d = ((d % N) + N * 1.5) % N - N / 2;
      const ft = this.bez(Math.min(1, Math.abs(d) / cfg.fadeRange));
      const tau = ft < this.fv[i] ? cfg.fadeIn : cfg.fadeOut;
      const kf = tau <= 0.005 ? 1 : 1 - Math.exp(-dt / tau);
      this.fv[i] += (ft - this.fv[i]) * kf;
      if (Math.abs(ft - this.fv[i]) > 0.001) fading = true; else this.fv[i] = ft;
    }
    // layout reads only when something could have changed them: mount, fonts, resize, or a React update
    const due = this.measureDue;
    this.measureDue = false;
    if (this.faceEls && this.faceEls.length && (due || !this.faceM.length)) {
      const M = this.faceEls.map((el, i) => { const mk = this.markEls[i]; return el && mk ? { w: el.offsetWidth, below: el.offsetHeight - mk.offsetTop, base: mk.offsetTop } : null; });
      if (M.every(Boolean)) { const changed = JSON.stringify(M) !== JSON.stringify(this.faceM); this.faceM = M; if (changed) { this.dirty = true; this.soulRect = null; } }
    }
    if (this.els.det && due) { const hh = this.els.det.offsetHeight; if (hh && Math.abs(hh - (this.detH || 0)) > 0.5) { this.detH = hh; this.dirty = true; } }
    let glowing = false;
    if (this.els.soul) {
      let target = 0;
      const readRects = this.mxMoved || p.rest !== 0;
      this.mxMoved = false;
      if (this.mx != null) {
        if (readRects || !this.soulRect) this.soulRect = this.els.soul.getBoundingClientRect();
        const r = this.soulRect;
        target = 1;
        const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
        const vx = this.mx - cx, vy = this.my - cy, vl = Math.hypot(vx, vy);
        if (vl > r.height * 0.2) {
          const ka = 1 - Math.exp(-dt / 0.18);
          this.ax = (this.ax == null ? vx / vl : this.ax + (vx / vl - this.ax) * ka);
          this.ay = (this.ay == null ? vy / vl : this.ay + (vy / vl - this.ay) * ka);
        }
      }
      let near = !!(p.drag || p.gy || p.gd || this.state.open || Math.abs(p.open) > 0.01 || Math.abs(p.ov) > 0.01 || p.rest > 0.01 || (p.col || 0) > 0.01);
      if (!near && this.mx != null && this.els.root) {
        if (readRects || !this.rootRect) this.rootRect = this.els.root.getBoundingClientRect();
        const rr = this.rootRect;
        const yA = (this.my - rr.top) * 1440 / rr.width;
        near = yA > 430;
      }
      this.suppress = near;
      if (near) target = 0;
      const prev = this.prox || 0;
      this.prox = prev + (target - prev) * (1 - Math.exp(-dt / 0.35));
      if (Math.abs(this.prox - target) < 0.002) this.prox = target;
      // the word only changes with prox and with the sector the pointer is in
      glowing = this.prox !== prev;
      const sAx = this.ax == null ? 0 : this.ax, sAy = this.ay == null ? -1 : this.ay;
      let sDeg = Math.atan2(sAy, sAx) * 180 / Math.PI + 90; sDeg = ((sDeg % 360) + 360) % 360;
      const sKey = (this.mx == null || this.suppress ? 'x' : '') + Math.floor(sDeg / 360 * 9 + 0.5) % 9;
      if (sKey !== this.lastSector) { this.lastSector = sKey; glowing = true; }
    }
    const moving = p.drag || p.gy || p.gd || p.gs || this.csMoving || p.sink !== 0 || p.sinkv !== 0 || p.tog !== togT || this.swapPending || (this.swapAt && now - this.swapAt < 1500) || p.dy !== 0 || p.dyv !== 0 || p.wdy !== p.dy || p.lift !== 0 || p.liftT !== 0 || p.hov !== hovT || p.v !== 0 || p.ov !== 0 || p.rv !== 0 || p.colv !== 0 || (!this.state.open && !this.phaseB) || (this.state.open && !this.openB) || (this.openBAt && now - this.openBAt < 950) || now - (this.openAt || -1e9) < 950 || now - (this.closeAt || -1e9) < 250 || Math.abs(p.sv) > 0.001 || fading || glowing;
    // the pointer's heading keeps easing for a moment after it stops, so stay awake a little longer
    const busy = !!(moving || this.dirty || this.measureDue || now - (this.lastMove || -1e9) < 1000);
    if (moving || this.dirty) { this.dirty = false; this.paint(); }
    return busy;
  }
  paint() {
    const f = this.frame();
    this.apply(f);
    if (f.key !== this.state.key) this.setState({ key: f.key });
  }
  // write only what changed since the last write
  apply(f) {
    if (!this.w) this.w = new Map();
    const w = this.w;
    const put = (el, props, attr) => {
      if (!el) return;
      let prev = w.get(el);
      if (!prev) w.set(el, prev = {});
      for (const k in props) {
        const v = String(props[k]);
        if (prev[k] === v) continue;
        prev[k] = v;
        if (attr) el.setAttribute(k, v); else el.style.setProperty(kebab(k), v);
      }
    };
    for (const name in f.st) put(this.els[name], f.st[name]);
    put(this.els.pill, f.pillAttr, true);
    // card patterns only run where someone can see them; reduced motion holds each on a still frame
    f.cardPause.forEach((want, i) => {
      if (this.paused[i] === want) return;
      const el = this.els['card' + i], svg = el && el.querySelector('svg');
      if (!svg) return;
      this.paused[i] = want;
      if (want) { svg.pauseAnimations(); if (this.rm) svg.setCurrentTime(1.2); } else svg.unpauseAnimations();
    });
    if (this.artPaused !== this.rm) {
      const svg = this.els.art && this.els.art.querySelector('svg');
      if (svg) { this.artPaused = this.rm; if (this.rm) { svg.pauseAnimations(); svg.setCurrentTime(1.2); } else svg.unpauseAnimations(); }
    }
  }
  bez(u) {
    const c = CFG;
    const X = (t) => 3 * (1 - t) * (1 - t) * t * c.fx1 + 3 * (1 - t) * t * t * c.fx2 + t * t * t;
    const Y = (t) => 3 * (1 - t) * (1 - t) * t * c.fy1 + 3 * (1 - t) * t * t * c.fy2 + t * t * t;
    let lo = 0, hi = 1, t = u;
    for (let i = 0; i < 22; i++) { t = (lo + hi) / 2; if (X(t) < u) lo = t; else hi = t; }
    return Y(t);
  }
  // Everything that moves, as style objects keyed by element name (the same objects seed the first render).
  frame() {
    const N = this.SOULS.length;
    const p = this.p, cfg = CFG, c01 = (v) => Math.max(0, Math.min(1, v));
    const { open, deck } = this.state;
    const pos = p.pos;
    const active = ((Math.round(pos) % N) + N) % N;
    // K sizes the whole fan (cards, radius, gap, lift) together, so smaller cards keep the same rhythm
    const K = 0.86, R = cfg.radius * K, PX = 720, PY = 616 + cfg.radius * K, STEP = cfg.spacing;
    const restE = p.rest * (1 - 0.45 * Math.max(0, Math.min(1, (p.dy || 0) / 320)) * Math.max(0, Math.min(1, p.open)));
    const op01 = Math.max(0, Math.min(1, restE));
    const sheetOn = open || Math.abs(p.open) > 0.002 || Math.abs(p.ov) > 0.01 || p.rest > 0.002;
    const lean = this.rm ? 0 : Math.max(-1, Math.min(1, p.sv / 5)) * cfg.lean;
    const st = {}, cardPause = [];
    for (let i = 0; i < N; i++) {
      let d = i - pos;
      d = ((d % N) + N * 1.5) % N - N / 2;
      const ad = Math.abs(d);
      const e = Math.max(0, 1 - ad);
      const isActive = i === active;
      const angDeg = d * STEP + Math.sign(d) * Math.min(1, ad) * (cfg.gap * K / R) * 180 / Math.PI;
      const ang = angDeg * Math.PI / 180;
      const wx = PX + R * Math.sin(ang) - 116;
      const wy = PY - R * Math.cos(ang) - 162 - cfg.lift * K * e - (isActive ? (p.lift || 0) : 0);
      const wa = angDeg + lean;
      const dz = Math.min(1, ad / cfg.depthRange), ds = dz * dz * (3 - 2 * dz);
      const ws = K * (1 + (cfg.scale - 1) * e) * (1 - (1 - cfg.sideScale) * ds);
      const wry = Math.sign(d) * Math.min(1, ad) * cfg.turn;
      const f = this.fv ? this.fv[i] : this.bez(Math.min(1, ad / cfg.fadeRange));
      const wop = ad < N / 2 - 0.45 ? 1 : 0;
      let ox, oy, oa, os, oop;
      if (isActive) { this.pose = { wx, wy, wa, ws }; ox = wx; oy = wy; oa = wa; os = ws; oop = 0; } else { ox = wx; oy = wy + cfg.drop; oa = wa; os = 0.92 * K; oop = 0; }
      const m = restE;
      const L = (a, b) => a + (b - a) * m;
      const cst = this.cs && this.cs[i] ? this.cs[i] : { s: 0, v: 0 };
      const sl = Math.max(-0.08, Math.min(1, cst.s / 0.6)), slc = Math.max(0, sl);
      const x = L(wx, ox) - (wx + 116 - 720) * 0.22 * slc, y = L(wy, oy) + 680 * sl;
      const op = isActive ? (sheetOn ? 0 : wop) : (wop + (oop - wop) * op01);
      st['card' + i] = {
        transform: 'translate(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px) rotate(' + (L(wa, oa) + Math.sign(d) * slc * 10 + Math.max(-6, Math.min(6, cst.v * 2.2)) * Math.sign(d)).toFixed(2) + 'deg) perspective(1400px) rotateY(' + L(wry, 0).toFixed(2) + 'deg) scale(' + (L(ws, os) * (1 - 0.08 * slc)).toFixed(4) + ')',
        opacity: op.toFixed(3),
        zIndex: isActive && op01 > 0.01 ? 120 : 100 - Math.round(ad * 10),
        filter: 'brightness(' + (1 - cfg.dim * f * (1 - op01)).toFixed(3) + ')',
        boxShadow: '0 ' + Math.round(18 + 14 * e) + 'px ' + Math.round(34 + 20 * e) + 'px -18px rgba(20,18,16,' + (cfg.shadow * (0.35 + 0.65 * e)).toFixed(3) + ')'
      };
      // off the window, invisible, or under the full-strength scrim
      const ext = this.ext || 0, exty = this.exty || 0;
      cardPause[i] = this.rm || op < 0.001 || op01 > 0.98 || x < -300 - ext || x > 1460 + ext || y > 920 + exty;
    }
    // the hero word: typeface follows the pointer's direction, colour warms with proximity
    if (!this.faceEls) { this.faceEls = []; this.markEls = []; this.faceM = []; }
    const ax = this.ax == null ? 0 : this.ax, ay = this.ay == null ? -1 : this.ay;
    let deg = Math.atan2(ay, ax) * 180 / Math.PI + 90; deg = ((deg % 360) + 360) % 360;
    const kn = Math.floor(deg / 360 * (FACES.length - 1) + 0.5) % (FACES.length - 1);
    const sel = (this.mx == null || this.suppress) ? 0 : kn + 1;
    const measured = this.faceM.length === FACES.length;
    const baseW = measured ? this.faceM[0].w : 150;
    const gc = GLOW[Math.floor(deg / 360 * GLOW.length + 0.5) % GLOW.length], prox = this.prox || 0;
    const soulColor = 'rgb(' + [20, 18, 16].map((v, j) => Math.round(v + (gc[j] - v) * prox)).join(',') + ')';
    st.soul = { width: baseW.toFixed(1) + 'px' };
    FACES.forEach((_, i) => {
      const m = this.faceM[i];
      st['face' + i] = {
        bottom: (m ? (-m.below).toFixed(1) : -14) + 'px', color: soulColor, opacity: i === sel ? 1 : 0,
        transformOrigin: '0 ' + (m ? m.base.toFixed(1) : 0) + 'px', transform: 'scale(' + (m && m.w ? (baseW / m.w).toFixed(4) : 1) + ')'
      };
    });
    const heroOp = (1 - op01).toFixed(3);
    st.hero = { opacity: heroOp, transform: 'translateY(' + (-16 * op01).toFixed(1) + 'px)' };
    st.bar = { opacity: heroOp };
    // the details window morphs out of the centre card
    let pillAttr;
    {
      const m = p.open;
      const P0 = this.pose || { wx: 604, wy: 458, wa: 0, ws: 1 };
      const W0 = 232 * P0.ws, H0 = 324 * P0.ws, cx0 = P0.wx + 116, cy0 = P0.wy + 162;
      const PAD = 40, GAP = 40, TEXTW = 400, ART = 1.2;
      const cardW = 232 * ART, cardH = 324 * ART;
      const textH = this.detH || 360;
      const innerH = Math.max(cardH, textH);
      const W1 = PAD + cardW + GAP + TEXTW + PAD, H1 = innerH + PAD * 2, cx1 = 720, cy1 = 470;
      const L = (a, b) => a + (b - a) * m;
      const mS = open ? m : c01(p.rest);
      const LS = (a, b) => a + (b - a) * mS;
      const col = p.col == null ? 0 : p.col;
      const LC = (a, b) => a + (b - a) * col;
      const artY1 = PAD + (innerH - cardH) / 2;
      const WT = LC(cardW, W1), HT = LC(cardH, H1), cxT = cx1, cyT = cy1;
      const artXT = LC(0, PAD), artYT = LC(0, artY1), RT = LC(20 * ART, 28);
      this.slotDy = cy0 - cyT;
      const dyE = (p.wdy || 0) * c01(m), gsc = 1 - 0.07 * c01((p.wdy || 0) / 320) * c01(m);
      const W = LS(W0, WT), H = LS(H0, HT), cx = L(cx0, cxT), cy = L(cy0, cyT) + dyE;
      const sq = cfg.squash * Math.max(-1, Math.min(1, p.ov / 6)) * 0.06;
      // the pill: above the centre card on the wheel, floating just outside the window when open
      const mc = c01(m);
      const pillX = cx, pillY = cy - H * gsc / 2 - L(18, 14) + ((p.dy || 0) - (p.wdy || 0)) * mc;
      const tn0 = performance.now(), pr = this.pillPrev;
      if (!pr || tn0 - pr.t > 4) {
        const inst = pr ? (pillY - pr.y) / ((tn0 - pr.t) / 1000) : 0;
        this.pillV = (this.pillV || 0) * 0.6 + (Math.abs(inst) < 6000 ? inst : 0) * 0.4;
        this.pillPrev = { y: pillY, t: tn0 };
      }
      const hv = c01(p.hov || 0);
      const pwid = L(34, 44) + 10 * hv;
      const bend = Math.max(-9, Math.min(9, (this.pillV || 0) / 70)) - 8 * c01((p.lift || 0) / 12) * (1 - mc);
      this.pillPos = { x: pillX, y: pillY };
      const wheelF = sheetOn ? 1 : c01(1 - Math.abs(pos - Math.round(pos)) * 5) * c01(1 - Math.abs(p.sv) * 1.5);
      pillAttr = {
        d: 'M' + (pillX - pwid / 2).toFixed(1) + ' ' + pillY.toFixed(1) + 'L' + pillX.toFixed(1) + ' ' + (pillY + bend).toFixed(1) + 'L' + (pillX + pwid / 2).toFixed(1) + ' ' + pillY.toFixed(1),
        'stroke-opacity': ((L(0.36, 0.24) + 0.28 * hv) * wheelF * (1 - c01((p.sink || 0) * 6))).toFixed(3)
      };
      const vis = sheetOn ? 'visible' : 'hidden', pe = open ? 'auto' : 'none';
      st.scrim = { background: 'rgba(244,240,232,' + (cfg.tint * c01(restE)).toFixed(3) + ')', backdropFilter: 'blur(' + (cfg.blur * c01(restE)).toFixed(2) + 'px)', WebkitBackdropFilter: 'blur(' + (cfg.blur * c01(restE)).toFixed(2) + 'px)', pointerEvents: pe, visibility: vis };
      st.sheet = {
        visibility: vis, width: Math.max(1, W).toFixed(1) + 'px', height: Math.max(1, H).toFixed(1) + 'px',
        transform: 'translate(' + (cx - W / 2).toFixed(1) + 'px, ' + (cy - H / 2).toFixed(1) + 'px) rotate(' + L(P0.wa, 0).toFixed(2) + 'deg) scale(' + ((1 + sq) * gsc).toFixed(4) + ', ' + ((1 - sq) * gsc).toFixed(4) + ')',
        borderRadius: LS(20 * P0.ws, RT).toFixed(1) + 'px',
        boxShadow: '0 ' + Math.round(L(24, 50)) + 'px ' + Math.round(L(40, 110)) + 'px -24px rgba(20,18,16,' + L(0.25, 0.32).toFixed(3) + '), 0 0 0 0.5px rgba(20,18,16,' + (0.1 * c01(m)).toFixed(3) + ')',
        pointerEvents: pe
      };
      st.art = { left: LS(0, artXT).toFixed(1) + 'px', top: LS(0, artYT).toFixed(1) + 'px', transform: 'scale(' + LS(P0.ws, ART).toFixed(4) + ')', boxShadow: '0 18px 40px -22px rgba(20,18,16,' + (0.35 * c01(m)).toFixed(3) + ')' };
      st.det = { left: Math.round(PAD + cardW + GAP) + 'px', top: Math.round(PAD + (innerH - textH) / 2) + 'px' };
      // the details text rises in, one line after another, once the window has unfolded
      for (let i = 0; i < 5; i++) {
        const tn = performance.now();
        let e;
        const colF = c01((p.col - 0.55) / 0.45);
        if (open) { const q = this.openB ? c01((tn - this.openBAt - 120 - i * 50) / 420) : 0; e = 1 - Math.pow(1 - q, 3); }
        else { e = Math.min(1 - c01((tn - (this.closeAt || 0)) / 110), colF); }
        st['d' + i] = { opacity: e.toFixed(3), transform: 'translateY(' + ((1 - e) * 10).toFixed(1) + 'px)', filter: 'blur(' + ((1 - e) * 4).toFixed(2) + 'px)' };
        if (i === 0) st.closeBtn = { opacity: e.toFixed(3) };
      }
    }
    // the deck toggle and the rolodex flip between deck names
    const other = deck === 'mbti' ? 'ennea' : 'mbti';
    const W0 = 112, W1 = 148, t = p.tog || 0;
    const armed = (p.sink || 0) > 0.14;
    st.toggle = { opacity: (1 - 0.6 * c01(p.rest || 0)).toFixed(3), pointerEvents: open ? 'none' : 'auto' };
    st.thumb = { left: (3 + W0 * t).toFixed(1) + 'px', width: (W0 + (W1 - W0) * t).toFixed(1) + 'px' };
    st.opt0 = { color: t < 0.5 ? '#141210' : '#6B6358' };
    st.opt1 = { color: t >= 0.5 ? '#141210' : '#6B6358' };
    // driven by the centre card's own spring: first half while it sinks, second half as the new centre lands
    const cc = this.cs && this.cs[this.centreI] ? this.cs[this.centreI] : { s: 0, v: 0 };
    const cl = cc.s / 0.6;
    let prog, o;
    if (!this.postSwap) { prog = 0.5 * Math.min(1.08, Math.max(0, cl)); o = c01(cl * 3); }
    else { const r = 1 - Math.min(1, cl); prog = 0.5 + 0.5 * r; o = 1 - c01((r - 0.8) / 0.2); }
    const from = this.postSwap ? other : deck, to = this.postSwap ? deck : other;
    // the front card tips forward on its bottom hinge as the fan sinks; the next card is revealed behind it
    const ang = this.postSwap ? 90 + 90 * c01(prog * 2 - 1) : 180 * prog;
    const rev = this.postSwap ? 1 : c01((ang - 30) / 60);
    st.flip = { opacity: o.toFixed(3), filter: 'blur(' + (8 * (1 - o)).toFixed(2) + 'px)' };
    st.hint = { opacity: p.gs ? 1 : 0 };
    st.back = { transform: 'translateY(' + (-10 * (1 - rev)).toFixed(2) + 'px) scale(' + (0.9 + 0.1 * rev).toFixed(4) + ')', opacity: rev.toFixed(3), filter: 'blur(' + (10 * (1 - rev)).toFixed(2) + 'px)' };
    st.front = { transform: 'rotateX(' + (-ang).toFixed(2) + 'deg)', opacity: (1 - c01((ang - 35) / 50)).toFixed(3), filter: 'blur(' + (10 * c01((ang - 15) / 70)).toFixed(2) + 'px)' };
    const plHint = armed || this.swapPending ? 'RELEASE TO SWITCH' : 'PULL DOWN TO SWITCH';
    return { st, pillAttr, cardPause, active, from, to, plHint, key: [active, from, to, plHint].join('|') };
  }
  cardClick(i) {
    const p = this.p, N = this.SOULS.length;
    if (p.moved > 6 || this.state.open || (p.sink || 0) > 0.01 || this.swapPending) return;
    let d = i - p.pos; d = ((d % N) + N * 1.5) % N - N / 2;
    if (i === ((Math.round(p.pos) % N) + N) % N) this.setState({ open: true });
    else { p.target = Math.round(p.target) + Math.round(d); this.dirty = true; }
  }
  renderVals() {
    const f = this.frame();
    const p = this.p;
    const { open, deck } = this.state;
    const cfg = CFG;
    const upFn = () => {
      if (p.gs) {
        const idle = performance.now() - p.gs.lt > 90;
        const v = idle ? 0 : Math.max(-3, Math.min(4, p.gs.vel));
        p.gs = null;
        if (p.sink + v * 0.12 > 0.14 || v > 0.7) { this.swapPending = true; p.sinkT = 1; p.sinkv = Math.max(v, 0.8); }
        else { p.sinkT = 0; p.sinkv = v; }
        this.dirty = true;
        return;
      }
      if (p.gd) {
        const g = p.gd; p.gd = null;
        if (!g.on) return;
        this.gEnd = performance.now();
        const idle = performance.now() - g.lt > 90;
        const v = idle ? 0 : Math.max(-3000, Math.min(4000, g.vel));
        const projected = p.dy + v * 0.12;
        if (projected > 140 || v > 700) {
          // hand the finger's speed to the return trip: normalise px/s by the distance left to the wheel slot
          const dist = Math.max(60, Math.abs((this.slotDy || 118) - p.dy));
          const nv = Math.max(0, v) / dist * Math.sign((this.slotDy || 118) - p.dy);
          this.gCommit = true;
          p.ov = -Math.abs(nv) * 0.8; p.rv = -1.5;
          this.setState({ open: false });
        } else {
          p.dyv = v;
        }
        this.dirty = true;
        return;
      }
      if (p.gy) {
        const idle = performance.now() - p.gy.lt > 90;
        const v = idle ? 0 : Math.max(-8, Math.min(12, p.gy.vel));
        p.gy = null;
        p.ov = v; p.rv = v;
        const projected = p.open + v * 0.15;
        if (projected > 0.42 || v > 2.4) { this.learned = true; this.setState({ open: true }); }
        else { this.phaseB = true; this.dirty = true; }
        return;
      }
      if (!p.drag) return;
      const idle = performance.now() - p.drag.lt > 80;
      const vel = idle ? 0 : p.drag.vel;
      p.drag = null;
      p.v = vel;
      const d = cfg.decel;
      p.target = Math.round(p.pos + (vel / 1000) * d / (1 - d));
    };
    const pickDeck = (to) => () => { if (deck !== to && !this.swapPending && !open) { this.swapPending = true; this.postSwap = false; p.sinkT = 1; p.sinkv = 1.2; this.dirty = true; } };
    const NM = { mbti: ['MBTI', '16 SOULS'], ennea: ['Enneagram', '9 SOULS'] };
    return {
      st: f.st, pill: f.pillAttr,
      cards: this.SOULS.map((s, i) => ({ s, label: s.name, click: () => this.cardClick(i) })),
      cur: this.SOULS[f.active],
      faces: FACES,
      frName: NM[f.from][0], frSub: NM[f.from][1], bkName: NM[f.to][0], bkSub: NM[f.to][1], plHint: f.plHint,
      counter: String((f.active % this.DECKS[deck].length) + 1).padStart(2, '0') + ' / ' + this.DECKS[deck].length,
      tgX: 720 - (112 + 148 + 6) / 2,
      isMbti: deck === 'mbti' ? 'true' : 'false', isEnnea: deck === 'ennea' ? 'true' : 'false',
      pickMbti: pickDeck('mbti'), pickEnnea: pickDeck('ennea'),
      faceRef: (i) => (el) => { this.faceEls[i] = el; },
      markRef: (i) => (el) => { this.markEls[i] = el; },
      stop: (e) => e.stopPropagation(),
      close: () => { if (performance.now() - (this.gEnd || 0) < 350) return; this.setState({ open: false }); },
      prev: () => { p.target = Math.round(p.target) - 1; this.dirty = true; },
      next: () => { p.target = Math.round(p.target) + 1; this.dirty = true; },
      wake: () => this.wake(),
      down: (e) => {
        this.lastInput = performance.now();
        this.wake();
        if (open) {
          if (this.openB && p.col > 0.9) p.gd = { x0: e.clientX, y0: e.clientY, ly: e.clientY, lt: performance.now(), vel: 0, prog: 0, on: false };
          return;
        }
        p.drag = { x: e.clientX, y: e.clientY, pos: p.pos, lx: e.clientX, lt: performance.now(), vel: 0, axis: null };
        p.moved = 0; p.v = 0;
      },
      leave: () => { this.mx = null; this.my = null; this.lastMove = performance.now(); this.wake(); upFn(); },
      move: (e) => {
        this.mx = e.clientX; this.my = e.clientY; this.mxMoved = true; this.lastMove = performance.now();
        this.wake();
        if (open && this.els.root && this.pillPos) {
          const rr = this.els.root.getBoundingClientRect(), sc = 1440 / rr.width;
          const ax = (e.clientX - rr.left) * sc, ay = (e.clientY - rr.top) * sc;
          const hov = Math.abs(ax - this.pillPos.x) < 70 && Math.abs(ay - this.pillPos.y) < 26;
          if (hov !== !!this.pillHover) { this.pillHover = hov; this.dirty = true; }
        } else if (this.pillHover) { this.pillHover = false; }
        if (p.gd) {
          const g = p.gd, dy = e.clientY - g.y0, dx = Math.abs(e.clientX - g.x0);
          if (!g.on) {
            if (dx < 6 && Math.abs(dy) < 6) return;
            if (dy > 0 && dy > dx) { g.on = true; g.y0 = e.clientY - 6; g.ly = e.clientY; g.lt = performance.now(); }
            else { p.gd = null; return; }
          }
          const rr = this.els.root ? this.els.root.getBoundingClientRect() : { width: 1440 };
          const sc = 1440 / rr.width;
          const tnow = performance.now(), gdt = Math.max(1, tnow - g.lt) / 1000;
          const raw = (e.clientY - g.y0) * sc;
          const inst = ((e.clientY - g.ly) * sc) / gdt;
          g.vel = g.vel * 0.25 + inst * 0.75; g.ly = e.clientY; g.lt = tnow;
          // 1:1 down, rubber-band up; gentle resistance that builds past 260px
          let d = raw < 0 ? -40 * (1 - Math.exp(raw / 120)) : (raw < 260 ? raw : 260 + (raw - 260) * 0.45);
          g.raw = raw;
          p.dy = d; p.dyv = 0;
          this.dirty = true;
          return;
        }
        if (p.gs) {
          const rr = this.els.root ? this.els.root.getBoundingClientRect() : { width: 1440 };
          const sc = 1440 / rr.width, SPAN = 1133;
          const tnow = performance.now(), gdt = Math.max(1, tnow - p.gs.lt) / 1000;
          const raw = (e.clientY - p.gs.y0) * sc;
          const dd = raw < 0 ? -20 * (1 - Math.exp(raw / 60)) : (raw < 220 ? raw : 220 + (raw - 220) * 0.4);
          const inst = ((e.clientY - p.gs.ly) * sc / SPAN) / gdt;
          p.gs.vel = p.gs.vel * 0.25 + inst * 0.75; p.gs.ly = e.clientY; p.gs.lt = tnow;
          p.sink = dd / SPAN; p.sinkv = 0;
          this.dirty = true;
          return;
        }
        if (p.gy) {
          const rr = this.els.root ? this.els.root.getBoundingClientRect() : { width: 1440 };
          const sc = 1440 / rr.width, SPAN = 300;
          const tnow = performance.now(), gdt = Math.max(1, tnow - p.gy.lt) / 1000;
          let prog = (p.gy.y0 - e.clientY) * sc / SPAN;
          if (prog > 1) prog = 1 + (prog - 1) * 0.3;
          if (prog < 0) prog = prog * 0.25;
          const inst = ((p.gy.ly - e.clientY) * sc / SPAN) / gdt;
          p.gy.vel = p.gy.vel * 0.25 + inst * 0.75;
          p.gy.ly = e.clientY; p.gy.lt = tnow;
          p.open = prog; p.ov = 0;
          p.rest = Math.max(0, Math.min(1, prog * 1.15)); p.rv = 0;
          this.dirty = true;
          return;
        }
        if (!p.drag) return;
        const dx = e.clientX - p.drag.x;
        if (!p.drag.axis) {
          const ddx = Math.abs(e.clientX - p.drag.x), ddy = e.clientY - p.drag.y;
          if (ddx < 6 && Math.abs(ddy) < 6) return;
          if (Math.abs(ddy) > ddx && ddy < 0 && Math.abs(p.pos - Math.round(p.pos)) < 0.25) {
            p.target = Math.round(p.pos); p.v = 0;
            p.gy = { y0: p.drag.y, ly: e.clientY, lt: performance.now(), vel: 0 };
            p.drag = null; p.moved = 99; this.phaseB = true;
            return;
          }
          if (Math.abs(ddy) > ddx && ddy > 0 && Math.abs(p.pos - Math.round(p.pos)) < 0.25 && !this.swapPending) {
            p.target = Math.round(p.pos); p.v = 0;
            p.gs = { y0: p.drag.y, ly: e.clientY, lt: performance.now(), vel: 0 }; this.postSwap = false;
            p.drag = null; p.moved = 99;
            return;
          }
          p.drag.axis = 'x';
        }
        p.moved = Math.max(p.moved, Math.abs(dx));
        const now = performance.now();
        const dt = Math.max(1, now - p.drag.lt) / 1000;
        const inst = -((e.clientX - p.drag.lx) / cfg.dragPx) / dt;
        p.drag.vel = p.drag.vel * 0.3 + inst * 0.7;
        p.drag.lx = e.clientX; p.drag.lt = now;
        p.pos = p.drag.pos - dx / cfg.dragPx;
      },
      up: () => { this.wake(); upFn(); },
      wheel: (e) => {
        this.lastInput = performance.now();
        // a trackpad pinch arrives as ctrl+wheel: that's a zoom, not a spin
        if (open || e.ctrlKey) return;
        // Firefox can report whole lines or pages instead of pixels
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 900 : 1;
        p.target += (e.deltaY + e.deltaX) * unit / cfg.wheelPx;
        this.dirty = true;
        this.wake();
        clearTimeout(this.wt);
        this.wt = setTimeout(() => { p.target = Math.round(p.target); this.dirty = true; this.wake(); }, cfg.snapMs);
      },
      key: (e) => {
        this.lastInput = performance.now();
        this.wake();
        if (e.key === 'ArrowRight') { p.target = Math.round(p.target) + 1; this.dirty = true; }
        else if (e.key === 'ArrowLeft') { p.target = Math.round(p.target) - 1; this.dirty = true; }
        else if (e.key === 'Enter' && !open) this.setState({ open: true });
        else if (e.key === 'Escape' && open) this.setState({ open: false });
      }
    };
  }

  template(v) {
    return (
    <div className="wheel" ref={this.R('root')} tabIndex="0" onPointerDown={v.down} onPointerMove={v.move} onPointerUp={v.up} onPointerLeave={v.leave} onWheel={v.wheel} onKeyDown={v.key} onClick={v.wake} style={{ "width": "1440px", "height": "900px", "position": "relative", "clipPath": "inset(calc(var(--exty, 0) * -1px) calc(var(--ext, 0) * -1px))", "background": "#F4F0E8" }}>
      <nav style={{ "position": "absolute", "left": "0", "top": "0", "width": "1440px", "boxSizing": "border-box", "padding": "28px 56px", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "zIndex": "200" }}>
        <a href="#" aria-label="giveitasoul home" style={{ "position": "relative", "display": "flex", "alignItems": "baseline", "fontFamily": "'Instrument Serif', Georgia, serif", "fontSize": "28px", "letterSpacing": "-0.03em", "textDecoration": "none", "color": "#141210" }}>
          {"give"}
          <span style={{ "position": "relative", "color": "#8A8174" }}>
            {"it"}
            <svg width="20" height="8" viewBox="0 0 30 10" style={{ "position": "absolute", "left": "-2px", "top": "46%" }} fill="none">
              <path d="M2 7 C 9 5, 18 6, 28 3" stroke="#D22E1E" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </span>
          {"asoul"}
        </a>
        <div style={{ "display": "flex", "gap": "28px", "fontSize": "15px" }}>
          <a href="#" style={{ "textDecoration": "none", "padding": "12px 0" }}>
            {"Browse souls"}
          </a>
          <a href="#" style={{ "textDecoration": "none", "padding": "12px 0" }}>
            {"Submit yours"}
          </a>
        </div>
      </nav>
      <div ref={this.R('hero')} style={{ "position": "absolute", "left": "0px", "top": "156px", "width": "1440px", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "14px", "textAlign": "center", "pointerEvents": "none", ...v.st.hero }}>
        <h1 style={{ "margin": "0", "fontFamily": "'Instrument Serif', Georgia, serif", "fontWeight": "400", "fontSize": "72px", "lineHeight": "1", "letterSpacing": "-0.03em" }}>
          <span>
            {"Give your AI agents a"}
          </span>
          {" "}
          <span ref={this.R('soul')} style={{ "position": "relative", "display": "inline-block", "height": "0.72em", "verticalAlign": "baseline", ...v.st.soul }}>
            {v.faces.map((sf, i) => (
              <span key={i} ref={(el) => { this.R('face' + i)(el); v.faceRef(i)(el); }} style={{ "position": "absolute", "left": "0", "fontFamily": sf.ff, "fontStyle": sf.st, "fontWeight": sf.w, "fontSize": `${sf.fs}em`, "letterSpacing": `${sf.ls}em`, "lineHeight": "1", "whiteSpace": "nowrap", ...v.st['face' + i] }}>
                {"soul"}
                <i ref={v.markRef(i)} style={{ "display": "inline-block", "width": "0", "height": "0" }} />
              </span>
            ))}
          </span>
          <span>
            {"."}
          </span>
        </h1>
        <p style={{ "margin": "0", "fontSize": "18px", "color": "#4A443C" }}>
          {"Spin through personalities. Tap one to meet it."}
        </p>
      </div>
      <div ref={this.R('toggle')} role="radiogroup" aria-label="Personality system" onPointerDown={v.stop} style={{ "position": "absolute", "left": `${v.tgX}px`, "top": "32px", "height": "36px", "padding": "3px", "boxSizing": "border-box", "borderRadius": "99px", "background": "rgba(20,18,16,0.07)", "display": "flex", "zIndex": "210", ...v.st.toggle }}>
        <span ref={this.R('thumb')} style={{ "position": "absolute", "top": "3px", "height": "30px", "borderRadius": "99px", "background": "#FFFFFF", "boxShadow": "0 1px 2px rgba(20,18,16,0.14), 0 3px 10px -2px rgba(20,18,16,0.12), 0 0 0 0.5px rgba(20,18,16,0.06)", ...v.st.thumb }} />
        <button ref={this.R('opt0')} type="button" role="radio" aria-checked={v.isMbti} onClick={v.pickMbti} style={{ "all": "unset", "position": "relative", "width": "112px", "height": "30px", "display": "flex", "alignItems": "center", "justifyContent": "center", "gap": "7px", "cursor": "pointer", "fontSize": "14px", "fontWeight": "500", ...v.st.opt0 }}>
          {"MBTI "}
          <span style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "11px", "fontWeight": "400", "opacity": "0.6" }}>
            {"16"}
          </span>
        </button>
        <button ref={this.R('opt1')} type="button" role="radio" aria-checked={v.isEnnea} onClick={v.pickEnnea} style={{ "all": "unset", "position": "relative", "width": "148px", "height": "30px", "display": "flex", "alignItems": "center", "justifyContent": "center", "gap": "7px", "cursor": "pointer", "fontSize": "14px", "fontWeight": "500", ...v.st.opt1 }}>
          {"Enneagram "}
          <span style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "11px", "fontWeight": "400", "opacity": "0.6" }}>
            {"9"}
          </span>
        </button>
      </div>
      <div ref={this.R('flip')} style={{ "position": "absolute", "left": "0", "top": "470px", "width": "1440px", "display": "flex", "flexDirection": "column", "alignItems": "center", "pointerEvents": "none", "zIndex": "90", ...v.st.flip }}>
        <span ref={this.R('hint')} style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "12px", "lineHeight": "16px", "letterSpacing": "0.08em", "color": "#6B6358", ...v.st.hint }}>
          {v.plHint}
        </span>
        <div style={{ "position": "relative", "marginTop": "14px", "width": "360px", "height": "104px", "perspective": "700px" }}>
          <div ref={this.R('back')} style={{ "position": "absolute", "left": "0", "top": "0", "width": "360px", "height": "96px", "display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center", "gap": "6px", "transformOrigin": "50% 100%", ...v.st.back }}>
            <span style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "12px", "lineHeight": "16px", "letterSpacing": "0.08em", "color": "#6B6358" }}>
              {v.bkSub}
            </span>
            <span style={{ "fontFamily": "'Instrument Serif', Georgia, serif", "fontSize": "48px", "lineHeight": "52px", "letterSpacing": "-0.02em" }}>
              {v.bkName}
            </span>
          </div>
          <div ref={this.R('front')} style={{ "position": "absolute", "left": "0", "top": "0", "width": "360px", "height": "96px", "display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center", "gap": "6px", "transformOrigin": "50% 100%", "backfaceVisibility": "hidden", "WebkitBackfaceVisibility": "hidden", ...v.st.front }}>
            <span style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "12px", "lineHeight": "16px", "letterSpacing": "0.08em", "color": "#6B6358" }}>
              {v.frSub}
            </span>
            <span style={{ "fontFamily": "'Instrument Serif', Georgia, serif", "fontSize": "48px", "lineHeight": "52px", "letterSpacing": "-0.02em" }}>
              {v.frName}
            </span>
          </div>
        </div>
      </div>
      {v.cards.map((c, i) => (
        <div key={i} ref={this.R('card' + i)} style={{ "position": "absolute", "left": "0", "top": "0", "width": "232px", "height": "324px", "borderRadius": "20px", "willChange": "transform", ...v.st['card' + i] }}>
          <button type="button" className="slotbtn" aria-label={c.label} onClick={c.click}>
            <SoulCard s={c.s} />
          </button>
        </div>
      ))}
      <span ref={this.R('scrim')} onClick={v.close} style={{ "position": "absolute", "left": "calc(var(--ext, 0) * -1px)", "top": "calc(var(--exty, 0) * -1px)", "width": "calc(1440px + var(--ext, 0) * 2px)", "height": "calc(900px + var(--exty, 0) * 2px)", "zIndex": "140", ...v.st.scrim }} />
      <svg width="1440" height="900" viewBox="0 0 1440 900" fill="none" style={{ "position": "absolute", "left": "0", "top": "0", "zIndex": "160", "pointerEvents": "none" }}>
        <path ref={this.R('pill')} d={v.pill.d} stroke="#141210" strokeOpacity={v.pill['stroke-opacity']} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div ref={this.R('sheet')} role="dialog" aria-label={v.cur.name} style={{ "position": "absolute", "left": "0", "top": "0", "zIndex": "150", "background": "rgba(251,248,241,1)", "overflow": "hidden", ...v.st.sheet }}>
        <div ref={this.R('art')} style={{ "position": "absolute", "width": "232px", "height": "324px", "transformOrigin": "0 0", "borderRadius": "20px", "overflow": "hidden", ...v.st.art }}>
          <SoulCard s={v.cur} />
        </div>
        <div ref={this.R('det')} style={{ "position": "absolute", "width": "400px", "display": "flex", "flexDirection": "column", ...v.st.det }}>
          <span ref={this.R('d0')} style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "12px", "lineHeight": "16px", "color": "#6B6358", "letterSpacing": "0.06em", ...v.st.d0 }}>
            {`${v.cur.anchor} · ${v.cur.weight}`}
          </span>
          <span ref={this.R('d1')} style={{ "marginTop": "8px", "fontFamily": "'Instrument Serif', Georgia, serif", "fontSize": "44px", "lineHeight": "48px", "letterSpacing": "-0.02em", ...v.st.d1 }}>
            {v.cur.name}
          </span>
          <span ref={this.R('d2')} style={{ "marginTop": "12px", "fontFamily": "'Instrument Serif', Georgia, serif", "fontStyle": "italic", "fontSize": "20px", "lineHeight": "28px", "color": "#3A342C", "textWrap": "pretty", ...v.st.d2 }}>
            {v.cur.says}
          </span>
          <div ref={this.R('d3')} style={{ "marginTop": "24px", "display": "flex", "flexDirection": "column", "gap": "8px", "borderTop": "1px solid #E4DCCB", "paddingTop": "16px", ...v.st.d3 }}>
            <span style={{ "fontSize": "12px", "lineHeight": "16px", "color": "#6B6358" }}>
              {"In moments, it will…"}
            </span>
            {(v.cur.moments || []).map((m, i) => (
              <span key={i} style={{ "fontSize": "15px", "lineHeight": "22px" }}>
                {`— ${m}`}
              </span>
            ))}
          </div>
          <div ref={this.R('d4')} style={{ "marginTop": "32px", "display": "flex", "gap": "8px", ...v.st.d4 }}>
            <a href="#" style={{ "height": "44px", "padding": "0 20px", "borderRadius": "99px", "background": "#141210", "color": "#F4F0E8", "textDecoration": "none", "display": "flex", "alignItems": "center", "fontSize": "15px", "fontWeight": "500" }}>
              {"Use this soul"}
            </a>
            <button type="button" onClick={v.close} style={{ "height": "44px", "padding": "0 18px", "borderRadius": "99px", "border": "1px solid #CFC6B6", "background": "transparent", "fontFamily": "Geist, sans-serif", "fontSize": "15px", "color": "#141210", "cursor": "pointer" }}>
              {"Back to all"}
            </button>
          </div>
        </div>
        <button ref={this.R('closeBtn')} type="button" aria-label="Close" onClick={v.close} style={{ "position": "absolute", "right": "16px", "top": "16px", "width": "32px", "height": "32px", "borderRadius": "50%", "border": "none", "background": "rgba(20,18,16,0.06)", "cursor": "pointer", "display": "flex", "alignItems": "center", "justifyContent": "center", ...v.st.closeBtn }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#141210" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 2l8 8M10 2L2 10" />
          </svg>
        </button>
      </div>
      <div style={{ "position": "absolute", "left": "calc(var(--ext, 0) * -1px)", "top": "calc(var(--exty, 0) * -1px)", "width": "280px", "height": "calc(900px + var(--exty, 0) * 2px)", "background": "linear-gradient(90deg, rgba(244,240,232,0.92) 0%, rgba(244,240,232,0.8) 14%, rgba(244,240,232,0.58) 32%, rgba(244,240,232,0.34) 52%, rgba(244,240,232,0.13) 74%, rgba(244,240,232,0) 100%)", "zIndex": "125", "pointerEvents": "none" }} />
      <div style={{ "position": "absolute", "right": "calc(var(--ext, 0) * -1px)", "top": "calc(var(--exty, 0) * -1px)", "width": "280px", "height": "calc(900px + var(--exty, 0) * 2px)", "background": "linear-gradient(270deg, rgba(244,240,232,0.92) 0%, rgba(244,240,232,0.8) 14%, rgba(244,240,232,0.58) 32%, rgba(244,240,232,0.34) 52%, rgba(244,240,232,0.13) 74%, rgba(244,240,232,0) 100%)", "zIndex": "125", "pointerEvents": "none" }} />
      <div ref={this.R('bar')} style={{ "position": "absolute", "left": "0", "bottom": "34px", "width": "1440px", "display": "flex", "justifyContent": "center", "alignItems": "center", "gap": "16px", "zIndex": "200", ...v.st.bar }}>
        <button type="button" aria-label="Previous soul" onClick={v.prev} style={{ "width": "44px", "height": "44px", "borderRadius": "50%", "border": "1.5px solid #CFC6B6", "background": "#F4F0E8", "cursor": "pointer", "display": "flex", "alignItems": "center", "justifyContent": "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#141210" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <span style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "12px", "color": "#4A443C", "minWidth": "180px", "textAlign": "center" }}>
          {`${v.counter} · drag, or pull down to switch deck`}
        </span>
        <button type="button" aria-label="Next soul" onClick={v.next} style={{ "width": "44px", "height": "44px", "borderRadius": "50%", "border": "1.5px solid #CFC6B6", "background": "#F4F0E8", "cursor": "pointer", "display": "flex", "alignItems": "center", "justifyContent": "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#141210" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
    );
  }
}
