// The MBTI / Enneagram segmented control: centred on desktop, at the right of the top bar on phones.
// The thumb slides on the engine's toggle spring.
export function DeckToggle({ engine, st, deck, L }) {
  const w = L.tgW0 + L.tgW1 + 6;
  const left = L.tgRight == null ? (L.W - w) / 2 : L.W - L.tgRight - w;
  return (
    <div ref={engine.bind('toggle')} role="radiogroup" aria-label="Personality system" onPointerDown={(e) => e.stopPropagation()} className="toggle" style={{ left: `${left}px`, top: `${L.tgTop}px`, ...st.toggle }}>
      <span ref={engine.bind('thumb')} className="toggle-thumb" style={st.thumb} />
      <button ref={engine.bind('opt0')} type="button" role="radio" aria-checked={deck === 'mbti'} onClick={() => engine.pickDeck('mbti')} className="toggle-opt" style={{ width: `${L.tgW0}px`, fontSize: `${L.tgFs}px`, ...st.opt0 }}>
        {'MBTI '}
        <span className="toggle-count">16</span>
      </button>
      <button ref={engine.bind('opt1')} type="button" role="radio" aria-checked={deck === 'ennea'} onClick={() => engine.pickDeck('ennea')} className="toggle-opt" style={{ width: `${L.tgW1}px`, fontSize: `${L.tgFs}px`, ...st.opt1 }}>
        {'Enneagram '}
        <span className="toggle-count">9</span>
      </button>
    </div>
  );
}
