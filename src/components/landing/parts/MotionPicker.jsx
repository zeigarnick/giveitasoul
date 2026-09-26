import { createPortal } from 'react-dom';
import { MOTIONS } from '../config.js';

const stop = (e) => e.stopPropagation();

// A small floating switch between open/close motion variants, for comparing them live. Picking one replays the
// open. Shown in dev, or with ?motion in the URL; rendered outside the scaled stage so it stays readable.
export function MotionPicker({ engine, current }) {
  if (!(import.meta.env.DEV || new URLSearchParams(location.search).has('motion'))) return null;
  return createPortal(
    // React events bubble through portals, so keep the wheel from seeing these as drags or key presses
    <div className="motionpicker" role="radiogroup" aria-label="Open and close motion" onPointerDown={stop} onPointerUp={stop} onPointerMove={stop} onKeyDown={stop} onWheel={stop}>
      <span className="motionpicker-title">Motion</span>
      {Object.entries(MOTIONS).map(([name, m]) => (
        <button key={name} type="button" role="radio" aria-checked={current === name} className="motionpicker-opt" onClick={() => engine.setMotion(name)}>
          {m.label}
        </button>
      ))}
    </div>,
    document.body
  );
}
