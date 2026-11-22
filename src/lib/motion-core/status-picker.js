/* Supplied HTML adaptation. Design reference: Nitish Khagwal (@nitishkmrk).
   Original HTML and embedded avatar did not include a separate license. */
export function createStatusPicker(scope, initial = {}) {
  const { document, on, requestAnimationFrame, cancelAnimationFrame, setTimeout, clearTimeout } = scope;
  let options = { ...initial };
  let destroyed = false;
  const STATUSES = ["online", "focus", "dnd"];
  const LABELS = {
    online: "Online",
    focus: "Focus",
    dnd: "Do Not Disturb"
  };

  const avatarCluster = document.getElementById("avatarCluster");
  const avatarWrap = document.getElementById("avatarWrap");
  const pickerAnchor = document.getElementById("pickerAnchor");
  const pickerShell = document.getElementById("pickerShell");
  const collapsedTrigger = document.getElementById("collapsedTrigger");
  const tooltipPill = document.getElementById("tooltipPill");
  const tooltipMeasurer = document.getElementById("tooltipMeasurer");
  const orbButtons = Array.from(document.querySelectorAll(".status-orb"));

  // Preserve the supplied 48px dot inside its 72px glass ring.
  const COLLAPSED_W = 72;
  const COLLAPSED_H = 72;
  const COLLAPSED_DOT_SCALE = 48 / 76;

  const EXPANDED_W = 266;
  const EXPANDED_H = 94;
  const ORB_SIZE = 76;
  const ORB_PAD = 9;
  const ORB_GAP = 10;
  const ORB_X = [
    ORB_PAD,
    ORB_PAD + ORB_SIZE + ORB_GAP,
    ORB_PAD + (ORB_SIZE + ORB_GAP) * 2
  ];
  const ORB_Y = (EXPANDED_H - ORB_SIZE) / 2; // 9px exact vertical center

  const AVATAR_EXPAND_SCALE = 1.203;

  const labelWidths = { online: 94, focus: 92, dnd: 168 };
  function measureLabelWidth(key) {
    tooltipMeasurer.textContent = LABELS[key];
    const measured = Math.ceil(tooltipMeasurer.offsetWidth);
    const w = Math.max(measured + 10, key === "dnd" ? 164 : 88);
    labelWidths[key] = w;
    return w;
  }
  function measureAllLabels() {
    if (!destroyed) STATUSES.forEach(measureLabelWidth);
  }
  measureAllLabels();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measureAllLabels);
  }

  function makeSpring(initial, stiffness, damping) {
    return { val: initial, target: initial, vel: 0, k: stiffness, c: damping };
  }

  function stepSpring(sp, dt) {
    if (scope.reduced()) {
      sp.val = sp.target;
      sp.vel = 0;
      return false;
    }
    const accel = -sp.k * (sp.val - sp.target) - sp.c * sp.vel;
    sp.vel += accel * dt;
    sp.val += sp.vel * dt;
    if (Math.abs(sp.val - sp.target) < 0.002 && Math.abs(sp.vel) < 0.01) {
      sp.val = sp.target;
      sp.vel = 0;
      return false;
    }
    return true;
  }

  const spOpen = makeSpring(0, 320, 24);
  const spCollapsedScale = makeSpring(1, 420, 24);
  const orbHoverSprings = STATUSES.map(() => makeSpring(1, 460, 24));

  const spTipOpacity = makeSpring(0, 320, 28);
  const spTipY = makeSpring(8, 320, 26);
  const spTipX = makeSpring(EXPANDED_W / 2, 340, 26);
  const spTipW = makeSpring(labelWidths.focus, 340, 26);

  let isOpen = false;
  let currentStatus = initial.status ?? "online";
  let displayedTooltipLabel = null;
  let rafId = null;
  let lastTime = 0;
  let sheenTimer = null;
  const springs = [spOpen, spCollapsedScale, spTipOpacity, spTipY, spTipX, spTipW, ...orbHoverSprings];

  function ensureLoop() {
    if (scope.reduced()) {
      cancelAnimationFrame(rafId);
      rafId = null;
      springs.forEach(spring => { spring.val = spring.target; spring.vel = 0; });
      renderFrame();
      return;
    }
    if (rafId === null) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  }

  function setTooltipText(label) {
    if (!label || displayedTooltipLabel === label) return;
    displayedTooltipLabel = label;

    if (scope.reduced()) {
      tooltipPill.replaceChildren();
    }
    Array.from(tooltipPill.children).forEach((oldEl) => {
      oldEl.classList.remove("is-visible", "is-entering");
      oldEl.classList.add("is-exiting");
      setTimeout(() => {
        if (oldEl.parentNode === tooltipPill) {
          tooltipPill.removeChild(oldEl);
        }
      }, 250);
    });

    const nextEl = document.createElement("span");
    nextEl.className = "tooltip-text-layer is-entering";
    nextEl.textContent = label;
    tooltipPill.appendChild(nextEl);

    const reveal = () => {
      nextEl.classList.remove("is-entering");
      nextEl.classList.add("is-visible");
    };
    if (scope.reduced()) reveal(); else requestAnimationFrame(reveal);
  }

  function updateTooltipTarget(statusKey) {
    if (!isOpen || !statusKey) {
      spTipOpacity.target = 0;
      spTipY.target = 8;
      tooltipPill.setAttribute("aria-hidden", "true");
      ensureLoop();
      return;
    }

    const idx = STATUSES.indexOf(statusKey);
    const orbCenterX = ORB_X[idx] + ORB_SIZE / 2;
    const targetW = measureLabelWidth(statusKey);
    const blendedCenter = orbCenterX * 0.65 + (EXPANDED_W / 2) * 0.35;
    const clampedCenter = Math.max(targetW / 2 + 2, Math.min(EXPANDED_W - targetW / 2 - 2, blendedCenter));

    if (spTipOpacity.val < 0.05) {
      spTipX.val = clampedCenter;
      spTipX.vel = 0;
      spTipW.val = targetW;
      spTipW.vel = 0;
    }

    spTipX.target = clampedCenter;
    spTipW.target = targetW;
    spTipOpacity.target = 1;
    spTipY.target = 0;
    tooltipPill.setAttribute("aria-hidden", "false");
    setTooltipText(LABELS[statusKey]);
    ensureLoop();
  }

  function triggerSheen(statusKey) {
    const idx = STATUSES.indexOf(statusKey);
    const orb = orbButtons[idx];
    if (!orb) return;
    const sheen = orb.querySelector(".orb-sheen");
    if (!sheen) return;
    sheen.classList.remove("is-sweeping");
    void sheen.offsetWidth;
    sheen.classList.add("is-sweeping");
  }

  function openPicker() {
    if (isOpen) return;
    clearTimeout(sheenTimer);
    isOpen = true;
    pickerShell.dataset.open = "true";
    pickerShell.classList.add("is-open");
    collapsedTrigger.setAttribute("aria-expanded", "true");
    orbButtons.forEach((b, i) => b.tabIndex = STATUSES[i] === currentStatus ? 0 : -1);
    spOpen.target = 1;
    spCollapsedScale.target = 1;
    ensureLoop();
  }

  function closePicker(selectedKey) {
    if (!isOpen) return;
    const changed = selectedKey && selectedKey !== currentStatus;
    if (selectedKey) {
      currentStatus = selectedKey;
      collapsedTrigger.setAttribute("aria-label", "Change status (current: " + LABELS[currentStatus] + ")");
    }
    isOpen = false;
    pickerShell.dataset.open = "false";
    pickerShell.classList.remove("is-open");
    collapsedTrigger.setAttribute("aria-expanded", "false");
    orbButtons.forEach((b, i) => {
      b.setAttribute("tabindex", "-1");
      orbHoverSprings[i].target = 1;
    });

    updateTooltipTarget(null);
    spOpen.target = 0;
    ensureLoop();

    syncStatus();
    if (pickerShell.contains(document.activeElement)) collapsedTrigger.focus({ preventScroll: true });
    if (changed) {
      options.onStatusChange?.(currentStatus);
    }
    if (selectedKey && !scope.reduced()) {
      // Trigger the diagonal white light sweep right as the orb lands in the glass ring
      sheenTimer = setTimeout(() => {
        if (!isOpen) triggerSheen(currentStatus);
      }, 180);
    }
  }

  function getResponsiveScale() {
    const vw = document.querySelector(".stage").clientWidth;
    return Math.min(1, Math.max(0.1, (vw - 36) / 440));
  }

  function renderFrame() {
    const p = spOpen.val;
    const clampedP = Math.max(0, Math.min(1, p));
    const speed = Math.abs(spOpen.vel);
    const motionBlur = Math.min(4.8, speed * 0.85);
    // Reduce opacity slightly during the fastest part of the morph.
    const morphAlphaDip = Math.min(0.18, speed * 0.032);
    const respScale = getResponsiveScale();

    // 1. Dynamically keep the whole cluster optically centered
    const clusterShiftX = -74 * p * respScale;
    const clusterShiftY = 14 * p * respScale;
    avatarCluster.style.transform = `translate3d(${clusterShiftX.toFixed(2)}px, ${clusterShiftY.toFixed(2)}px, 0) scale(${respScale.toFixed(4)})`;

    // 2. Avatar scales up smoothly (1.0 -> 1.203x)
    const avScale = 1 + (AVATAR_EXPAND_SCALE - 1) * p;
    avatarWrap.style.transform = `scale(${avScale.toFixed(4)})`;

    // 3. Picker anchor rides cleanly with the expanding avatar shoulder
    const anchorShiftX = 8 * p;
    const anchorShiftY = -36 * p;
    pickerAnchor.style.transform = `translate3d(${anchorShiftX.toFixed(2)}px, ${anchorShiftY.toFixed(2)}px, 0)`;

    // 4. Outer Liquid Glass pill morph
    const shellW = COLLAPSED_W + (EXPANDED_W - COLLAPSED_W) * p;
    const shellH = COLLAPSED_H + (EXPANDED_H - COLLAPSED_H) * p;
    const collapsedScale = 1 + (spCollapsedScale.val - 1) * (1 - clampedP);

    pickerShell.style.width = Math.max(COLLAPSED_W * 0.92, shellW).toFixed(2) + "px";
    pickerShell.style.height = Math.max(COLLAPSED_H * 0.92, shellH).toFixed(2) + "px";
    pickerShell.style.transform = `scale(${collapsedScale.toFixed(4)})`;

    // Exact centered dot origin inside 72x72 borderless glass circle: (72 - 76)/2 = -2.00px
    const collapsedLeft = (COLLAPSED_W - ORB_SIZE) / 2;
    const collapsedTop = (COLLAPSED_H - ORB_SIZE) / 2;

    // 5. Render each of the 3 pure flat solid status circles
    orbButtons.forEach((orb, idx) => {
      const key = STATUSES[idx];
      const isCurrent = key === currentStatus;
      const hoverScale = orbHoverSprings[idx].val;

      const x = collapsedLeft + (ORB_X[idx] - collapsedLeft) * p;
      const y = collapsedTop + (ORB_Y - collapsedTop) * p;
      const baseScale = COLLAPSED_DOT_SCALE + (1 - COLLAPSED_DOT_SCALE) * p;
      const finalScale = Math.max(0.2, baseScale * (1 + (hoverScale - 1) * clampedP));

      const rawOpacity = isCurrent ? 1 : Math.max(0, Math.min(1, (clampedP - 0.04) * 1.45));
      const orbOpacity = Math.max(0, rawOpacity - (rawOpacity > 0.2 ? morphAlphaDip : 0));

      orb.style.zIndex = isCurrent ? "3" : "2";
      orb.style.opacity = orbOpacity.toFixed(3);
      orb.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${finalScale.toFixed(4)})`;
      orb.style.filter = motionBlur > 0.12 ? `blur(${motionBlur.toFixed(2)}px)` : "none";

      const iconP = Math.max(0, Math.min(1, (clampedP - 0.25) / 0.65));
      const svg = orb.querySelector("svg");
      if (svg) {
        svg.style.opacity = iconP.toFixed(3);
        svg.style.transform = `scale(${(0.55 + 0.45 * iconP).toFixed(3)})`;
      }
    });

    // 6. Floating Liquid Glass tooltip pill
    const tipOp = Math.max(0, Math.min(1, spTipOpacity.val));
    const tipW = Math.max(60, spTipW.val);
    const tipLeft = spTipX.val - tipW / 2;
    const tipBlur = (1 - tipOp) * 4;

    tooltipPill.style.width = tipW.toFixed(2) + "px";
    tooltipPill.style.opacity = tipOp.toFixed(3);
    tooltipPill.style.transform = `translate3d(${tipLeft.toFixed(2)}px, ${spTipY.val.toFixed(2)}px, 0)`;
    tooltipPill.style.filter = tipBlur > 0.1 ? `blur(${tipBlur.toFixed(2)}px)` : "none";
  }

  function tick(now) {
    const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    const steps = rawDt > 0.012 ? 2 : 1;
    const dt = rawDt / steps;
    let moving = false;

    for (let s = 0; s < steps; s++) {
      moving = stepSpring(spOpen, dt) || moving;
      moving = stepSpring(spCollapsedScale, dt) || moving;
      moving = stepSpring(spTipOpacity, dt) || moving;
      moving = stepSpring(spTipY, dt) || moving;
      moving = stepSpring(spTipX, dt) || moving;
      moving = stepSpring(spTipW, dt) || moving;
      for (let i = 0; i < orbHoverSprings.length; i++) {
        moving = stepSpring(orbHoverSprings[i], dt) || moving;
      }
    }

    renderFrame();

    if (moving) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  on(collapsedTrigger, "pointerenter", () => {
    if (!isOpen) {
      spCollapsedScale.target = 1.06;
      ensureLoop();
    }
  });

  on(collapsedTrigger, "pointerleave", () => {
    if (!isOpen) {
      spCollapsedScale.target = 1;
      ensureLoop();
    }
  });

  on(collapsedTrigger, "pointerdown", () => {
    if (!isOpen) {
      spCollapsedScale.target = 0.94;
      ensureLoop();
    }
  });

  for (const type of ["pointerup", "pointercancel"]) on(collapsedTrigger, type, () => {
    spCollapsedScale.target = 1;
    ensureLoop();
  });

  on(collapsedTrigger, "click", (e) => {
    e.stopPropagation();
    openPicker();
    if (e.detail === 0) orbButtons[STATUSES.indexOf(currentStatus)].focus({ preventScroll: true });
  });

  orbButtons.forEach((orb, idx) => {
    const key = STATUSES[idx];

    on(orb, "pointerenter", e => {
      if (e.pointerType === "touch") return;
      if (!isOpen) return;
      orbHoverSprings[idx].target = 1.07;
      updateTooltipTarget(key);
    });

    on(orb, "pointerleave", () => {
      orbHoverSprings[idx].target = 1;
      if (document.activeElement === orb) return;
      updateTooltipTarget(null);
    });

    on(orb, "pointerdown", () => {
      if (!isOpen) return;
      orbHoverSprings[idx].target = 0.94;
      ensureLoop();
    });

    for (const type of ["pointerup", "pointercancel"]) on(orb, type, () => {
      orbHoverSprings[idx].target = 1;
      ensureLoop();
    });

    on(orb, "focus", () => {
      if (!isOpen) return;
      orbHoverSprings[idx].target = 1.07;
      updateTooltipTarget(key);
    });

    on(orb, "blur", () => {
      orbHoverSprings[idx].target = 1;
      updateTooltipTarget(null);
    });

    on(orb, "click", (e) => {
      e.stopPropagation();
      if (!isOpen) return;
      closePicker(key);
    });
  });

  on(pickerShell, "pointerleave", () => {
    if (isOpen) {
      updateTooltipTarget(null);
    }
  });

  on(document.querySelector(".stage"), "click", e => {
    if (isOpen && !e.composedPath().includes(pickerShell)) closePicker(null);
  });

  on(pickerShell, "keydown", e => {
    if (!isOpen) return;
    const current = orbButtons.indexOf(document.activeElement);
    const direction = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    let next;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) next = (current + direction + 3) % 3;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = 2;
    if (next === undefined) return;
    e.preventDefault();
    orbButtons.forEach((button, index) => button.tabIndex = index === next ? 0 : -1);
    orbButtons[next].focus();
  });

  on(pickerShell, "focusout", e => {
    // Opening hides the trigger and transfers focus into the expanded choices.
    if (e.target === collapsedTrigger) return;
    setTimeout(() => {
      if (isOpen && !pickerShell.contains(document.activeElement)) closePicker(null);
    }, 0);
  });

  on(pickerShell, "keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      closePicker(null);
      collapsedTrigger.focus();
    }
  });

  const sizeObserver = new scope.ResizeObserver(renderFrame);
  sizeObserver.observe(document.querySelector(".stage"));

  function syncStatus() {
    pickerShell.dataset.status = currentStatus;
    collapsedTrigger.setAttribute("aria-label", "Change status (current: " + LABELS[currentStatus] + ")");
    orbButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.status === currentStatus)));
  }

  syncStatus();
  renderFrame();
  if (initial.open) openPicker();
  return {
    refresh: ensureLoop,
    update(next) {
      options = { ...options, ...next };
      if (next.status !== undefined && next.status !== currentStatus) {
        currentStatus = next.status;
        syncStatus();
      }
      if (next.open !== undefined) {
        if (next.open) openPicker(); else closePicker(null);
      }
      ensureLoop();
    },
    destroy() {
      destroyed = true;
      sizeObserver.disconnect();
      cancelAnimationFrame(rafId);
    },
  };
}
