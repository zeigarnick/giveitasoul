import { useWheel } from './useWheel.js';
import { TopBar } from './parts/TopBar.jsx';
import { DeckToggle } from './parts/DeckToggle.jsx';
import { Hero } from './parts/Hero.jsx';
import { DeckFlip } from './parts/DeckFlip.jsx';
import { CardFan } from './parts/CardFan.jsx';
import { DetailsSheet } from './parts/DetailsSheet.jsx';
import { BottomBar } from './parts/BottomBar.jsx';
import './landing.css';

// The landing stage: the whole window, holding the soul wheel. Its type steps between fixed tiers and the fan
// sizes itself to the space left (see layoutFor in config.js).
// All motion lives in the wheel engine (see useWheel); these components only lay the page out.
export default function Landing() {
  const { engine, frame: f } = useWheel();
  const L = engine.L;
  const deckSize = engine.deck === 'mbti' ? 16 : 9;
  const counter = String((f.active % deckSize) + 1).padStart(2, '0') + ' / ' + deckSize;
  return (
    <div
      className="wheel" ref={engine.bind('root')} tabIndex="0"
      onPointerDown={engine.onPointerDown} onPointerMove={engine.onPointerMove} onPointerUp={engine.onPointerUp}
      onPointerLeave={engine.onPointerLeave} onWheel={engine.onWheel} onKeyDown={engine.onKeyDown}
      style={{ '--W': `${L.W}px`, '--H': `${L.H}px` }}
    >
      <TopBar L={L} />
      <Hero engine={engine} st={f.st} L={L} />
      <DeckToggle engine={engine} st={f.st} deck={engine.deck} L={L} />
      <DeckFlip engine={engine} st={f.st} from={f.from} to={f.to} hint={f.plHint} L={L} />
      <CardFan engine={engine} st={f.st} souls={engine.souls} />
      <DetailsSheet engine={engine} st={f.st} pill={f.pillAttr} soul={engine.souls[f.active]} L={L} />
      <BottomBar engine={engine} st={f.st} counter={counter} L={L} />
    </div>
  );
}
