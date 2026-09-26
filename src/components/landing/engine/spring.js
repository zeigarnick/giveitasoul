// A SwiftUI-style spring (response in seconds, damping ratio) as stiffness k and damping c for unit mass.
export function springK(response, damping) {
  return { k: Math.pow(2 * Math.PI / response, 2), c: 4 * Math.PI * damping / response };
}

// One semi-implicit Euler step of a spring pulling `s[x]` toward `target`, velocity in `s[v]`.
export function stepSpring(s, x, v, target, sp, h) {
  const a = -sp.k * (s[x] - target) - sp.c * s[v];
  s[v] += a * h;
  s[x] += s[v] * h;
}

// CSS-style cubic-bezier easing: y for a given x, solved by bisection.
export function cubicBezier(x1, y1, x2, y2) {
  const X = (t) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const Y = (t) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  return (u) => {
    let lo = 0, hi = 1, t = u;
    for (let i = 0; i < 22; i++) { t = (lo + hi) / 2; if (X(t) < u) lo = t; else hi = t; }
    return Y(t);
  };
}

export const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Signed distance from card i to the wheel position, wrapped round a ring of n cards to (-n/2, n/2].
export function ringOffset(i, pos, n) {
  const d = i - pos;
  return ((d % n) + n * 1.5) % n - n / 2;
}
