import React from 'react';
import { DCLogic } from './dc.jsx';
import SoulCard from './SoulCard.jsx';
import { MBTI, ENNEAGRAM } from '../../data/souls.js';

// The landing stage: a 1440×900 artboard (scaled to the viewport by the page).
// Physics runs in a rAF loop (tick) with springs integrated at 240 Hz; renderVals() turns state into view values.
export default class Landing extends DCLogic {
  constructor(p) {
    super(p);
    this.PRESETS = {
      Ensoul: { response: 0.63, damping: 0.86, decel: 0.998, dragPx: 245, wheelPx: 120, snapMs: 60, radius: 1160, spacing: 6.7, visible: 5, lean: 2.5, lift: 32, scale: 1.105, dim: 0.5, shadow: 0.3, fadeIn: 0.05, fadeOut: 0.28, sideScale: 0.82, depthRange: 5, turn: -21.5, gap: 84, fadeTo: 1, fadeRange: 6, fx1: 0.336, fy1: 0.101, fx2: 0.251, fy2: 1.015, mResp: 0.53, mDamp: 0.74, mClose: 0.42, mCloseDamp: 0.8, dBlur: 0, squash: 0, winW: 860, winH: 560, artScale: 1.45, dStart: 0.35, dStagger: 0.15, dDur: 0.51, dRise: 6, blur: 14, tint: 0.63, drop: 80 },
      iOS: { response: 0.55, damping: 0.83, decel: 0.998 },
      Snappy: { response: 0.3, damping: 0.9, decel: 0.992 },
      Gentle: { response: 0.85, damping: 1, decel: 0.998 },
      Bouncy: { response: 0.5, damping: 0.52, decel: 0.998 }
    };
    this.state = {
      t: 0, deck: 'mbti', open: false, hud: false, sound: false, copied: 0, preset: 'Ensoul',
      cfg: { response: 0.63, damping: 0.86, decel: 0.998, dragPx: 245, wheelPx: 120, snapMs: 60, radius: 1160, spacing: 6.7, visible: 5, lean: 2.5, lift: 32, scale: 1.105, dim: 0.5, shadow: 0.3, fadeIn: 0.05, fadeOut: 0.28, sideScale: 0.82, depthRange: 5, turn: -21.5, gap: 84, fadeTo: 1, fadeRange: 6, fx1: 0.336, fy1: 0.101, fx2: 0.251, fy2: 1.015, mResp: 0.53, mDamp: 0.74, mClose: 0.42, mCloseDamp: 0.8, dBlur: 0, squash: 0, winW: 860, winH: 560, artScale: 1.45, dStart: 0.35, dStagger: 0.15, dDur: 0.51, dRise: 6, blur: 14, tint: 0.63, drop: 80 }
    };
    this.p = { pos: -4, v: 0, target: 0, drag: null, moved: 0, open: 0, ov: 0, rest: 0, rv: 0, sv: 0, lastR: 0, last: 0 };
    this.SOULS = MBTI;
    this.DECKS = { mbti: MBTI, ennea: ENNEAGRAM };
  }
  componentDidMount() {
    const loop = (now) => { this.tick(now); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  componentWillUnmount() { cancelAnimationFrame(this.raf); clearTimeout(this.wt); clearTimeout(this.ct); }
  springK(resp, damp) { const k = Math.pow(2 * Math.PI / resp, 2); return { k, c: 4 * Math.PI * damp / resp }; }
  tick(now) {
    const p = this.p, cfg = this.state.cfg;
    if (!p.last) p.last = now;
    const dt = Math.min(0.05, (now - p.last) / 1000);
    p.last = now;
    const { k, c } = this.springK(cfg.response, cfg.damping);
    const o = this.state.open ? this.springK(cfg.mResp, cfg.mDamp) : this.springK(cfg.mClose, cfg.mCloseDamp);
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
    if (settled && !this.learned && now - (this.lastInput || 0) > 2400 && now - (this.nudgeAt || 0) > 3600) { this.nudgeAt = now; p.liftT = 12; this.liftHold = now + 190; }
    if ((this.liftHold && now > this.liftHold) || !settled) { p.liftT = 0; this.liftHold = 0; }
    const hovT = (this.state.open && this.pillHover) || gOn ? 1 : 0;
    // deck swap: p.sink 0..1 sinks the fan; at the bottom the deck changes and it rises again
    if (p.sink == null) { p.sink = 0; p.sinkv = 0; p.sinkT = 0; p.tog = 0; p.togv = 0; }
    if (this.swapPending && p.sink > 0.9 && this.cs && this.cs.every((c) => c.s > 0.62)) {
      const nd = this.state.deck === 'mbti' ? 'ennea' : 'mbti';
      // a 9-card deck is laid out twice round the ring so the fan runs to the screen edges like the 16-card one
      this.SOULS = this.DECKS[nd].length < 16 ? this.DECKS[nd].concat(this.DECKS[nd]) : this.DECKS[nd]; this.fv = null;
      this.cs = this.SOULS.map(() => ({ s: 1, v: 0 })); p.sink = 1;
      p.pos = -1.5; p.target = 0; p.v = 0; p.lastR = 0;
      p.sinkT = 0; p.sinkv = 0; this.swapPending = false; this.swapAt = now; this.postSwap = true;
      this.setState({ deck: nd });
    }
    const curIdx = this.state.deck === 'mbti' ? 0 : 1, dir = curIdx ? -1 : 1;
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
      if (true) { const ac = -cs.k * (p.col - ct) - cs.c * p.colv; p.colv += ac * h; p.col += p.colv * h; }
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
    const r = Math.round(p.pos);
    if (r !== p.lastR) { p.lastR = r; this.tickSound(); }
    const N = this.SOULS.length;
    if (!this.fv) this.fv = new Array(N).fill(1);
    // each card hangs off its neighbour nearer the centre: a chain of springs, so the fan drapes and ripples
    if (!this.cs || this.cs.length !== N) this.cs = Array.from({ length: N }, () => ({ s: 0, v: 0 }));
    this.csMoving = false;
    {
      const order = [];
      for (let i = 0; i < N; i++) { let d = i - p.pos; d = ((d % N) + N * 1.5) % N - N / 2; order.push({ i, d, ad: Math.abs(d) }); }
      order.sort((x, y) => x.ad - y.ad);
      order.forEach((o) => { o.par = o.ad < 0.5 ? -1 : (((o.i - Math.sign(o.d)) % N) + N) % N; o.k = this.springK(0.19 + 0.022 * Math.min(8, o.ad), 0.64); });
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
    if (this.faceEls && this.faceEls.length && (!this.faceM.length || now - (this.lastMeasure || 0) > 1500)) {
      this.lastMeasure = now;
      const M = this.faceEls.map((el, i) => { const mk = this.markEls[i]; return el && mk ? { w: el.offsetWidth, below: el.offsetHeight - mk.offsetTop, base: mk.offsetTop } : null; });
      if (M.every(Boolean)) { const changed = JSON.stringify(M) !== JSON.stringify(this.faceM); this.faceM = M; if (changed) this.dirty = true; }
    }
    if (this.detEl) { const hh = this.detEl.offsetHeight; if (hh && Math.abs(hh - (this.detH || 0)) > 0.5) { this.detH = hh; this.dirty = true; } }
    let glowing = false;
    if (this.soulEl) {
      let target = 0;
      if (this.mx != null) {
        const r = this.soulEl.getBoundingClientRect();
        const dx = Math.max(r.left - this.mx, 0, this.mx - r.right), dy = Math.max(r.top - this.my, 0, this.my - r.bottom);
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
      if (!near && this.mx != null && this.rootEl) {
        const rr = this.rootEl.getBoundingClientRect();
        const yA = (this.my - rr.top) * 1440 / rr.width;
        near = yA > 385;
      }
      this.suppress = near;
      if (near) target = 0;
      const prev = this.prox || 0;
      this.prox = prev + (target - prev) * (1 - Math.exp(-dt / 0.35));
      if (Math.abs(this.prox - target) < 0.002) this.prox = target;
      glowing = this.prox !== prev || this.prox > 0.002;
      const sAx = this.ax == null ? 0 : this.ax, sAy = this.ay == null ? -1 : this.ay;
      let sDeg = Math.atan2(sAy, sAx) * 180 / Math.PI + 90; sDeg = ((sDeg % 360) + 360) % 360;
      const sKey = (this.mx == null || this.suppress ? 'x' : '') + Math.floor(sDeg / 360 * 9 + 0.5) % 9;
      if (sKey !== this.lastSector) { this.lastSector = sKey; glowing = true; }
    }
    const moving = p.drag || p.gy || p.gd || p.gs || this.csMoving || p.sink !== 0 || p.sinkv !== 0 || p.tog !== togT || this.swapPending || (this.swapAt && now - this.swapAt < 1500) || p.dy !== 0 || p.dyv !== 0 || p.wdy !== p.dy || p.lift !== 0 || p.liftT !== 0 || p.hov !== hovT || p.v !== 0 || p.ov !== 0 || p.rv !== 0 || p.colv !== 0 || (!this.state.open && !this.phaseB) || (this.state.open && !this.openB) || (this.openBAt && now - this.openBAt < 950) || now - (this.openAt || -1e9) < 950 || now - (this.closeAt || -1e9) < 250 || Math.abs(p.sv) > 0.001 || fading || glowing;
    if (moving || this.dirty) { this.dirty = false; this.setState({ t: now }); }
  }
  tickSound() {
    if (!this.state.sound) return;
    try {
      if (!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)();
      const t = this.ac.currentTime, osc = this.ac.createOscillator(), g = this.ac.createGain();
      osc.type = 'triangle'; osc.frequency.value = 2000;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);
      osc.connect(g); g.connect(this.ac.destination); osc.start(t); osc.stop(t + 0.03);
    } catch (e) {}
  }
  curveFor(resp, damp) {
    const key = resp + '|' + damp;
    if (this.cKey === key) return this.cVal;
    const { k, c } = this.springK(resp, damp);
    let x = 0, v = 0, t = 0, settle = 0;
    const T = 1.6, dt = 1 / 480, pts = [];
    for (let i = 0; t <= T; i++) {
      if (i % 4 === 0) pts.push([t, x]);
      if (Math.abs(1 - x) > 0.01) settle = t;
      const a = -k * (x - 1) - c * v; v += a * dt; x += v * dt; t += dt;
    }
    const path = pts.map(([tt, xx], i) => (i ? 'L' : 'M') + (tt / T * 252).toFixed(1) + ' ' + (70 - Math.max(-0.3, Math.min(1.5, xx)) * 52).toFixed(1)).join(' ');
    this.cKey = key;
    this.cVal = { path, settle: Math.min(settle + dt, T), settleX: (Math.min(settle, T) / T * 252).toFixed(1) };
    return this.cVal;
  }
  bez(u) {
    const c = this.state.cfg;
    const X = (t) => 3 * (1 - t) * (1 - t) * t * c.fx1 + 3 * (1 - t) * t * t * c.fx2 + t * t * t;
    const Y = (t) => 3 * (1 - t) * (1 - t) * t * c.fy1 + 3 * (1 - t) * t * t * c.fy2 + t * t * t;
    let lo = 0, hi = 1, t = u;
    for (let i = 0; i < 22; i++) { t = (lo + hi) / 2; if (X(t) < u) lo = t; else hi = t; }
    return Y(t);
  }
  renderVals() {
    const N = this.SOULS.length;
    const p = this.p;
    const { open, cfg, hud, sound, copied, preset } = this.state;
    const pos = p.pos;
    const active = ((Math.round(pos) % N) + N) % N;
    const R = cfg.radius, PX = 720, PY = 620 + cfg.radius, STEP = cfg.spacing;
    const restE = p.rest * (1 - 0.45 * Math.max(0, Math.min(1, (p.dy || 0) / 320)) * Math.max(0, Math.min(1, p.open)));
    const op01 = Math.max(0, Math.min(1, restE));
    const sheetOn = open || Math.abs(p.open) > 0.002 || Math.abs(p.ov) > 0.01 || p.rest > 0.002;
    const lean = Math.max(-1, Math.min(1, p.sv / 5)) * cfg.lean;
    const cards = this.SOULS.map((s, i) => {
      let d = i - pos;
      d = ((d % N) + N * 1.5) % N - N / 2;
      const ad = Math.abs(d);
      const e = Math.max(0, 1 - ad);
      const isActive = i === active;
      const angDeg = d * STEP + Math.sign(d) * Math.min(1, ad) * (cfg.gap / R) * 180 / Math.PI;
      const ang = angDeg * Math.PI / 180;
      const wx = PX + R * Math.sin(ang) - 116;
      const wy = PY - R * Math.cos(ang) - 162 - cfg.lift * e - (isActive ? (p.lift || 0) : 0);
      const wa = angDeg + lean;
      const dz = Math.min(1, ad / cfg.depthRange), ds = dz * dz * (3 - 2 * dz);
      const ws = (1 + (cfg.scale - 1) * e) * (1 - (1 - cfg.sideScale) * ds);
      const wry = Math.sign(d) * Math.min(1, ad) * cfg.turn;
      const f = this.fv ? this.fv[i] : this.bez(Math.min(1, ad / cfg.fadeRange));
      const wop = ad < 7.4 ? 1 : 0;
      let ox, oy, oa, os, oop;
      if (isActive) { this.pose = { wx, wy, wa, ws }; ox = wx; oy = wy; oa = wa; os = ws; oop = 0; } else { ox = wx; oy = wy + cfg.drop; oa = wa; os = 0.92; oop = 0; }
      const m = restE;
      const L = (a, b) => a + (b - a) * m;
      const cst = this.cs && this.cs[i] ? this.cs[i] : { s: 0, v: 0 };
      const sl = Math.max(-0.08, Math.min(1, cst.s / 0.6)), slc = Math.max(0, sl);
      return {
        s, label: s.name,
        x: (L(wx, ox) - (wx + 116 - 720) * 0.22 * slc).toFixed(1), y: (L(wy, oy) + 680 * sl).toFixed(1), a: (L(wa, oa) + Math.sign(d) * slc * 10 + Math.max(-6, Math.min(6, cst.v * 2.2)) * Math.sign(d)).toFixed(2), sc: (L(ws, os) * (1 - 0.08 * slc)).toFixed(4), ry: L(wry, 0).toFixed(2),
        op: (isActive ? (sheetOn ? 0 : wop) : (wop + (oop - wop) * op01)).toFixed(3),
        br: (1 - cfg.dim * f * (1 - op01)).toFixed(3),
        sh: '0 ' + Math.round(18 + 14 * e) + 'px ' + Math.round(34 + 20 * e) + 'px -18px rgba(20,18,16,' + (cfg.shadow * (0.35 + 0.65 * e)).toFixed(3) + ')',
        z: isActive && op01 > 0.01 ? 120 : 100 - Math.round(ad * 10),
        click: () => {
          if (p.moved > 6 || open || (p.sink || 0) > 0.01 || this.swapPending) return;
          if (isActive) this.setState({ open: true });
          else { p.target = Math.round(p.target) + Math.round(d); this.dirty = true; }
        }
      };
    });
    const setCfg = (key, val, keepPreset) => this.setState({ cfg: Object.assign({}, this.state.cfg, { [key]: val }), preset: keepPreset ? this.state.preset : null });
    const S = (key, label, min, max, step, fmt) => {
      const v = cfg[key];
      return { label, min, max, step, v, shown: fmt(v), fill: ((v - min) / (max - min) * 100).toFixed(1), set: (e) => setCfg(key, Number(e.target.value)) };
    };
    const sections = [
      { title: 'OPEN · MORPH', items: [
        S('mResp', 'Open response', 0.2, 1.4, 0.01, (v) => v.toFixed(2) + 's'),
        S('mDamp', 'Open damping', 0.4, 1.2, 0.01, (v) => v.toFixed(2)),
        S('mClose', 'Close response', 0.2, 1.2, 0.01, (v) => v.toFixed(2) + 's'),
        S('mCloseDamp', 'Close damping', 0.4, 1.2, 0.01, (v) => v.toFixed(2)),
        S('squash', 'Squash & stretch', 0, 1, 0.01, (v) => Math.round(v * 100) + '%'),
        S('drop', 'Other cards drop', 0, 600, 10, (v) => v + 'px'),
        S('blur', 'Backdrop blur', 0, 20, 0.5, (v) => v + 'px'),
        S('tint', 'Backdrop tint', 0, 0.9, 0.01, (v) => Math.round(v * 100) + '%') ] },
      { title: 'SPRING', items: [
        S('response', 'Response', 0.15, 1.2, 0.01, (v) => v.toFixed(2) + 's'),
        S('damping', 'Damping', 0.2, 1.2, 0.01, (v) => v.toFixed(2)) ] },
      { title: 'FLICK & SCROLL', items: [
        S('decel', 'Momentum', 0.99, 0.999, 0.0005, (v) => v.toFixed(4)),
        S('dragPx', 'Drag per card', 100, 300, 5, (v) => v + 'px'),
        S('wheelPx', 'Scroll per card', 60, 400, 10, (v) => v + 'px'),
        S('snapMs', 'Scroll snap delay', 40, 400, 10, (v) => v + 'ms') ] },
      { title: 'GEOMETRY', items: [
        S('radius', 'Wheel radius', 700, 1800, 10, (v) => v + 'px'),
        S('spacing', 'Card spacing', 5, 16, 0.1, (v) => v.toFixed(1) + '°'),
        S('gap', 'Centre gap', 0, 180, 2, (v) => v + 'px'),
        S('visible', 'Visible each side', 2, 5, 0.1, (v) => v.toFixed(1)) ] },
      { title: 'DEPTH', items: [
        S('sideScale', 'Side cards shrink to', 0.5, 1, 0.01, (v) => Math.round(v * 100) + '%'),
        S('depthRange', 'Over', 0.5, 5, 0.1, (v) => v.toFixed(1) + ' cards'),
        S('turn', '3D turn (\u2212 away \u00b7 + toward)', -45, 45, 0.5, (v) => (v > 0 ? '+' : '') + v.toFixed(1) + '\u00b0') ] },
      { title: 'FEEL', items: [
        S('lean', 'Lean with speed', 0, 14, 0.5, (v) => v.toFixed(1) + '°'),
        S('lift', 'Centre lift', 0, 48, 1, (v) => v + 'px'),
        S('scale', 'Centre scale', 1, 1.15, 0.005, (v) => v.toFixed(3)),
        S('shadow', 'Shadow', 0, 0.5, 0.01, (v) => Math.round(v * 100) + '%') ] }
    ];
    const presets = Object.keys(this.PRESETS).map((name) => ({
      name, bg: preset === name ? '#FFFFFF' : 'transparent', sh: preset === name ? '0 1px 2px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.06)' : 'none',
      pick: () => this.setState({ cfg: Object.assign({}, this.state.cfg, this.PRESETS[name]), preset: name })
    }));
    const cv = this.curveFor(cfg.response, cfg.damping);
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
    const PX0 = 16, PY0 = 14, PW = 224, PH = 120;
    const bx = (t) => 3 * (1 - t) * (1 - t) * t * cfg.fx1 + 3 * (1 - t) * t * t * cfg.fx2 + t * t * t;
    const by = (t) => 3 * (1 - t) * (1 - t) * t * cfg.fy1 + 3 * (1 - t) * t * t * cfg.fy2 + t * t * t;
    let fPath = '';
    for (let i = 0; i <= 48; i++) { const t = i / 48; fPath += (i ? 'L' : 'M') + (PX0 + bx(t) * PW).toFixed(1) + ' ' + (PY0 + by(t) * PH).toFixed(1) + ' '; }
    const fDots = [], fGrid = [], readout = [], fs = {};
    for (let d = 1; d <= 5; d++) {
      const u = d / cfg.fadeRange;
      fs['fs' + d] = { x: 0, y: 0, ty: 0, o: 0 };
      if (u <= 1) { const fv0 = this.bez(u), yy0 = PY0 + fv0 * PH; fs['fs' + d] = { x: (PX0 + u * PW).toFixed(1), y: yy0.toFixed(1), ty: (yy0 - 8).toFixed(1), o: 1 }; }
      if (u <= 1) { fGrid.push({ x: (PX0 + u * PW).toFixed(1) }); const fv = this.bez(u); const yy = PY0 + fv * PH; fDots.push({ x: (PX0 + u * PW).toFixed(1), y: yy.toFixed(1), ty: (yy - 8).toFixed(1), label: '\u00b1' + d }); }
      if (d <= 3) readout.push('\u00b1' + d + ' ' + Math.round((1 - (1 - cfg.fadeTo) * this.bez(Math.min(1, u))) * 100) + '%');
    }
    const FP = { Linear: [0, 0, 1, 1], 'Ease in': [0.42, 0, 1, 1], 'Ease out': [0, 0, 0.58, 1], 'In-out': [0.45, 0, 0.55, 1], Hold: [0.75, 0, 0.9, 0.6] };
    const same = (a) => Math.abs(a[0] - cfg.fx1) < 0.005 && Math.abs(a[1] - cfg.fy1) < 0.005 && Math.abs(a[2] - cfg.fx2) < 0.005 && Math.abs(a[3] - cfg.fy2) < 0.005;
    const fPresets = Object.keys(FP).map((name) => ({ name, bg: same(FP[name]) ? '#FFFFFF' : 'transparent', sh: same(FP[name]) ? '0 1px 2px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.06)' : 'none',
      pick: () => this.setState({ cfg: Object.assign({}, this.state.cfg, { fx1: FP[name][0], fy1: FP[name][1], fx2: FP[name][2], fy2: FP[name][3] }), preset: null }) }));
    const hTo = (e) => {
      if (!this.hdrag) return;
      const svg = e.currentTarget, r = svg.getBoundingClientRect();
      const sx = (e.clientX - r.left) * 256 / r.width, sy = (e.clientY - r.top) * 156 / r.height;
      const u = Math.max(0, Math.min(1, (sx - PX0) / PW)), v = Math.max(-0.4, Math.min(1.4, (sy - PY0) / PH));
      const k = this.hdrag === 1 ? { fx1: +u.toFixed(3), fy1: +v.toFixed(3) } : { fx2: +u.toFixed(3), fy2: +v.toFixed(3) };
      this.setState({ cfg: Object.assign({}, this.state.cfg, k), preset: null });
    };
    const hDown = (n) => (e) => { e.stopPropagation(); this.hdrag = n; try { e.target.ownerSVGElement.setPointerCapture(e.pointerId); } catch (err) {} };
    const fItems = [
      S('fadeTo', 'Fade to', 0, 1, 0.01, (v) => Math.round(v * 100) + '%'),
      S('fadeRange', 'Over', 0.5, 6, 0.1, (v) => v.toFixed(1) + ' cards'),
      S('dim', 'Also dim by', 0, 0.5, 0.01, (v) => Math.round(v * 100) + '%'),
      S('fadeIn', 'Brighten in', 0, 0.8, 0.01, (v) => v === 0 ? 'instant' : Math.round(v * 1000) + 'ms'),
      S('fadeOut', 'Dim out', 0, 0.8, 0.01, (v) => v === 0 ? 'instant' : Math.round(v * 1000) + 'ms')
    ];
    return {
      ...fs,
      mPresets: (() => {
        const MP = {
          Smooth: { mResp: 0.5, mDamp: 1, mClose: 0.5, mCloseDamp: 1, dStart: 0.4, dStagger: 0.06, dDur: 0.36, dRise: 12, dBlur: 0, squash: 0 },
          Snappy: { mResp: 0.5, mDamp: 0.85, mClose: 0.4, mCloseDamp: 0.95, dStart: 0.35, dStagger: 0.05, dDur: 0.3, dRise: 10, dBlur: 0, squash: 0 },
          Bouncy: { mResp: 0.5, mDamp: 0.7, mClose: 0.45, mCloseDamp: 0.85, dStart: 0.35, dStagger: 0.06, dDur: 0.32, dRise: 14, dBlur: 0, squash: 0.4 },
          Island: { mResp: 0.32, mDamp: 0.75, mClose: 0.3, mCloseDamp: 0.82, dStart: 0.28, dStagger: 0.04, dDur: 0.3, dRise: 6, dBlur: 8, squash: 0.6 }
        };
        const same = (o) => Object.keys(o).every((k) => Math.abs(cfg[k] - o[k]) < 0.001);
        return Object.keys(MP).map((name) => ({ name, bg: same(MP[name]) ? '#FFFFFF' : 'transparent', sh: same(MP[name]) ? '0 1px 2px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.06)' : 'none',
          pick: () => { this.setState({ cfg: Object.assign({}, this.state.cfg, MP[name]), preset: null, open: false }); setTimeout(() => this.setState({ open: true }), 450); } }));
      })(),
      cards, sections, presets, fPresets, fItems, fPath, fDots, fGrid,
      fReadout: readout.join('  \u00b7  '),
      bezLabel: 'bezier(' + [cfg.fx1, cfg.fy1, cfg.fx2, cfg.fy2].map((n) => (+n).toFixed(2)).join(', ') + ')',
      rangeLabel: cfg.fadeRange.toFixed(1) + ' cards',
      h1x: (PX0 + cfg.fx1 * PW).toFixed(1), h1y: (PY0 + cfg.fy1 * PH).toFixed(1),
      h2x: (PX0 + cfg.fx2 * PW).toFixed(1), h2y: (PY0 + cfg.fy2 * PH).toFixed(1),
      h1Down: hDown(1), h2Down: hDown(2), hMove: hTo, hUp: () => { this.hdrag = 0; },
      curve: cv.path, settle: cv.settle.toFixed(2), settleX: cv.settleX,
      cur: this.SOULS[active],
      soulRef: (el) => { this.soulEl = el; },
      detRef: (el) => { this.detEl = el; },
      rootRef: (el) => { this.rootEl = el; },
      ...(() => {
        const F = [
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
        if (!this.faceEls) { this.faceEls = []; this.markEls = []; this.faceM = []; }
        const n = F.length - 1;
        const ax = this.ax == null ? 0 : this.ax, ay = this.ay == null ? -1 : this.ay;
        let deg = Math.atan2(ay, ax) * 180 / Math.PI + 90; deg = ((deg % 360) + 360) % 360;
        const kn = Math.floor(deg / 360 * n + 0.5) % n;
        const t = this.prox || 0;
        const sel = (this.mx == null || this.suppress) ? 0 : kn + 1;
        const measured = this.faceM.length === F.length;
        const baseW = measured ? this.faceM[0].w : 150;
        const faces = F.map((f, i) => {
          const m = this.faceM[i];
          return Object.assign({}, f, {
            op: i === sel ? 1 : 0,
            sc: m && m.w ? (baseW / m.w).toFixed(4) : 1,
            oy: m ? m.base.toFixed(1) : 0,
            bo: m ? (-m.below).toFixed(1) : -14,
            ref: (el) => { this.faceEls[i] = el; },
            mref: (el) => { this.markEls[i] = el; }
          });
        });
        return { soulFaces: faces, soulW: baseW.toFixed(1) };
      })(),
      soulColor: (() => {
        const P = [[198,43,39],[224,80,26],[156,111,0],[95,122,14],[46,125,79],[28,128,116],[30,95,208],[106,82,217],[201,37,96]];
        const ink = [20,18,16];
        const ax = this.ax == null ? 0 : this.ax, ay = this.ay == null ? -1 : this.ay;
        let deg = Math.atan2(ay, ax) * 180 / Math.PI + 90;
        deg = ((deg % 360) + 360) % 360;
        const c = P[Math.floor(deg / 360 * P.length + 0.5) % P.length];
        const t = this.prox || 0;
        return 'rgb(' + ink.map((v, j) => Math.round(v + (c[j] - v) * t)).join(',') + ')';
      })(),
      heroOp: (1 - op01).toFixed(3), heroY: (-16 * op01).toFixed(1),
      ...(() => {
        const m = p.open, c01 = (v) => Math.max(0, Math.min(1, v));
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
        const bgA = 1;
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
        const out = {
          pillD: 'M' + (pillX - pwid / 2).toFixed(1) + ' ' + pillY.toFixed(1) + 'L' + pillX.toFixed(1) + ' ' + (pillY + bend).toFixed(1) + 'L' + (pillX + pwid / 2).toFixed(1) + ' ' + pillY.toFixed(1),
          pillO: ((L(0.36, 0.24) + 0.28 * hv) * wheelF * (1 - c01((p.sink || 0) * 6))).toFixed(3),
          shBgA: bgA.toFixed(3),
          shSx: ((1 + sq) * gsc).toFixed(4), shSy2: ((1 - sq) * gsc).toFixed(4),
          sheetVis: sheetOn ? 'visible' : 'hidden', panelPe: open ? 'auto' : 'none',
          shW: Math.max(1, W).toFixed(1), shH: Math.max(1, H).toFixed(1), shX: (cx - W / 2).toFixed(1), shY: (cy - H / 2).toFixed(1), shA: L(P0.wa, 0).toFixed(2),
          shR: LS(20 * P0.ws, RT).toFixed(1), shSy: Math.round(L(24, 50)), shSb: Math.round(L(40, 110)), shSa: (L(0.25, 0.32) * bgA).toFixed(3), shBorder: (0.1 * c01(m) * bgA).toFixed(3),
          artX: LS(0, artXT).toFixed(1), artY: LS(0, artYT).toFixed(1), artS: LS(P0.ws, ART).toFixed(4), artSh: (0.35 * c01(m)).toFixed(3),
          scrimA: (cfg.tint * c01(restE)).toFixed(3), scrimBlur: (cfg.blur * c01(restE)).toFixed(2), detX: Math.round(PAD + cardW + GAP), detY: Math.round(PAD + (innerH - textH) / 2)
        };
        for (let i = 0; i < 5; i++) {
          const tn = performance.now();
          let e;
          const colF = c01((p.col - 0.55) / 0.45);
          if (open) { const q = this.openB ? c01((tn - this.openBAt - 120 - i * 50) / 420) : 0; e = 1 - Math.pow(1 - q, 3); }
          else { e = Math.min(1 - c01((tn - (this.closeAt || 0)) / 110), colF); }
          out['q' + i] = e.toFixed(3); out['y' + i] = ((1 - e) * 10).toFixed(1); out['b' + i] = ((1 - e) * 4).toFixed(2);
        }
        return out;
      })(),
      counter: String((active % this.DECKS[this.state.deck].length) + 1).padStart(2, '0') + ' / ' + this.DECKS[this.state.deck].length,
      ...(() => {
        const c01 = (v) => Math.max(0, Math.min(1, v));
        const deck = this.state.deck, other = deck === 'mbti' ? 'ennea' : 'mbti';
        const NAMES = { mbti: ['MBTI', '16 souls, one for each type'], ennea: ['Enneagram', '9 souls, one for each type'] };
        const W0 = 112, W1 = 148, t = p.tog || 0;
        const sink = p.sink || 0, armed = sink > 0.14;
        const target = this.swapPending || p.gs ? other : deck;
        const showName = (p.gs || this.swapPending) ? NAMES[other] : NAMES[deck];
        return {
          tgX: 720 - (W0 + W1 + 6) / 2, tgO: (1 - 0.6 * c01(p.rest || 0)).toFixed(3), tgPe: open ? 'none' : 'auto',
          thX: (3 + W0 * t).toFixed(1), thW: (W0 + (W1 - W0) * t).toFixed(1),
          tc0: t < 0.5 ? '#141210' : '#6B6358', tc1: t >= 0.5 ? '#141210' : '#6B6358',
          isMbti: deck === 'mbti' ? 'true' : 'false', isEnnea: deck === 'ennea' ? 'true' : 'false',
          pickMbti: () => { if (deck !== 'mbti' && !this.swapPending && !open) { this.swapPending = true; this.postSwap = false; p.sinkT = 1; p.sinkv = 1.2; this.dirty = true; } },
          pickEnnea: () => { if (deck !== 'ennea' && !this.swapPending && !open) { this.swapPending = true; this.postSwap = false; p.sinkT = 1; p.sinkv = 1.2; this.dirty = true; } },
          ...(() => {
            // a rolodex flip between the two decks.
            // Driven by the centre card's own spring: first half while it sinks, second half as the new centre lands.
            const cc = this.cs && this.cs[this.centreI] ? this.cs[this.centreI] : { s: 0, v: 0 };
            const cl = cc.s / 0.6;
            let prog, o;
            if (!this.postSwap) { prog = 0.5 * Math.min(1.08, Math.max(0, cl)); o = c01(cl * 3); }
            else { const r = 1 - Math.min(1, cl); prog = 0.5 + 0.5 * r; o = 1 - c01((r - 0.8) / 0.2); }
            const from = this.postSwap ? other : deck, to = this.postSwap ? deck : other;
            const NM = { mbti: ['MBTI', '16 SOULS'], ennea: ['Enneagram', '9 SOULS'] };
            // rolodex: the front card tips forward on its bottom hinge as the fan sinks; the next card is revealed behind it
            const ang = this.postSwap ? 90 + 90 * c01(prog * 2 - 1) : 180 * prog;
            const rev = this.postSwap ? 1 : c01((ang - 30) / 60);
            return {
              plO: o.toFixed(3), plBl: (8 * (1 - o)).toFixed(2),
              frName: NM[from][0], frSub: NM[from][1], frR: (-ang).toFixed(2), frO: (1 - c01((ang - 35) / 50)).toFixed(3), frBl: (10 * c01((ang - 15) / 70)).toFixed(2),
              bkName: NM[to][0], bkSub: NM[to][1], bkY: (-10 * (1 - rev)).toFixed(2), bkS: (0.9 + 0.1 * rev).toFixed(4), bkO: rev.toFixed(3), bkBl: (10 * (1 - rev)).toFixed(2)
            };
          })(),
          plHint: armed || this.swapPending ? 'RELEASE TO SWITCH' : 'PULL DOWN TO SWITCH', plHintO: p.gs ? 1 : 0,
        };
      })(),
      navShift: hud ? 300 : 0,
      hudOp: hud ? 1 : 0, hudX: hud ? 0 : 24, hudPe: hud ? 'auto' : 'none', hudLabel: hud ? 'Hide tuning' : 'Tune',
      toggleHud: (e) => { e.stopPropagation(); this.setState({ hud: !hud }); },
      soundOn: sound ? 'true' : 'false', swBg: sound ? '#34C759' : 'rgba(0,0,0,0.16)', knobX: sound ? 14 : 2,
      toggleSound: () => this.setState({ sound: !sound }),
      copyLabel: Date.now() - copied < 1400 ? 'Copied' : 'Copy values',
      copy: () => {
        try { navigator.clipboard.writeText(JSON.stringify(this.state.cfg, null, 2)); } catch (e) {}
        this.setState({ copied: Date.now() });
        clearTimeout(this.ct); this.ct = setTimeout(() => this.forceUpdate(), 1500);
      },
      replay: () => { p.pos = p.target - 4; p.v = 0; this.dirty = true; },
      stop: (e) => e.stopPropagation(),
      close: () => { if (performance.now() - (this.gEnd || 0) < 350) return; this.setState({ open: false }); },
      toggleOpen: () => this.setState({ open: !open }),
      openLabel: open ? 'Close card' : 'Open card',
      prev: () => { p.target = Math.round(p.target) - 1; this.dirty = true; },
      next: () => { p.target = Math.round(p.target) + 1; this.dirty = true; },
      down: (e) => {
        this.lastInput = performance.now();
        if (open) {
          if (this.openB && p.col > 0.9) p.gd = { x0: e.clientX, y0: e.clientY, ly: e.clientY, lt: performance.now(), vel: 0, prog: 0, on: false };
          return;
        }
        p.drag = { x: e.clientX, y: e.clientY, pos: p.pos, lx: e.clientX, lt: performance.now(), vel: 0, axis: null };
        p.moved = 0; p.v = 0;
      },
      leave: () => { this.mx = null; this.my = null; upFn(); },
      move: (e) => {
        this.mx = e.clientX; this.my = e.clientY;
        if (open && this.rootEl && this.pillPos) {
          const rr = this.rootEl.getBoundingClientRect(), sc = 1440 / rr.width;
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
          const rr = this.rootEl ? this.rootEl.getBoundingClientRect() : { width: 1440 };
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
          const rr = this.rootEl ? this.rootEl.getBoundingClientRect() : { width: 1440 };
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
          const rr = this.rootEl ? this.rootEl.getBoundingClientRect() : { width: 1440 };
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
      up: () => upFn(),
      wheel: (e) => {
        this.lastInput = performance.now();
        if (open) return;
        p.target += (e.deltaY + e.deltaX) / cfg.wheelPx;
        this.dirty = true;
        clearTimeout(this.wt);
        this.wt = setTimeout(() => { p.target = Math.round(p.target); this.dirty = true; }, cfg.snapMs);
      },
      key: (e) => {
        this.lastInput = performance.now();
        if (e.key === 'ArrowRight') { p.target = Math.round(p.target) + 1; this.dirty = true; }
        else if (e.key === 'ArrowLeft') { p.target = Math.round(p.target) - 1; this.dirty = true; }
        else if (e.key === 'Enter' && !open) this.setState({ open: true });
        else if (e.key === 'Escape' && open) this.setState({ open: false });
      }
    };
  }

  template(v) {
    return (
    <div className="wheel" ref={v.rootRef} tabIndex="0" onPointerDown={v.down} onPointerMove={v.move} onPointerUp={v.up} onPointerLeave={v.leave} onWheel={v.wheel} onKeyDown={v.key} style={{ "width": "1440px", "height": "900px", "position": "relative", "overflow": "hidden", "background": "#F4F0E8" }}>
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
        <div style={{ "display": "flex", "gap": "28px", "fontSize": "15px", "marginRight": `${v.navShift}px` }}>
          <a href="#" style={{ "textDecoration": "none", "padding": "12px 0" }}>
            {"Browse souls"}
          </a>
          <a href="#" style={{ "textDecoration": "none", "padding": "12px 0" }}>
            {"Submit yours"}
          </a>
        </div>
      </nav>
      <div style={{ "position": "absolute", "left": "0px", "top": "212px", "width": "1440px", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "14px", "textAlign": "center", "opacity": v.heroOp, "transform": `translateY(${v.heroY}px)`, "pointerEvents": "none" }}>
        <h1 style={{ "margin": "0", "fontFamily": "'Instrument Serif', Georgia, serif", "fontWeight": "400", "fontSize": "72px", "lineHeight": "1", "letterSpacing": "-0.03em" }}>
          <span>
            {"Give your AI agents a"}
          </span>
          {" "}
          <span ref={v.soulRef} style={{ "position": "relative", "display": "inline-block", "width": `${v.soulW}px`, "height": "0.72em", "verticalAlign": "baseline" }}>
            {(v.soulFaces || []).map((sf, _i0) => (
              <React.Fragment key={_i0}>
                <span ref={sf.ref} style={{ "position": "absolute", "left": "0", "bottom": `${sf.bo}px`, "fontFamily": sf.ff, "fontStyle": sf.st, "fontWeight": sf.w, "fontSize": `${sf.fs}em`, "letterSpacing": `${sf.ls}em`, "lineHeight": "1", "whiteSpace": "nowrap", "color": v.soulColor, "opacity": sf.op, "transformOrigin": `0 ${sf.oy}px`, "transform": `scale(${sf.sc})` }}>
                  {"soul"}
                  <i ref={sf.mref} style={{ "display": "inline-block", "width": "0", "height": "0" }} />
                </span>
              </React.Fragment>
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
      <div role="radiogroup" aria-label="Personality system" onPointerDown={v.stop} style={{ "position": "absolute", "left": `${v.tgX}px`, "top": "32px", "height": "36px", "padding": "3px", "boxSizing": "border-box", "borderRadius": "99px", "background": "rgba(20,18,16,0.07)", "display": "flex", "zIndex": "210", "opacity": v.tgO, "pointerEvents": v.tgPe }}>
        <span style={{ "position": "absolute", "left": `${v.thX}px`, "top": "3px", "width": `${v.thW}px`, "height": "30px", "borderRadius": "99px", "background": "#FFFFFF", "boxShadow": "0 1px 2px rgba(20,18,16,0.14), 0 3px 10px -2px rgba(20,18,16,0.12), 0 0 0 0.5px rgba(20,18,16,0.06)" }} />
        <button type="button" role="radio" aria-checked={v.isMbti} onClick={v.pickMbti} style={{ "all": "unset", "position": "relative", "width": "112px", "height": "30px", "display": "flex", "alignItems": "center", "justifyContent": "center", "gap": "7px", "cursor": "pointer", "fontSize": "14px", "fontWeight": "500", "color": v.tc0 }}>
          {"MBTI "}
          <span style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "11px", "fontWeight": "400", "opacity": "0.6" }}>
            {"16"}
          </span>
        </button>
        <button type="button" role="radio" aria-checked={v.isEnnea} onClick={v.pickEnnea} style={{ "all": "unset", "position": "relative", "width": "148px", "height": "30px", "display": "flex", "alignItems": "center", "justifyContent": "center", "gap": "7px", "cursor": "pointer", "fontSize": "14px", "fontWeight": "500", "color": v.tc1 }}>
          {"Enneagram "}
          <span style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "11px", "fontWeight": "400", "opacity": "0.6" }}>
            {"9"}
          </span>
        </button>
      </div>
      <div style={{ "position": "absolute", "left": "0", "top": "470px", "width": "1440px", "display": "flex", "flexDirection": "column", "alignItems": "center", "pointerEvents": "none", "opacity": v.plO, "filter": `blur(${v.plBl}px)`, "zIndex": "90" }}>
        <span style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "12px", "lineHeight": "16px", "letterSpacing": "0.08em", "color": "#6B6358", "opacity": v.plHintO }}>
          {v.plHint}
        </span>
        <div style={{ "position": "relative", "marginTop": "14px", "width": "360px", "height": "104px", "perspective": "700px" }}>
          <div style={{ "position": "absolute", "left": "0", "top": "0", "width": "360px", "height": "96px", "display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center", "gap": "6px", "transformOrigin": "50% 100%", "transform": `translateY(${v.bkY}px) scale(${v.bkS})`, "opacity": v.bkO, "filter": `blur(${v.bkBl}px)` }}>
            <span style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "12px", "lineHeight": "16px", "letterSpacing": "0.08em", "color": "#6B6358" }}>
              {v.bkSub}
            </span>
            <span style={{ "fontFamily": "'Instrument Serif', Georgia, serif", "fontSize": "48px", "lineHeight": "52px", "letterSpacing": "-0.02em" }}>
              {v.bkName}
            </span>
          </div>
          <div style={{ "position": "absolute", "left": "0", "top": "0", "width": "360px", "height": "96px", "display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center", "gap": "6px", "transformOrigin": "50% 100%", "transform": `rotateX(${v.frR}deg)`, "backfaceVisibility": "hidden", "WebkitBackfaceVisibility": "hidden", "opacity": v.frO, "filter": `blur(${v.frBl}px)` }}>
            <span style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "12px", "lineHeight": "16px", "letterSpacing": "0.08em", "color": "#6B6358" }}>
              {v.frSub}
            </span>
            <span style={{ "fontFamily": "'Instrument Serif', Georgia, serif", "fontSize": "48px", "lineHeight": "52px", "letterSpacing": "-0.02em" }}>
              {v.frName}
            </span>
          </div>
        </div>
      </div>
      {(v.cards || []).map((c, _i1) => (
        <React.Fragment key={_i1}>
          <div style={{ "position": "absolute", "left": "0", "top": "0", "width": "232px", "height": "324px", "borderRadius": "20px", "transform": `translate(${c.x}px, ${c.y}px) rotate(${c.a}deg) perspective(1400px) rotateY(${c.ry}deg) scale(${c.sc})`, "opacity": c.op, "zIndex": c.z, "filter": `brightness(${c.br})`, "boxShadow": c.sh, "willChange": "transform" }}>
            <button type="button" className="slotbtn" aria-label={c.label} onClick={c.click}>
              <SoulCard s={c.s} />
            </button>
          </div>
        </React.Fragment>
      ))}
      <span onClick={v.close} style={{ "position": "absolute", "left": "0", "top": "0", "width": "1440px", "height": "900px", "zIndex": "140", "background": `rgba(244,240,232,${v.scrimA})`, "backdropFilter": `blur(${v.scrimBlur}px)`, "WebkitBackdropFilter": `blur(${v.scrimBlur}px)`, "pointerEvents": v.panelPe, "visibility": v.sheetVis }} />
      <svg width="1440" height="900" viewBox="0 0 1440 900" fill="none" style={{ "position": "absolute", "left": "0", "top": "0", "zIndex": "160", "pointerEvents": "none" }}>
        <path d={v.pillD} stroke="#141210" strokeOpacity={v.pillO} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div role="dialog" aria-label={v.cur.name} style={{ "position": "absolute", "left": "0", "top": "0", "zIndex": "150", "visibility": v.sheetVis, "width": `${v.shW}px`, "height": `${v.shH}px`, "transform": `translate(${v.shX}px, ${v.shY}px) rotate(${v.shA}deg) scale(${v.shSx}, ${v.shSy2})`, "borderRadius": `${v.shR}px`, "background": `rgba(251,248,241,${v.shBgA})`, "overflow": "hidden", "boxShadow": `0 ${v.shSy}px ${v.shSb}px -24px rgba(20,18,16,${v.shSa}), 0 0 0 0.5px rgba(20,18,16,${v.shBorder})`, "pointerEvents": v.panelPe }}>
        <div style={{ "position": "absolute", "left": `${v.artX}px`, "top": `${v.artY}px`, "width": "232px", "height": "324px", "transformOrigin": "0 0", "transform": `scale(${v.artS})`, "borderRadius": "20px", "overflow": "hidden", "boxShadow": `0 18px 40px -22px rgba(20,18,16,${v.artSh})` }}>
          <SoulCard s={v.cur} />
        </div>
        <div ref={v.detRef} style={{ "position": "absolute", "left": `${v.detX}px`, "top": `${v.detY}px`, "width": "400px", "display": "flex", "flexDirection": "column" }}>
          <span style={{ "fontFamily": "'Geist Mono', monospace", "fontSize": "12px", "lineHeight": "16px", "color": "#6B6358", "letterSpacing": "0.06em", "opacity": v.q0, "transform": `translateY(${v.y0}px)`, "filter": `blur(${v.b0}px)` }}>
            {`${v.cur.anchor} · ${v.cur.weight}`}
          </span>
          <span style={{ "marginTop": "8px", "fontFamily": "'Instrument Serif', Georgia, serif", "fontSize": "44px", "lineHeight": "48px", "letterSpacing": "-0.02em", "opacity": v.q1, "transform": `translateY(${v.y1}px)`, "filter": `blur(${v.b1}px)` }}>
            {v.cur.name}
          </span>
          <span style={{ "marginTop": "12px", "fontFamily": "'Instrument Serif', Georgia, serif", "fontStyle": "italic", "fontSize": "20px", "lineHeight": "28px", "color": "#3A342C", "textWrap": "pretty", "opacity": v.q2, "transform": `translateY(${v.y2}px)`, "filter": `blur(${v.b2}px)` }}>
            {v.cur.says}
          </span>
          <div style={{ "marginTop": "24px", "display": "flex", "flexDirection": "column", "gap": "8px", "borderTop": "1px solid #E4DCCB", "paddingTop": "16px", "opacity": v.q3, "transform": `translateY(${v.y3}px)`, "filter": `blur(${v.b3}px)` }}>
            <span style={{ "fontSize": "12px", "lineHeight": "16px", "color": "#6B6358" }}>
              {"In moments, it will…"}
            </span>
            {(v.cur.moments || []).map((m, _i2) => (
              <React.Fragment key={_i2}>
                <span style={{ "fontSize": "15px", "lineHeight": "22px" }}>
                  {`— ${m}`}
                </span>
              </React.Fragment>
            ))}
          </div>
          <div style={{ "marginTop": "32px", "display": "flex", "gap": "8px", "opacity": v.q4, "transform": `translateY(${v.y4}px)`, "filter": `blur(${v.b4}px)` }}>
            <a href="#" style={{ "height": "44px", "padding": "0 20px", "borderRadius": "99px", "background": "#141210", "color": "#F4F0E8", "textDecoration": "none", "display": "flex", "alignItems": "center", "fontSize": "15px", "fontWeight": "500" }}>
              {"Use this soul"}
            </a>
            <button type="button" onClick={v.close} style={{ "height": "44px", "padding": "0 18px", "borderRadius": "99px", "border": "1px solid #CFC6B6", "background": "transparent", "fontFamily": "Geist, sans-serif", "fontSize": "15px", "color": "#141210", "cursor": "pointer" }}>
              {"Back to all"}
            </button>
          </div>
        </div>
        <button type="button" aria-label="Close" onClick={v.close} style={{ "position": "absolute", "right": "16px", "top": "16px", "width": "32px", "height": "32px", "borderRadius": "50%", "border": "none", "background": "rgba(20,18,16,0.06)", "cursor": "pointer", "display": "flex", "alignItems": "center", "justifyContent": "center", "opacity": v.q0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#141210" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 2l8 8M10 2L2 10" />
          </svg>
        </button>
      </div>
      <div style={{ "position": "absolute", "left": "0", "top": "0", "width": "280px", "height": "900px", "background": "linear-gradient(90deg, rgba(244,240,232,0.92) 0%, rgba(244,240,232,0.8) 14%, rgba(244,240,232,0.58) 32%, rgba(244,240,232,0.34) 52%, rgba(244,240,232,0.13) 74%, rgba(244,240,232,0) 100%)", "zIndex": "125", "pointerEvents": "none" }} />
      <div style={{ "position": "absolute", "right": "0", "top": "0", "width": "280px", "height": "900px", "background": "linear-gradient(270deg, rgba(244,240,232,0.92) 0%, rgba(244,240,232,0.8) 14%, rgba(244,240,232,0.58) 32%, rgba(244,240,232,0.34) 52%, rgba(244,240,232,0.13) 74%, rgba(244,240,232,0) 100%)", "zIndex": "125", "pointerEvents": "none" }} />
      <div style={{ "position": "absolute", "left": "0", "bottom": "34px", "width": "1440px", "display": "flex", "justifyContent": "center", "alignItems": "center", "gap": "16px", "opacity": v.heroOp, "zIndex": "200" }}>
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
