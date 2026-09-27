import { renderer } from '../shaders/renderer.js';

const kebab = (k) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

// Writes a frame's styles to the named elements, touching only values that changed since the last write.
// reset() forgets what was written, for when React has just rendered its own copy.
export function createWriter() {
  let written = new Map();
  let paused = [], artPaused = null;

  const put = (el, props, attr) => {
    if (!el) return;
    let prev = written.get(el);
    if (!prev) written.set(el, prev = {});
    for (const k in props) {
      const v = String(props[k]);
      if (prev[k] === v) continue;
      prev[k] = v;
      if (attr) el.setAttribute(k, v); else el.style.setProperty(kebab(k), v);
    }
  };

  // Card patterns run only where someone can see them; reduced motion holds each on a still frame.
  const hold = (svg, still, rm) => {
    if (still) { svg.pauseAnimations(); if (rm) svg.setCurrentTime(1.2); } else svg.unpauseAnimations();
  };

  return {
    write(els, f, rm, handPattern) {
      for (const name in f.st) put(els[name], f.st[name]);
      put(els.pill, f.pillAttr, true);
      f.cardPause.forEach((want, i) => {
        // shader cards animate only at the centre
        const cv = els['card' + i] && els['card' + i].querySelector('.slotbtn canvas');
        if (cv) renderer().setDistance(cv, f.cardDist[i]);
        if (paused[i] === want) return;
        const el = els['card' + i];
        // shader cards: the shared renderer skips them while paused (it keeps one clock, so nothing to hand over)
        const canvas = el && el.querySelector('.slotbtn canvas');
        if (canvas) { paused[i] = want; renderer().setRunning(canvas, !want); return; }
        const svg = el && el.querySelector('.slotbtn svg');
        if (!svg) return;
        // the centre card coming back from under the open window carries on from the window's pattern
        if (!want && paused[i] === true && i === f.active && handPattern) handPattern(els.art, els['card' + i]);
        paused[i] = want;
        hold(svg, want, rm);
      });
      // the open window's shader copies (its card, and the one on the flip side) draw only while the window shows
      if (els.sheet) {
        const on = f.st.sheet.visibility === 'visible';
        els.sheet.querySelectorAll('canvas').forEach((cv) => { renderer().setDistance(cv, 0); renderer().setRunning(cv, on); });
      }
      if (artPaused !== rm) {
        const svg = els.art && els.art.querySelector('svg');
        if (svg) { artPaused = rm; hold(svg, rm, rm); }
      }
    },
    reset() { written = new Map(); paused = []; artPaused = null; },
    resetPause() { paused = []; artPaused = null; }
  };
}
