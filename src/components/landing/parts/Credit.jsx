import { SITE } from '../../../lib/site.js';
import '../../../styles/credit.css';

const { name, handle, url } = SITE.creator;

// "created by Nick Sng", linking to his X profile.
export function Credit({ className = '' }) {
  return (
    <a href={url} className={`credit ${className}`} target="_blank" rel="author noopener" aria-label={`Created by ${name}, ${handle} on X`}>
      <span className="credit-by">created by</span>
      <span className="credit-name">{name}</span>
      <svg className="credit-x" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    </a>
  );
}
