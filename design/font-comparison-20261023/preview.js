const families = { mi: 'MiSans Preview', harmony: 'Harmony Preview', alibaba: 'Alibaba Preview', noto: 'Noto Preview', system: 'Microsoft YaHei' };
const select = document.querySelector('#font-select');
const preview = document.querySelector('#site-preview');
function setFont(key) {
  select.value = key;
  preview.style.setProperty('--sample-font', `'${families[key]}'`);
}
select.addEventListener('change', () => setFont(select.value));
for (const button of document.querySelectorAll('[data-select]')) {
  button.addEventListener('click', () => {
    setFont(button.dataset.select);
    document.querySelector('#page-preview').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    select.focus({ preventScroll: true });
  });
}
document.querySelector('#theme').addEventListener('click', (event) => {
  const dark = document.body.classList.toggle('dark');
  event.currentTarget.setAttribute('aria-pressed', String(dark));
  event.currentTarget.textContent = dark ? '切换浅色' : '切换深色';
});
window.previewReady = false;
Promise.all(Object.entries(families).filter(([key]) => key !== 'system').flatMap(([, family]) => [400, 500].map((weight) => document.fonts.load(`${weight} 16px "${family}"`, '装下你的 UI 灵感与组件'))))
  .then(() => document.fonts.ready)
  .then(() => {
    const loaded = Object.entries(families).filter(([key]) => key !== 'system').every(([, family]) => document.fonts.check(`400 16px "${family}"`, '灵感与组件'));
    document.querySelector('#font-status').textContent = loaded ? '4 款真实字体已载入' : '部分字体未载入，请刷新后对比';
    document.querySelector('#font-status').dataset.ready = String(loaded);
    window.previewReady = loaded;
  }).catch(() => { document.querySelector('#font-status').textContent = '字体未载入，请刷新后对比'; });
