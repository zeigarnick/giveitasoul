// The MBTI / Enneagram segmented control. The thumb slides on the engine's toggle spring.
export function DeckToggle({ engine, st, deck }) {
  return (
    <div ref={engine.bind('toggle')} role="radiogroup" aria-label="Personality system" onPointerDown={(e) => e.stopPropagation()} className="toggle" style={{ left: `${720 - (112 + 148 + 6) / 2}px`, ...st.toggle }}>
      <span ref={engine.bind('thumb')} className="toggle-thumb" style={st.thumb} />
      <button ref={engine.bind('opt0')} type="button" role="radio" aria-checked={deck === 'mbti'} onClick={() => engine.pickDeck('mbti')} className="toggle-opt" style={{ width: '112px', ...st.opt0 }}>
        {'MBTI '}
        <span className="toggle-count">16</span>
      </button>
      <button ref={engine.bind('opt1')} type="button" role="radio" aria-checked={deck === 'ennea'} onClick={() => engine.pickDeck('ennea')} className="toggle-opt" style={{ width: '148px', ...st.opt1 }}>
        {'Enneagram '}
        <span className="toggle-count">9</span>
      </button>
    </div>
  );
}
