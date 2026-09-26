import { FEEL, FACES, GLOW, CARD_W, CARD_H } from '../config.js';
import { clamp01, ringOffset } from './spring.js';

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
  return { st, pillAttr, cardPause: fan.cardPause, active: fan.active, ...deck, key: [fan.active, deck.from, deck.to, deck.plHint].join('|') };
}

// The fan: each card on a big hidden wheel. When a card opens, the others drop away; when the deck switches,
// the chain of springs in e.cs drapes them down.
function fanStyles(e, { open, restE, op01, sheetOn }, st) {
  const p = e.p, cfg = FEEL, N = e.souls.length;
  const pos = p.pos;
  const active = ((Math.round(pos) % N) + N) % N;
  // K sizes the whole fan (cards, radius, gap, lift) together, so smaller cards keep the same rhythm
  const K = 0.86, R = cfg.radius * K, PX = 720, PY = 616 + cfg.radius * K, STEP = cfg.spacing;
  const lean = e.rm ? 0 : Math.max(-1, Math.min(1, p.sv / 5)) * cfg.lean;
  const ext = e.ext || 0, exty = e.exty || 0;
  const cardPause = [];
  for (let i = 0; i < N; i++) {
    const d = ringOffset(i, pos, N);
    const ad = Math.abs(d);
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
    if (isActive) { e.pose = { wx, wy, wa, ws }; ox = wx; oy = wy; oa = wa; os = ws; } else { ox = wx; oy = wy + cfg.drop; oa = wa; os = 0.92 * K; }
    const L = (a, b) => a + (b - a) * restE;
    const cst = e.cs && e.cs[i] ? e.cs[i] : { s: 0, v: 0 };
    const sl = Math.max(-0.08, Math.min(1, cst.s / 0.6)), slc = Math.max(0, sl);
    const x = L(wx, ox) - (wx + CARD_W / 2 - PX) * 0.22 * slc, y = L(wy, oy) + 680 * sl;
    const op = isActive ? (sheetOn ? 0 : wop) : wop * (1 - op01);
    st['card' + i] = {
      transform: 'translate(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px) rotate(' + (L(wa, oa) + Math.sign(d) * slc * 10 + Math.max(-6, Math.min(6, cst.v * 2.2)) * Math.sign(d)).toFixed(2) + 'deg) perspective(1400px) rotateY(' + L(wry, 0).toFixed(2) + 'deg) scale(' + (L(ws, os) * (1 - 0.08 * slc)).toFixed(4) + ')',
      opacity: op.toFixed(3),
      zIndex: isActive && op01 > 0.01 ? 120 : 100 - Math.round(ad * 10),
      filter: 'brightness(' + (1 - cfg.dim * f * (1 - op01)).toFixed(3) + ')',
      boxShadow: '0 ' + Math.round(18 + 14 * near) + 'px ' + Math.round(34 + 20 * near) + 'px -18px rgba(20,18,16,' + (cfg.shadow * (0.35 + 0.65 * near)).toFixed(3) + ')'
    };
    // off the window, invisible, or under the full-strength scrim
    cardPause[i] = e.rm || op < 0.001 || op01 > 0.98 || x < -300 - ext || x > 1460 + ext || y > 920 + exty;
  }
  return { active, cardPause };
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

// The details window morphs out of the centre card: p.open moves it, p.rest sizes it, p.col unfolds the text
// column. Returns the pill's path attributes.
function sheetStyles(e, { open, restE, sheetOn }, st) {
  const p = e.p, cfg = FEEL;
  const m = p.open;
  const P0 = e.pose || { wx: 604, wy: 458, wa: 0, ws: 1 };
  const W0 = CARD_W * P0.ws, H0 = CARD_H * P0.ws, cx0 = P0.wx + CARD_W / 2, cy0 = P0.wy + CARD_H / 2;
  const PAD = 40, GAP = 40, TEXTW = 400, ART = 1.2;
  const cardW = CARD_W * ART, cardH = CARD_H * ART;
  const textH = e.detH || 360;
  const innerH = Math.max(cardH, textH);
  const W1 = PAD + cardW + GAP + TEXTW + PAD, H1 = innerH + PAD * 2, cx1 = 720, cy1 = 470;
  const L = (a, b) => a + (b - a) * m;
  const mS = open ? m : clamp01(p.rest);
  const LS = (a, b) => a + (b - a) * mS;
  const col = p.col == null ? 0 : p.col;
  const LC = (a, b) => a + (b - a) * col;
  const artY1 = PAD + (innerH - cardH) / 2;
  const WT = LC(cardW, W1), HT = LC(cardH, H1);
  const artXT = LC(0, PAD), artYT = LC(0, artY1), RT = LC(20 * ART, 28);
  e.slotDy = cy0 - cy1;
  const dyE = (p.wdy || 0) * clamp01(m), gsc = 1 - 0.07 * clamp01((p.wdy || 0) / 320) * clamp01(m);
  const W = LS(W0, WT), H = LS(H0, HT), cx = L(cx0, cx1), cy = L(cy0, cy1) + dyE;
  const sq = cfg.squash * Math.max(-1, Math.min(1, p.ov / 6)) * 0.06;

  // the pill: above the centre card on the wheel, floating just outside the window when open; it bends with speed
  const mc = clamp01(m);
  const pillX = cx, pillY = cy - H * gsc / 2 - L(18, 14) + ((p.dy || 0) - (p.wdy || 0)) * mc;
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
  const blur = 'blur(' + (cfg.blur * clamp01(restE)).toFixed(2) + 'px)';
  st.scrim = { background: 'rgba(244,240,232,' + (cfg.tint * clamp01(restE)).toFixed(3) + ')', backdropFilter: blur, WebkitBackdropFilter: blur, pointerEvents: pe, visibility: vis };
  st.sheet = {
    visibility: vis, width: Math.max(1, W).toFixed(1) + 'px', height: Math.max(1, H).toFixed(1) + 'px',
    transform: 'translate(' + (cx - W / 2).toFixed(1) + 'px, ' + (cy - H / 2).toFixed(1) + 'px) rotate(' + L(P0.wa, 0).toFixed(2) + 'deg) scale(' + ((1 + sq) * gsc).toFixed(4) + ', ' + ((1 - sq) * gsc).toFixed(4) + ')',
    borderRadius: LS(20 * P0.ws, RT).toFixed(1) + 'px',
    boxShadow: '0 ' + Math.round(L(24, 50)) + 'px ' + Math.round(L(40, 110)) + 'px -24px rgba(20,18,16,' + L(0.25, 0.32).toFixed(3) + '), 0 0 0 0.5px rgba(20,18,16,' + (0.1 * clamp01(m)).toFixed(3) + ')',
    pointerEvents: pe
  };
  st.art = { left: LS(0, artXT).toFixed(1) + 'px', top: LS(0, artYT).toFixed(1) + 'px', transform: 'scale(' + LS(P0.ws, ART).toFixed(4) + ')', boxShadow: '0 18px 40px -22px rgba(20,18,16,' + (0.35 * clamp01(m)).toFixed(3) + ')' };
  st.det = { left: Math.round(PAD + cardW + GAP) + 'px', top: Math.round(PAD + (innerH - textH) / 2) + 'px' };

  // the details text rises in, one line after another, once the window has unfolded
  const colF = clamp01((p.col - 0.55) / 0.45);
  for (let i = 0; i < 5; i++) {
    const tn = performance.now();
    let k;
    if (open) { const q = e.openB ? clamp01((tn - e.openBAt - 120 - i * 50) / 420) : 0; k = 1 - Math.pow(1 - q, 3); }
    else k = Math.min(1 - clamp01((tn - (e.closeAt || 0)) / 110), colF);
    st['d' + i] = { opacity: k.toFixed(3), transform: 'translateY(' + ((1 - k) * 10).toFixed(1) + 'px)', filter: 'blur(' + ((1 - k) * 4).toFixed(2) + 'px)' };
    if (i === 0) st.closeBtn = { opacity: k.toFixed(3) };
  }
  return pillAttr;
}

// The MBTI/Enneagram toggle and the rolodex flip between deck names, driven by the centre card's own spring:
// the first half while it sinks, the second half as the new centre lands.
function deckStyles(e, st) {
  const p = e.p, deck = e.deck, open = e.open;
  const other = deck === 'mbti' ? 'ennea' : 'mbti';
  const W0 = 112, W1 = 148, t = p.tog || 0;
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
