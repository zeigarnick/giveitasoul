import SoulCard from '../SoulCard.jsx';

// The fan of soul cards. Each card is placed by the engine; tapping the centre card opens it, tapping another
// spins it to the centre.
export function CardFan({ engine, st, souls }) {
  return souls.map((s, i) => (
    <div key={i} ref={engine.bind('card' + i)} className="fancard" style={st['card' + i]}>
      <span ref={engine.bind('shade' + i)} className="fancard-shade" style={st['shade' + i]} />
      <button type="button" className="slotbtn" aria-label={s.name} onClick={() => engine.cardClick(i)} onFocus={(e) => engine.cardFocus(i, e)}>
        <SoulCard s={s} />
      </button>
      <span className="glare"><span ref={engine.bind('glare' + i)} className="glare-spot" style={st['glare' + i]} /></span>
    </div>
  ));
}
