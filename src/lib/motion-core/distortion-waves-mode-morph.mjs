const DURATION = 540;
const EASING = "cubic-bezier(.24,.8,.28,1)";
const px = (value) => `${value}px`;

export function createModeMorph(scope, { card, contentLayer, revealedLayer, overlay, button, segment }) {
  const highlight = segment.querySelector(".dw-mode-highlight");
  const styles = (element) => scope.window.getComputedStyle(element);
  let running;

  function positionHighlight() {
    const selected = segment.querySelector('[aria-pressed="true"]');
    if (!selected.offsetWidth) return;
    highlight.style.width = px(selected.offsetWidth);
    highlight.style.height = px(selected.offsetHeight);
    highlight.style.transform = `translate(${px(selected.offsetLeft)}, ${px(selected.offsetTop)})`;
    if (!segment.hasAttribute("data-highlight-ready")) {
      scope.requestAnimationFrame(() => { segment.dataset.highlightReady = ""; });
    }
  }

  function cardSize() {
    const { width, height } = styles(card);
    return { width, height };
  }

  function buttonBox() {
    const { left, top, width, height, borderRadius } = styles(button);
    return {
      left: left === "auto" ? px(button.offsetLeft) : left,
      top: top === "auto" ? px(button.offsetTop) : top,
      width, height, borderRadius,
    };
  }

  function copyView(layer) {
    const view = layer.querySelector(".dw-view");
    const { width, padding, justifyContent, alignItems, gap, minHeight } = styles(view);
    const copy = view.cloneNode(true);
    copy.classList.add("dw-mode-view");
    copy.setAttribute("aria-hidden", "true");
    copy.setAttribute("data-dw-skip", "");
    copy.inert = true;
    Object.assign(copy.style, { width, padding, justifyContent, alignItems, gap, minHeight });
    return copy;
  }

  function makeLabel() {
    const label = scope.document.createElement("span");
    label.className = "dw-mode-label";
    const { fontSize, flexDirection } = styles(button);
    Object.assign(label.style, { fontSize, flexDirection });
    return label;
  }

  function visibleCopies(elements) {
    return elements.flatMap(element => {
      const { opacity, transform } = styles(element);
      if (Number(opacity) < .04) return [];
      const copy = element.cloneNode(true);
      Object.assign(copy.style, { opacity, transform });
      return [copy];
    });
  }

  function capture() {
    const geometry = { card: cardSize(), button: buttonBox(), mode: card.dataset.mode };
    if (running) {
      return { ...geometry, views: visibleCopies(running.views), labels: visibleCopies(running.labels) };
    }
    const shown = revealedLayer.getAttribute("aria-hidden") === "false" ? revealedLayer : contentLayer;
    const label = makeLabel();
    label.append(...Array.from(button.childNodes, node => node.cloneNode(true)));
    return { ...geometry, views: [copyView(shown)], labels: [label] };
  }

  function finish() {
    if (!running) return;
    for (const animation of running.animations) animation.cancel();
    for (const copy of running.views) copy.remove();
    running.newLabel.replaceWith(...running.newLabel.childNodes);
    for (const label of running.labels) label.remove();
    delete card.dataset.modeMorph;
    running = null;
  }

  function animate(from) {
    const mode = card.dataset.mode;
    const toCard = cardSize();
    const toButton = buttonBox();
    const newView = copyView(contentLayer);
    const newLabel = makeLabel();
    newLabel.append(...button.childNodes);
    for (const label of from.labels) label.setAttribute("aria-hidden", "true");
    const views = [...from.views, newView];
    const labels = [...from.labels, newLabel];
    card.append(...views);
    button.append(...labels);
    card.dataset.modeMorph = "";

    const animations = [card.animate([from.card, toCard], {
      duration: DURATION, easing: EASING, fill: "both",
    })];
    const buttonFrames = [from.button, toButton];
    if (mode === "horizontal" || from.mode === "horizontal") {
      const toRail = mode === "horizontal";
      const rail = toRail ? toButton : from.button;
      const midpoint = (parseFloat(from.button.top) + parseFloat(toButton.top)) / 2;
      // Keep the intermediate pill narrow so it doesn't cover the card's copy.
      buttonFrames.splice(1, 0, {
        offset: toRail ? .38 : .46,
        left: rail.left,
        top: px(midpoint),
        width: "68px",
        height: "48px",
        borderRadius: "22px",
      });
    }
    animations.push(button.animate(buttonFrames, { duration: DURATION, easing: EASING, fill: "both" }));

    const direction = mode === "horizontal" ? 1 : from.mode === "horizontal" ? -1 : 0;
    const travel = direction ? `translateX(${direction * 14}px)` : "translateY(9px)";
    const exit = direction ? `translateX(${direction * -9}px)` : "translateY(-7px)";
    for (const copy of from.views) {
      animations.push(copy.animate([
        { opacity: copy.style.opacity || 1, transform: copy.style.transform || "none" },
        { opacity: 0, transform: exit },
      ], { duration: 205, easing: EASING, fill: "both" }));
    }
    animations.push(newView.animate([
      { opacity: 0, transform: travel },
      { opacity: 1, transform: "none" },
    ], { delay: 105, duration: 365, easing: EASING, fill: "both" }));

    for (const label of from.labels) {
      animations.push(label.animate([
        { opacity: label.style.opacity || 1 }, { opacity: 0 },
      ], { duration: 135, easing: EASING, fill: "both" }));
    }
    animations.push(newLabel.animate([
      { opacity: 0 }, { opacity: 1 },
    ], { delay: 205, duration: 225, easing: EASING, fill: "both" }));

    const transition = { animations, views, labels, newLabel };
    running = transition;
    animations[0].addEventListener("finish", () => {
      if (running === transition) finish();
    }, { once: true });
  }

  function change(render) {
    const from = scope.reduced() || !overlay.offsetWidth ? null : capture();
    finish();
    render();
    if (from) animate(from);
  }

  new scope.ResizeObserver(positionHighlight).observe(segment);
  scope.window.addEventListener("resize", finish);
  scope.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", finish);
  scope.addCleanup(finish);
  return { change, finish, positionHighlight };
}
