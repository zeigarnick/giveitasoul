import React from 'react';
import { DCLogic } from './dc.jsx';

// A soul card: 232×324, one animated SVG pattern per `kind` (SMIL), name and line at the bottom.
export default class SoulCard extends DCLogic {
  shouldComponentUpdate(next) { return next.s !== this.props.s; }

  renderVals() {
    const s = this.props.s ?? { name: 'The Tidewatcher', anchor: 'INFJ', weight: 'Light', line: 'Asks before it advises.', bg: '#1E5FD0', fg: '#F4F0E8', ac: '#8DB8FF', kind: 'waves' };
    const kinds = ['waves', 'bars', 'dashes', 'orbit', 'still', 'petals', 'contours', 'dots', 'zigzag', 'slash', 'nest', 'stars', 'gears', 'grid', 'chevrons', 'burst', 'ennea'];
    const k = {};
    kinds.forEach((n) => { k[n] = s.kind === n; });
    // Enneagram figure: 9 at top, clockwise. Highlight the type's point and its two lines.
    let en = { all: 'M0 0', dots: 'M0 0', hi: 'M0 0', x: 0, y: 0, tx: 0, ty: 0, n: '' };
    if (s.kind === 'ennea') {
      const n = s.num || 9, CX = 116, CY = 112, RR = 72;
      const P = (k) => { const a = (-90 + 40 * (k % 9)) * Math.PI / 180; return [CX + RR * Math.cos(a), CY + RR * Math.sin(a)]; };
      const f = (q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      const tri = [9, 3, 6], hex = [1, 4, 2, 8, 5, 7];
      const all = 'M' + tri.map((k) => f(P(k))).join('L') + 'Z M' + hex.map((k) => f(P(k))).join('L') + 'Z';
      let dots = '';
      for (let k = 1; k <= 9; k++) { const q = P(k); dots += 'M' + (q[0] - 3).toFixed(1) + ' ' + q[1].toFixed(1) + 'a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'; }
      const L = { 1: [4, 7], 2: [4, 8], 3: [6, 9], 4: [1, 2], 5: [7, 8], 6: [3, 9], 7: [1, 5], 8: [2, 5], 9: [3, 6] }[n];
      const hi = 'M' + f(P(L[0])) + 'L' + f(P(n)) + 'L' + f(P(L[1]));
      const q = P(n), a = (-90 + 40 * (n % 9)) * Math.PI / 180;
      en = { all, dots, hi, x: q[0].toFixed(1), y: q[1].toFixed(1), tx: (CX + (RR + 22) * Math.cos(a)).toFixed(1), ty: (CY + (RR + 22) * Math.sin(a)).toFixed(1), n: String(n) };
    }
    return { s, k, en, edge: s.bg === '#EDE3D1' ? 'inset 0 0 0 1px #DCCFB8' : 'none' };
  }

  template(v) {
    return (
    <div style={{ "width": "232px", "height": "324px", "borderRadius": "20px", "overflow": "hidden", "position": "relative", "background": v.s.bg, "color": v.s.fg, "fontFamily": "Geist, system-ui, sans-serif", "boxShadow": v.edge, "userSelect": "none" }}>
      {v.k.waves ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <g>
              <animateTransform attributeName="transform" type="translate" from="0 0" to="64 0" dur="6s" repeatCount="indefinite" />
              <path d="M-64 48 q16 -8 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0" stroke={v.s.ac} strokeWidth="2" />
              <path d="M-64 96 q16 -8 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0" stroke={v.s.ac} strokeWidth="2" />
              <path d="M-64 144 q16 -8 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0" stroke={v.s.ac} strokeWidth="2" />
              <path d="M-64 192 q16 -8 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0" stroke={v.s.ac} strokeWidth="2" />
            </g>
            <g opacity="0.6">
              <animateTransform attributeName="transform" type="translate" from="64 0" to="0 0" dur="9s" repeatCount="indefinite" />
              <path d="M-64 72 q16 -8 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0" stroke={v.s.ac} strokeWidth="2" />
              <path d="M-64 120 q16 -8 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0" stroke={v.s.ac} strokeWidth="2" />
              <path d="M-64 168 q16 -8 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0" stroke={v.s.ac} strokeWidth="2" />
            </g>
          </svg>
        </>
      ) : null}
      {v.k.bars ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill={v.s.ac} style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <rect x="26" width="10" rx="5" y="90" height="120">
              <animate attributeName="y" values="90;138;90" dur="1.1s" repeatCount="indefinite" />
              <animate attributeName="height" values="120;72;120" dur="1.1s" repeatCount="indefinite" />
            </rect>
            <rect x="50" width="10" rx="5" y="50" height="160">
              <animate attributeName="y" values="50;114;50" dur="0.9s" begin="-0.3s" repeatCount="indefinite" />
              <animate attributeName="height" values="160;96;160" dur="0.9s" begin="-0.3s" repeatCount="indefinite" />
            </rect>
            <rect x="74" width="10" rx="5" y="110" height="100">
              <animate attributeName="y" values="110;150;110" dur="1.3s" begin="-0.6s" repeatCount="indefinite" />
              <animate attributeName="height" values="100;60;100" dur="1.3s" begin="-0.6s" repeatCount="indefinite" />
            </rect>
            <rect x="98" width="10" rx="5" y="30" height="180">
              <animate attributeName="y" values="30;102;30" dur="1s" begin="-0.2s" repeatCount="indefinite" />
              <animate attributeName="height" values="180;108;180" dur="1s" begin="-0.2s" repeatCount="indefinite" />
            </rect>
            <rect x="122" width="10" rx="5" y="70" height="140">
              <animate attributeName="y" values="70;126;70" dur="1.2s" begin="-0.8s" repeatCount="indefinite" />
              <animate attributeName="height" values="140;84;140" dur="1.2s" begin="-0.8s" repeatCount="indefinite" />
            </rect>
            <rect x="146" width="10" rx="5" y="40" height="170">
              <animate attributeName="y" values="40;108;40" dur="0.95s" begin="-0.5s" repeatCount="indefinite" />
              <animate attributeName="height" values="170;102;170" dur="0.95s" begin="-0.5s" repeatCount="indefinite" />
            </rect>
            <rect x="170" width="10" rx="5" y="100" height="110">
              <animate attributeName="y" values="100;144;100" dur="1.15s" begin="-0.1s" repeatCount="indefinite" />
              <animate attributeName="height" values="110;66;110" dur="1.15s" begin="-0.1s" repeatCount="indefinite" />
            </rect>
            <rect x="194" width="10" rx="5" y="60" height="150">
              <animate attributeName="y" values="60;120;60" dur="1.05s" begin="-0.7s" repeatCount="indefinite" />
              <animate attributeName="height" values="150;90;150" dur="1.05s" begin="-0.7s" repeatCount="indefinite" />
            </rect>
          </svg>
        </>
      ) : null}
      {v.k.dashes ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" stroke={v.s.ac} strokeWidth="2" strokeDasharray="28 8" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <line x1="0" y1="44" x2="232" y2="44">
              <animate attributeName="stroke-dashoffset" from="0" to="-36" dur="2.6s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="64" x2="232" y2="64">
              <animate attributeName="stroke-dashoffset" from="-9" to="-45" dur="2.6s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="84" x2="232" y2="84">
              <animate attributeName="stroke-dashoffset" from="-18" to="-54" dur="2.6s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="104" x2="232" y2="104">
              <animate attributeName="stroke-dashoffset" from="-27" to="-63" dur="2.6s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="124" x2="232" y2="124">
              <animate attributeName="stroke-dashoffset" from="0" to="-36" dur="2.6s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="144" x2="232" y2="144">
              <animate attributeName="stroke-dashoffset" from="-9" to="-45" dur="2.6s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="164" x2="232" y2="164">
              <animate attributeName="stroke-dashoffset" from="-18" to="-54" dur="2.6s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="184" x2="232" y2="184">
              <animate attributeName="stroke-dashoffset" from="-27" to="-63" dur="2.6s" repeatCount="indefinite" />
            </line>
          </svg>
        </>
      ) : null}
      {v.k.orbit ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <circle cx="116" cy="110" r="84" stroke={v.s.ac} strokeWidth="1.5" strokeDasharray="1 7" strokeLinecap="round" />
            <circle cx="116" cy="110" r="58" stroke={v.s.ac} strokeWidth="1.5" strokeDasharray="1 7" strokeLinecap="round" />
            <circle cx="116" cy="110" r="32" stroke={v.s.ac} strokeWidth="1.5" />
            <g>
              <animateTransform attributeName="transform" type="rotate" values="-40 116 110;220 116 110;-40 116 110" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.6 0 0.4 1;0.6 0 0.4 1" dur="14s" repeatCount="indefinite" />
              <circle cx="116" cy="26" r="7" fill={v.s.ac} />
              <circle cx="116" cy="194" r="4" fill={v.s.ac} />
              <line x1="116" y1="26" x2="116" y2="194" stroke={v.s.ac} strokeOpacity="0.35" />
            </g>
          </svg>
        </>
      ) : null}
      {v.k.still ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <g stroke={v.s.ac} strokeOpacity="0.22">
              <line x1="12" y1="0" x2="12" y2="206" />
              <line x1="26" y1="0" x2="26" y2="206" />
              <line x1="40" y1="0" x2="40" y2="206" />
              <line x1="54" y1="0" x2="54" y2="206" />
              <line x1="68" y1="0" x2="68" y2="206" />
              <line x1="82" y1="0" x2="82" y2="206" />
              <line x1="96" y1="0" x2="96" y2="206" />
              <line x1="110" y1="0" x2="110" y2="206" />
              <line x1="124" y1="0" x2="124" y2="206" />
              <line x1="138" y1="0" x2="138" y2="206" />
              <line x1="152" y1="0" x2="152" y2="206" />
              <line x1="166" y1="0" x2="166" y2="206" />
              <line x1="180" y1="0" x2="180" y2="206" />
              <line x1="194" y1="0" x2="194" y2="206" />
              <line x1="208" y1="0" x2="208" y2="206" />
              <line x1="222" y1="0" x2="222" y2="206" />
            </g>
            <circle cx="116" cy="104" r="46" fill={v.s.ac}>
              <animate attributeName="r" values="46;47.4;46" dur="9s" repeatCount="indefinite" />
            </circle>
          </svg>
        </>
      ) : null}
      {v.k.petals ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" stroke={v.s.ac} strokeWidth="1.5" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0 116 110" to="360 116 110" dur="48s" repeatCount="indefinite" />
              <ellipse cx="116" cy="110" rx="22" ry="80" />
              <ellipse cx="116" cy="110" rx="22" ry="80" transform="rotate(30 116 110)" />
              <ellipse cx="116" cy="110" rx="22" ry="80" transform="rotate(60 116 110)" />
              <ellipse cx="116" cy="110" rx="22" ry="80" transform="rotate(90 116 110)" />
              <ellipse cx="116" cy="110" rx="22" ry="80" transform="rotate(120 116 110)" />
              <ellipse cx="116" cy="110" rx="22" ry="80" transform="rotate(150 116 110)" />
            </g>
            <circle cx="116" cy="110" r="10" fill={v.s.ac}>
              <animate attributeName="r" values="8;13;8" dur="4s" repeatCount="indefinite" />
            </circle>
          </svg>
        </>
      ) : null}
      {v.k.contours ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" stroke={v.s.ac} strokeWidth="1.4" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <path d="M40 120 C 40 60, 110 30, 160 50 C 205 68, 210 140, 170 170 C 130 200, 40 190, 40 120 Z" />
            <path d="M60 120 C 60 76, 112 52, 152 66 C 186 80, 190 132, 160 154 C 128 176, 60 166, 60 120 Z" />
            <path d="M80 118 C 80 90, 114 74, 142 84 C 166 94, 168 128, 148 142 C 126 156, 80 148, 80 118 Z" />
            <path d="M100 116 C 100 102, 118 94, 132 100 C 144 106, 146 122, 136 130 C 124 138, 100 132, 100 116 Z" />
            <circle cx="120" cy="114" r="3" fill={v.s.ac} />
            <path d="M20 200 C 60 180, 90 210, 130 190 S 200 170, 220 186" strokeDasharray="3 6">
              <animate attributeName="stroke-dashoffset" from="0" to="-90" dur="5s" repeatCount="indefinite" />
            </path>
          </svg>
        </>
      ) : null}
      {v.k.dots ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill={v.s.ac} style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <circle cx="44" cy="46" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="0s" repeatCount="indefinite" />
            </circle>
            <circle cx="80" cy="46" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="116" cy="46" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-0.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="152" cy="46" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-0.9s" repeatCount="indefinite" />
            </circle>
            <circle cx="188" cy="46" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="44" cy="88" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="80" cy="88" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-0.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="116" cy="88" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-0.9s" repeatCount="indefinite" />
            </circle>
            <circle cx="152" cy="88" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="188" cy="88" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="44" cy="130" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-0.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="80" cy="130" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-0.9s" repeatCount="indefinite" />
            </circle>
            <circle cx="116" cy="130" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="152" cy="130" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="188" cy="130" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="44" cy="172" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-0.9s" repeatCount="indefinite" />
            </circle>
            <circle cx="80" cy="172" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="116" cy="172" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="152" cy="172" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="188" cy="172" r="3">
              <animate attributeName="r" values="2;8;2" dur="3.2s" begin="-2.1s" repeatCount="indefinite" />
            </circle>
          </svg>
        </>
      ) : null}
      {v.k.zigzag ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" stroke={v.s.ac} strokeWidth="2.2" strokeLinejoin="round" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <g>
              <animateTransform attributeName="transform" type="translate" from="0 0" to="40 0" dur="1.6s" repeatCount="indefinite" />
              <path d="M-40 50 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12" />
              <path d="M-40 90 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12" />
              <path d="M-40 130 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12" />
              <path d="M-40 170 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12 l20 -12 l20 12" />
            </g>
          </svg>
        </>
      ) : null}
      {v.k.slash ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" stroke={v.s.ac} strokeWidth="1.5" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <line x1="-180" y1="210" x2="20" y2="10" />
            <line x1="-150" y1="210" x2="50" y2="10" />
            <line x1="-120" y1="210" x2="80" y2="10" />
            <line x1="-90" y1="210" x2="110" y2="10" />
            <line x1="-60" y1="210" x2="140" y2="10" />
            <line x1="-30" y1="210" x2="170" y2="10" />
            <line x1="0" y1="210" x2="200" y2="10" />
            <line x1="30" y1="210" x2="230" y2="10" />
            <line x1="60" y1="210" x2="260" y2="10" />
            <line x1="90" y1="210" x2="290" y2="10" />
            <line x1="120" y1="210" x2="320" y2="10" />
            <line x1="150" y1="210" x2="350" y2="10" />
            <line x1="180" y1="210" x2="380" y2="10" />
            <line x1="210" y1="210" x2="410" y2="10" />
            <g>
              <animateTransform attributeName="transform" type="translate" values="-260 0;260 0" keyTimes="0;1" dur="3.4s" repeatCount="indefinite" />
              <line x1="0" y1="210" x2="200" y2="10" strokeWidth="12" strokeLinecap="round" />
            </g>
          </svg>
        </>
      ) : null}
      {v.k.nest ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" stroke={v.s.ac} strokeWidth="1.6" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <rect x="26" y="22" width="180" height="180" rx="40">
              <animate attributeName="stroke-opacity" values="0.25;1;0.25" dur="3s" begin="0s" repeatCount="indefinite" />
            </rect>
            <rect x="44" y="40" width="144" height="144" rx="32">
              <animate attributeName="stroke-opacity" values="0.25;1;0.25" dur="3s" begin="0.3s" repeatCount="indefinite" />
            </rect>
            <rect x="62" y="58" width="108" height="108" rx="24">
              <animate attributeName="stroke-opacity" values="0.25;1;0.25" dur="3s" begin="0.6s" repeatCount="indefinite" />
            </rect>
            <rect x="80" y="76" width="72" height="72" rx="16">
              <animate attributeName="stroke-opacity" values="0.25;1;0.25" dur="3s" begin="0.9s" repeatCount="indefinite" />
            </rect>
            <rect x="98" y="94" width="36" height="36" rx="10" fill={v.s.ac} />
          </svg>
        </>
      ) : null}
      {v.k.stars ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill={v.s.ac} style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <circle cx="150" cy="80" r="34" />
            <circle cx="166" cy="68" r="30" fill={v.s.bg} />
            <circle cx="30" cy="40" r="1.6">
              <animate attributeName="opacity" values="1;0.2;1" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="62" cy="96" r="1.2">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="3.1s" repeatCount="indefinite" />
            </circle>
            <circle cx="90" cy="30" r="2">
              <animate attributeName="opacity" values="1;0.3;1" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="160" r="1.4">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="110" cy="150" r="1.8">
              <animate attributeName="opacity" values="1;0.2;1" dur="3.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="30" r="1.4">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="206" cy="150" r="2">
              <animate attributeName="opacity" values="1;0.3;1" dur="3.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="176" cy="190" r="1.2">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="70" cy="196" r="1.6">
              <animate attributeName="opacity" values="1;0.2;1" dur="3.9s" repeatCount="indefinite" />
            </circle>
            <circle cx="20" cy="110" r="1.2">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="2.9s" repeatCount="indefinite" />
            </circle>
          </svg>
        </>
      ) : null}
      {v.k.gears ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0 92 96" to="360 92 96" dur="14s" repeatCount="indefinite" />
              <circle cx="92" cy="96" r="50" stroke={v.s.ac} strokeWidth="14" strokeDasharray="9.5 6.2" />
              <circle cx="92" cy="96" r="34" stroke={v.s.ac} strokeWidth="3" />
              <circle cx="92" cy="96" r="8" fill={v.s.ac} />
            </g>
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0 166 166" to="-360 166 166" dur="8.4s" repeatCount="indefinite" />
              <circle cx="166" cy="166" r="28" stroke={v.s.ac} strokeWidth="12" strokeDasharray="7.6 7" />
              <circle cx="166" cy="166" r="6" fill={v.s.ac} />
            </g>
          </svg>
        </>
      ) : null}
      {v.k.grid ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <rect x="40" y="28" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-0.00s" repeatCount="indefinite" />
            </rect>
            <rect x="80" y="28" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-0.35s" repeatCount="indefinite" />
            </rect>
            <rect x="120" y="28" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-0.70s" repeatCount="indefinite" />
            </rect>
            <rect x="160" y="28" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-1.05s" repeatCount="indefinite" />
            </rect>
            <rect x="40" y="68" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-1.40s" repeatCount="indefinite" />
            </rect>
            <rect x="80" y="68" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-1.75s" repeatCount="indefinite" />
            </rect>
            <rect x="120" y="68" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-2.10s" repeatCount="indefinite" />
            </rect>
            <rect x="160" y="68" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-2.45s" repeatCount="indefinite" />
            </rect>
            <rect x="40" y="108" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-2.80s" repeatCount="indefinite" />
            </rect>
            <rect x="80" y="108" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-3.15s" repeatCount="indefinite" />
            </rect>
            <rect x="120" y="108" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-3.50s" repeatCount="indefinite" />
            </rect>
            <rect x="160" y="108" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-3.85s" repeatCount="indefinite" />
            </rect>
            <rect x="40" y="148" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-4.20s" repeatCount="indefinite" />
            </rect>
            <rect x="80" y="148" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-4.55s" repeatCount="indefinite" />
            </rect>
            <rect x="120" y="148" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-4.90s" repeatCount="indefinite" />
            </rect>
            <rect x="160" y="148" width="28" height="28" rx="7" fill={v.s.ac} fillOpacity="0.15">
              <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" dur="6s" begin="-5.25s" repeatCount="indefinite" />
            </rect>
          </svg>
        </>
      ) : null}
      {v.k.chevrons ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" stroke={v.s.ac} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <g>
              <animateTransform attributeName="transform" type="translate" from="0 0" to="36 0" dur="0.7s" repeatCount="indefinite" />
              <path d="M-36 38 l14 14 l-14 14 M0 38 l14 14 l-14 14 M36 38 l14 14 l-14 14 M72 38 l14 14 l-14 14 M108 38 l14 14 l-14 14 M144 38 l14 14 l-14 14 M180 38 l14 14 l-14 14 M216 38 l14 14 l-14 14 M252 38 l14 14 l-14 14" />
              <path d="M-36 96 l14 14 l-14 14 M0 96 l14 14 l-14 14 M36 96 l14 14 l-14 14 M72 96 l14 14 l-14 14 M108 96 l14 14 l-14 14 M144 96 l14 14 l-14 14 M180 96 l14 14 l-14 14 M216 96 l14 14 l-14 14 M252 96 l14 14 l-14 14" />
              <path d="M-36 154 l14 14 l-14 14 M0 154 l14 14 l-14 14 M36 154 l14 14 l-14 14 M72 154 l14 14 l-14 14 M108 154 l14 14 l-14 14 M144 154 l14 14 l-14 14 M180 154 l14 14 l-14 14 M216 154 l14 14 l-14 14 M252 154 l14 14 l-14 14" />
            </g>
          </svg>
        </>
      ) : null}
      {v.k.burst ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <g stroke={v.s.ac} strokeWidth="4" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 116 110" to="30 116 110" dur="3s" repeatCount="indefinite" />
              <line x1="146.0" y1="110.0" x2="194.0" y2="110.0" />
              <line x1="142.0" y1="125.0" x2="166.2" y2="139.0" />
              <line x1="131.0" y1="136.0" x2="155.0" y2="177.5" />
              <line x1="116.0" y1="140.0" x2="116.0" y2="168.0" />
              <line x1="101.0" y1="136.0" x2="77.0" y2="177.5" />
              <line x1="90.0" y1="125.0" x2="65.8" y2="139.0" />
              <line x1="86.0" y1="110.0" x2="38.0" y2="110.0" />
              <line x1="90.0" y1="95.0" x2="65.8" y2="81.0" />
              <line x1="101.0" y1="84.0" x2="77.0" y2="42.5" />
              <line x1="116.0" y1="80.0" x2="116.0" y2="52.0" />
              <line x1="131.0" y1="84.0" x2="155.0" y2="42.5" />
              <line x1="142.0" y1="95.0" x2="166.2" y2="81.0" />
            </g>
            <circle cx="116" cy="110" r="16" fill={v.s.ac}>
              <animate attributeName="r" values="13;19;13" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="40" r="3" fill={v.s.ac}>
              <animate attributeName="opacity" values="0;1;0" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="196" cy="58" r="2.5" fill={v.s.ac}>
              <animate attributeName="opacity" values="0;1;0" dur="2.2s" begin="-0.7s" repeatCount="indefinite" />
            </circle>
            <circle cx="190" cy="190" r="3" fill={v.s.ac}>
              <animate attributeName="opacity" values="0;1;0" dur="2s" begin="-1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="34" cy="178" r="2.5" fill={v.s.ac}>
              <animate attributeName="opacity" values="0;1;0" dur="1.6s" begin="-0.4s" repeatCount="indefinite" />
            </circle>
          </svg>
        </>
      ) : null}
      {v.k.ennea ? (
        <>
          <svg width="232" height="324" viewBox="0 0 232 324" fill="none" style={{ "position": "absolute", "left": "0", "top": "0" }}>
            <circle cx="116" cy="112" r="72" stroke={v.s.ac} strokeOpacity="0.32" strokeWidth="1.5" />
            <path d={v.en.all} stroke={v.s.ac} strokeOpacity="0.32" strokeWidth="1.5" strokeLinejoin="round" />
            <path d={v.en.dots} fill={v.s.ac} fillOpacity="0.55" />
            <path d={v.en.hi} pathLength="100" stroke={v.s.ac} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="100 100">
              <animate attributeName="stroke-dashoffset" values="100;0;0;-100" keyTimes="0;0.45;0.75;1" dur="5s" repeatCount="indefinite" />
            </path>
            <circle cx={v.en.x} cy={v.en.y} r="12" stroke={v.s.ac} strokeWidth="1.5" fill="none">
              <animate attributeName="r" values="7;16;7" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.9;0;0.9" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={v.en.x} cy={v.en.y} r="6" fill={v.s.ac} />
          </svg>
        </>
      ) : null}
      <span style={{ "position": "absolute", "left": "18px", "right": "18px", "top": "16px", "display": "flex", "justifyContent": "space-between", "fontFamily": "'Geist Mono', monospace", "fontSize": "11px" }}>
        <span>
          {v.s.anchor}
        </span>
        <span>
          {v.s.weight}
        </span>
      </span>
      <span style={{ "position": "absolute", "left": "18px", "right": "18px", "bottom": "18px", "display": "flex", "flexDirection": "column", "gap": "4px" }}>
        <span style={{ "fontFamily": "'Instrument Serif', Georgia, serif", "fontSize": "30px", "lineHeight": "1" }}>
          {v.s.name}
        </span>
        <span style={{ "fontSize": "13px", "lineHeight": "1.35" }}>
          {v.s.line}
        </span>
      </span>
    </div>
    );
  }
}
