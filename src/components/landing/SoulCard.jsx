import { memo } from 'react';
import { PATTERNS } from './parts/patterns.jsx';

const FALLBACK = { name: 'The Tidewatcher', anchor: 'INFJ', weight: 'Light', line: 'Asks before it advises.', bg: '#1E5FD0', fg: '#F4F0E8', ac: '#8DB8FF', kind: 'waves' };

// A soul card: 232×324, the soul's animated pattern, its type and weight on top, name and line at the bottom.
function SoulCard({ s = FALLBACK }) {
  const Pattern = PATTERNS[s.kind];
  return (
    <div style={{ width: '232px', height: '324px', borderRadius: '20px', overflow: 'hidden', position: 'relative', background: s.bg, color: s.fg, fontFamily: 'Geist, system-ui, sans-serif', boxShadow: s.bg === '#EDE3D1' ? 'inset 0 0 0 1px #DCCFB8' : 'none', userSelect: 'none' }}>
      {Pattern ? <Pattern ac={s.ac} bg={s.bg} num={s.num} /> : null}
      <span style={{ position: 'absolute', left: '18px', right: '18px', top: '16px', display: 'flex', justifyContent: 'space-between', fontFamily: "'Geist Mono', monospace", fontSize: '11px' }}>
        <span>{s.anchor}</span>
        <span>{s.weight}</span>
      </span>
      <span style={{ position: 'absolute', left: '18px', right: '18px', bottom: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '30px', lineHeight: '1' }}>{s.name}</span>
        <span style={{ fontSize: '13px', lineHeight: '1.35' }}>{s.line}</span>
      </span>
    </div>
  );
}

// Card artwork never changes for the same soul, so only a new soul re-renders it.
export default memo(SoulCard, (a, b) => a.s === b.s);
