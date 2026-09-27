import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import SoulCard from '../SoulCard.jsx';
import { SOUL_FILES, soulSlug, soulPrompt } from '../../../lib/souls.js';

// "Use this soul": the card in the open window turns over, growing across the window as it turns, and its back is
// the SOUL.md. It runs on its own spring on top of the wheel engine: it reads where the engine left the card art,
// hides that art while it's turned, and hands it back when it's flipped home (or the window closes).

const OPEN = { response: 0.62, damping: 0.8 }, BACK = { response: 0.52, damping: 0.88 };
const spring = ({ response, damping }) => ({ k: Math.pow((2 * Math.PI) / response, 2), c: (4 * Math.PI * damping) / response });
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try {
    const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok;
  } catch (e) { return false; }
}

// SOUL.md -> blocks for reading (Copy wraps it in a note to the agent; Download is the raw file)
function toBlocks(md) {
  const out = [];
  for (const line of md.split('\n')) {
    if (!line.trim() || line.startsWith('# ')) continue;
    if (line.startsWith('## ')) out.push({ t: 'h', x: line.slice(3) });
    else if (line.startsWith('> ')) out.push({ t: 'q', x: line.slice(2) });
    else if (line.startsWith('- ')) { const m = line.slice(2).match(/^\*\*(.+?)\*\*\s*(.*)$/); out.push(m ? { t: 'li', b: m[1], x: m[2] } : { t: 'li', x: line.slice(2) }); }
    else out.push({ t: 'p', x: line });
  }
  return out;
}

const Arrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></svg>
);
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M5 20h14" /></svg>
);
const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
);

export function FlipFile({ engine, soul, L, flipped, onBack }) {
  const { row, ART } = L.sheet;
  const slug = soulSlug(soul.name);
  const md = SOUL_FILES[slug] || '';
  const blocks = useMemo(() => toBlocks(md), [md]);
  const page = `/souls/${slug}/`;
  const panel = useRef(null), rotor = useRef(null), frontFace = useRef(null), front = useRef(null), backFace = useRef(null), backInner = useRef(null), copyBtn = useRef(null);
  const s = useRef({ p: 0, v: 0, raf: 0, last: 0, from: null, to: null });
  const [done, setDone] = useState('');
  const [more, setMore] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => { clearTimeout(timer.current); cancelAnimationFrame(s.current.raf); }, []);

  const cardW = 232 * ART, cardH = 324 * ART;

  // write the flip's current state straight to the elements (no React render per frame)
  const apply = () => {
    const st = s.current, els = engine.els, p = st.p;
    if (!panel.current || !st.from) return;
    const g = smooth((p - 0.25) / 0.75), f = st.from, t = st.to;
    const w = lerp(f.w, t.w, g), h = lerp(f.h, t.h, g);
    const on = p > 0.001;
    Object.assign(panel.current.style, {
      // 'inherit', never 'visible': a child set to visible shows even inside a hidden parent, so the flip (and its
      // copy of the card) would stay on screen after flipping home or while the window closes
      visibility: on ? 'inherit' : 'hidden',
      left: lerp(f.x, t.x, g) + 'px', top: lerp(f.y, t.y, g) + 'px', width: w + 'px', height: h + 'px'
    });
    rotor.current.style.transform = `rotateY(${(180 * p).toFixed(2)}deg)`;
    front.current.style.left = (row ? 0 : (w - cardW) / 2) + 'px';
    // the back's content is laid out once at the final size and only revealed as the card grows, so its text never
    // re-wraps mid-flip; it fades in once the card is nearly full size
    Object.assign(backInner.current.style, { width: t.w + 'px', height: t.h + 'px', left: (row ? 0 : (w - t.w) / 2) + 'px' });
    const b = clamp01((p - 0.72) / 0.24);
    backFace.current.style.setProperty('--in', b.toFixed(3));
    // show exactly one face: iOS Safari doesn't always honour backface-visibility for the card's canvas, which let
    // the front card flicker through the back mid-turn
    const backShows = Math.abs(((180 * p) % 360 + 360) % 360 - 180) < 90;
    backFace.current.style.visibility = backShows ? 'inherit' : 'hidden';
    frontFace.current.style.visibility = backShows ? 'hidden' : 'inherit';
    const a = clamp01(p / 0.45);
    if (els.sheet) els.sheet.classList.toggle('is-flipping', on);
    if (els.det) {
      if (on) { els.det.style.opacity = (1 - a).toFixed(3); els.det.style.filter = a > 0.01 ? `blur(${(5 * a).toFixed(2)}px)` : ''; }
      else { els.det.style.removeProperty('opacity'); els.det.style.removeProperty('filter'); }
    }
  };

  const measure = () => {
    const els = engine.els;
    if (!els.art || !els.sheet) return false;
    const sw = els.sheet.offsetWidth, sh = els.sheet.offsetHeight;
    const x = els.art.offsetLeft, y = els.art.offsetTop;
    s.current.from = { x, y, w: cardW, h: cardH };
    // desktop: the card widens across the window at its own height; phone: it fills the window, 10px in
    s.current.to = row ? { x, y, w: sw - 2 * x, h: cardH } : { x: 10, y: 10, w: sw - 20, h: sh - 20 };
    return true;
  };

  useLayoutEffect(() => {
    const st = s.current;
    if (flipped && st.p === 0 && !measure()) return;
    if (!st.from) return;
    const target = flipped ? 1 : 0, sp = spring(flipped ? OPEN : BACK);
    cancelAnimationFrame(st.raf);
    if (engine.rm) { st.p = target; st.v = 0; apply(); return; }
    st.last = 0;
    const run = (now) => {
      const dt = Math.min(0.05, st.last ? (now - st.last) / 1000 : 1 / 60); st.last = now;
      const n = Math.max(1, Math.ceil(dt * 240)), hh = dt / n;
      for (let i = 0; i < n; i++) { const acc = -sp.k * (st.p - target) - sp.c * st.v; st.v += acc * hh; st.p += st.v * hh; }
      const still = Math.abs(st.v) < 0.0015 && Math.abs(st.p - target) < 0.0005;
      if (still) { st.p = target; st.v = 0; }
      apply();
      if (!still) st.raf = requestAnimationFrame(run);
      else if (target === 1 && copyBtn.current) copyBtn.current.focus({ preventScroll: true });
    };
    st.raf = requestAnimationFrame(run);
  }, [flipped]);

  // the window closing (scrim, Esc, pull down) or a new soul: drop the flip at once so the card art flies home
  useEffect(() => {
    if (engine.open) return;
    const st = s.current; cancelAnimationFrame(st.raf); st.p = 0; st.v = 0; apply(); setMore(false);
  }, [engine.open]);
  useEffect(() => { const st = s.current; cancelAnimationFrame(st.raf); st.p = 0; st.v = 0; apply(); setMore(false); }, [soul.name]);

  const flash = (what) => { setDone(what); clearTimeout(timer.current); timer.current = setTimeout(() => setDone(''), what === 'file' ? 2300 : 1600); };
  const copyFile = async () => { if (await copyText(soulPrompt(soul.name, md))) flash('file'); };
  const copyLink = async () => { if (await copyText(`${location.origin}${page}`)) flash('link'); };
  const download = () => {
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
    const a = document.createElement('a'); a.href = url; a.download = `${slug}.md`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash('download');
  };
  const stop = (e) => e.stopPropagation();
  const back = () => { setMore(false); onBack(); };
  const note = done === 'link' ? 'Link copied' : done === 'download' ? `Saved ${slug}.md` : '';

  return (
    <div ref={panel} className={'flip' + (row ? ' is-row' : ' is-stack')} style={{ visibility: 'hidden' }} aria-hidden={!flipped}>
      <div ref={rotor} className="flip-rotor">
        <div ref={frontFace} className="flip-front">
          <div ref={front} className="flip-front-card" style={{ width: cardW + 'px', height: cardH + 'px' }}>
            <div style={{ width: '232px', height: '324px', transformOrigin: '0 0', transform: `scale(${ART})` }}><SoulCard s={soul} /></div>
          </div>
        </div>
        <div ref={backFace} className="flip-back" style={{ '--soul-bg': soul.bg, '--soul-fg': soul.fg }}>
          <div ref={backInner} className="flip-back-inner">
          <div className="flip-strip">
            <div className="flip-title">
              <span className="flip-name">{soul.name}</span>
              <span className="flip-sub">{`SOUL.md · ${soul.anchor}`}</span>
            </div>
            <a href={page} className="flip-page" tabIndex={flipped ? 0 : -1}>Soul page ↗</a>
          </div>
          <div className="flip-body" onPointerDown={stop} onWheel={stop} tabIndex={flipped ? 0 : -1} aria-label={`${soul.name} SOUL.md`}>
            {blocks.map((bl, i) =>
              bl.t === 'h' ? <h3 key={i} className="md-h">{bl.x}</h3>
              : bl.t === 'q' ? <p key={i} className="md-q">{bl.x}</p>
              : bl.t === 'li' ? <p key={i} className="md-li">{bl.b ? <b>{bl.b}</b> : null}{bl.b ? ' ' : ''}{bl.x}</p>
              : <p key={i} className="md-p">{bl.x}</p>
            )}
          </div>
          <div className="flip-dock">
            <span className="flip-note" aria-live="polite">{note}</span>
            <div className={'flip-bar' + (done === 'file' ? ' is-done' : '')}>
              <button type="button" className="flip-round flip-side is-left" onClick={back} aria-label="Back" tabIndex={flipped ? 0 : -1}><Arrow /></button>
              <button ref={copyBtn} type="button" className="flip-copy" onClick={copyFile} tabIndex={flipped ? 0 : -1}>
                <span className="flip-copy-label">Copy SOUL.md</span>
                <span className="flip-copy-done" aria-hidden={done !== 'file'}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flip-check"><circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.18)" /><path d="M7 12.5l3.2 3.2L17 9" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span className="flip-copy-msg">Copied. Paste it into your agent.</span>
                </span>
              </button>
              {row ? (
                <div className="flip-side is-right flip-extras">
                  <button type="button" className="flip-pillbtn" onClick={download} tabIndex={flipped ? 0 : -1}><DownloadIcon />Download</button>
                  <button type="button" className="flip-pillbtn" onClick={copyLink} tabIndex={flipped ? 0 : -1}><LinkIcon />Copy link</button>
                </div>
              ) : (
                <button type="button" className="flip-round flip-side is-right" onClick={() => setMore(!more)} aria-label="More options" aria-expanded={more} tabIndex={flipped ? 0 : -1}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
                </button>
              )}
            </div>
            {!row && (
              <div className={'flip-more' + (more ? ' is-open' : '')}>
                <button type="button" className="flip-pillbtn" onClick={download} tabIndex={more ? 0 : -1}><DownloadIcon />Download .md</button>
                <button type="button" className="flip-pillbtn" onClick={copyLink} tabIndex={more ? 0 : -1}><LinkIcon />Copy link</button>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
