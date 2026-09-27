'use strict';
// The hero's solar system, drawn with worlds rendered in the app. Larger worlds rank higher and
// nearer orbits hold games started earlier, as in My Orbit; each world is lit from the star.
// Every so often a ship leaves the system for a world it hasn't visited: the next discovery flight.
(() => {
  const canvas = document.getElementById('orbit');
  if (!canvas || !canvas.getContext) return;
  const context = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const worlds = [
    {name: 'hades', orbit: 0.2, size: 0.058, phase: 0.9},
    {name: 'subnautica', orbit: 0.31, size: 0.046, phase: 3.6},
    {name: 'elden-ring', orbit: 0.43, size: 0.054, phase: 2.2},
    {name: 'stardew-valley', orbit: 0.56, size: 0.036, phase: 5.1},
    {name: 'cyberpunk-2077', orbit: 0.69, size: 0.044, phase: 0.1},
    {name: 'witcher-3', orbit: 0.82, size: 0.03, phase: 4.2},
    {name: 'bloodborne', orbit: 0.95, size: 0.026, phase: 1.4},
  ];
  const destinations = ['nine-sols', 'tears-of-the-kingdom', 'god-of-war-ragnarok'];
  const cycle = 13000;
  // Sprites include landmarks around the body, so they are drawn larger than the body radius.
  const spriteScale = 2.45;
  let random = 7;
  const next = () => (random = (random * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({length: 170}, () => ({x: next(), y: next(), r: 0.35 + next() * 0.85, a: 0.2 + next() * 0.5}));
  const sprites = new Map();
  const scratch = document.createElement('canvas');
  const shade = scratch.getContext('2d');
  let width = 0, height = 0, scale = 1, frame = 0, visible = true;
  const start = performance.now();

  for (const name of [...worlds.map(world => world.name), ...destinations]) {
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('load', () => {
      sprites.set(name, image);
      if (!frame) draw(elapsed());
    });
    image.src = `images/worlds/${name}.webp`;
  }

  function elapsed() {
    return still.matches ? 0 : performance.now() - start;
  }

  function layout() {
    const box = canvas.getBoundingClientRect();
    scale = Math.min(window.devicePixelRatio || 1, 2);
    width = box.width; height = box.height;
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const between = (time, from, to) => clamp((time - from) / (to - from));

  function draw(time) {
    const narrow = width < 820;
    const cx = narrow ? width * 0.5 : width * 0.72;
    const cy = narrow ? 220 : height * 0.5;
    const reach = narrow ? Math.min(width * 0.62, 290) : Math.min(width * 0.42, height * 0.95);
    const tilt = 0.34;
    const sunRadius = Math.max(14, reach * 0.05);
    context.clearRect(0, 0, width, height);

    for (const s of stars) {
      context.globalAlpha = s.a;
      context.fillStyle = '#c7cbe0';
      context.beginPath(); context.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
    context.strokeStyle = 'rgba(162,170,192,0.09)';
    context.lineWidth = 1;
    for (const w of worlds) {
      context.beginPath(); context.ellipse(cx, cy, w.orbit * reach, w.orbit * reach * tilt, 0, 0, Math.PI * 2); context.stroke();
    }

    const placed = worlds.map(w => {
      // Nearer worlds move faster, as orbits do. Worlds on the near side read slightly larger.
      const angle = w.phase + time * 0.000025 / Math.pow(w.orbit, 1.5);
      return {name: w.name, x: cx + Math.cos(angle) * w.orbit * reach, y: cy + Math.sin(angle) * w.orbit * reach * tilt,
        r: Math.max(5, w.size * reach * 1.2 * (1 + Math.sin(angle) * 0.06))};
    });

    flight(time, cx, cy, reach, sunRadius);
    placed.filter(p => p.y < cy).forEach(p => world(p.name, p.x, p.y, p.r, 1, cx, cy));
    sun(cx, cy, sunRadius);
    placed.filter(p => p.y >= cy).forEach(p => world(p.name, p.x, p.y, p.r, 1, cx, cy));
    ship(time, cx, cy, reach, sunRadius);
  }

  function route(cx, cy, reach, sunRadius) {
    const end = {x: cx + reach * 0.46, y: cy + reach * 0.42};
    const angle = Math.atan2(end.y - cy, end.x - cx);
    const from = {x: cx + Math.cos(angle) * sunRadius * 1.8, y: cy + Math.sin(angle) * sunRadius * 1.8};
    const length = Math.hypot(end.x - from.x, end.y - from.y);
    const control = {x: (from.x + end.x) / 2 + Math.sin(angle) * length * 0.32, y: (from.y + end.y) / 2 - Math.cos(angle) * length * 0.32};
    const at = t => ({
      x: (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * control.x + t * t * end.x,
      y: (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * control.y + t * t * end.y,
    });
    return {end, at};
  }

  // Timeline within each cycle: the new world appears faintly, the ship crosses, the world lights up,
  // then everything fades before the next destination. Reduced motion shows the completed flight.
  function progress(time) {
    if (still.matches) return {name: destinations[0], travel: 1, arrive: 1, fade: 0.35, shown: 1};
    const index = Math.floor(time / cycle) % destinations.length;
    const t = time % cycle;
    return {
      name: destinations[index],
      shown: between(t, 0, 800) * (1 - between(t, 10000, 11500)),
      travel: ease(between(t, 800, 4800)),
      arrive: ease(between(t, 4800, 5800)),
      fade: (0.55 - between(t, 5800, 10000) * 0.3) * (1 - between(t, 10000, 11500)),
      ship: t >= 800 && t < 5600 ? 1 - between(t, 4900, 5600) : 0,
      pulse: between(t, 4800, 6400),
    };
  }

  function flight(time, cx, cy, reach, sunRadius) {
    const state = progress(time);
    if (!state.shown) return;
    const path = route(cx, cy, reach, sunRadius);
    const r = Math.max(7, reach * 0.05);
    context.save();
    context.setLineDash([2, 7]);
    context.lineWidth = 1.25;
    context.strokeStyle = `rgba(163,156,255,${state.fade})`;
    context.beginPath();
    const steps = 48;
    for (let i = 0; i <= steps * state.travel; i++) {
      const p = path.at(i / steps);
      if (i === 0) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y);
    }
    context.stroke();
    context.restore();
    if (state.pulse > 0 && state.pulse < 1) {
      context.strokeStyle = `rgba(238,241,248,${0.5 * (1 - state.pulse)})`;
      context.lineWidth = 1;
      context.beginPath(); context.arc(path.end.x, path.end.y, r * (1.3 + state.pulse * 1.4), 0, Math.PI * 2); context.stroke();
    }
    world(state.name, path.end.x, path.end.y, r, state.shown * (0.28 + 0.72 * state.arrive), cx, cy);
  }

  function ship(time, cx, cy, reach, sunRadius) {
    const state = progress(time);
    if (!state.ship) return;
    const path = route(cx, cy, reach, sunRadius);
    for (let i = 14; i >= 0; i--) {
      const t = state.travel - i * 0.012;
      if (t <= 0) continue;
      const p = path.at(t);
      context.globalAlpha = state.ship * (1 - i / 15) * (i ? 0.35 : 1);
      context.fillStyle = i ? '#a39cff' : '#fff1cc';
      context.beginPath(); context.arc(p.x, p.y, i ? 1.4 : 2.4, 0, Math.PI * 2); context.fill();
    }
    const head = path.at(state.travel);
    const glow = context.createRadialGradient(head.x, head.y, 0, head.x, head.y, 10);
    glow.addColorStop(0, 'rgba(255,241,204,0.55)'); glow.addColorStop(1, 'rgba(255,241,204,0)');
    context.globalAlpha = state.ship;
    context.fillStyle = glow; context.beginPath(); context.arc(head.x, head.y, 10, 0, Math.PI * 2); context.fill();
    context.globalAlpha = 1;
  }

  function sun(x, y, r) {
    const corona = context.createRadialGradient(x, y, r * 0.6, x, y, r * 7);
    corona.addColorStop(0, 'rgba(246,185,79,0.4)');
    corona.addColorStop(0.35, 'rgba(246,185,79,0.09)');
    corona.addColorStop(1, 'rgba(246,185,79,0)');
    context.fillStyle = corona; context.beginPath(); context.arc(x, y, r * 7, 0, Math.PI * 2); context.fill();
    const core = context.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
    core.addColorStop(0, '#ffffff'); core.addColorStop(0.55, '#fff1cc'); core.addColorStop(1, '#f6b94f');
    context.fillStyle = core; context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
  }

  // Draws a rendered world, then darkens the side facing away from the star on its opaque pixels only.
  function world(name, x, y, r, alpha, sx, sy) {
    const image = sprites.get(name);
    if (!image || alpha <= 0) return;
    const drawn = r * spriteScale;
    const size = Math.max(8, Math.ceil(drawn * scale));
    if (scratch.width < size) scratch.width = scratch.height = size;
    shade.globalCompositeOperation = 'source-over';
    shade.clearRect(0, 0, scratch.width, scratch.height);
    shade.drawImage(image, 0, 0, size, size);
    const dx = sx - x, dy = sy - y, d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d, half = size / 2, body = half / spriteScale * 2;
    const night = shade.createLinearGradient(half + ux * body, half + uy * body, half - ux * body, half - uy * body);
    night.addColorStop(0, 'rgba(10,15,30,0)');
    night.addColorStop(0.45, 'rgba(10,15,30,0.12)');
    night.addColorStop(1, 'rgba(10,15,30,0.82)');
    shade.globalCompositeOperation = 'source-atop';
    shade.fillStyle = night;
    shade.fillRect(0, 0, size, size);
    context.globalAlpha = alpha;
    context.drawImage(scratch, 0, 0, size, size, x - drawn / 2, y - drawn / 2, drawn, drawn);
    context.globalAlpha = 1;
  }

  function loop() {
    draw(elapsed());
    frame = visible && !still.matches && !document.hidden ? requestAnimationFrame(loop) : 0;
  }
  function resume() {
    if (!frame && visible && !still.matches && !document.hidden) frame = requestAnimationFrame(loop);
    else if (still.matches) draw(0);
  }
  layout(); draw(elapsed());
  new ResizeObserver(() => { layout(); draw(elapsed()); }).observe(canvas);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else resume(); });
  still.addEventListener('change', () => { cancelAnimationFrame(frame); frame = 0; resume(); });
  resume();
})();
