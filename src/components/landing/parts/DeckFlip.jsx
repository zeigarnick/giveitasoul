import { DECK_LABELS } from '../config.js';

// The deck name under the fan while switching decks: the old name tips forward like a rolodex card and the new
// one is revealed behind it.
export function DeckFlip({ engine, st, from, to, hint, L }) {
  const [frName, frSub] = DECK_LABELS[from], [bkName, bkSub] = DECK_LABELS[to];
  return (
    <div ref={engine.bind('flip')} className="deckflip" style={{ top: `${L.label}px`, ...st.flip }}>
      <span ref={engine.bind('hint')} className="deckflip-hint" style={st.hint}>{hint}</span>
      <div className="deckflip-stage">
        <div ref={engine.bind('back')} className="deckflip-card" style={st.back}>
          <span className="deckflip-sub">{bkSub}</span>
          <span className="deckflip-name">{bkName}</span>
        </div>
        <div ref={engine.bind('front')} className="deckflip-card is-front" style={st.front}>
          <span className="deckflip-sub">{frSub}</span>
          <span className="deckflip-name">{frName}</span>
        </div>
      </div>
    </div>
  );
}
