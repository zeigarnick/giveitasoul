import SoulCard from '../SoulCard.jsx';
import { CARD_W, CARD_H } from '../config.js';

// The fan of soul cards. Each card is placed by the engine; tapping the centre card opens it, tapping another
// spins it to the centre.
// Cards are laid out at the centre card's on-screen size (zoom: Kc) rather than drawn at 232×324 and scaled up, so
// the browser draws their words at full resolution; the engine's transform only scales them relative to that.
export function CardFan({ engine, st, souls, L }) {
  const box = { width: `${CARD_W * L.Kc}px`, height: `${CARD_H * L.Kc}px`, borderRadius: `${20 * L.Kc}px` };
  return souls.map((s, i) => (
    <div key={i} ref={engine.bind('card' + i)} className="fancard" style={{ ...box, ...st['card' + i] }}>
      <div className="fancard-z" style={{ zoom: L.Kc }}>
        <span ref={engine.bind('shade' + i)} className="fancard-shade" style={st['shade' + i]} />
        <button type="button" className="slotbtn" aria-label={s.name} onClick={() => engine.cardClick(i)} onFocus={(e) => engine.cardFocus(i, e)}>
          <SoulCard s={s} />
        </button>
        <span className="glare"><span ref={engine.bind('glare' + i)} className="glare-spot" style={st['glare' + i]} /></span>
        <span ref={engine.bind('dim' + i)} className="fancard-dim" style={st['dim' + i]} />
      </div>
    </div>
  ));
}
