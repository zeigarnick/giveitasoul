import { useEffect, useState } from 'react';
import SoulCard from '../SoulCard.jsx';
import { soulSlug } from '../../../lib/souls.js';
import { FlipFile } from './FlipFile.jsx';
import './soulfile.css';

// The open soul: the scrim behind it, the pill handle above it, and the window that morphs out of the centre card
// with the card on one side and what the soul says and does on the other. "Use this soul" turns the card over to
// show its SOUL.md (FlipFile).
export function DetailsSheet({ engine, st, pill, soul, L }) {
  const { row, PAD, TEXTW } = L.sheet;
  // phones: the window spans the whole screen (the artboard plus --ext each side), MARGIN in from each edge
  const textW = row ? `${TEXTW}px` : `calc(${L.W - 2 * (L.sheet.MARGIN + PAD)}px + 2px * var(--ext, 0))`;
  const [flipped, setFlipped] = useState(false);
  useEffect(() => { if (!engine.open) setFlipped(false); }, [engine.open]);
  useEffect(() => { setFlipped(false); }, [soul.name]);
  const page = `/souls/${soulSlug(soul.name)}/`;
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
        <div ref={engine.bind('det')} className="sheet-text" style={{ width: textW, ...st.det }} aria-hidden={flipped}>
          <span ref={engine.bind('d0')} className="sheet-meta soulfile-head" style={st.d0}>
            <span>{soul.anchor}</span>
            <a href={page} className="soulfile-back">Soul page ↗</a>
          </span>
          <span ref={engine.bind('d1')} className="sheet-name" style={{ fontSize: `${L.nameFs}px`, lineHeight: `${L.nameLh}px`, ...st.d1 }}>{soul.name}</span>
          <span ref={engine.bind('d2')} className="sheet-says" style={st.d2}>{soul.says}</span>
          <div ref={engine.bind('d3')} className="sheet-moments" style={st.d3}>
            <span className="sheet-moments-title">What it’s like</span>
            {(soul.traits || []).map((m, i) => <span key={i} className="sheet-moment">{`— ${m}`}</span>)}
          </div>
          {row ? (
            <div ref={engine.bind('d4')} className="sheet-actions" style={st.d4}>
              <button type="button" className="btn-primary" onClick={() => setFlipped(true)}>Use this soul</button>
              <button type="button" onClick={engine.close} className="btn-secondary">Back to all</button>
            </div>
          ) : (
            <div ref={engine.bind('d4')} className="sheet-actions is-stack" style={st.d4}>
              <button type="button" className="round-back" onClick={engine.close} aria-label="Back to all souls">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></svg>
              </button>
              <button type="button" className="btn-primary" onClick={() => setFlipped(true)}>Use this soul</button>
            </div>
          )}
        </div>
        <FlipFile engine={engine} soul={soul} L={L} flipped={flipped} onBack={() => setFlipped(false)} />
        <button ref={engine.bind('closeBtn')} type="button" aria-label="Close" onClick={engine.close} className="sheet-close" style={st.closeBtn}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#141210" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 2l8 8M10 2L2 10" />
          </svg>
        </button>
      </div>
    </>
  );
}
