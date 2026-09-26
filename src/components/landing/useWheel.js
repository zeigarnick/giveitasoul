import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { WheelEngine } from './engine/WheelEngine.js';

// Connects the wheel engine to React. Re-renders only when the engine's snapshot changes (deck, open state,
// centre soul, deck-flip labels); every frame in between is written straight to the elements.
// Returns the engine and this render's frame: `st` holds each element's current styles for its first paint.
export function useWheel() {
  const [engine] = useState(() => new WheelEngine());
  useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  useEffect(() => { engine.mount(); return () => engine.unmount(); }, [engine]);
  // after every commit, put the engine's styles back on top of React's
  useLayoutEffect(() => engine.afterCommit());
  return { engine, frame: engine.frame() };
}
