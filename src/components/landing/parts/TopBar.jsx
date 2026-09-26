// The logo and site links. Static.
export function TopBar() {
  return (
    <nav className="topbar">
      <a href="#" aria-label="giveitasoul home" className="logo">
        {'give'}
        <span className="logo-it">
          {'it'}
          <svg width="20" height="8" viewBox="0 0 30 10" fill="none">
            <path d="M2 7 C 9 5, 18 6, 28 3" stroke="#D22E1E" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </span>
        {'asoul'}
      </a>
      <div className="navlinks">
        <a href="#">Browse souls</a>
        <a href="#">Submit yours</a>
      </div>
    </nav>
  );
}
