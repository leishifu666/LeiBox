import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createSurface } from '../motion-runtime';

const stylesBySlug = {
  'liquid-metal': ['metal-fx-styles', 'mfx-bare-style', 'mfx-bend-style'],
};

function Demo({ Scene, options, reducedMotion, preview, onReady }) {
  const locale = options.locale ?? 'en';
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <div
      className="library-demo"
      lang={locale}
      data-preview={preview}
      data-controls={options.showControls !== false}
      data-reduced={reducedMotion}
    >
      <Scene options={options} reducedMotion={reducedMotion} preview={preview} locale={locale} />
    </div>
  );
}

export function mountLibraryDemo(target, initialOptions, scene, settings = {}) {
  const { Scene, slug, width, height, css } = scene;
  const { preview = false, onReady } = settings;
  let options = { ...initialOptions };
  let destroyed = false;
  const scope = createSurface(target, { markup: '', css, width, height, responsive: true }, options);
  const reactRoot = createRoot(scope.body);
  const document = target.ownerDocument;
  const media = document.defaultView.matchMedia('(prefers-reduced-motion: reduce)');
  const draw = () => reactRoot.render(
    <Demo Scene={Scene} options={options} reducedMotion={scope.reduced() || document.hidden} preview={preview} onReady={onReady} />,
  );

  // These upstream packages install CSS in the document head. Mirror their own
  // rules into the existing LeiBox shadow surface, including late effect styles.
  const styleIds = stylesBySlug[slug];
  if (styleIds) {
    const mirror = () => {
      for (const id of styleIds) {
        const source = document.getElementById(id);
        if (source && !scope.root.getElementById(id)) scope.root.append(source.cloneNode(true));
      }
    };
    const observer = new document.defaultView.MutationObserver(mirror);
    observer.observe(document.head, { childList: true });
    scope.addCleanup(() => observer.disconnect());
    mirror();
  }

  scope.on(media, 'change', draw);
  scope.on(document, 'visibilitychange', draw);
  draw();
  return {
    ...scope.controller,
    update(next) {
      if (destroyed) return;
      options = { ...options, ...next };
      scope.controller.update(next);
      draw();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      scope.controller.destroy();
      // An outer React entry may be in the middle of its own unmount commit.
      queueMicrotask(() => reactRoot.unmount());
    },
  };
}
