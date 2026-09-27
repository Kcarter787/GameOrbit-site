'use strict';
// The hero's solar system: your star and your games as worlds. Larger worlds rank higher and
// nearer orbits hold games started earlier, as in the app. Each world is lit from the star.
(() => {
  const canvas = document.getElementById('orbit');
  if (!canvas || !canvas.getContext) return;
  const context = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Brand planet colors: Ember, Sand, Cyan, Steel, Violet, Verdant, plus Rose.
  const worlds = [
    {orbit: 0.17, size: 0.030, color: '#5ccfe3', phase: 0.8},
    {orbit: 0.25, size: 0.022, color: '#ee7a57', phase: 3.9},
    {orbit: 0.34, size: 0.036, color: '#9a7df5', phase: 2.2},
    {orbit: 0.44, size: 0.018, color: '#d6b06c', phase: 5.1},
    {orbit: 0.55, size: 0.026, color: '#5dbe8a', phase: 0.3},
    {orbit: 0.67, size: 0.015, color: '#8eaee6', phase: 4.4},
    {orbit: 0.80, size: 0.020, color: '#ec7fb2', phase: 1.6},
  ];
  let random = 7;
  const next = () => (random = (random * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({length: 150}, () => ({x: next(), y: next(), r: 0.4 + next() * 0.9, a: 0.25 + next() * 0.55}));
  let width = 0, height = 0, scale = 1, frame = 0, visible = true, start = performance.now();

  function layout() {
    const box = canvas.getBoundingClientRect();
    scale = Math.min(window.devicePixelRatio || 1, 2);
    width = box.width; height = box.height;
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function shade(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const mix = c => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
    return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
  }

  function draw(time) {
    const narrow = width < 820;
    const cx = narrow ? width * 0.5 : width * 0.7;
    const cy = narrow ? 210 : height * 0.5;
    const reach = narrow ? Math.min(width * 0.62, 300) : Math.min(width * 0.46, height * 1.05);
    const tilt = 0.36;
    context.clearRect(0, 0, width, height);
    for (const s of stars) {
      context.globalAlpha = s.a;
      context.fillStyle = '#c7cbe0';
      context.beginPath(); context.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
    // Orbital paths
    context.strokeStyle = 'rgba(162,170,192,0.10)';
    context.lineWidth = 1;
    for (const w of worlds) {
      context.beginPath(); context.ellipse(cx, cy, w.orbit * reach, w.orbit * reach * tilt, 0, 0, Math.PI * 2); context.stroke();
    }
    const placed = worlds.map(w => {
      // Nearer worlds move faster, as orbits do.
      const angle = w.phase + time * 0.00006 / Math.pow(w.orbit, 1.5);
      return {w, x: cx + Math.cos(angle) * w.orbit * reach, y: cy + Math.sin(angle) * w.orbit * reach * tilt,
        r: Math.max(4, w.size * reach * 1.9)};
    });
    const behind = placed.filter(p => p.y < cy), front = placed.filter(p => p.y >= cy);
    behind.forEach(p => world(p, cx, cy));
    sun(cx, cy, Math.max(16, reach * 0.055));
    front.forEach(p => world(p, cx, cy));
  }

  function sun(x, y, r) {
    const corona = context.createRadialGradient(x, y, r * 0.6, x, y, r * 7);
    corona.addColorStop(0, 'rgba(246,185,79,0.42)');
    corona.addColorStop(0.35, 'rgba(246,185,79,0.10)');
    corona.addColorStop(1, 'rgba(246,185,79,0)');
    context.fillStyle = corona; context.beginPath(); context.arc(x, y, r * 7, 0, Math.PI * 2); context.fill();
    const core = context.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
    core.addColorStop(0, '#ffffff'); core.addColorStop(0.55, '#fff1cc'); core.addColorStop(1, '#f6b94f');
    context.fillStyle = core; context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
  }

  function world(p, sx, sy) {
    const dx = sx - p.x, dy = sy - p.y, d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    const body = context.createRadialGradient(p.x + ux * p.r * 0.45, p.y + uy * p.r * 0.45, p.r * 0.1, p.x, p.y, p.r * 1.05);
    body.addColorStop(0, shade(p.w.color, 0.35)); body.addColorStop(0.55, p.w.color); body.addColorStop(1, shade(p.w.color, -0.55));
    context.fillStyle = body; context.beginPath(); context.arc(p.x, p.y, p.r, 0, Math.PI * 2); context.fill();
    // Night side, away from the star.
    const night = context.createLinearGradient(p.x + ux * p.r, p.y + uy * p.r, p.x - ux * p.r, p.y - uy * p.r);
    night.addColorStop(0, 'rgba(10,15,30,0)'); night.addColorStop(0.5, 'rgba(10,15,30,0.15)'); night.addColorStop(1, 'rgba(10,15,30,0.78)');
    context.fillStyle = night; context.beginPath(); context.arc(p.x, p.y, p.r, 0, Math.PI * 2); context.fill();
  }

  function loop(now) {
    draw(now - start);
    frame = visible && !still.matches ? requestAnimationFrame(loop) : 0;
  }
  function resume() {
    if (!frame && visible && !still.matches && !document.hidden) frame = requestAnimationFrame(loop);
    else if (still.matches) draw(0);
  }
  layout(); draw(0);
  new ResizeObserver(() => { layout(); draw(performance.now() - start); }).observe(canvas);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else resume(); });
  still.addEventListener('change', () => { cancelAnimationFrame(frame); frame = 0; resume(); });
  resume();
})();
