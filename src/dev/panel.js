// Dev only: a slider panel built from a schema, shared by the playgrounds in src/dev.
// Each control is { key, label, type: 'range' | 'select' | 'color' | 'check', ... } or { type: 'heading', label }.
// State is remembered per tool in localStorage (when the browser allows it); presets are partial states.

export function panel(root, { tool, schema, presets = {}, onChange }) {
  const defaults = Object.fromEntries(schema.filter((c) => c.key).map((c) => [c.key, c.value]));
  const store = 'dev-pg-' + tool;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(store) || '{}'); } catch (e) {}
  const state = { ...defaults, ...saved };
  const inputs = {};

  const bar = document.createElement('div');
  bar.className = 'pg-presets';
  for (const name of Object.keys(presets)) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = name;
    b.addEventListener('click', () => set({ ...defaults, ...presets[name] }));
    bar.appendChild(b);
  }
  const reset = document.createElement('button');
  reset.type = 'button'; reset.textContent = 'Reset'; reset.className = 'pg-reset';
  reset.addEventListener('click', () => set(defaults));
  bar.appendChild(reset);
  root.appendChild(bar);

  for (const c of schema) {
    if (c.type === 'heading') {
      const h = document.createElement('h3'); h.textContent = c.label; root.appendChild(h); continue;
    }
    const row = document.createElement('label');
    row.className = 'pg-row' + (c.type === 'check' ? ' is-check' : '');
    const name = document.createElement('span'); name.textContent = c.label;
    let input, out;
    if (c.type === 'range') {
      input = document.createElement('input');
      Object.assign(input, { type: 'range', min: c.min, max: c.max, step: c.step ?? 1 });
      out = document.createElement('output');
    } else if (c.type === 'select') {
      input = document.createElement('select');
      input.innerHTML = c.options.map((o) => `<option value="${o}">${o}</option>`).join('');
    } else if (c.type === 'color') {
      input = document.createElement('input'); input.type = 'color';
    } else {
      input = document.createElement('input'); input.type = 'checkbox';
    }
    input.addEventListener('input', () => {
      state[c.key] = c.type === 'range' ? +input.value : c.type === 'check' ? input.checked : input.value;
      sync(); emit();
    });
    inputs[c.key] = { input, out, c };
    if (c.type === 'check') row.append(input, name); else row.append(name, input, ...(out ? [out] : []));
    root.appendChild(row);
  }

  function sync() {
    for (const k in inputs) {
      const { input, out, c } = inputs[k];
      if (c.type === 'check') input.checked = !!state[k]; else input.value = state[k];
      if (out) out.textContent = state[k] + (c.unit || '');
    }
  }
  function emit() {
    try { localStorage.setItem(store, JSON.stringify(state)); } catch (e) {}
    onChange(state);
  }
  function set(next) { Object.assign(state, next); sync(); emit(); }
  sync();
  // first paint after the caller has finished setting up
  queueMicrotask(() => onChange(state));
  return { state, set };
}

// A SwiftUI-style spring (response in seconds, damping ratio) as a CSS linear() easing and how long it runs.
// Lets plain CSS transitions move on the same springs the wheel engine uses.
export function springEasing(response, damping) {
  const k = Math.pow((2 * Math.PI) / response, 2), c = (4 * Math.PI * damping) / response;
  let x = 0, v = 0, t = 0;
  const h = 1 / 600, pts = [];
  let settled = 0;
  while (t < 3) {
    for (let i = 0; i < 10; i++) { const a = -k * (x - 1) - c * v; v += a * h; x += v * h; t += h; }
    pts.push(x);
    if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) { if (++settled > 6) break; } else settled = 0;
  }
  const ms = Math.round(t * 1000);
  // keep enough points to trace the curve without bloating the CSS
  const step = Math.max(1, Math.floor(pts.length / 48));
  const kept = pts.filter((_, i) => i % step === 0);
  kept[kept.length - 1] = 1;
  return { ms, easing: 'linear(0, ' + kept.map((p) => +p.toFixed(4)).join(', ') + ')' };
}

// a step-by-step spring for JS-driven motion (one value toward a target)
export function springStepper(response, damping) {
  const k = Math.pow((2 * Math.PI) / response, 2), c = (4 * Math.PI * damping) / response;
  return (s, target, dt) => {
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) { const a = -k * (s.x - target) - c * s.v; s.v += a * h; s.x += s.v * h; }
    const done = Math.abs(s.x - target) < 0.0005 && Math.abs(s.v) < 0.002;
    if (done) { s.x = target; s.v = 0; }
    return !done;
  };
}

export function copyButton(btn, getText) {
  btn.addEventListener('click', async () => {
    const label = btn.textContent;
    try { await navigator.clipboard.writeText(getText()); btn.textContent = 'Copied'; } catch (e) { btn.textContent = 'Select the text'; }
    setTimeout(() => { btn.textContent = label; }, 1400);
  });
}
