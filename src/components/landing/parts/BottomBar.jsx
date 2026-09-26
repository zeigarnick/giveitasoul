const Chevron = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#141210" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// Previous / next buttons around the position counter.
export function BottomBar({ engine, st, counter, L }) {
  return (
    <div ref={engine.bind('bar')} className="bottombar" style={{ bottom: `${L.bottom}px`, ...st.bar }}>
      <button type="button" aria-label="Previous soul" onClick={engine.prev} className="roundbtn"><Chevron d="M15 6l-6 6 6 6" /></button>
      <span className="counter" style={{ minWidth: `${L.counterW}px` }}>{counter + L.hint}</span>
      <button type="button" aria-label="Next soul" onClick={engine.next} className="roundbtn"><Chevron d="M9 6l6 6-6 6" /></button>
    </div>
  );
}
