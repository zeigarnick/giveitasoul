import { FACES, GLOW, CARD_W, CARD_H } from '../config.js';
import { clamp01, ringOffset, springAt } from './spring.js';

// Everything that moves, as style objects keyed by element name. The same objects seed React's render, and the
// engine writes them to the elements on every moving frame. Also records the centre card's pose and the pill's
// position, which the gestures read.
export function frame(e) {
  const p = e.p;
  const restE = p.rest * (1 - 0.45 * clamp01((p.dy || 0) / 320) * clamp01(p.open));
  const ctx = {
    open: e.open,
    restE,
    op01: clamp01(restE),
    sheetOn: e.open || Math.abs(p.open) > 0.002 || Math.abs(p.ov) > 0.01 || p.rest > 0.002
  };
  const st = {};
  const fan = fanStyles(e, ctx, st);
  heroStyles(e, ctx, st);
  const pillAttr = sheetStyles(e, ctx, st);
  const deck = deckStyles(e, st);
  return { st, pillAttr, cardPause: fan.cardPause, cardDist: fan.cardDist, active: fan.active, ...deck, key: [fan.active, deck.from, deck.to, deck.plHint].join('|') };
}

// The fan: each card on a big hidden wheel. When a card opens, the others drop away; when the deck switches,
// the chain of springs in e.cs drapes them down.
function fanStyles(e, { open, restE, op01, sheetOn }, st) {
  const p = e.p, cfg = e.feel, N = e.souls.length;
  const pos = p.pos;
  const active = ((Math.round(pos) % N) + N) % N;
  const Lay = e.L, K = Lay.K, R = cfg.radius * K, PX = Lay.W / 2, PY = Lay.PYb + cfg.radius * K, STEP = cfg.spacing;
  const lean = e.rm ? 0 : Math.max(-1, Math.min(1, p.sv / 5)) * cfg.lean;
  const ext = e.ext || 0, exty = e.exty || 0;
  const cardPause = [], cardDist = [];
  for (let i = 0; i < N; i++) {
    const d = ringOffset(i, pos, N);
    const ad = Math.abs(d);
    cardDist[i] = ad;
    const near = Math.max(0, 1 - ad);
    const isActive = i === active;
    const angDeg = d * STEP + Math.sign(d) * Math.min(1, ad) * (cfg.gap * K / R) * 180 / Math.PI;
    const ang = angDeg * Math.PI / 180;
    const wx = PX + R * Math.sin(ang) - CARD_W / 2;
    const wy = PY - R * Math.cos(ang) - CARD_H / 2 - cfg.lift * K * near - (isActive ? (p.lift || 0) : 0);
    const wa = angDeg + lean;
    const dz = Math.min(1, ad / cfg.depthRange), ds = dz * dz * (3 - 2 * dz);
    const ws = K * (1 + (cfg.scale - 1) * near) * (1 - (1 - cfg.sideScale) * ds);
    const wry = Math.sign(d) * Math.min(1, ad) * cfg.turn;
    const f = e.fv ? e.fv[i] : e.bez(Math.min(1, ad / cfg.fadeRange));
    const wop = ad < N / 2 - 0.45 ? 1 : 0;
    // where the card goes while another one is open: the centre stays put, the rest drop and shrink
    let ox, oy, oa, os;
    if (isActive) { e.pose = { wx, wy, wa, ws, near }; ox = wx; oy = wy; oa = wa; os = ws; } else { ox = wx; oy = wy + cfg.drop; oa = wa; os = 0.92 * K; }
    const L = (a, b) => a + (b - a) * restE;
    const cst = e.cs && e.cs[i] ? e.cs[i] : { s: 0, v: 0 };
    const sl = Math.max(-0.08, Math.min(1, cst.s / 0.6)), slc = Math.max(0, sl);
    const x = L(wx, ox) - (wx + CARD_W / 2 - PX) * 0.22 * slc, y = L(wy, oy) + 680 * sl;
    const op = isActive ? (sheetOn ? 0 : wop) : wop * (1 - op01);
    st['card' + i] = {
      transform: 'translate(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px) rotate(' + (L(wa, oa) + Math.sign(d) * slc * 10 + Math.max(-6, Math.min(6, cst.v * 2.2)) * Math.sign(d)).toFixed(2) + 'deg) perspective(1400px) rotateY(' + L(wry, 0).toFixed(2) + 'deg)' + (isActive ? tilt(p) : '') + ' scale(' + (L(ws, os) * (1 - 0.08 * slc)).toFixed(4) + ')',
      opacity: op.toFixed(3),
      zIndex: isActive && op01 > 0.01 ? 120 : 100 - Math.round(ad * 10),
      filter: 'brightness(' + (1 - cfg.dim * f * (1 - op01)).toFixed(3) + ')',
      boxShadow: cardShadow(near, cfg)
    };
    st['glare' + i] = isActive ? glare(p) : NO_GLARE;
    // off the window, invisible, or under the full-strength scrim
    cardPause[i] = e.rm || op < 0.001 || op01 > 0.98 || x < -300 - ext || x > Lay.W + 20 + ext || y > Lay.H + 20 + exty;
  }
  return { active, cardPause, cardDist };
}

// Shadows are two layers (Interface Craft, Compositing: Layered Shadows): a tight, darker contact shadow where the
// card meets the page and a wide, soft ambient one. Both deepen the nearer a card is to the centre (near 0..1).
function shadowLayers(near, cfg) {
  return [
    { y: 1 + near, blur: 2 + 3 * near, spread: 0, a: cfg.shadow * (0.3 + 0.2 * near) },
    { y: Math.round(18 + 14 * near), blur: Math.round(34 + 20 * near), spread: -18, a: cfg.shadow * (0.35 + 0.65 * near) }
  ];
}
// the open window's two layers
const OPEN_SHADOW = [{ y: 2, blur: 6, spread: 0, a: 0.08 }, { y: 50, blur: 110, spread: -24, a: 0.32 }];
const shadowCss = (layers, digits) => layers.map((s) => '0 ' + s.y.toFixed(digits) + 'px ' + s.blur.toFixed(digits) + 'px ' + s.spread.toFixed(digits) + 'px rgba(20,18,16,' + s.a.toFixed(3) + ')').join(', ');
function cardShadow(near, cfg) {
  return shadowCss(shadowLayers(near, cfg), 0);
}
// The details window's shadow: the centre card's layers in window pixels (the card's are scaled by its transform)
// at m = 0, growing to the open window's at m = 1; `lift` deepens the ambient layer mid-flight.
function sheetShadow(P0, m, lift, cfg) {
  const k = P0.ws, L = (a, b) => a + (b - a) * m;
  const layers = shadowLayers(P0.near, cfg).map((s, j) => {
    const o = OPEN_SHADOW[j], up = j === 1 ? lift : 0;
    return { y: L(s.y * k, o.y) + 24 * up, blur: L(s.blur * k, o.blur) + 40 * up, spread: L(s.spread * k, o.spread), a: L(s.a, o.a) + 0.06 * up };
  });
  return shadowCss(layers, 1);
}

// Tilt toward the pointer (up to 8° across, 6° down) and a soft highlight that follows it (the v0 gift card's
// perspective tilt and radial glare). The glare is a pre-drawn spot moved with transform, so only transform and
// opacity change.
const tilt = (p) => (p.tx || p.ty ? ' rotateX(' + (-p.ty * 6).toFixed(2) + 'deg) rotateY(' + (p.tx * 8).toFixed(2) + 'deg)' : '');
const NO_GLARE = { opacity: '0.000', transform: 'translate(0px, 0px)' };
function glare(p) {
  if (!p.gl) return NO_GLARE;
  return { opacity: (0.55 * p.gl).toFixed(3), transform: 'translate(' + ((p.tx + 1) / 2 * CARD_W - 180).toFixed(1) + 'px, ' + ((p.ty + 1) / 2 * CARD_H - 180).toFixed(1) + 'px)' };
}

// The hero line fades up as a card opens. Its word "soul" takes the typeface the pointer points at and warms with
// proximity.
function heroStyles(e, { op01 }, st) {
  const ax = e.ax == null ? 0 : e.ax, ay = e.ay == null ? -1 : e.ay;
  let deg = Math.atan2(ay, ax) * 180 / Math.PI + 90; deg = ((deg % 360) + 360) % 360;
  const kn = Math.floor(deg / 360 * (FACES.length - 1) + 0.5) % (FACES.length - 1);
  const sel = (e.mx == null || e.suppress) ? 0 : kn + 1;
  const measured = e.faceM.length === FACES.length;
  const baseW = measured ? e.faceM[0].w : 150;
  const gc = GLOW[Math.floor(deg / 360 * GLOW.length + 0.5) % GLOW.length], prox = e.prox || 0;
  const color = 'rgb(' + [20, 18, 16].map((v, j) => Math.round(v + (gc[j] - v) * prox)).join(',') + ')';
  st.soul = { width: baseW.toFixed(1) + 'px' };
  FACES.forEach((_, i) => {
    const m = e.faceM[i];
    st['face' + i] = {
      bottom: (m ? (-m.below).toFixed(1) : -14) + 'px', color, opacity: i === sel ? 1 : 0,
      transformOrigin: '0 ' + (m ? m.base.toFixed(1) : 0) + 'px', transform: 'scale(' + (m && m.w ? (baseW / m.w).toFixed(4) : 1) + ')'
    };
  });
  const heroOp = (1 - op01).toFixed(3);
  st.hero = { opacity: heroOp, transform: 'translateY(' + (-16 * op01).toFixed(1) + 'px)' };
  st.bar = { opacity: heroOp };
}

// The details window morphs out of the centre card: p.open moves it, p.rest sizes it, p.col unfolds the text.
// On desktop the card sits left of the text; on phones it sits on top. Returns the pill's path attributes.
function sheetStyles(e, { open, restE, sheetOn }, st) {
  const p = e.p, cfg = e.feel;
  const m = p.open;
  const P0 = e.pose || { wx: 604, wy: 458, wa: 0, ws: 1, near: 1 };
  const W0 = CARD_W * P0.ws, H0 = CARD_H * P0.ws, cx0 = P0.wx + CARD_W / 2, cy0 = P0.wy + CARD_H / 2;
  const Lay = e.L, { row, PAD, GAP, ART } = Lay.sheet;
  const cardW = CARD_W * ART, cardH = CARD_H * ART;
  const textH = e.detH || 360;
  const W1 = row ? PAD + cardW + GAP + Lay.sheet.TEXTW + PAD : Lay.W - 24;
  const innerH = row ? Math.max(cardH, textH) : cardH + GAP + textH;
  const H1 = innerH + PAD * 2, cx1 = Lay.W / 2, cy1 = Lay.sheet.cy;
  // where the card art and the text land inside the open window
  const artX1 = row ? PAD : (W1 - cardW) / 2, artY1 = row ? PAD + (innerH - cardH) / 2 : PAD;
  const textX = row ? PAD + cardW + GAP : PAD, textY = row ? PAD + (innerH - textH) / 2 : PAD + cardH + GAP;
  const L = (a, b) => a + (b - a) * m;
  const mS = open ? m : clamp01(p.rest);
  const LS = (a, b) => a + (b - a) * mS;
  const col = p.col == null ? 0 : p.col;
  const LC = (a, b) => a + (b - a) * col;
  const WT = LC(cardW, W1), HT = LC(cardH, H1);
  const artXT = LC(0, artX1), artYT = LC(0, artY1), RT = LC(20 * ART, 28);
  e.slotDy = cy0 - cy1;
  const dyE = (p.wdy || 0) * clamp01(m), gsc = 1 - 0.07 * clamp01((p.wdy || 0) / 320) * clamp01(m);
  // Arc and lift (Interface Craft, Animations: Arc paths): mid-flight the card rises above the straight path, grows a
  // little and casts a deeper shadow, as if lifted off the page. Nothing at either end, so the hand-offs stay exact.
  const lift = e.rm ? 0 : 4 * clamp01(m) * (1 - clamp01(m));
  const W = LS(W0, WT), H = LS(H0, HT), cx = L(cx0, cx1), cy = L(cy0, cy1) + dyE - 22 * Lay.K * lift;
  const ls = 1 + 0.03 * lift;
  const sq = cfg.squash * Math.max(-1, Math.min(1, p.ov / 6)) * 0.06;

  // the pill: above the centre card on the wheel, floating just outside the window when open; it bends with speed
  const mc = clamp01(m);
  const pillX = cx, pillY = cy - H * gsc * ls / 2 - L(18, 14) + ((p.dy || 0) - (p.wdy || 0)) * mc;
  const tn0 = performance.now(), pr = e.pillPrev;
  if (!pr || tn0 - pr.t > 4) {
    const inst = pr ? (pillY - pr.y) / ((tn0 - pr.t) / 1000) : 0;
    e.pillV = (e.pillV || 0) * 0.6 + (Math.abs(inst) < 6000 ? inst : 0) * 0.4;
    e.pillPrev = { y: pillY, t: tn0 };
  }
  const hv = clamp01(p.hov || 0);
  const pwid = L(34, 44) + 10 * hv;
  const bend = Math.max(-9, Math.min(9, (e.pillV || 0) / 70)) - 8 * clamp01((p.lift || 0) / 12) * (1 - mc);
  e.pillPos = { x: pillX, y: pillY };
  const wheelF = sheetOn ? 1 : clamp01(1 - Math.abs(p.pos - Math.round(p.pos)) * 5) * clamp01(1 - Math.abs(p.sv) * 1.5);
  const pillAttr = {
    d: 'M' + (pillX - pwid / 2).toFixed(1) + ' ' + pillY.toFixed(1) + 'L' + pillX.toFixed(1) + ' ' + (pillY + bend).toFixed(1) + 'L' + (pillX + pwid / 2).toFixed(1) + ' ' + pillY.toFixed(1),
    'stroke-opacity': ((L(0.36, 0.24) + 0.28 * hv) * wheelF * (1 - clamp01((p.sink || 0) * 6))).toFixed(3)
  };

  const vis = sheetOn ? 'visible' : 'hidden', pe = open ? 'auto' : 'none';
  // frosted backdrop, with saturation lifted as it blurs so it reads richer, not greyer (Compositing: Backdrop Filters)
  const blur = 'blur(' + (cfg.blur * clamp01(restE)).toFixed(2) + 'px) saturate(' + (1 + 0.4 * clamp01(restE)).toFixed(3) + ')';
  st.scrim = { background: 'rgba(244,240,232,' + (cfg.tint * clamp01(restE)).toFixed(3) + ')', backdropFilter: blur, WebkitBackdropFilter: blur, pointerEvents: pe, visibility: vis };
  st.sheet = {
    visibility: vis, width: Math.max(1, W).toFixed(1) + 'px', height: Math.max(1, H).toFixed(1) + 'px',
    // carries the card's tilt as it lifts, so a tilted card opens without a jump
    transform: 'translate(' + (cx - W / 2).toFixed(1) + 'px, ' + (cy - H / 2).toFixed(1) + 'px) rotate(' + L(P0.wa, 0).toFixed(2) + 'deg)' + (p.tx || p.ty ? ' perspective(1400px)' + tilt(p) : '') + ' scale(' + ((1 + sq) * gsc * ls).toFixed(4) + ', ' + ((1 - sq) * gsc * ls).toFixed(4) + ')',
    borderRadius: LS(20 * P0.ws, RT).toFixed(1) + 'px',
    // starts as exactly the centre card's shadow (scaled like the card), so handing back to the card is seamless
    boxShadow: sheetShadow(P0, clamp01(m), lift, cfg) + ', 0 0 0 0.5px rgba(20,18,16,' + (0.1 * clamp01(m)).toFixed(3) + ')',
    pointerEvents: pe
  };
  st.art = { left: LS(0, artXT).toFixed(1) + 'px', top: LS(0, artYT).toFixed(1) + 'px', transform: 'scale(' + LS(P0.ws, ART).toFixed(4) + ')', boxShadow: '0 18px 40px -22px rgba(20,18,16,' + (0.35 * clamp01(m)).toFixed(3) + ')' };
  st.artGlare = glare(p);
  st.det = { left: Math.round(textX) + 'px', top: Math.round(textY) + 'px' };

  textStyles(e, open, st);
  return pillAttr;
}

// The details text arrives one line after another once the window has unfolded, and leaves as it folds.
// "rise": lines ease up 10px out of a blur. "spring": lines blend in from a little smaller, out of a blur, on a
// spring, and shrink back into the window on close (the Dynamic Island morph).
function textStyles(e, open, st) {
  const p = e.p, T = e.motion.text, X = e.motion.exit;
  const colF = clamp01((p.col - 0.55) / 0.45);
  for (let i = 0; i < 5; i++) {
    const tn = performance.now();
    let k;
    if (open) {
      const t = e.openB ? tn - e.openBAt - T.delay - i * T.stagger : -1;
      k = T.kind === 'rise' ? 1 - Math.pow(1 - clamp01(t / T.dur), 3) : (t > 0 ? springAt(t / 1000, T.response, T.damping) : 0);
    } else k = Math.min(1 - clamp01((tn - (e.closeAt || 0)) / X.dur), colF);
    if (T.kind === 'rise') {
      st['d' + i] = { opacity: k.toFixed(3), transform: 'translateY(' + ((1 - k) * T.rise).toFixed(1) + 'px)', filter: 'blur(' + ((1 - k) * T.blur).toFixed(2) + 'px)', transformOrigin: '50% 50%' };
    } else {
      const s0 = open ? T.scale : X.scale, b0 = open ? T.blur : X.blur;
      st['d' + i] = { opacity: clamp01(k).toFixed(3), transform: 'scale(' + (s0 + (1 - s0) * k).toFixed(4) + ')', filter: 'blur(' + (Math.max(0, 1 - k) * b0).toFixed(2) + 'px)', transformOrigin: '0% 50%' };
    }
    if (i === 0) st.closeBtn = { opacity: clamp01(k).toFixed(3) };
  }
}

// The MBTI/Enneagram toggle and the rolodex flip between deck names, driven by the centre card's own spring:
// the first half while it sinks, the second half as the new centre lands.
function deckStyles(e, st) {
  const p = e.p, deck = e.deck, open = e.open;
  const other = deck === 'mbti' ? 'ennea' : 'mbti';
  const W0 = e.L.tgW0, W1 = e.L.tgW1, t = p.tog || 0;
  st.toggle = { opacity: (1 - 0.6 * clamp01(p.rest || 0)).toFixed(3), pointerEvents: open ? 'none' : 'auto' };
  st.thumb = { left: (3 + W0 * t).toFixed(1) + 'px', width: (W0 + (W1 - W0) * t).toFixed(1) + 'px' };
  st.opt0 = { color: t < 0.5 ? '#141210' : '#6B6358' };
  st.opt1 = { color: t >= 0.5 ? '#141210' : '#6B6358' };
  const cc = e.cs && e.cs[e.centreI] ? e.cs[e.centreI] : { s: 0, v: 0 };
  const cl = cc.s / 0.6;
  let prog, o;
  if (!e.postSwap) { prog = 0.5 * Math.min(1.08, Math.max(0, cl)); o = clamp01(cl * 3); }
  else { const r = 1 - Math.min(1, cl); prog = 0.5 + 0.5 * r; o = 1 - clamp01((r - 0.8) / 0.2); }
  const from = e.postSwap ? other : deck, to = e.postSwap ? deck : other;
  // the front card tips forward on its bottom hinge as the fan sinks; the next card is revealed behind it
  const ang = e.postSwap ? 90 + 90 * clamp01(prog * 2 - 1) : 180 * prog;
  const rev = e.postSwap ? 1 : clamp01((ang - 30) / 60);
  st.flip = { opacity: o.toFixed(3), filter: 'blur(' + (8 * (1 - o)).toFixed(2) + 'px)' };
  st.hint = { opacity: p.gs ? 1 : 0 };
  st.back = { transform: 'translateY(' + (-10 * (1 - rev)).toFixed(2) + 'px) scale(' + (0.9 + 0.1 * rev).toFixed(4) + ')', opacity: rev.toFixed(3), filter: 'blur(' + (10 * (1 - rev)).toFixed(2) + 'px)' };
  st.front = { transform: 'rotateX(' + (-ang).toFixed(2) + 'deg)', opacity: (1 - clamp01((ang - 35) / 50)).toFixed(3), filter: 'blur(' + (10 * clamp01((ang - 15) / 70)).toFixed(2) + 'px)' };
  const plHint = (p.sink || 0) > 0.14 || e.swapPending ? 'RELEASE TO SWITCH' : 'PULL DOWN TO SWITCH';
  return { from, to, plHint };
}
