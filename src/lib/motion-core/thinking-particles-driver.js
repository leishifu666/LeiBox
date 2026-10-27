// Procedural recreation of Shridhar's visual thinking study. All geometry is generated locally.
(() => {
  const root = document.querySelector('.thinking-demo');
  const canvas = root.querySelector('.tp-canvas');
  const visual = root.querySelector('.tp-visual');
  const stage = root.querySelector('.tp-process');
  const clock = root.querySelector('.tp-clock');
  const stop = root.querySelector('.tp-stop');
  const summary = root.querySelector('.tp-summary');
  const answer = root.querySelector('.tp-answer');
  const live = root.querySelector('.tp-status');
  const steps = [...root.querySelectorAll('.tp-step')];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const changes = [0, 2.14, 6.42, 9.78, 15.46];
  const paintCloud = createThinkingRenderer(canvas);
  let elapsed = .02, last = 0, playing = true, finished = false, expanded = false, frame = 0, stageIndex = -1, lastClock = '', answerChars = 0;
  let rotation = 0, drag = null, generation = 0;
  const nativeScope = typeof scope !== 'undefined' && typeof scope.addCleanup === 'function' ? scope : null;
  const reduced = () => media.matches;
  const bodyCopy = root.querySelector('.tp-answer-copy');
  const textNodes = [];
  const collect = element => { for (const node of element.childNodes) { if (node.nodeType === 3) textNodes.push([node, node.textContent]); else collect(node); } };
  collect(bodyCopy);
  const textLength = textNodes.reduce((n, [, text]) => n + text.length, 0);
  function typeAnswer(chars) {
    if (chars === answerChars) return;
    answerChars = chars;
    for (const [node, text] of textNodes) { node.textContent = text.slice(0, Math.max(0, chars)); chars -= text.length; }
  }
  function renderCloud(time) { visual.dataset.shape = paintCloud(time, rotation, reduced()); }
  function update() {
    const second = Math.min(20, elapsed).toFixed(1) + 's';
    if (lastClock !== second) { clock.textContent = second; lastClock = second; }
    let index = 0;
    for (let i = 0; i < changes.length; i++) if (elapsed >= changes[i]) index = i;
    if (index !== stageIndex) {
      stageIndex = index;
      root.dataset.step = String(index);
      steps.forEach((line, i) => { line.hidden = i > index; line.classList.toggle('is-current', i === index); });
      live.textContent = steps[index].textContent;
    }
    finished = elapsed >= 20;
    root.dataset.state = finished ? 'complete' : playing ? 'thinking' : 'paused';
    stage.inert = finished && !expanded;
    stage.setAttribute('aria-hidden', String(finished && !expanded));
    root.dataset.expanded = String(expanded);
    summary.hidden = !finished;
    answer.hidden = !finished || expanded;
    summary.setAttribute('aria-expanded', String(expanded));
    const label = finished ? 'Replay thinking' : playing ? 'Pause thinking' : 'Resume thinking';
    if (stop.getAttribute('aria-label') !== label) { stop.setAttribute('aria-label', label); stop.innerHTML = finished || !playing ? ICONS.play : ICONS.square; }
    if (!finished || expanded) renderCloud(Math.min(elapsed, 19.99));
    if (finished) typeAnswer(reduced() ? textLength : Math.min(textLength, Math.floor(Math.max(0, elapsed - 20.2) * 330)));
    root.querySelector('.tp-answer-actions').hidden = answerChars < textLength;
  }
  const inView = { value: true };
  const observer = new IntersectionObserver(([entry]) => { inView.value = entry.isIntersecting; last = 0; });
  observer.observe(root);
  function tick(now, revision) {
    if (revision !== generation) return;
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    if (playing && inView.value && !document.hidden && !reduced()) {
      elapsed = Math.min(24, elapsed + dt);
      update();
      if (elapsed >= 24) playing = false;
    }
    if (playing && !reduced()) frame = requestAnimationFrame(time => tick(time, revision));
  }
  function schedule() { const revision = ++generation; cancelAnimationFrame(frame); last = 0; if (playing && !reduced()) frame = requestAnimationFrame(time => tick(time, revision)); }
  function restart() {
    elapsed = reduced() ? 24 : 0; expanded = false; finished = false; playing = !reduced(); stageIndex = -1;
    root.querySelectorAll('.tp-reaction').forEach(button => button.setAttribute('aria-pressed', 'false'));
    answerChars = -1; typeAnswer(0); steps.forEach(line => line.classList.remove('is-current')); update(); schedule();
  }
  stop.addEventListener('click', () => {
    if (finished) return restart();
    playing = !playing; update(); schedule();
  });
  summary.addEventListener('click', () => { expanded = !expanded; update(); });
  root.querySelector('.tp-rerun').addEventListener('click', restart);
  async function copy(text, button) {
    const previous = button.classList.contains('tp-copy-question') ? ICONS.file : ICONS.copy;
    const label = button.classList.contains('tp-copy-question') ? 'Copy question' : 'Copy answer';
    try { await navigator.clipboard.writeText(text); button.innerHTML = ICONS.check; live.textContent = 'Copied'; }
    catch { live.textContent = 'Copy failed. Try again.'; button.setAttribute('aria-label', 'Copy failed. Try again.'); }
    setTimeout(() => { button.innerHTML = previous; button.setAttribute('aria-label', label); }, 1600);
  }
  root.querySelector('.tp-copy-question').addEventListener('click', event => copy(root.querySelector('.tp-question').textContent, event.currentTarget));
  root.querySelector('.tp-copy-answer').addEventListener('click', event => copy(bodyCopy.innerText, event.currentTarget));
  const reactions = [...root.querySelectorAll('.tp-reaction')];
  reactions.forEach(button => button.addEventListener('click', () => { const active = button.getAttribute('aria-pressed') !== 'true'; reactions.forEach(other => other.setAttribute('aria-pressed', String(other === button && active))); live.textContent = active ? 'Feedback recorded locally' : 'Feedback cleared'; }));
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, rotation }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (drag && !reduced()) { rotation = drag.rotation + (e.clientX - drag.x) * .008; renderCloud(Math.min(elapsed, 19.99)); } });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'Home'].includes(e.key)) { e.preventDefault(); rotation = e.key === 'Home' ? 0 : rotation + (e.key === 'ArrowLeft' ? -.18 : .18); renderCloud(Math.min(elapsed, 19.99)); } });
  media.addEventListener('change', restart);
  let reductionObserver;
  if (nativeScope) {
    let previous = reduced();
    reductionObserver = new MutationObserver(() => { if (previous !== reduced()) { previous = reduced(); restart(); } });
    reductionObserver.observe(root.getRootNode().host, { attributes: true, attributeFilter: ['data-reduced-motion'] });
  } else {
    const fit = () => {
      const scale = Math.min(1, window.innerWidth / 1200);
      root.style.width = '1200px'; root.style.transform = `scale(${scale})`; root.style.transformOrigin = 'top left';
      document.body.style.height = `${810 * scale}px`; document.body.style.overflow = 'hidden';
    };
    window.addEventListener('resize', fit); fit();
  }
  const teardown = () => { generation++; cancelAnimationFrame(frame); observer.disconnect(); reductionObserver?.disconnect(); };
  window.addEventListener('pagehide', teardown);
  nativeScope?.addCleanup(teardown);
  restart();
})();
