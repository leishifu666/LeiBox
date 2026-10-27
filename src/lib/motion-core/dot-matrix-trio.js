/* global scope */
// Independently reconstructed from a recorded design; no original assets or code.
const scene = document.querySelector('.dm-scene');
const stage = scene.querySelector('.dm-stage');
const posters = [...scene.querySelectorAll('.dm-poster')];
const canvases = posters.map(node => node.querySelector('canvas'));
const contexts = canvases.map(canvas => canvas.getContext('2d'));
const brandMark = new Path2D(scene.querySelector('[data-dm-symbol] path').getAttribute('d'));
const status = scene.querySelector('.dm-status');
const media = window.matchMedia('(prefers-reduced-motion: reduce)');
const tau = Math.PI * 2;
let clock = 0, last = 0, frame = 0, paused = false, visible = true, disposed = false, optionObserver;
let density = 0;

function mark(ctx, x, y, size, color) {
  ctx.save(); ctx.translate(x + size / 2, y + size / 2);
  ctx.scale(size / 416.774, size / 416.774); ctx.translate(-256, -256);
  ctx.fillStyle = color; ctx.fill(brandMark, 'evenodd'); ctx.restore();
}
function dot(ctx, x, y, radius, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, tau); ctx.fill();
}
function draw() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (density !== dpr) {
    density = dpr;
    canvases.forEach(canvas => { canvas.width = Math.round(213 * dpr); canvas.height = Math.round(213 * dpr); });
  }
  contexts.forEach((ctx, index) => {
    ctx.setTransform(density, 0, 0, density, 0, 0);
    ctx.fillStyle = index === 2 ? '#fdfdfd' : '#050505'; ctx.fillRect(0, 0, 213, 213);
    if (index < 2) { ctx.fillStyle = '#000'; ctx.fillRect(8, 12, 197, 191); }
    const phase = (clock + 2 - 1 / 30) % 2;
    const radius = phase * 76;
    for (let row = 0; row < 20; row++) for (let col = 0; col < 20; col++) {
      const x = 20 + col * 173 / 19, y = 20 + row * 173 / 19;
      const dx = x - 106.5, dy = y - 106.5, distance = Math.hypot(dx, dy);
      if (index < 2 && col >= 8 && col <= 11 && row >= 8 && row <= 11) continue;
      if (index === 2 && col >= 9 && col <= 10 && row >= 9 && row <= 10) continue;
      let color;
      if (index === 0) color = Math.sin(distance * .074 + 1.37 - clock * Math.PI / 2) > 0 ? '#dfff8f' : '#31afe9';
      else if (index === 1) {
        const wave = Math.sin(Math.atan2(dy, dx) * 8 + distance * .156 + 4.97 - clock * 4);
        if (wave < .25) continue;
        color = '#dfff8f';
      } else {
        const corner = (col <= 1 || col >= 18) && (row <= 1 || row >= 18) && !((col === 1 || col === 18) && (row === 1 || row === 18));
        if (corner) color = '#050505';
        else if (distance <= radius) color = '#e4ff8e';
        else continue;
      }
      dot(ctx, x, y, 3.35, color);
    }
    mark(ctx, 97.5, 97.5, 18, index === 2 ? '#050505' : '#fdfdfd');
  });
  scene.dataset.time = clock.toFixed(3);
  scene.dataset.paused = String(paused);
  scene.dataset.motion = media.matches ? 'reduced' : 'full';
  document.body.dataset.motionReady = 'true';
}
function stop() { cancelAnimationFrame(frame); frame = 0; last = 0; }
function tick(now) {
  frame = 0;
  if (disposed || paused || !visible || document.hidden || media.matches) { last = 0; return; }
  if (last) clock += Math.min((now - last) / 1000, .05);
  last = now; draw(); frame = requestAnimationFrame(tick);
}
function wake() {
  if (!frame && !disposed && !paused && visible && !document.hidden && !media.matches) frame = requestAnimationFrame(tick);
}
function toggle() {
  paused = !paused; posters.forEach(poster => poster.setAttribute('aria-pressed', String(paused)));
  status.textContent = paused ? 'Animation paused' : media.matches ? 'Still frame · reduced motion' : 'Animation playing';
  if (paused) stop(); else wake(); draw();
}
function reset() {
  clock = 0; paused = false; stop(); posters.forEach(poster => poster.setAttribute('aria-pressed', 'false'));
  status.textContent = 'Animation reset'; draw(); wake();
}
posters.forEach(poster => {
  poster.addEventListener('click', toggle);
  poster.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'Home') { event.preventDefault(); reset(); }
    else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); paused = true; stop(); clock = Math.max(0, clock + (event.key === 'ArrowRight' ? 1 : -1) / 30);
      posters.forEach(node => node.setAttribute('aria-pressed', 'true')); status.textContent = 'Animation stepped one frame'; draw();
    }
  });
});
function syncMotion() { stop(); draw(); wake(); }
media.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', () => document.hidden ? stop() : wake());
const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) wake(); else stop(); });
intersection.observe(scene);
function resize() {
  const rect = scene.getBoundingClientRect();
  stage.style.setProperty('--dm-scale', String(Math.min(rect.width / 960, rect.height / 540)));
  draw();
}
const observer = new ResizeObserver(resize); observer.observe(scene);
function dispose() {
  disposed = true; stop(); observer.disconnect(); intersection.disconnect(); optionObserver?.disconnect(); media.removeEventListener('change', syncMotion);
  canvases.forEach(canvas => { canvas.width = 0; canvas.height = 0; });
}
if (typeof scope !== 'undefined') {
  scope.addCleanup(dispose);
  optionObserver = new MutationObserver(syncMotion);
  optionObserver.observe(scope.element, { attributes: true, attributeFilter: ['data-reduced-motion'] });
} else window.addEventListener('pagehide', dispose, { once: true });
resize(); draw(); wake();
