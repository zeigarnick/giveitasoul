import { Credit } from './Credit.jsx';
import { WISP, LOGO_COLORS as C, SWOOSH, SWOOSH_STROKE } from '../../../lib/logo.js';
import '../../../styles/logo.css';

// The logo, and who made it: a pill on the right on desktop, a byline under the logo on phones (the deck
// toggle takes the right there).
export function TopBar({ L }) {
  return (
    <nav className="topbar" style={{ padding: L.navPad }}>
      <div className="topbar-brand">
        <a href="#" aria-label="giveitasoul home" className="logo" style={{ fontSize: L.logo + 'px' }}>
          <svg className="logo-wisp" viewBox="0 0 32 32" aria-hidden="true">
            <path d={WISP.flame} fill={C.flame} />
            <path d={WISP.glow} fill={C.glow} />
            {WISP.eyes.map(([x, y]) => <circle key={x} cx={x} cy={y} r={WISP.eyeR} fill={C.ink} />)}
          </svg>
          <span className="logo-word">
            {'give'}
            <span className="logo-it">
              {'it'}
              <svg className="logo-swoosh" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d={SWOOSH} fill="none" stroke="currentColor" strokeWidth={SWOOSH_STROKE} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
            </span>
            {'asoul'}
          </span>
        </a>
        {L.credit === 'byline' && <Credit className="credit-byline" />}
      </div>
      {L.credit === 'pill' && <Credit />}
    </nav>
  );
}
