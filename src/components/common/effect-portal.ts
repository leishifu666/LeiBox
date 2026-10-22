const EFFECT_CONTENT = "canvas[layoutsubtree] > div";

/**
 * Portal target for popups on pages wrapped in an html-in-canvas effect.
 *
 * Popups portaled to `document.body` sit outside the `<canvas layoutsubtree>`
 * subtree, so the effect never captures them and they float, unaffected, above
 * the page. Rendering them inside the captured content element keeps them part
 * of the picture. The lookup starts from the trigger, so a popup only moves
 * into an effect that actually wraps it: a boxed demo on the same page must not
 * capture the page's own controls. Returns `undefined` (= `document.body`) when
 * the trigger is not inside an effect.
 */
export function effectPortalContainer(
  trigger: Element | null,
): HTMLElement | undefined {
  return trigger?.closest<HTMLElement>(EFFECT_CONTENT) ?? undefined;
}
