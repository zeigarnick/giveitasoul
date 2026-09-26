// The animated pattern on each soul card, one per `kind`. Each moves like its personality; all are SMIL, so they
// run without JavaScript and the wheel can pause the ones nobody can see.

const ART = { position: 'absolute', left: '0', top: '0' };
const Svg = ({ children, ...rest }) => (
  <svg width="232" height="324" viewBox="0 0 232 324" style={ART} {...rest}>{children}</svg>
);
// There-and-back loops ease through each turnaround like a sine wave instead of bouncing off it (Interface Craft,
// Wave Functions: keyframes show a seam where they reverse; a wave is smooth everywhere).
const EASE = '0.37 0 0.63 1';
const WAVE = { calcMode: 'spline', keyTimes: '0;0.5;1', keySplines: EASE + ';' + EASE };
const GRID_WAVE = { calcMode: 'spline', keySplines: EASE + ';' + EASE + ';' + EASE };
// SMIL begin offsets: "0s", "-0.3s", …
const offset = (sec, digits = 1) => (sec === 0 ? '0s' : (sec < 0 ? '-' : '') + Math.abs(sec).toFixed(digits) + 's');

const wave = (y) => `M-64 ${y} q16 -8 32 0` + ' t32 0'.repeat(11);
function Waves({ ac }) {
  return (
    <Svg fill="none">
      <g>
        <animateTransform attributeName="transform" type="translate" from="0 0" to="64 0" dur="6s" repeatCount="indefinite" />
        {[48, 96, 144, 192].map((y) => <path key={y} d={wave(y)} stroke={ac} strokeWidth="2" />)}
      </g>
      <g opacity="0.6">
        <animateTransform attributeName="transform" type="translate" from="64 0" to="0 0" dur="9s" repeatCount="indefinite" />
        {[72, 120, 168].map((y) => <path key={y} d={wave(y)} stroke={ac} strokeWidth="2" />)}
      </g>
    </Svg>
  );
}

// [x, top, top when squashed, duration, begin]; every bar stands on y = 210
const BARS = [[26, 90, 138, '1.1s'], [50, 50, 114, '0.9s', '-0.3s'], [74, 110, 150, '1.3s', '-0.6s'], [98, 30, 102, '1s', '-0.2s'], [122, 70, 126, '1.2s', '-0.8s'], [146, 40, 108, '0.95s', '-0.5s'], [170, 100, 144, '1.15s', '-0.1s'], [194, 60, 120, '1.05s', '-0.7s']];
function Bars({ ac }) {
  return (
    <Svg fill={ac}>
      {BARS.map(([x, y, y2, dur, begin]) => (
        <rect key={x} x={x} width="10" rx="5" y={y} height={210 - y}>
          <animate attributeName="y" values={`${y};${y2};${y}`} {...WAVE} dur={dur} begin={begin} repeatCount="indefinite" />
          <animate attributeName="height" values={`${210 - y};${210 - y2};${210 - y}`} {...WAVE} dur={dur} begin={begin} repeatCount="indefinite" />
        </rect>
      ))}
    </Svg>
  );
}

function Dashes({ ac }) {
  return (
    <Svg fill="none" stroke={ac} strokeWidth="2" strokeDasharray="28 8">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const from = -9 * (i % 4);
        return (
          <line key={i} x1="0" y1={44 + 20 * i} x2="232" y2={44 + 20 * i}>
            <animate attributeName="stroke-dashoffset" from={String(from)} to={String(from - 36)} dur="2.6s" repeatCount="indefinite" />
          </line>
        );
      })}
    </Svg>
  );
}

function Orbit({ ac }) {
  return (
    <Svg fill="none">
      <circle cx="116" cy="110" r="84" stroke={ac} strokeWidth="1.5" strokeDasharray="1 7" strokeLinecap="round" />
      <circle cx="116" cy="110" r="58" stroke={ac} strokeWidth="1.5" strokeDasharray="1 7" strokeLinecap="round" />
      <circle cx="116" cy="110" r="32" stroke={ac} strokeWidth="1.5" />
      <g>
        <animateTransform attributeName="transform" type="rotate" values="-40 116 110;220 116 110;-40 116 110" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.6 0 0.4 1;0.6 0 0.4 1" dur="14s" repeatCount="indefinite" />
        <circle cx="116" cy="26" r="7" fill={ac} />
        <circle cx="116" cy="194" r="4" fill={ac} />
        <line x1="116" y1="26" x2="116" y2="194" stroke={ac} strokeOpacity="0.35" />
      </g>
    </Svg>
  );
}

function Still({ ac }) {
  return (
    <Svg fill="none">
      <g stroke={ac} strokeOpacity="0.22">
        {Array.from({ length: 16 }, (_, i) => <line key={i} x1={12 + 14 * i} y1="0" x2={12 + 14 * i} y2="206" />)}
      </g>
      <circle cx="116" cy="104" r="46" fill={ac}>
        <animate attributeName="r" values="46;47.4;46" {...WAVE} dur="9s" repeatCount="indefinite" />
      </circle>
    </Svg>
  );
}

function Petals({ ac }) {
  return (
    <Svg fill="none" stroke={ac} strokeWidth="1.5">
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 116 110" to="360 116 110" dur="48s" repeatCount="indefinite" />
        {[0, 30, 60, 90, 120, 150].map((a) => <ellipse key={a} cx="116" cy="110" rx="22" ry="80" transform={a ? `rotate(${a} 116 110)` : undefined} />)}
      </g>
      <circle cx="116" cy="110" r="10" fill={ac}>
        <animate attributeName="r" values="8;13;8" {...WAVE} dur="4s" repeatCount="indefinite" />
      </circle>
    </Svg>
  );
}

function Contours({ ac }) {
  return (
    <Svg fill="none" stroke={ac} strokeWidth="1.4">
      <path d="M40 120 C 40 60, 110 30, 160 50 C 205 68, 210 140, 170 170 C 130 200, 40 190, 40 120 Z" />
      <path d="M60 120 C 60 76, 112 52, 152 66 C 186 80, 190 132, 160 154 C 128 176, 60 166, 60 120 Z" />
      <path d="M80 118 C 80 90, 114 74, 142 84 C 166 94, 168 128, 148 142 C 126 156, 80 148, 80 118 Z" />
      <path d="M100 116 C 100 102, 118 94, 132 100 C 144 106, 146 122, 136 130 C 124 138, 100 132, 100 116 Z" />
      <circle cx="120" cy="114" r="3" fill={ac} />
      <path d="M20 200 C 60 180, 90 210, 130 190 S 200 170, 220 186" strokeDasharray="3 6">
        <animate attributeName="stroke-dashoffset" from="0" to="-90" dur="5s" repeatCount="indefinite" />
      </path>
    </Svg>
  );
}

// a 5×4 grid of dots growing in a diagonal wave
function Dots({ ac }) {
  const dots = [];
  [46, 88, 130, 172].forEach((cy, r) => [44, 80, 116, 152, 188].forEach((cx, c) => dots.push({ cx, cy, begin: offset(-0.3 * (r + c)) })));
  return (
    <Svg fill={ac}>
      {dots.map((d) => (
        <circle key={d.cx + '-' + d.cy} cx={d.cx} cy={d.cy} r="3">
          <animate attributeName="r" values="2;8;2" {...WAVE} dur="3.2s" begin={d.begin} repeatCount="indefinite" />
        </circle>
      ))}
    </Svg>
  );
}

const zig = (y) => `M-40 ${y}` + ' l20 -12 l20 12'.repeat(8);
function Zigzag({ ac }) {
  return (
    <Svg fill="none" stroke={ac} strokeWidth="2.2" strokeLinejoin="round">
      <g>
        <animateTransform attributeName="transform" type="translate" from="0 0" to="40 0" dur="1.6s" repeatCount="indefinite" />
        {[50, 90, 130, 170].map((y) => <path key={y} d={zig(y)} />)}
      </g>
    </Svg>
  );
}

// diagonal rules with a red-pen stroke sweeping across
function Slash({ ac }) {
  return (
    <Svg fill="none" stroke={ac} strokeWidth="1.5">
      {Array.from({ length: 14 }, (_, i) => <line key={i} x1={-180 + 30 * i} y1="210" x2={20 + 30 * i} y2="10" />)}
      <g>
        <animateTransform attributeName="transform" type="translate" values="-260 0;260 0" keyTimes="0;1" dur="3.4s" repeatCount="indefinite" />
        <line x1="0" y1="210" x2="200" y2="10" strokeWidth="12" strokeLinecap="round" />
      </g>
    </Svg>
  );
}

function Nest({ ac }) {
  return (
    <Svg fill="none" stroke={ac} strokeWidth="1.6">
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={26 + 18 * i} y={22 + 18 * i} width={180 - 36 * i} height={180 - 36 * i} rx={40 - 8 * i}>
          <animate attributeName="stroke-opacity" values="0.25;1;0.25" {...WAVE} dur="3s" begin={offset(0.3 * i)} repeatCount="indefinite" />
        </rect>
      ))}
      <rect x="98" y="94" width="36" height="36" rx="10" fill={ac} />
    </Svg>
  );
}

// [cx, cy, r, opacity keyframes, duration]
const STARS = [[30, 40, 1.6, '1;0.2;1', '2.6s'], [62, 96, 1.2, '0.2;1;0.2', '3.1s'], [90, 30, 2, '1;0.3;1', '4s'], [40, 160, 1.4, '0.3;1;0.3', '2.2s'], [110, 150, 1.8, '1;0.2;1', '3.6s'], [200, 30, 1.4, '0.2;1;0.2', '2.8s'], [206, 150, 2, '1;0.3;1', '3.3s'], [176, 190, 1.2, '0.3;1;0.3', '2.4s'], [70, 196, 1.6, '1;0.2;1', '3.9s'], [20, 110, 1.2, '0.2;1;0.2', '2.9s']];
function Stars({ ac, bg }) {
  return (
    <Svg fill={ac}>
      <circle cx="150" cy="80" r="34" />
      <circle cx="166" cy="68" r="30" fill={bg} />
      {STARS.map(([cx, cy, r, values, dur]) => (
        <circle key={cx + '-' + cy} cx={cx} cy={cy} r={r}>
          <animate attributeName="opacity" values={values} {...WAVE} dur={dur} repeatCount="indefinite" />
        </circle>
      ))}
    </Svg>
  );
}

function Gears({ ac }) {
  return (
    <Svg fill="none">
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 92 96" to="360 92 96" dur="14s" repeatCount="indefinite" />
        <circle cx="92" cy="96" r="50" stroke={ac} strokeWidth="14" strokeDasharray="9.5 6.2" />
        <circle cx="92" cy="96" r="34" stroke={ac} strokeWidth="3" />
        <circle cx="92" cy="96" r="8" fill={ac} />
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 166 166" to="-360 166 166" dur="8.4s" repeatCount="indefinite" />
        <circle cx="166" cy="166" r="28" stroke={ac} strokeWidth="12" strokeDasharray="7.6 7" />
        <circle cx="166" cy="166" r="6" fill={ac} />
      </g>
    </Svg>
  );
}

// a 4×4 grid filling in reading order
function Grid({ ac }) {
  return (
    <Svg fill="none">
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={40 + 40 * (i % 4)} y={28 + 40 * Math.floor(i / 4)} width="28" height="28" rx="7" fill={ac} fillOpacity="0.15">
          <animate attributeName="fill-opacity" values="0.15;1;1;0.15" keyTimes="0;0.15;0.7;1" {...GRID_WAVE} dur="6s" begin={'-' + (i * 35 / 100).toFixed(2) + 's'} repeatCount="indefinite" />
        </rect>
      ))}
    </Svg>
  );
}

const chevrons = (y) => Array.from({ length: 9 }, (_, i) => `M${-36 + 36 * i} ${y} l14 14 l-14 14`).join(' ');
function Chevrons({ ac }) {
  return (
    <Svg fill="none" stroke={ac} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <g>
        <animateTransform attributeName="transform" type="translate" from="0 0" to="36 0" dur="0.7s" repeatCount="indefinite" />
        {[38, 96, 154].map((y) => <path key={y} d={chevrons(y)} />)}
      </g>
    </Svg>
  );
}

const RAYS = [['146.0', '110.0', '194.0', '110.0'], ['142.0', '125.0', '166.2', '139.0'], ['131.0', '136.0', '155.0', '177.5'], ['116.0', '140.0', '116.0', '168.0'], ['101.0', '136.0', '77.0', '177.5'], ['90.0', '125.0', '65.8', '139.0'], ['86.0', '110.0', '38.0', '110.0'], ['90.0', '95.0', '65.8', '81.0'], ['101.0', '84.0', '77.0', '42.5'], ['116.0', '80.0', '116.0', '52.0'], ['131.0', '84.0', '155.0', '42.5'], ['142.0', '95.0', '166.2', '81.0']];
// [cx, cy, r, duration, begin]
const SPARKS = [[40, 40, 3, '1.8s'], [196, 58, 2.5, '2.2s', '-0.7s'], [190, 190, 3, '2s', '-1.2s'], [34, 178, 2.5, '1.6s', '-0.4s']];
function Burst({ ac }) {
  return (
    <Svg fill="none">
      <g stroke={ac} strokeWidth="4" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 116 110" to="30 116 110" dur="3s" repeatCount="indefinite" />
        {RAYS.map(([x1, y1, x2, y2]) => <line key={x2 + y2} x1={x1} y1={y1} x2={x2} y2={y2} />)}
      </g>
      <circle cx="116" cy="110" r="16" fill={ac}>
        <animate attributeName="r" values="13;19;13" {...WAVE} dur="1.5s" repeatCount="indefinite" />
      </circle>
      {SPARKS.map(([cx, cy, r, dur, begin]) => (
        <circle key={cx} cx={cx} cy={cy} r={r} fill={ac}>
          <animate attributeName="opacity" values="0;1;0" {...WAVE} dur={dur} begin={begin} repeatCount="indefinite" />
        </circle>
      ))}
    </Svg>
  );
}

// The Enneagram figure, 9 at the top and clockwise, with the type's point and its two lines drawn in.
const LINES = { 1: [4, 7], 2: [4, 8], 3: [6, 9], 4: [1, 2], 5: [7, 8], 6: [3, 9], 7: [1, 5], 8: [2, 5], 9: [3, 6] };
function enneagram(n) {
  const CX = 116, CY = 112, RR = 72;
  const P = (k) => { const a = (-90 + 40 * (k % 9)) * Math.PI / 180; return [CX + RR * Math.cos(a), CY + RR * Math.sin(a)]; };
  const f = (q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1);
  const all = 'M' + [9, 3, 6].map((k) => f(P(k))).join('L') + 'Z M' + [1, 4, 2, 8, 5, 7].map((k) => f(P(k))).join('L') + 'Z';
  let dots = '';
  for (let k = 1; k <= 9; k++) { const q = P(k); dots += 'M' + (q[0] - 3).toFixed(1) + ' ' + q[1].toFixed(1) + 'a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'; }
  const [a, b] = LINES[n];
  const q = P(n);
  return { all, dots, hi: 'M' + f(P(a)) + 'L' + f(q) + 'L' + f(P(b)), x: q[0].toFixed(1), y: q[1].toFixed(1) };
}
function Ennea({ ac, num }) {
  const en = enneagram(num || 9);
  return (
    <Svg fill="none">
      <circle cx="116" cy="112" r="72" stroke={ac} strokeOpacity="0.32" strokeWidth="1.5" />
      <path d={en.all} stroke={ac} strokeOpacity="0.32" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={en.dots} fill={ac} fillOpacity="0.55" />
      <path d={en.hi} pathLength="100" stroke={ac} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="100 100">
        <animate attributeName="stroke-dashoffset" values="100;0;0;-100" keyTimes="0;0.45;0.75;1" dur="5s" repeatCount="indefinite" />
      </path>
      <circle cx={en.x} cy={en.y} r="12" stroke={ac} strokeWidth="1.5" fill="none">
        <animate attributeName="r" values="7;16;7" {...WAVE} dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.9;0;0.9" {...WAVE} dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={en.x} cy={en.y} r="6" fill={ac} />
    </Svg>
  );
}

export const PATTERNS = {
  waves: Waves, bars: Bars, dashes: Dashes, orbit: Orbit, still: Still, petals: Petals, contours: Contours, dots: Dots,
  zigzag: Zigzag, slash: Slash, nest: Nest, stars: Stars, gears: Gears, grid: Grid, chevrons: Chevrons, burst: Burst, ennea: Ennea
};
