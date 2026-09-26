import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import SoulCard from '../SoulCard.jsx';
import { SOUL_FILES, soulSlug } from '../../../lib/souls.js';
import './soulfile.css';

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try {
    const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok;
  } catch (e) { return false; }
}

// The open soul: the scrim behind it, the pill handle above it, and the window that morphs out of the centre card
// with the card on one side and what the soul says and does on the other.
export function DetailsSheet({ engine, st, pill, soul, L }) {
  const { row, PAD, TEXTW } = L.sheet;
  const textW = row ? TEXTW : L.W - 24 - 2 * PAD;
  // 'about' shows what the soul is like; 'file' shows its SOUL.md with copy / download / link
  const [view, setView] = useState('about');
  const [done, setDone] = useState('');
  const timer = useRef(0);
  useEffect(() => { if (!engine.open) setView('about'); }, [engine.open]);
  useEffect(() => { setView('about'); }, [soul.name]);
  useEffect(() => () => clearTimeout(timer.current), []);
  // switching views swaps the elements the engine styles; have it write its current styles onto the new ones
  useLayoutEffect(() => { engine.afterCommit(); }, [view]);
  const slug = soulSlug(soul.name);
  const md = SOUL_FILES[slug] || '';
  const flash = (what) => { setDone(what); clearTimeout(timer.current); timer.current = setTimeout(() => setDone(''), 1600); };
  const stop = (e) => e.stopPropagation();
  const copyFile = async () => { if (await copyText(md)) flash('file'); };
  const copyLink = async () => { if (await copyText(`${location.origin}/souls/${slug}.md`)) flash('link'); };
  const download = () => {
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
    const a = document.createElement('a'); a.href = url; a.download = `${slug}.md`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash('download');
  };
  const file = view === 'file';
  return (
    <>
      <span ref={engine.bind('scrim')} onClick={engine.close} className="scrim" style={st.scrim} />
      <svg width={L.W} height={L.H} viewBox={`0 0 ${L.W} ${L.H}`} fill="none" className="pill">
        <path ref={engine.bind('pill')} d={pill.d} stroke="#141210" strokeOpacity={pill['stroke-opacity']} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div ref={engine.bind('sheet')} role="dialog" aria-label={soul.name} className="sheet" style={st.sheet}>
        <div ref={engine.bind('art')} className="sheet-art" style={st.art}>
          <SoulCard s={soul} />
          <span className="glare"><span ref={engine.bind('artGlare')} className="glare-spot" style={st.artGlare} /></span>
        </div>
        <div ref={engine.bind('det')} className="sheet-text" style={{ width: `${textW}px`, ...st.det }}>
          {file ? (
            <span ref={engine.bind('d0')} className="sheet-meta soulfile-head" style={st.d0}>
              <span>SOUL.md</span>
              <button type="button" className="soulfile-back" onClick={() => setView('about')}>← About</button>
            </span>
          ) : (
            <span ref={engine.bind('d0')} className="sheet-meta" style={st.d0}>{`${soul.anchor} · ${soul.weight}`}</span>
          )}
          <span ref={engine.bind('d1')} className="sheet-name" style={{ fontSize: `${L.nameFs}px`, lineHeight: `${L.nameLh}px`, ...st.d1 }}>{soul.name}</span>
          {file ? (
            <>
              <pre ref={engine.bind('d2')} className="soulfile" style={{ '--soulfile-h': `${row ? 232 : 260}px`, ...st.d2 }}
                onPointerDown={stop} onWheel={stop} tabIndex="0" aria-label={`${soul.name} SOUL.md`}>{md}</pre>
              <div ref={engine.bind('d3')} className="soulfile-actions" style={st.d3}>
                <button type="button" className="btn-primary" onClick={copyFile}>{done === 'file' ? 'Copied' : 'Copy'}</button>
                <button type="button" className="btn-secondary" onClick={download}>{done === 'download' ? 'Saved' : 'Download'}</button>
                <button type="button" className="btn-secondary" onClick={copyLink}>{done === 'link' ? 'Link copied' : 'Copy link'}</button>
              </div>
              <span ref={engine.bind('d4')} className="soulfile-note" style={st.d4}>
                Paste it into your agent's instructions, save it as SOUL.md, or give your agent the link.
              </span>
            </>
          ) : (
            <>
              <span ref={engine.bind('d2')} className="sheet-says" style={st.d2}>{soul.says}</span>
              <div ref={engine.bind('d3')} className="sheet-moments" style={st.d3}>
                <span className="sheet-moments-title">In moments, it will…</span>
                {(soul.moments || []).map((m, i) => <span key={i} className="sheet-moment">{`— ${m}`}</span>)}
              </div>
              <div ref={engine.bind('d4')} className="sheet-actions" style={st.d4}>
                <button type="button" className="btn-primary" onClick={() => setView('file')}>Use this soul</button>
                <button type="button" onClick={engine.close} className="btn-secondary">Back to all</button>
              </div>
            </>
          )}
        </div>
        <button ref={engine.bind('closeBtn')} type="button" aria-label="Close" onClick={engine.close} className="sheet-close" style={st.closeBtn}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#141210" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 2l8 8M10 2L2 10" />
          </svg>
        </button>
      </div>
    </>
  );
}
