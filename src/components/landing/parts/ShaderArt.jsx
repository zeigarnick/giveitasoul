import { useLayoutEffect, useRef } from 'react';
import { renderer } from '../shaders/renderer.js';

// A soul's pattern drawn by a shader: a canvas the shared renderer paints into.
export function ShaderArt({ program, s }) {
  const ref = useRef(null);
  // a layout effect, so the canvas joins before the wheel's own layout effect (in the parent) tells the renderer which
  // cards are hidden and how often each redraws; joining later, a hidden card would draw until something moved
  useLayoutEffect(() => {
    const canvas = ref.current, r = renderer();
    r.attach(canvas, program, s);
    return () => r.detach(canvas);
  }, [program, s]);
  return <canvas ref={ref} style={{ position: 'absolute', left: '0', top: '0', width: '232px', height: '324px' }} />;
}
