/* Supplied HTML adaptation. Design reference: @imharshin.
   No separate license was included for the HTML or embedded backdrop. */
export function createGenieMenu(scope, initial = {}) {
  const { document, on, requestAnimationFrame, cancelAnimationFrame, setTimeout, clearTimeout } = scope;
  let options = { ...initial };
  let focusOnOpen = null;
  const BTN_CX = 286;
  const BTN_CY = 24;

  // DOM refs
  const triggerBtn = document.getElementById("triggerBtn");
  const iconDots = document.getElementById("iconDots");
  const iconClose = document.getElementById("iconClose");
  const menuCard = document.getElementById("menuCard");
  const menuList = document.getElementById("menuList");
  const hoverPill = document.getElementById("hoverPill");
  const menuButtons = Array.from(document.querySelectorAll(".menu-item-btn"));
  const actionToast = document.getElementById("actionToast");

  const gooBlur = document.getElementById("gooBlur");
  const surfaceDroplet = document.getElementById("surfaceDroplet");
  const shadowDroplet = document.getElementById("shadowDroplet");
  const contactDroplet = document.getElementById("contactDroplet");
  const strokeBtn = document.getElementById("strokeBtn");
  const surfaceGooGroup = document.getElementById("surfaceGooGroup");
  const shadowGooGroup = document.getElementById("shadowGooGroup");
  const contactGooGroup = document.getElementById("contactGooGroup");

  const speedNormalBtn = document.getElementById("speedNormal");
  const speedSlowBtn = document.getElementById("speedSlow");

  // Preserve the asymmetric opening and closing durations from the supplied HTML.
  const OPEN_DURATION = 470;
  const CLOSE_DURATION = 175;

  let isOpen = false;
  let direction = -1;       // +1 opening, -1 closing
  let progress = 0;         // spatial progress p in [0, 1]
  let animU = 0;            // normalized elapsed time u in [0, 1]
  let speedMultiplier = initial.speed ?? 1;
  let rafId = null;
  let lastTime = 0;
  let toastTimer = null;

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function easeOutCubic(t) {
    const u = clamp(t, 0, 1);
    return 1 - Math.pow(1 - u, 3);
  }

  function easeOutQuart(t) {
    const u = clamp(t, 0, 1);
    return 1 - Math.pow(1 - u, 4);
  }

  function easeInOutCubic(t) {
    const u = clamp(t, 0, 1);
    return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  }

  /**
   * Exact cubic-bezier evaluator for custom velocity curves.
   */
  function cubicBezier(x1, y1, x2, y2, t) {
    const u = clamp(t, 0, 1);
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    let x = u;
    for (let i = 0; i < 6; i++) {
      const fx = ((ax * x + bx) * x + cx) * x - u;
      const dfx = (3 * ax * x + 2 * bx) * x + cx;
      if (Math.abs(dfx) < 1e-6) break;
      x -= fx / dfx;
    }
    x = clamp(x, 0, 1);
    return ((ay * x + by) * x + cy) * x;
  }

  /**
   * Open velocity curve (calibrated to slow-mo f372 -> f472):
   * - Viscous pull-out from liquid neck (0..0.24)
   * - Fast whip/bloom in 3D space (0.24..0.55)
   * - Long silky deceleration settle (0.55..1.00)
   */
  function openProgressFromU(u) {
    return cubicBezier(0.28, 0.04, 0.14, 1.0, u);
  }

  /**
   * Close velocity curve (calibrated to 60fps f302 -> f311):
   * - Immediate crisp snap-back, fast suck-in into the circular button
   */
  function closeProgressFromU(u) {
    return 1 - cubicBezier(0.42, 0.0, 0.22, 1.0, u);
  }

  /**
   * Invert monotonic curve via binary search so mid-flight interruption is seamless.
   */
  function invertCurve(fn, targetP, decreasing) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) * 0.5;
      const val = fn(mid);
      if (decreasing ? val > targetP : val < targetP) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return (lo + hi) * 0.5;
  }

  /**
   * Builds a smooth rounded trapezoid path for the SVG liquid droplet stage (p in 0..0.34).
   */
  function buildRoundedTrapezoidPath(tlx, trx, ty, blx, brx, by, r) {
    const topW = trx - tlx;
    const botW = brx - blx;
    const h = by - ty;
    if (topW <= 1 || botW <= 1 || h <= 1) return "";

    const maxR = Math.min(r, topW * 0.48, botW * 0.48, h * 0.48);
    const leftDx = blx - tlx;
    const leftLen = Math.hypot(leftDx, h);
    const rightDx = brx - trx;
    const rightLen = Math.hypot(rightDx, h);

    const lux = leftDx / leftLen;
    const luy = h / leftLen;
    const rux = rightDx / rightLen;
    const ruy = h / rightLen;

    return [
      `M ${(tlx + maxR).toFixed(2)} ${ty.toFixed(2)}`,
      `L ${(trx - maxR).toFixed(2)} ${ty.toFixed(2)}`,
      `Q ${trx.toFixed(2)} ${ty.toFixed(2)} ${(trx + rux * maxR).toFixed(2)} ${(ty + ruy * maxR).toFixed(2)}`,
      `L ${(brx - rux * maxR).toFixed(2)} ${(by - ruy * maxR).toFixed(2)}`,
      `Q ${brx.toFixed(2)} ${by.toFixed(2)} ${(brx - maxR).toFixed(2)} ${by.toFixed(2)}`,
      `L ${(blx + maxR).toFixed(2)} ${by.toFixed(2)}`,
      `Q ${blx.toFixed(2)} ${by.toFixed(2)} ${(blx - lux * maxR).toFixed(2)} ${(by - luy * maxR).toFixed(2)}`,
      `L ${(tlx + lux * maxR).toFixed(2)} ${(ty + luy * maxR).toFixed(2)}`,
      `Q ${tlx.toFixed(2)} ${ty.toFixed(2)} ${(tlx + maxR).toFixed(2)} ${ty.toFixed(2)}`,
      "Z"
    ].join(" ");
  }

  /**
   * Renders both the SVG gooey liquid pull-out (p in 0..0.34)
   * and the true 3D front-to-back spatial curve of the menu card (p in 0.22..1.00).
   */
  function render(p, dir) {
    const cp = clamp(p, 0, 1);
    const interactive = cp > 0.78 && isOpen;
    menuCard.inert = !interactive;
    menuCard.setAttribute("aria-hidden", String(!interactive));
    menuCard.dataset.progress = cp.toFixed(4);
    menuCard.dataset.state = cp === 0 ? "closed" : cp === 1 ? "open" : dir > 0 ? "opening" : "closing";
    if (interactive && focusOnOpen !== null) {
      focusItem(focusOnOpen);
      focusOnOpen = null;
    }

    // 1. Trigger button icon crossfade & rotation (... <-> + <-> ×)
    const dotsOut = smoothstep(0.0, 0.22, cp);
    iconDots.style.opacity = (1 - dotsOut).toFixed(3);
    iconDots.style.transform = `scale(${lerp(1, 0.55, dotsOut).toFixed(3)})`;
    iconDots.style.filter = dotsOut > 0.02 ? `blur(${(dotsOut * 2.4).toFixed(2)}px)` : "none";

    const closeIn = smoothstep(0.08, 0.34, cp);
    const closeRot = lerp(-45, 0, easeOutCubic(closeIn));
    iconClose.style.opacity = closeIn.toFixed(3);
    iconClose.style.transform = `rotate(${closeRot.toFixed(2)}deg) scale(${lerp(0.65, 1, closeIn).toFixed(3)})`;
    iconClose.style.filter = closeIn < 0.98 ? `blur(${((1 - closeIn) * 2.2).toFixed(2)}px)` : "none";

    // 2. SVG Gooey Liquid Droplet Stage (p in 0.004 .. 0.36)
    // Matches slow-mo f376 -> f396: compact white droplet pulls down out of the button,
    // stretches a viscous liquid neck, and pinches off cleanly right as the 3D card blooms.
    if (cp <= 0.004 || cp >= 0.36) {
      surfaceDroplet.setAttribute("d", "");
      shadowDroplet.setAttribute("d", "");
      contactDroplet.setAttribute("d", "");
      surfaceGooGroup.removeAttribute("filter");
      shadowGooGroup.removeAttribute("filter");
      contactGooGroup.removeAttribute("filter");
      strokeBtn.setAttribute("opacity", "1");
    } else {
      const dp = clamp(cp / 0.34, 0, 1);
      const pull = easeInOutCubic(dp);

      // Compact droplet emerging from button center (286, 24) downward & slightly left
      const ty = lerp(BTN_CY - 2, 64, smoothstep(0.18, 1.0, dp));
      const by = lerp(BTN_CY + 14, 134, pull);
      const trx = lerp(BTN_CX + 13, 304, pull);
      const brx = lerp(BTN_CX + 15, 306, pull);
      const tlx = lerp(BTN_CX - 13, 250, smoothstep(0.15, 1.0, dp));
      const blx = lerp(BTN_CX - 15, 236, pull);
      const dr = lerp(15, 22, pull);

      const dropPath = buildRoundedTrapezoidPath(tlx, trx, ty, blx, brx, by, dr);
      surfaceDroplet.setAttribute("d", dropPath);
      shadowDroplet.setAttribute("d", dropPath);
      contactDroplet.setAttribute("d", dropPath);

      // Gooey neck peaks while droplet is close to button (dp ~ 0.35), then pinches off by dp = 0.85
      const gooEnv = dp < 0.88 ? Math.sin(clamp(dp / 0.88, 0, 1) * Math.PI) : 0;
      const blurStd = gooEnv * 7.8;

      if (blurStd > 0.2) {
        gooBlur.setAttribute("stdDeviation", blurStd.toFixed(2));
        surfaceGooGroup.setAttribute("filter", "url(#genie-goo)");
        shadowGooGroup.setAttribute("filter", "url(#genie-goo)");
        contactGooGroup.setAttribute("filter", "url(#genie-goo)");
      } else {
        surfaceGooGroup.removeAttribute("filter");
        shadowGooGroup.removeAttribute("filter");
        contactGooGroup.removeAttribute("filter");
      }

      // Cross-fade droplet out cleanly as the 3D card takes over (p in 0.25..0.35)
      const dropFade = 1 - smoothstep(0.25, 0.35, cp);
      surfaceDroplet.setAttribute("opacity", dropFade.toFixed(3));
      shadowDroplet.setAttribute("opacity", dropFade.toFixed(3));
      contactDroplet.setAttribute("opacity", dropFade.toFixed(3));
      strokeBtn.setAttribute("opacity", (1 - gooEnv * 0.92).toFixed(3));
    }

    // 3. True 3D Front-to-Back Spatial Curve for the Menu Card (p in 0.22 .. 1.00)
    // Reproduces exact measured 60fps slow-mo trajectory (f396 -> f472):
    // - Emerges pitched back in 3D space (rotateX ~ +46deg, top receded into Z, bottom closer)
    // - Top edge dips DOWN below final resting top_y (+20px overshoot around p ~ 0.56)
    // - Then unfolds forward out of Z-space (rotateX -> 0deg, translateZ arcs forward -> 0)
    //   so the top edge swings UP & FORWARD while bottom edge cushions softly (+3px -> 0)!
    if (cp <= 0.20) {
      menuCard.style.opacity = "0";
      menuCard.style.transform = "translate3d(10px, -145px, -110px) rotateX(48deg) scale(0.24, 0.32)";
      menuCard.classList.remove("interactive");
      menuList.style.opacity = "0";
      menuList.style.filter = "none";
      return;
    }

    // Normalized card bloom phase k in [0, 1] over p in [0.22, 1.00]
    const k = clamp((cp - 0.22) / 0.78, 0, 1);

    // Card opacity snaps to 1 right during droplet handoff (p in 0.22..0.31)
    const cardOpacity = smoothstep(0.22, 0.31, cp);

    // Scale X & Y expand smoothly from droplet size (~0.24 x 0.32) to full card (1.0 x 1.0)
    const sx = lerp(0.26, 1.0, easeOutQuart(k));
    const sy = lerp(0.32, 1.0, easeOutCubic(k));

    // Front-to-back 3D tilt (rotateX):
    // Starts pitched back (+48deg -> top edge narrower ~0.78x of bottom edge, matching f400-f408!)
    // Holds strong perspective through mid-flight, then smoothly flattens to 0deg into the screen plane.
    const tiltDecay = 1 - Math.pow(smoothstep(0.05, 0.96, k), 0.92);
    const rotX = 48 * tiltDecay;

    // Subtle diagonal yaw peel from top-right anchor leftward
    const rotY = 0;

    // Front-to-back Z spatial arc:
    // Starts recessed behind the plane (-95px), swings forward slightly past the plane (+12px around k=0.62)
    // as the bottom edge lifts toward the viewer, then settles flat onto Z=0!
    const zArc = lerp(-95, 0, easeOutCubic(k)) + 16 * Math.sin(clamp(k, 0, 1) * Math.PI) * smoothstep(0.2, 0.7, k);

    // Vertical Y spatial curve (with authentic +20px top-edge dip & +3px bottom cushion overshoot!):
    // Starts high near droplet (ty = -146px relative to settled bottom-origin),
    // sweeps down past 0 to +4px cushion overshoot around k=0.68, then glides back up to 0px!
    const baseY = lerp(-146, 0, easeOutQuart(k));
    const bottomCushion = 4.5 * Math.sin(clamp((k - 0.25) / 0.75, 0, 1) * Math.PI) * (1 - k * 0.35);
    const ty = baseY + bottomCushion;

    // Horizontal drift from right-aligned button leftward to settled x
    const tx = lerp(6, 0, easeOutCubic(k));

    // Dynamic elevation shadow tracks the 3D Z-arc (deeper & softer when floating forward in mid-flight)
    const floatBoost = Math.sin(clamp(k, 0, 1) * Math.PI);
    const shadowY = lerp(12, 18, k) + floatBoost * 10;
    const shadowBlur = lerp(24, 42, k) + floatBoost * 16;
    const shadowAlpha = (lerp(0.06, 0.085, k) + floatBoost * 0.025).toFixed(3);

    // Border radius slightly compensates for initial small scale so corners stay silky round
    const dynRadius = lerp(34, 26, smoothstep(0.0, 0.6, k));

    menuCard.style.opacity = cardOpacity.toFixed(3);
    menuCard.style.borderRadius = `${dynRadius.toFixed(1)}px`;
    menuCard.style.transform =
      `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, ${zArc.toFixed(2)}px) ` +
      `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) ` +
      `scale3d(${sx.toFixed(4)}, ${sy.toFixed(4)}, 1)`;
    menuCard.style.boxShadow =
      `0 ${shadowY.toFixed(1)}px ${shadowBlur.toFixed(1)}px rgba(0, 0, 0, ${shadowAlpha}), ` +
      `0 4px 12px rgba(0, 0, 0, 0.04)`;

    // 4. Menu content blur-in & fade (asymmetric: unblurs in during 3D unfold on open,
    //    vanishes immediately in ~33ms on close matching f302 -> f304!)
    let contentVis;
    if (dir < 0) {
      // Closing: content fades & blurs out rapidly right at the start (cp: 1.0 -> 0.72)
      contentVis = smoothstep(0.70, 0.98, cp);
    } else {
      // Opening: starts appearing inside the tilted 3D card at f412 (cp ~ 0.44),
      // sharpens to crisp by f436 (cp ~ 0.84)
      contentVis = smoothstep(0.42, 0.84, cp);
    }

    const contentBlur = (1 - contentVis) * 11;
    menuList.style.opacity = contentVis.toFixed(3);
    menuList.style.filter = contentBlur > 0.08 ? `blur(${contentBlur.toFixed(2)}px)` : "none";

    if (cp > 0.78 && isOpen) {
      menuCard.classList.add("interactive");
    } else {
      menuCard.classList.remove("interactive");
    }
  }

  function tick(now) {
    if (!lastTime) lastTime = now;
    const rawDt = Math.min(now - lastTime, 50);
    lastTime = now;

    const duration = (direction > 0 ? OPEN_DURATION : CLOSE_DURATION) / speedMultiplier;
    animU = clamp(animU + rawDt / duration, 0, 1);

    progress = direction > 0 ? openProgressFromU(animU) : closeProgressFromU(animU);
    render(progress, direction);

    if (animU >= 1) {
      progress = direction > 0 ? 1 : 0;
      render(progress, direction);
      rafId = null;
      lastTime = 0;
    } else {
      rafId = requestAnimationFrame(tick);
    }
  }

  function setOpen(nextOpen) {
    if (isOpen === nextOpen) return;
    isOpen = nextOpen;
    direction = isOpen ? 1 : -1;

    triggerBtn.setAttribute("aria-expanded", String(isOpen));
    triggerBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    menuButtons.forEach((button, index) => button.tabIndex = isOpen && index === 0 ? 0 : -1);

    if (!isOpen) {
      focusOnOpen = null;
      hoverPill.classList.remove("visible");
      if (menuCard.contains(document.activeElement)) triggerBtn.focus({ preventScroll: true });
    }
    if (scope.reduced()) {
      finish();
      return;
    }

    // Seamless mid-flight interruption: find matching elapsed u for current progress
    animU = isOpen
      ? invertCurve(openProgressFromU, progress, false)
      : invertCurve(closeProgressFromU, progress, true);

    if (!rafId) {
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }
  }

  on(triggerBtn, "click", (e) => {
    e.stopPropagation();
    if (!isOpen && e.detail === 0) focusOnOpen = 0;
    setOpen(!isOpen);
  });

  on(triggerBtn, "keydown", e => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    focusOnOpen = e.key === "ArrowDown" ? 0 : menuButtons.length - 1;
    if (isOpen) { focusItem(focusOnOpen); focusOnOpen = null; }
    else setOpen(true);
  });

  function focusItem(index) {
    menuButtons.forEach((button, i) => button.tabIndex = i === index ? 0 : -1);
    menuButtons[index].focus({ preventScroll: true });
  }

  on(menuCard, "keydown", e => {
    const current = menuButtons.indexOf(document.activeElement);
    let next;
    if (e.key === "ArrowDown") next = (current + 1) % menuButtons.length;
    if (e.key === "ArrowUp") next = (current + menuButtons.length - 1) % menuButtons.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = menuButtons.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    focusItem(next);
  });

  on(menuCard, "focusout", () => {
    setTimeout(() => {
      if (isOpen && !menuCard.contains(document.activeElement) && document.activeElement !== triggerBtn) setOpen(false);
    }, 0);
  });

  menuButtons.forEach((btn) => {
    on(btn, "pointerenter", () => {
      if (!isOpen) return;
      const idx = Number(btn.dataset.index);
      hoverPill.style.transform = `translate3d(0, ${idx * 49}px, 0)`;
      hoverPill.classList.add("visible");
    });

    on(btn, "focus", () => {
      const idx = Number(btn.dataset.index);
      hoverPill.style.transform = `translate3d(0, ${idx * 49}px, 0)`;
      hoverPill.classList.add("visible");
    });

    on(btn, "click", (e) => {
      e.stopPropagation();
      if (!isOpen || progress <= .78) return;
      const action = btn.dataset.action;
      setOpen(false);
      showToast(action);
      options.onAction?.(action);
    });
  });

  on(menuList, "pointerleave", () => {
    if (!menuList.contains(document.activeElement)) hoverPill.classList.remove("visible");
  });

  on(document.getElementById("stage"), "click", (e) => {
    if (isOpen && !e.target.closest("#menuAnchor") && !e.target.closest(".speed-control")) {
      setOpen(false);
    }
  });

  on(document.getElementById("menuAnchor"), "keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      setOpen(false);
      triggerBtn.focus();
    }
  });

  function showToast(label) {
    actionToast.textContent = label;
    actionToast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      actionToast.classList.remove("show");
    }, 1600);
  }

  [speedNormalBtn, speedSlowBtn].forEach((btn) => {
    on(btn, "click", (e) => {
      e.stopPropagation();
      setSpeed(Number(btn.dataset.speed));
    });
  });

  function setSpeed(speed) {
    speedMultiplier = speed;
    speedNormalBtn.classList.toggle("active", speed === 1);
    speedSlowBtn.classList.toggle("active", speed === .3);
    speedNormalBtn.setAttribute("aria-pressed", String(speed === 1));
    speedSlowBtn.setAttribute("aria-pressed", String(speed === .3));
  }

  function finish() {
    cancelAnimationFrame(rafId);
    rafId = null;
    lastTime = 0;
    animU = 1;
    progress = isOpen ? 1 : 0;
    render(progress, direction);
  }

  menuButtons.forEach(button => button.tabIndex = -1);
  triggerBtn.setAttribute("aria-haspopup", "menu");
  setSpeed(speedMultiplier);
  render(0, -1);
  if (initial.open) setOpen(true);
  return {
    refresh() { if (scope.reduced()) finish(); },
    update(next) {
      options = { ...options, ...next };
      if (next.speed !== undefined) setSpeed(next.speed);
      if (next.open !== undefined) setOpen(next.open);
      if (scope.reduced()) finish();
    },
    destroy() { cancelAnimationFrame(rafId); clearTimeout(toastTimer); },
  };
}
