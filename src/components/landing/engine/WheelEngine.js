import { MBTI, ENNEAGRAM } from '../../../data/souls.js';
import { FEEL, FACES, LAYOUTS, PHONE_QUERY, MOTIONS } from '../config.js';
import { springK, stepSpring, cubicBezier, ringOffset } from './spring.js';
import { frame } from './frame.js';
import { createWriter } from './writer.js';

const DECKS = { mbti: MBTI, ennea: ENNEAGRAM };
// a 9-card deck is laid out twice round the ring so the fan runs to the screen edges like the 16-card one
const ring = (deck) => (DECKS[deck].length < 16 ? DECKS[deck].concat(DECKS[deck]) : DECKS[deck]);

// The soul wheel, outside React. Physics runs in a rAF loop (tick) with springs integrated at 240 Hz; each moving
// frame, frame() turns state into styles and the writer puts them straight on the elements. React re-renders
// only when the snapshot (deck, open, centre soul, deck-flip labels) changes. The loop sleeps when nothing moves
// and wakes on input.
export class WheelEngine {
  constructor() {
    this.mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.rm = this.mq.matches;
    this.phoneMq = window.matchMedia(PHONE_QUERY);
    this.layout = this.phoneMq.matches ? 'phone' : 'desk';
    this.L = LAYOUTS[this.layout];
    let motion = 'islandBounce';
    try { const m = localStorage.getItem('giveitasoul.motion'); if (MOTIONS[m]) motion = m; } catch (err) {}
    this.useMotion(motion);
    this.open = false;
    this.deck = 'mbti';
    this.key = '';
    this.snapshot = { open: false, deck: 'mbti', key: '', layout: this.layout, motion: this.motionName };
    this.listeners = new Set();
    this.p = { pos: this.rm ? 0 : -4, v: 0, target: 0, drag: null, moved: 0, open: 0, ov: 0, rest: 0, rv: 0, sv: 0, last: 0 };
    this.souls = ring('mbti');
    this.bez = cubicBezier(FEEL.fx1, FEEL.fy1, FEEL.fx2, FEEL.fy2);
    this.els = {};
    this.refs = {};
    this.faceEls = []; this.markEls = []; this.faceM = [];
    this.writer = createWriter();
    this.raf = 0;
    this.loop = (now) => {
      this.raf = 0;
      if (this.tick(now)) this.raf = requestAnimationFrame(this.loop);
      else this.sleep(now);
    };
  }

  // ---- React bridge -------------------------------------------------------------------------------------------

  subscribe = (fn) => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  getSnapshot = () => this.snapshot;
  emit() {
    this.snapshot = { open: this.open, deck: this.deck, key: this.key, layout: this.layout, motion: this.motionName };
    this.listeners.forEach((fn) => fn());
  }
  // a stable ref callback per element name
  bind(name) {
    return this.refs[name] || (this.refs[name] = (el) => { this.els[name] = el; });
  }
  faceRef(i) {
    return this.refs['face' + i] || (this.refs['face' + i] = (el) => { this.els['face' + i] = el; this.faceEls[i] = el; });
  }
  markRef(i) {
    return this.refs['mark' + i] || (this.refs['mark' + i] = (el) => { this.markEls[i] = el; });
  }
  frame() { return frame(this); }
  // React just wrote its own copy of the styles and may have swapped card artwork: forget what we wrote, write it again
  afterCommit() {
    this.writer.reset();
    this.writer.write(this.els, this.frame(), this.rm, this.handPattern);
    this.measureDue = true;
    this.wake();
  }

  mount() {
    this.onRm = () => { this.rm = this.mq.matches; this.writer.resetPause(); this.dirty = true; this.wake(); };
    this.onResize = () => { this.soulRect = null; this.rootRect = null; this.readExt(); this.measureDue = true; this.dirty = true; this.wake(); };
    this.onFonts = () => { this.measureDue = true; this.wake(); };
    // crossing the phone breakpoint swaps the artboard: forget the open card's pose and the hero word's measurements
    this.onLayout = () => {
      this.layout = this.phoneMq.matches ? 'phone' : 'desk';
      this.L = LAYOUTS[this.layout];
      this.pose = null; this.faceM = []; this.detH = 0; this.soulRect = null; this.rootRect = null;
      this.measureDue = true; this.dirty = true;
      this.emit();
      this.wake();
    };
    this.mq.addEventListener('change', this.onRm);
    this.phoneMq.addEventListener('change', this.onLayout);
    window.addEventListener('resize', this.onResize);
    if (document.fonts) { document.fonts.addEventListener('loadingdone', this.onFonts); document.fonts.ready.then(this.onFonts); }
    this.readExt();
    this.measureDue = true; this.dirty = true;
    this.wake();
    if (import.meta.env.DEV) window.__wheel = this;
  }
  unmount() {
    cancelAnimationFrame(this.raf); this.raf = 0;
    clearTimeout(this.wt); clearTimeout(this.replayT); clearTimeout(this.sleepT);
    this.mq.removeEventListener('change', this.onRm);
    this.phoneMq.removeEventListener('change', this.onLayout);
    window.removeEventListener('resize', this.onResize);
    if (document.fonts) document.fonts.removeEventListener('loadingdone', this.onFonts);
  }
  // how far the window reaches past the artboard (set by the page), so cards out there still count as on screen
  readExt() {
    const cs = this.els.root ? getComputedStyle(this.els.root) : null;
    this.ext = cs ? +cs.getPropertyValue('--ext') || 0 : 0;
    this.exty = cs ? +cs.getPropertyValue('--exty') || 0 : 0;
  }

  // ---- The loop -----------------------------------------------------------------------------------------------

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
  paint() {
    const f = this.frame();
    this.writer.write(this.els, f, this.rm, this.handPattern);
    if (f.key !== this.key) { this.key = f.key; this.emit(); }
  }

  // Advances every spring by the time since the last frame; paints if anything moved. Returns whether to keep looping.
  tick(now) {
    const p = this.p, cfg = this.feel, rm = this.rm, open = this.open;
    if (!p.last) p.last = now;
    const dt = Math.max(0, Math.min(0.05, (now - p.last) / 1000));
    p.last = now;
    // reduced motion: no overshoot anywhere
    const wheelS = springK(cfg.response, rm ? Math.max(1, cfg.damping) : cfg.damping);
    const openS = open ? springK(cfg.mResp, rm ? 1 : cfg.mDamp) : springK(cfg.mClose, rm ? 1 : cfg.mCloseDamp);
    const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;

    // open/close runs in two phases: the card lifts into the window (p.open), then the text column unfolds (p.col).
    // Closing folds the column first, then the window returns to the wheel.
    if (open !== this.lastOpen) {
      this.lastOpen = open;
      if (open) { this.openAt = now; this.phaseB = false; this.openB = false; this.openBAt = 0; } else { this.closeAt = now; this.phaseB = !!this.gCommit; this.gCommit = false; }
    }
    if (p.col == null) { p.col = 0; p.colv = 0; }
    if (!open && !this.phaseB && p.col < 0.4) this.phaseB = true;
    if (open && !this.openB && p.open > 0.62) { this.openB = true; this.openBAt = now; }
    const ot = open ? 1 : (this.phaseB ? 0 : 1);
    const ct = open ? (this.openB ? 1 : 0) : 0;
    const colS = open ? springK(0.42, 0.84) : springK(0.26, 0.9);
    const restS = springK(open ? cfg.mResp : cfg.mClose, 1);
    if (p.dy == null) { p.dy = 0; p.dyv = 0; }
    if (p.wdy == null) { p.wdy = 0; p.wdyv = 0; p.lift = 0; p.liftv = 0; p.liftT = 0; p.hov = 0; p.hovv = 0; }
    const dragS = springK(0.38, 0.82), gOn = !!(p.gd && p.gd.on);
    const tether = springK(0.17, 0.72), nud = springK(0.46, 0.6), hovS = springK(0.25, 0.9);

    // idle nudge: the centre card lifts a little when nobody has touched anything for a while
    const settled = !open && !p.drag && !p.gy && !p.gs && !this.swapPending && !(p.sink > 0.001) && p.v === 0 && p.open === 0 && p.rest === 0 && Math.abs(p.sv) < 0.01;
    if (settled && !rm && !this.learned && now - (this.lastInput || 0) > 2400 && now - (this.nudgeAt || 0) > 3600) { this.nudgeAt = now; p.liftT = 12; this.liftHold = now + 190; }
    if ((this.liftHold && now > this.liftHold) || !settled) { p.liftT = 0; this.liftHold = 0; }
    const hovT = (open && this.pillHover) || gOn ? 1 : 0;

    // deck swap: p.sink 0..1 sinks the fan; at the bottom the deck changes and it rises again
    if (p.sink == null) { p.sink = 0; p.sinkv = 0; p.sinkT = 0; p.tog = 0; p.togv = 0; }
    const curIdx = this.deck === 'mbti' ? 0 : 1;
    if (this.swapPending && p.sink > 0.9 && this.cs && this.cs.every((c) => c.s > 0.62)) {
      this.deck = this.deck === 'mbti' ? 'ennea' : 'mbti';
      this.souls = ring(this.deck); this.fv = null;
      this.cs = this.souls.map(() => ({ s: 1, v: 0 })); p.sink = 1;
      p.pos = -1.5; p.target = 0; p.v = 0;
      p.sinkT = 0; p.sinkv = 0; this.swapPending = false; this.swapAt = now; this.postSwap = true;
      this.emit();
    }
    const togT = this.swapPending ? 1 - curIdx : curIdx; // flips once the switch is committed, on its own spring
    const sinkS = p.sinkT ? springK(0.4, 0.95) : springK(0.62, 0.84), togS = springK(0.32, 0.86);

    for (let i = 0; i < n; i++) {
      if (!gOn && open) stepSpring(p, 'dy', 'dyv', 0, dragS, h);
      stepSpring(p, 'wdy', 'wdyv', p.dy, tether, h);
      stepSpring(p, 'lift', 'liftv', p.liftT, nud, h);
      stepSpring(p, 'hov', 'hovv', hovT, hovS, h);
      if (!p.gs) stepSpring(p, 'sink', 'sinkv', p.sinkT, sinkS, h);
      stepSpring(p, 'tog', 'togv', togT, togS, h);
      if (!p.drag) stepSpring(p, 'pos', 'v', p.target, wheelS, h);
      if (!p.gy && !gOn) {
        stepSpring(p, 'open', 'ov', ot, openS, h);
        stepSpring(p, 'rest', 'rv', ot, restS, h);
      }
      stepSpring(p, 'col', 'colv', ct, colS, h);
    }
    // settle: snap to the target once close enough, so "at rest" is exact
    if (!p.drag && Math.abs(p.v) < 0.002 && Math.abs(p.pos - p.target) < 0.0006) { p.pos = p.target; p.v = 0; }
    if (Math.abs(p.ov) < 0.002 && Math.abs(p.open - ot) < 0.0006) { p.open = ot; p.ov = 0; }
    if (Math.abs(p.rv) < 0.002 && Math.abs(p.rest - ot) < 0.0006) { p.rest = ot; p.rv = 0; }
    if (Math.abs(p.colv) < 0.002 && Math.abs(p.col - ct) < 0.0006) { p.col = ct; p.colv = 0; }
    if (open && !gOn && Math.abs(p.dyv) < 1 && Math.abs(p.dy) < 0.3) { p.dy = 0; p.dyv = 0; }
    if (!open && this.phaseB && p.open === 0 && p.ov === 0) { p.dy = 0; p.dyv = 0; p.wdy = 0; p.wdyv = 0; }
    if (Math.abs(p.wdyv) < 0.5 && Math.abs(p.wdy - p.dy) < 0.2) { p.wdy = p.dy; p.wdyv = 0; }
    if (!p.liftT && Math.abs(p.liftv) < 0.05 && Math.abs(p.lift) < 0.03) { p.lift = 0; p.liftv = 0; }
    if (Math.abs(p.hovv) < 0.002 && Math.abs(p.hov - hovT) < 0.002) { p.hov = hovT; p.hovv = 0; }
    if (!p.gs && Math.abs(p.sinkv) < 0.002 && Math.abs(p.sink - p.sinkT) < 0.0006) { p.sink = p.sinkT; p.sinkv = 0; if (p.sink === 0) this.postSwap = false; }
    if (Math.abs(p.togv) < 0.002 && Math.abs(p.tog - togT) < 0.0006) { p.tog = togT; p.togv = 0; }
    const liveV = p.drag ? p.drag.vel : p.v;
    p.sv += (liveV - p.sv) * Math.min(1, dt * 14);

    if (this.pendingOpen != null && !open) {
      const N = this.souls.length;
      if (((Math.round(p.pos) % N) + N) % N === this.pendingOpen) { this.pendingOpen = null; this.setOpen(true); }
    }
    const csMoving = this.stepChain(n, h);
    const fading = this.stepFade(dt);
    this.measure();
    const glowing = this.stepGlow(dt);

    const moving = p.drag || p.gy || p.gd || p.gs || csMoving || p.sink !== 0 || p.sinkv !== 0 || p.tog !== togT || this.swapPending || (this.swapAt && now - this.swapAt < 1500) || p.dy !== 0 || p.dyv !== 0 || p.wdy !== p.dy || p.lift !== 0 || p.liftT !== 0 || p.hov !== hovT || p.v !== 0 || p.ov !== 0 || p.rv !== 0 || p.colv !== 0 || (!open && !this.phaseB) || (open && !this.openB) || (this.openBAt && now - this.openBAt < 950) || now - (this.openAt || -1e9) < 950 || now - (this.closeAt || -1e9) < 250 || Math.abs(p.sv) > 0.001 || fading || glowing;
    // the pointer's heading keeps easing for a moment after it stops, so stay awake a little longer
    const busy = !!(moving || this.dirty || this.measureDue || now - (this.lastMove || -1e9) < 1000);
    if (moving || this.dirty) { this.dirty = false; this.paint(); }
    return busy;
  }

  // Each card hangs off its neighbour nearer the centre: a chain of springs, so the fan drapes and ripples when
  // the deck sinks. Returns whether any link is still moving.
  stepChain(n, h) {
    const p = this.p, N = this.souls.length;
    if (!this.cs || this.cs.length !== N) this.cs = Array.from({ length: N }, () => ({ s: 0, v: 0 }));
    const order = [];
    for (let i = 0; i < N; i++) { const d = ringOffset(i, p.pos, N); order.push({ i, d, ad: Math.abs(d) }); }
    order.sort((x, y) => x.ad - y.ad);
    order.forEach((o) => { o.par = o.ad < 0.5 ? -1 : (((o.i - Math.sign(o.d)) % N) + N) % N; o.k = springK(0.19 + 0.022 * Math.min(8, o.ad), this.rm ? 1 : 0.64); });
    for (let j = 0; j < n; j++) {
      for (const o of order) stepSpring(this.cs[o.i], 's', 'v', o.par < 0 ? (p.sink || 0) : this.cs[o.par].s, o.k, h);
    }
    let moving = false;
    for (const o of order) {
      const c = this.cs[o.i], tg = o.par < 0 ? (p.sink || 0) : this.cs[o.par].s;
      if (Math.abs(c.v) < 0.002 && Math.abs(c.s - tg) < 0.0006 && tg === (p.sink || 0) && !p.gs) { c.s = tg; c.v = 0; }
      if (c.s !== 0 || c.v !== 0) moving = true;
    }
    this.centreI = order[0].i;
    return moving;
  }

  // Side cards dim with distance, brightening quickly as they arrive and dimming slowly as they leave.
  stepFade(dt) {
    const N = this.souls.length, cfg = this.feel;
    if (!this.fv) this.fv = new Array(N).fill(1);
    let fading = false;
    for (let i = 0; i < N; i++) {
      const ft = this.bez(Math.min(1, Math.abs(ringOffset(i, this.p.pos, N)) / cfg.fadeRange));
      const tau = ft < this.fv[i] ? cfg.fadeIn : cfg.fadeOut;
      const kf = tau <= 0.005 ? 1 : 1 - Math.exp(-dt / tau);
      this.fv[i] += (ft - this.fv[i]) * kf;
      if (Math.abs(ft - this.fv[i]) > 0.001) fading = true; else this.fv[i] = ft;
    }
    return fading;
  }

  // Layout reads only when something could have changed them: mount, fonts, resize, or a React update.
  measure() {
    const due = this.measureDue;
    this.measureDue = false;
    if (this.faceEls.length && (due || !this.faceM.length)) {
      const M = this.faceEls.map((el, i) => { const mk = this.markEls[i]; return el && mk ? { w: el.offsetWidth, below: el.offsetHeight - mk.offsetTop, base: mk.offsetTop } : null; });
      if (M.length === FACES.length && M.every(Boolean)) { const changed = JSON.stringify(M) !== JSON.stringify(this.faceM); this.faceM = M; if (changed) { this.dirty = true; this.soulRect = null; } }
    }
    if (this.els.det && due) { const hh = this.els.det.offsetHeight; if (hh && Math.abs(hh - (this.detH || 0)) > 0.5) { this.detH = hh; this.dirty = true; } }
  }

  // The hero word follows the pointer's direction and warms as the pointer comes near; it stays neutral while the
  // pointer is over the cards or a card is open. Returns whether the word needs repainting.
  stepGlow(dt) {
    const p = this.p;
    if (!this.els.soul) return false;
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
    let near = !!(p.drag || p.gy || p.gd || this.open || Math.abs(p.open) > 0.01 || Math.abs(p.ov) > 0.01 || p.rest > 0.01 || (p.col || 0) > 0.01);
    if (!near && this.mx != null && this.els.root) {
      if (readRects || !this.rootRect) this.rootRect = this.els.root.getBoundingClientRect();
      const rr = this.rootRect;
      near = (this.my - rr.top) * this.L.W / rr.width > this.L.nearY;
    }
    this.suppress = near;
    if (near) target = 0;
    const prev = this.prox || 0;
    this.prox = prev + (target - prev) * (1 - Math.exp(-dt / 0.35));
    if (Math.abs(this.prox - target) < 0.002) this.prox = target;
    // the word only changes with prox and with the sector the pointer is in
    let glowing = this.prox !== prev;
    const sAx = this.ax == null ? 0 : this.ax, sAy = this.ay == null ? -1 : this.ay;
    let sDeg = Math.atan2(sAy, sAx) * 180 / Math.PI + 90; sDeg = ((sDeg % 360) + 360) % 360;
    const sKey = (this.mx == null || this.suppress ? 'x' : '') + Math.floor(sDeg / 360 * 9 + 0.5) % 9;
    if (sKey !== this.lastSector) { this.lastSector = sKey; glowing = true; }
    return glowing;
  }

  // ---- Actions ------------------------------------------------------------------------------------------------

  // open/close motion variant (see MOTIONS); the feel is FEEL with the variant's spring overrides
  useMotion(name) {
    this.motionName = name;
    this.motion = MOTIONS[name];
    this.feel = { ...FEEL, ...this.motion.feel };
  }
  // switch variant from the motion picker and replay the open so it can be compared
  setMotion = (name) => {
    if (!MOTIONS[name] || name === this.motionName) return;
    this.useMotion(name);
    try { localStorage.setItem('giveitasoul.motion', name); } catch (err) {}
    this.emit();
    clearTimeout(this.replayT);
    if (this.open) { this.setOpen(false); this.replayT = setTimeout(() => this.setOpen(true), 700); }
    else if (!this.swapPending && !this.p.drag) this.setOpen(true);
  };
  setOpen(v) {
    if (this.open === v) return;
    if (v) this.handPattern(this.els['card' + this.activeIndex()], this.els.art);
    this.open = v;
    this.emit();
    this.wake();
  }
  // closing by tap is ignored right after a drag-to-dismiss, whose release lands on the scrim
  close = () => { if (performance.now() - (this.gEnd || 0) < 350) return; this.setOpen(false); };
  step(by) { this.pendingOpen = null; this.p.target = Math.round(this.p.target) + by; this.dirty = true; this.wake(); }
  activeIndex() { const N = this.souls.length; return ((Math.round(this.p.pos) % N) + N) % N; }
  // The wheel card and the open window each draw the soul's pattern; hand the animation's time from one to the
  // other so the pattern carries on instead of restarting.
  handPattern = (fromEl, toEl) => {
    const a = fromEl && fromEl.querySelector('svg'), b = toEl && toEl.querySelector('svg');
    if (a && b && !this.rm) b.setCurrentTime(a.getCurrentTime());
  }
  // the card the wheel is heading for
  targetIndex() { const N = this.souls.length; return ((Math.round(this.p.target) % N) + N) % N; }
  focusCard(i) { const b = this.els['card' + i] && this.els['card' + i].querySelector('.slotbtn'); if (b) b.focus({ preventScroll: true }); }
  // bring card i to the centre by the shortest way round
  centre(i) { this.step(Math.round(ringOffset(i, Math.round(this.p.target), this.souls.length))); }
  // keyboard focus (Tab) spins the focused card to the centre, so Enter opens what the focus ring shows
  cardFocus(i, e) {
    if (this.open || !e.target.matches(':focus-visible')) return;
    if (i !== this.targetIndex()) this.centre(i);
  }
  prev = () => this.step(-1);
  next = () => this.step(1);
  pickDeck(to) {
    if (this.deck === to || this.swapPending || this.open) return;
    const p = this.p;
    this.swapPending = true; this.postSwap = false; p.sinkT = 1; p.sinkv = 1.2; this.dirty = true;
    this.wake();
  }
  cardClick(i) {
    const p = this.p, N = this.souls.length;
    if (p.moved > 6 || this.open || (p.sink || 0) > 0.01 || this.swapPending) return;
    if (i !== this.targetIndex()) { this.centre(i); return; }
    // it's the card the wheel is settling on: open now, or as soon as it reaches the centre
    if (i === ((Math.round(p.pos) % N) + N) % N) this.setOpen(true);
    else { this.pendingOpen = i; this.wake(); }
  }

  // ---- Gestures -----------------------------------------------------------------------------------------------
  // Horizontal drag spins the wheel. From rest, a vertical drag either lifts the centre card open (up) or sinks
  // the fan to switch decks (down). While open, dragging the window down dismisses it.

  // artboard pixels per screen pixel
  scale() { return this.L.W / (this.els.root ? this.els.root.getBoundingClientRect().width : this.L.W); }

  onPointerDown = (e) => {
    const p = this.p;
    this.pendingOpen = null;
    this.lastInput = performance.now();
    this.wake();
    if (this.open) {
      if (this.openB && p.col > 0.9) p.gd = { x0: e.clientX, y0: e.clientY, ly: e.clientY, lt: performance.now(), vel: 0, on: false };
      return;
    }
    p.drag = { x: e.clientX, y: e.clientY, pos: p.pos, lx: e.clientX, lt: performance.now(), vel: 0, axis: null };
    p.moved = 0; p.v = 0;
  };

  onPointerMove = (e) => {
    const p = this.p;
    this.mx = e.clientX; this.my = e.clientY; this.mxMoved = true; this.lastMove = performance.now();
    this.wake();
    if (this.open && this.els.root && this.pillPos) {
      const rr = this.els.root.getBoundingClientRect(), sc = this.L.W / rr.width;
      const hov = Math.abs((e.clientX - rr.left) * sc - this.pillPos.x) < 70 && Math.abs((e.clientY - rr.top) * sc - this.pillPos.y) < 26;
      if (hov !== !!this.pillHover) { this.pillHover = hov; this.dirty = true; }
    } else if (this.pillHover) { this.pillHover = false; }

    if (p.gd) {
      const g = p.gd, dy = e.clientY - g.y0, dx = Math.abs(e.clientX - g.x0);
      if (!g.on) {
        if (dx < 6 && Math.abs(dy) < 6) return;
        if (dy > 0 && dy > dx) { g.on = true; g.y0 = e.clientY - 6; g.ly = e.clientY; g.lt = performance.now(); }
        else { p.gd = null; return; }
      }
      const sc = this.scale();
      const tnow = performance.now(), gdt = Math.max(1, tnow - g.lt) / 1000;
      const raw = (e.clientY - g.y0) * sc;
      g.vel = g.vel * 0.25 + ((e.clientY - g.ly) * sc) / gdt * 0.75; g.ly = e.clientY; g.lt = tnow;
      // 1:1 down, rubber-band up; gentle resistance that builds past 260px
      p.dy = raw < 0 ? -40 * (1 - Math.exp(raw / 120)) : (raw < 260 ? raw : 260 + (raw - 260) * 0.45);
      p.dyv = 0;
      this.dirty = true;
      return;
    }
    if (p.gs) {
      const sc = this.scale(), SPAN = 1133;
      const tnow = performance.now(), gdt = Math.max(1, tnow - p.gs.lt) / 1000;
      const raw = (e.clientY - p.gs.y0) * sc;
      const dd = raw < 0 ? -20 * (1 - Math.exp(raw / 60)) : (raw < 220 ? raw : 220 + (raw - 220) * 0.4);
      p.gs.vel = p.gs.vel * 0.25 + ((e.clientY - p.gs.ly) * sc / SPAN) / gdt * 0.75; p.gs.ly = e.clientY; p.gs.lt = tnow;
      p.sink = dd / SPAN; p.sinkv = 0;
      this.dirty = true;
      return;
    }
    if (p.gy) {
      const sc = this.scale(), SPAN = 300;
      const tnow = performance.now(), gdt = Math.max(1, tnow - p.gy.lt) / 1000;
      let prog = (p.gy.y0 - e.clientY) * sc / SPAN;
      if (prog > 1) prog = 1 + (prog - 1) * 0.3;
      if (prog < 0) prog = prog * 0.25;
      p.gy.vel = p.gy.vel * 0.25 + ((p.gy.ly - e.clientY) * sc / SPAN) / gdt * 0.75;
      p.gy.ly = e.clientY; p.gy.lt = tnow;
      p.open = prog; p.ov = 0;
      p.rest = Math.max(0, Math.min(1, prog * 1.15)); p.rv = 0;
      this.dirty = true;
      return;
    }
    if (!p.drag) return;
    const dx = e.clientX - p.drag.x;
    if (!p.drag.axis) {
      const ddx = Math.abs(dx), ddy = e.clientY - p.drag.y;
      if (ddx < 6 && Math.abs(ddy) < 6) return;
      const onCard = Math.abs(p.pos - Math.round(p.pos)) < 0.25;
      if (Math.abs(ddy) > ddx && ddy < 0 && onCard) {
        p.target = Math.round(p.pos); p.v = 0;
        p.gy = { y0: p.drag.y, ly: e.clientY, lt: performance.now(), vel: 0 };
        p.drag = null; p.moved = 99; this.phaseB = true;
        return;
      }
      if (Math.abs(ddy) > ddx && ddy > 0 && onCard && !this.swapPending) {
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
    // screen pixels per card: shorter on phones, so a thumb flick covers a few cards
    const perCard = this.feel.dragPx * this.L.dragK;
    p.drag.vel = p.drag.vel * 0.3 + (-((e.clientX - p.drag.lx) / perCard) / dt) * 0.7;
    p.drag.lx = e.clientX; p.drag.lt = now;
    p.pos = p.drag.pos - dx / perCard;
  };

  // Release: each gesture projects where the finger's speed would carry it and commits or springs back.
  onPointerUp = () => {
    const p = this.p;
    this.wake();
    if (p.gs) {
      const v = performance.now() - p.gs.lt > 90 ? 0 : Math.max(-3, Math.min(4, p.gs.vel));
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
      const v = performance.now() - g.lt > 90 ? 0 : Math.max(-3000, Math.min(4000, g.vel));
      if (p.dy + v * 0.12 > 140 || v > 700) {
        // hand the finger's speed to the return trip: normalise px/s by the distance left to the wheel slot
        const dist = Math.max(60, Math.abs((this.slotDy || 118) - p.dy));
        const nv = Math.max(0, v) / dist * Math.sign((this.slotDy || 118) - p.dy);
        this.gCommit = true;
        p.ov = -Math.abs(nv) * 0.8; p.rv = -1.5;
        this.setOpen(false);
      } else {
        p.dyv = v;
      }
      this.dirty = true;
      return;
    }
    if (p.gy) {
      const v = performance.now() - p.gy.lt > 90 ? 0 : Math.max(-8, Math.min(12, p.gy.vel));
      p.gy = null;
      p.ov = v; p.rv = v;
      if (p.open + v * 0.15 > 0.42 || v > 2.4) { this.learned = true; this.setOpen(true); }
      else { this.phaseB = true; this.dirty = true; }
      return;
    }
    if (!p.drag) return;
    const vel = performance.now() - p.drag.lt > 80 ? 0 : p.drag.vel;
    p.drag = null;
    p.v = vel;
    // iOS-style momentum: land on the card the flick would coast to
    const d = this.feel.decel;
    p.target = Math.round(p.pos + (vel / 1000) * d / (1 - d));
  };

  onPointerLeave = () => { this.mx = null; this.my = null; this.lastMove = performance.now(); this.onPointerUp(); };

  onWheel = (e) => {
    const p = this.p;
    this.lastInput = performance.now();
    // a trackpad pinch arrives as ctrl+wheel: that's a zoom, not a spin
    if (this.open || e.ctrlKey) return;
    this.pendingOpen = null;
    // Firefox can report whole lines or pages instead of pixels
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 900 : 1;
    p.target += (e.deltaY + e.deltaX) * unit / this.feel.wheelPx;
    this.dirty = true;
    this.wake();
    clearTimeout(this.wt);
    this.wt = setTimeout(() => { p.target = Math.round(p.target); this.dirty = true; this.wake(); }, this.feel.snapMs);
  };

  onKeyDown = (e) => {
    this.lastInput = performance.now();
    this.wake();
    // Enter or Space on a focused card is that card's own click
    if ((e.key === 'Enter' || e.key === ' ') && e.target !== this.els.root) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      this.step(e.key === 'ArrowRight' ? 1 : -1);
      // keep keyboard focus on the card that is heading for the centre
      if (e.target !== this.els.root) this.focusCard(this.targetIndex());
    }
    else if (e.key === 'Enter' && !this.open) this.setOpen(true);
    else if (e.key === 'Escape' && this.open) this.setOpen(false);
  };
}
