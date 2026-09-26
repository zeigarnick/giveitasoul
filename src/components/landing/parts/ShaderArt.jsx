import { useEffect, useRef } from 'react';
import { renderer } from '../shaders/renderer.js';

// A soul's pattern drawn by a shader: a canvas the shared renderer paints into.
export function ShaderArt({ program, s }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, r = renderer();
    r.attach(canvas, program, s);
    return () => r.detach(canvas);
  }, [program, s]);
  return <canvas ref={ref} style={{ position: 'absolute', left: '0', top: '0', width: '232px', height: '324px' }} />;
}
