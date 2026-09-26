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
    write(els, f, rm) {
      for (const name in f.st) put(els[name], f.st[name]);
      put(els.pill, f.pillAttr, true);
      f.cardPause.forEach((want, i) => {
        if (paused[i] === want) return;
        const svg = els['card' + i] && els['card' + i].querySelector('svg');
        if (!svg) return;
        paused[i] = want;
        hold(svg, want, rm);
      });
      if (artPaused !== rm) {
        const svg = els.art && els.art.querySelector('svg');
        if (svg) { artPaused = rm; hold(svg, rm, rm); }
      }
    },
    reset() { written = new Map(); paused = []; artPaused = null; },
    resetPause() { paused = []; artPaused = null; }
  };
}
