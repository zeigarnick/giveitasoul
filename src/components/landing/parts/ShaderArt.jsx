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
    // where the card's name block starts, so the pattern centres between the type label and the name; again once
    // the fonts have loaded, since they decide whether the line under the name wraps
    const nameBlock = canvas.parentElement && canvas.parentElement.lastElementChild;
    const measure = () => { if (nameBlock) r.setNameTop(canvas, nameBlock.offsetTop); };
    measure();
    let live = true;
    if (document.fonts) document.fonts.ready.then(() => { if (live) measure(); });
    return () => { live = false; r.detach(canvas); };
  }, [program, s]);
  return <canvas ref={ref} style={{ position: 'absolute', left: '0', top: '0', width: '232px', height: '324px' }} />;
}
