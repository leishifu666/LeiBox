// Capture each grapheme at its actual position. Moving glyphs are absolutely
// positioned, so narrowing a heading can never send its last character below it.
export function captureTitleLayout(node) {
  const doc = node.ownerDocument;
  const css = doc.defaultView.getComputedStyle(node);
  const bounds = node.getBoundingClientRect();
  const glyphs = [];
  const walker = doc.createTreeWalker(node, 4);
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  while (walker.nextNode()) {
    const text = walker.currentNode;
    for (const { segment, index } of segmenter.segment(text.data)) {
      const range = doc.createRange();
      range.setStart(text, index);
      range.setEnd(text, index + segment.length);
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      glyphs.push({ text: segment, x: rect.left - bounds.left, y: rect.top - bounds.top });
    }
  }
  return {
    rect: { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height },
    text: node.textContent || '', glyphs,
    fontFamily: css.fontFamily, fontSize: css.fontSize, fontWeight: css.fontWeight,
    lineHeight: css.lineHeight, letterSpacing: css.letterSpacing, color: css.color,
  };
}

const offsets = new WeakMap();

export function mountTitleLayout(node, layout, gsap) {
  node.replaceChildren();
  Object.assign(node.style, {
    fontFamily: layout.fontFamily, fontSize: layout.fontSize,
    fontWeight: layout.fontWeight, lineHeight: layout.lineHeight,
    letterSpacing: layout.letterSpacing, color: layout.color,
    whiteSpace: 'normal', overflow: 'visible',
  });
  gsap.set(node, { x: layout.rect.x, y: layout.rect.y, width: layout.rect.width, height: layout.rect.height, scale: 1 });
  const measured = [];
  for (const glyph of layout.glyphs) {
    const span = node.ownerDocument.createElement('span');
    span.textContent = glyph.text;
    Object.assign(span.style, {
      position: 'absolute', left: '0', top: '0', display: 'block',
      width: 'max-content', whiteSpace: 'pre', transformOrigin: 'left top',
      fontFamily: layout.fontFamily, fontSize: layout.fontSize,
      fontWeight: layout.fontWeight, lineHeight: layout.lineHeight,
      letterSpacing: layout.letterSpacing,
    });
    node.append(span);
    const range = node.ownerDocument.createRange();
    range.selectNodeContents(span);
    const textRect = range.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const offset = { x: textRect.left - spanRect.left, y: textRect.top - spanRect.top };
    measured.push(offset);
    gsap.set(span, { x: glyph.x - offset.x, y: glyph.y - offset.y });
  }
  offsets.set(node, measured);
}

export function tweenTitleLayout(timeline, node, from, to, duration = .62, at = 0) {
  const scale = parseFloat(to.fontSize) / parseFloat(from.fontSize);
  const measured = offsets.get(node);
  timeline.to(node, {
    x: to.rect.x, y: to.rect.y, width: to.rect.width, height: to.rect.height,
    fontSize: to.fontSize, lineHeight: to.lineHeight, color: to.color,
    duration, ease: 'power3.inOut',
  }, at);
  [...node.children].forEach((span, index) => {
    const target = to.glyphs[index], offset = measured[index];
    timeline.to(span, {
      x: target.x - offset.x * scale, y: target.y - offset.y * scale,
      scale, fontWeight: to.fontWeight,
      duration, ease: 'power3.inOut',
    }, at);
  });
  return timeline;
}
