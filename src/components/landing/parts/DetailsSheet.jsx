import SoulCard from '../SoulCard.jsx';

// The open soul: the scrim behind it, the pill handle above it, and the window that morphs out of the centre card
// with the card on one side and what the soul says and does on the other.
export function DetailsSheet({ engine, st, pill, soul, L }) {
  const { row, PAD, TEXTW } = L.sheet;
  const textW = row ? TEXTW : L.W - 24 - 2 * PAD;
  return (
    <>
      <span ref={engine.bind('scrim')} onClick={engine.close} className="scrim" style={st.scrim} />
      <svg width={L.W} height={L.H} viewBox={`0 0 ${L.W} ${L.H}`} fill="none" className="pill">
        <path ref={engine.bind('pill')} d={pill.d} stroke="#141210" strokeOpacity={pill['stroke-opacity']} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div ref={engine.bind('sheet')} role="dialog" aria-label={soul.name} className="sheet" style={st.sheet}>
        <div ref={engine.bind('art')} className="sheet-art" style={st.art}>
          <SoulCard s={soul} />
        </div>
        <div ref={engine.bind('det')} className="sheet-text" style={{ width: `${textW}px`, ...st.det }}>
          <span ref={engine.bind('d0')} className="sheet-meta" style={st.d0}>{`${soul.anchor} · ${soul.weight}`}</span>
          <span ref={engine.bind('d1')} className="sheet-name" style={{ fontSize: `${L.nameFs}px`, lineHeight: `${L.nameLh}px`, ...st.d1 }}>{soul.name}</span>
          <span ref={engine.bind('d2')} className="sheet-says" style={st.d2}>{soul.says}</span>
          <div ref={engine.bind('d3')} className="sheet-moments" style={st.d3}>
            <span className="sheet-moments-title">In moments, it will…</span>
            {(soul.moments || []).map((m, i) => <span key={i} className="sheet-moment">{`— ${m}`}</span>)}
          </div>
          <div ref={engine.bind('d4')} className="sheet-actions" style={st.d4}>
            <a href="#" className="btn-primary">Use this soul</a>
            <button type="button" onClick={engine.close} className="btn-secondary">Back to all</button>
          </div>
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
