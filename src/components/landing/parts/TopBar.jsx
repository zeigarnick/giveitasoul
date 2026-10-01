import { Credit } from './Credit.jsx';

// The logo, and who made it: a pill on the right on desktop, a byline under the logo on phones (the deck
// toggle takes the right there).
export function TopBar({ L }) {
  return (
    <nav className="topbar" style={{ padding: L.navPad }}>
      <div className="topbar-brand">
        <a href="#" aria-label="giveitasoul home" className="logo" style={{ fontSize: L.logo + 'px' }}>
          {'give'}
          <span className="logo-it">
            {'it'}
            <svg width="20" height="8" viewBox="0 0 30 10" fill="none">
              <path d="M2 7 C 9 5, 18 6, 28 3" stroke="#D22E1E" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </span>
          {'asoul'}
        </a>
        {L.credit === 'byline' && <Credit className="credit-byline" />}
      </div>
      {L.credit === 'pill' && <Credit />}
    </nav>
  );
}
