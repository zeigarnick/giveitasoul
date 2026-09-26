import { FACES } from '../config.js';

// The headline. Its last word, "soul", is ten stacked typefaces; the engine shows the one the pointer points at.
export function Hero({ engine, st }) {
  return (
    <div ref={engine.bind('hero')} className="hero" style={st.hero}>
      <h1>
        <span>Give your AI agents a</span>
        {' '}
        <span ref={engine.bind('soul')} className="soulword" style={st.soul}>
          {FACES.map((f, i) => (
            <span key={i} ref={engine.faceRef(i)} className="soulface" style={{ fontFamily: f.ff, fontStyle: f.st, fontWeight: f.w, fontSize: `${f.fs}em`, letterSpacing: `${f.ls}em`, ...st['face' + i] }}>
              {'soul'}
              <i ref={engine.markRef(i)} className="soulmark" />
            </span>
          ))}
        </span>
        <span>.</span>
      </h1>
      <p>Spin through personalities. Tap one to meet it.</p>
    </div>
  );
}
