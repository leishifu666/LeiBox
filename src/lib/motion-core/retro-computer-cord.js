/* Adapted from the supplied Aqib portfolio demo, credited to @MAQIB135. */
export function runRetroComputerCord({
  document, on, rect, point, reduced, requestAnimationFrame, cancelAnimationFrame,
  setTimeout, clearTimeout, ResizeObserver,
}) {

  /* =====================================================================
     1. LOOPING HANDWRITTEN SVG SIGNATURE ("Hey, I'm Aqib")
     ===================================================================== */
  const hwBtn = document.getElementById('handwriting-btn');
  const hwStrokes = Array.from(document.querySelectorAll('.hw-stroke'));
  let hwTimers = [];

  function clearHwTimers() {
    hwTimers.forEach(clearTimeout);
    hwTimers = [];
  }

  function runHandwritingLoop() {
    clearHwTimers();
    if (reduced()) {
      hwStrokes.forEach(p => { p.style.cssText = "transition:none;opacity:1;stroke-dashoffset:0"; });
      return;
    }

    // Reset strokes to hidden immediately
    hwStrokes.forEach((p) => {
      const len = p.getTotalLength();
      p.style.transition = 'none';
      p.style.opacity = '1';
      p.style.strokeDasharray = `${len + 1}`;
      p.style.strokeDashoffset = `${len + 1}`;
    });

    // Force layout reflow
    void hwBtn.offsetWidth;

    let cursorMs = 120;
    hwStrokes.forEach((p) => {
      const len = p.getTotalLength();
      // Natural pen speed proportional to stroke length
      const dur = Math.max(85, Math.min(270, len * 6.8));
      const t = setTimeout(() => {
        p.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(0.32, 0.04, 0.28, 1)`;
        p.style.strokeDashoffset = '0';
      }, cursorMs);
      hwTimers.push(t);
      cursorMs += dur * 0.78;
    });

    // Hold completed signature, then fade out gently and restart
    const holdEnd = cursorMs + 4200;
    hwTimers.push(
      setTimeout(() => {
        hwStrokes.forEach((p) => {
          p.style.transition = 'opacity 420ms ease';
          p.style.opacity = '0';
        });
      }, holdEnd)
    );

    hwTimers.push(
      setTimeout(() => {
        runHandwritingLoop();
      }, holdEnd + 650)
    );
  }

  on(hwBtn, 'click', runHandwritingLoop);

  /* =====================================================================
     2. FLOATING HOVER PREVIEW CARDS ("product" & "web") — SILKY INERTIA
     ===================================================================== */
  const previewMap = {
    product: {
      el: document.getElementById('preview-product'),
      baseTilt: -2.4
    },
    web: {
      el: document.getElementById('preview-web'),
      baseTilt: -1.2
    }
  };

  let activePreviewKey = null;
  let renderingPreviewKey = null;
  let hidePreviewTimer = null;

  let triggerCenterX = 0;
  let targetCardX = 0;
  let targetCardY = 0;
  let curCardX = 0;
  let curCardY = 0;
  let smoothVx = 0;

  // Velvety critically-damped spring tilt driven by smoothed horizontal inertia
  let curCardRot = 0;
  let cardRotVel = 0;
  let baseCardRot = 0;
  let curCardScale = 0.9;
  let targetCardScale = 0.9;

  function openPreview(key, triggerEl, clientX) {
    const info = previewMap[key];
    if (!info) return;
    clearTimeout(hidePreviewTimer);

    const bounds = rect(triggerEl);
    triggerCenterX = bounds.left + bounds.width / 2;
    const offsetX = typeof clientX === 'number' ? (clientX - triggerCenterX) * 0.65 : 0;

    targetCardX = clampCardX(info.el, triggerCenterX + offsetX);
    targetCardY = bounds.top - 14;
    baseCardRot = info.baseTilt + offsetX * 0.08;
    targetCardScale = 1;

    if (activePreviewKey !== key) {
      Object.keys(previewMap).forEach((k) => {
        if (k !== key) previewMap[k].el.classList.remove('is-open');
      });
      curCardX = targetCardX;
      curCardY = targetCardY + 10;
      smoothVx = 0;
      curCardRot = baseCardRot;
      cardRotVel = 0;
      curCardScale = 0.9;
      activePreviewKey = key;
      renderingPreviewKey = key;
    }
    info.el.classList.add('is-open');
    requestPaint();
  }

  function clampCardX(card, x) {
    const margin = card.offsetWidth / 2 + 8;
    return Math.max(margin, Math.min(document.body.clientWidth - margin, x));
  }

  function closePreview(key) {
    if (activePreviewKey === key) {
      previewMap[key].el.classList.remove('is-open');
      targetCardScale = 0.92;
      requestPaint();
      activePreviewKey = null;
      clearTimeout(hidePreviewTimer);
      hidePreviewTimer = setTimeout(() => {
        if (!activePreviewKey) renderingPreviewKey = null;
      }, 260);
    }
  }

  document.querySelectorAll('.specialty-trigger').forEach((trigger) => {
    const key = trigger.dataset.preview;

    on(trigger, 'pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      trigger.classList.add('is-active');
      openPreview(key, trigger, point(e).x);
    });

    on(trigger, 'pointermove', (e) => {
      if (activePreviewKey === key) {
        const bounds = rect(trigger);
        triggerCenterX = bounds.left + bounds.width / 2;
        const dx = (point(e).x - triggerCenterX) * 0.65;
        targetCardX = clampCardX(previewMap[key].el, triggerCenterX + dx);
        targetCardY = bounds.top - 14;
        baseCardRot = previewMap[key].baseTilt + dx * 0.08;
        requestPaint();
      }
    });

    on(trigger, 'pointerleave', (e) => {
      if (e.pointerType === 'touch' || document.activeElement === trigger) return;
      trigger.classList.remove('is-active');
      closePreview(key);
    });

    on(trigger, 'focus', () => {
      if (!trigger.matches(':focus-visible')) return;
      trigger.classList.add('is-active');
      openPreview(key, trigger);
    });

    on(trigger, 'blur', () => {
      trigger.classList.remove('is-active');
      closePreview(key);
    });

    // Support tap toggle on touch devices
    on(trigger, 'click', (e) => {
      if (e.pointerType === 'mouse') return;
      if (activePreviewKey === key) {
        trigger.classList.remove('is-active');
        closePreview(key);
      } else {
        document.querySelectorAll('.specialty-trigger').forEach((el) => el.classList.remove('is-active'));
        trigger.classList.add('is-active');
        openPreview(key, trigger);
      }
    });
  });

  /* =====================================================================
     3. SOCIAL ICONS & EMAIL COPY TOOLTIP ("Click to copy" -> "Copied")
     ===================================================================== */
  const emailItem = document.getElementById('email-item');
  const emailBtn = document.getElementById('email-btn');
  const copyTooltip = document.getElementById('copy-tooltip');
  const microToast = document.getElementById('micro-toast');
  const DEMO_EMAIL = 'aqib@example.com';

  let copiedTimer = null;
  let isEmailHovered = false;
  let toastTimer = null;

  function showToast(msg) {
    microToast.textContent = msg;
    microToast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      microToast.classList.remove('is-visible');
    }, 1800);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Opaque preview frames may only support the selection-based fallback.
    }
    if (!emailBtn.isConnected) return false;
    const previous = document.activeElement;
    const input = document.createElement('textarea');
    input.value = text;
    input.style.cssText = 'position:absolute;opacity:0;pointer-events:none';
    emailItem.appendChild(input);
    input.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      input.remove();
      previous?.focus({ preventScroll: true });
    }
  }

  on(emailItem, 'pointerenter', () => {
    isEmailHovered = true;
    emailItem.classList.add('show-tooltip');
  });

  on(emailItem, 'pointerleave', () => {
    isEmailHovered = false;
    if (!copiedTimer) {
      emailItem.classList.remove('show-tooltip');
    }
  });

  on(emailBtn, 'focus', () => {
    emailItem.classList.add('show-tooltip');
  });

  on(emailBtn, 'blur', () => {
    if (!copiedTimer) emailItem.classList.remove('show-tooltip');
  });

  on(emailBtn, 'click', async () => {
    const copied = await copyToClipboard(DEMO_EMAIL);
    if (!emailBtn.isConnected) return;
    copyTooltip.textContent = copied ? 'Copied' : 'Copy unavailable';
    copyTooltip.classList.toggle('is-copied', copied);
    emailItem.classList.add('show-tooltip');

    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copiedTimer = null;
      copyTooltip.classList.remove('is-copied');
      if (!isEmailHovered) {
        emailItem.classList.remove('show-tooltip');
        setTimeout(() => {
          copyTooltip.textContent = 'Click to copy';
        }, 180);
      } else {
        copyTooltip.textContent = 'Click to copy';
      }
    }, 1850);
  });

  document.querySelectorAll('.social-btn[data-social]').forEach((btn) => {
    on(btn, 'click', () => {
      showToast(`External link: ${btn.dataset.social}`);
    });
  });

  /* =====================================================================
     4. MACINTOSH 128K: CRT TINT CYCLE, OUTLET POWER, DRAG & PHYSICS CORD
     ===================================================================== */
  const macWrapper = document.getElementById('mac-wrapper');
  const macBody = document.getElementById('mac-body');
  const crtScreen = document.getElementById('mac-crt-screen');
  const crtFlash = document.getElementById('mac-crt-flash');
  const wallOutlet = document.getElementById('wall-outlet');
  const reconnectBtn = document.getElementById('reconnect-btn');

  const cordConnected = document.getElementById('cord-connected');
  const cordOutletTail = document.getElementById('cord-outlet-tail');
  const cordMacTail = document.getElementById('cord-mac-tail');

  const TINTS = ['cyan', 'green', 'amber', 'mono'];
  let tintIndex = 0;

  // State
  let isPoweredOn = true;
  let isPluggedIn = true;
  let dragPointer = null;
  let isReturningHome = false;
  let powerOnTimer = null;

  // Mac translation relative to home (0, 0)
  let macX = 0;
  let macY = 0;
  let macVx = 0;
  let macVy = 0;

  // Drag tracking
  let dragStartPtrX = 0;
  let dragStartPtrY = 0;
  let dragStartMacX = 0;
  let dragStartMacY = 0;
  let dragMovedDist = 0;

  // Dangling cord pendulum physics (angle & angular velocity)
  let outletAngle = 0;
  let outletAngVel = 0;
  let macTailAngle = 0;
  let macTailAngVel = 0;
  let lastMacX = 0;

  // Connected cord sag spring
  let cordSag = 22;
  let cordSagVel = 0;

  const UNPLUG_DISTANCE = 175;

  function triggerCrtFlash(type) {
    crtFlash.classList.remove('play-off', 'play-on');
    void crtFlash.offsetWidth;
    crtFlash.classList.add(type === 'off' ? 'play-off' : 'play-on');
  }

  function setPower(on) {
    if (isPoweredOn === on) return;
    isPoweredOn = on;
    wallOutlet.setAttribute('aria-pressed', String(on));
    if (on) {
      crtScreen.classList.remove('is-off');
      wallOutlet.classList.remove('is-off');
      triggerCrtFlash('on');
    } else {
      crtScreen.classList.add('is-off');
      wallOutlet.classList.add('is-off');
      triggerCrtFlash('off');
    }
  }

  function cycleScreenTint() {
    if (!isPoweredOn || !isPluggedIn) return;
    tintIndex = (tintIndex + 1) % TINTS.length;
    crtScreen.setAttribute('data-tint', TINTS[tintIndex]);
    crtScreen.classList.remove('is-glitching');
    void crtScreen.offsetWidth;
    crtScreen.classList.add('is-glitching');
  }

  function unplugMac() {
    if (!isPluggedIn) return;
    clearTimeout(powerOnTimer);
    isPluggedIn = false;
    setPower(false);
    wallOutlet.classList.add('is-unplugged');
    wallOutlet.setAttribute('aria-label', 'Reconnect power');
    reconnectBtn.tabIndex = 0;
    reconnectBtn.classList.add('is-visible');

    // Kick pendulum physics for the snapped cord tails
    outletAngle = macX < 0 ? -0.42 : 0.42;
    outletAngVel = macX < 0 ? 0.04 : -0.04;
    macTailAngle = macX < 0 ? 0.48 : -0.48;
    macTailAngVel = 0;

    cordConnected.style.display = 'none';
    cordOutletTail.style.display = 'block';
    cordMacTail.style.display = 'block';
  }

  function reconnectMac() {
    if (isPluggedIn || isReturningHome) return;
    reconnectBtn.classList.remove('is-visible');
    reconnectBtn.tabIndex = -1;
    isReturningHome = true;
    requestPaint();
  }

  // Click on wall outlet: toggle power if plugged in, or reconnect if unplugged
  on(wallOutlet, 'click', () => {
    if (!isPluggedIn) {
      reconnectMac();
      return;
    }
    clearTimeout(powerOnTimer);
    setPower(!isPoweredOn);
  });

  // Some touch browsers suppress the click immediately after a captured drag.
  on(reconnectBtn, 'pointerup', (e) => {
    if (e.pointerType !== 'touch' || !e.isPrimary) return;
    const { x, y } = point(e);
    const { left, right, top, height } = rect(reconnectBtn);
    if (x >= left && x <= right && y >= top && y <= top + height) reconnectMac();
  });
  on(reconnectBtn, 'click', (e) => {
    e.stopPropagation();
    reconnectMac();
  });

  // Drag & click on Macintosh
  on(macWrapper, 'pointerdown', (e) => {
    if (e.button !== 0 || dragPointer !== null || reconnectBtn.contains(e.target)) return;
    e.preventDefault();
    dragPointer = e.pointerId;
    isReturningHome = false;
    dragMovedDist = 0;
    dragStartPtrX = point(e).x;
    dragStartPtrY = point(e).y;
    dragStartMacX = macX;
    dragStartMacY = macY;
    macWrapper.classList.add('is-pressing');
    if (e.isTrusted) macWrapper.setPointerCapture(e.pointerId);
    requestPaint();
  });

  on(macWrapper, 'pointermove', (e) => {
    if (dragPointer !== e.pointerId) return;
    const dx = point(e).x - dragStartPtrX;
    const dy = point(e).y - dragStartPtrY;
    dragMovedDist = Math.hypot(dx, dy);

    if (dragMovedDist > 5) {
      macWrapper.classList.remove('is-pressing');
      macWrapper.classList.add('is-dragging');
      macX = dragStartMacX + dx;
      macY = dragStartMacY + dy;

      // Keep within generous viewport bounds
      const home = rect(macWrapper.parentElement);
      const bounds = rect(document.body);
      const maxShiftX = Math.max(225, bounds.width * 0.42);
      const minX = Math.max(-maxShiftX, 36 - home.left - macWrapper.offsetWidth);
      const maxX = Math.min(maxShiftX, bounds.width - home.left - 36);
      macX = Math.max(minX, Math.min(maxX, macX));
      macY = Math.max(-70, Math.min(220, bounds.height - (home.top - bounds.top) - 56, macY));

      // Check cord unplug distance
      if (isPluggedIn) {
        const stretchDist = Math.hypot(macX, macY);
        if (stretchDist > UNPLUG_DISTANCE) {
          unplugMac();
        }
      }
      requestPaint();
    }
  });

  function endDrag(e) {
    if (dragPointer !== e.pointerId) return;
    dragPointer = null;
    macWrapper.classList.remove('is-dragging', 'is-pressing');
    if (macWrapper.hasPointerCapture(e.pointerId)) {
      macWrapper.releasePointerCapture(e.pointerId);
    }

    if (e.type === 'pointerup' && dragMovedDist <= 5) {
      // Short tap/click on Mac screen cycles CRT phosphor tint
      cycleScreenTint();
    } else if (isPluggedIn) {
      // Still plugged in when released -> spring gently back to desk spot
      isReturningHome = true;
    } else if (!isReturningHome) {
      reconnectBtn.classList.add('is-visible');
      reconnectBtn.tabIndex = 0;
    }
    requestPaint();
  }

  on(macWrapper, 'pointerup', endDrag);
  on(macWrapper, 'pointercancel', endDrag);
  on(macWrapper, 'lostpointercapture', endDrag);

  // Keyboard accessibility on Mac
  on(macBody, 'keydown', (e) => {
    if (!e.repeat && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (!isPluggedIn) {
        reconnectMac();
      } else {
        cycleScreenTint();
      }
    }
  });

  /* =====================================================================
     5. MASTER 60FPS PHYSICS & ANIMATION LOOP (CORD + SPRING + PREVIEW CARD)
     ===================================================================== */
  let lastFrameTime = performance.now();
  let pendingFrame = 0;
  let animateUntil = 0;

  function requestPaint() {
    if (reduced()) {
      cancelAnimationFrame(pendingFrame);
      renderFrame(performance.now());
      return;
    }
    animateUntil = performance.now() + 700;
    if (!pendingFrame) pendingFrame = requestAnimationFrame(renderFrame);
  }

  function renderFrame(now) {
    pendingFrame = 0;
    const still = reduced();
    const dt = Math.min(0.032, Math.max(0.004, (now - lastFrameTime) / 1000));
    lastFrameTime = now;
    // A. Spring return-to-home animation for Mac
    if (isReturningHome && dragPointer === null) {
      const stiffness = 0.14;
      const damping = 0.76;
      macVx = (macVx + (0 - macX) * stiffness) * damping;
      macVy = (macVy + (0 - macY) * stiffness) * damping;
      macX += macVx;
      macY += macVy;

      if (still || Math.hypot(macX, macY) < 0.6 && Math.hypot(macVx, macVy) < 0.25) {
        macX = 0;
        macY = 0;
        macVx = 0;
        macVy = 0;
        isReturningHome = false;

        if (!isPluggedIn) {
          isPluggedIn = true;
          wallOutlet.classList.remove('is-unplugged');
          wallOutlet.setAttribute('aria-label', 'Toggle Macintosh power');
          cordConnected.style.display = 'block';
          cordOutletTail.style.display = 'none';
          cordMacTail.style.display = 'none';
          cordSag = 32; // soft bounce on reattach
          cordSagVel = -2.2;
          if (still) setPower(true);
          else powerOnTimer = setTimeout(() => {
            if (isPluggedIn) setPower(true);
          }, 220);
        }
      }
    }

    macWrapper.style.transform = `translate3d(${macX.toFixed(2)}px, ${macY.toFixed(2)}px, 0)`;

    // B. Update Power Cord Geometry
    const macRect = rect(macWrapper);
    const outletRect = rect(wallOutlet);

    // Right rear port on Mac chassis
    const portX = macRect.right - 2;
    const portY = macRect.top + macRect.height * 0.52;

    // Center of wall outlet socket
    const plugX = outletRect.left + outletRect.width / 2;
    const plugY = outletRect.top + outletRect.height / 2 + 2;

    if (isPluggedIn) {
      const dist = Math.hypot(plugX - portX, plugY - portY);
      // Target sag decreases as cord pulls taut
      const slackRatio = Math.max(0, 1 - dist / 260);
      const targetSag = 5 + slackRatio * 24;
      cordSagVel = (cordSagVel + (targetSag - cordSag) * 0.18) * 0.78;
      cordSag = still ? targetSag : cordSag + cordSagVel;

      const midX = (portX + plugX) / 2;
      const midY = Math.max(portY, plugY) + cordSag;

      cordConnected.setAttribute(
        'd',
        `M ${portX.toFixed(1)} ${portY.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${plugX.toFixed(1)} ${plugY.toFixed(1)}`
      );
    } else {
      // Dangling outlet cord pendulum
      outletAngVel = (outletAngVel - outletAngle * 0.055) * 0.92;
      outletAngle = still ? 0 : outletAngle + outletAngVel;
      const oLen = 84;
      const oEndX = plugX + Math.sin(outletAngle) * oLen;
      const oEndY = plugY + Math.cos(outletAngle) * oLen;
      const oCtrlX = plugX + Math.sin(outletAngle * 0.5) * (oLen * 0.5);
      const oCtrlY = plugY + oLen * 0.52;
      cordOutletTail.setAttribute(
        'd',
        `M ${plugX.toFixed(1)} ${plugY.toFixed(1)} Q ${oCtrlX.toFixed(1)} ${oCtrlY.toFixed(1)} ${oEndX.toFixed(1)} ${oEndY.toFixed(1)}`
      );

      // Dangling Mac cord tail pendulum (reacts to horizontal drag velocity)
      const macDx = macX - lastMacX;
      macTailAngVel = (macTailAngVel - macTailAngle * 0.06 - macDx * 0.008) * 0.9;
      macTailAngle = still ? 0 : Math.max(-0.9, Math.min(0.9, macTailAngle + macTailAngVel));
      const mLen = 78;
      const mEndX = portX + Math.sin(macTailAngle) * mLen;
      const mEndY = portY + Math.cos(macTailAngle) * mLen;
      const mCtrlX = portX + Math.sin(macTailAngle * 0.55) * (mLen * 0.5);
      const mCtrlY = portY + mLen * 0.52;
      cordMacTail.setAttribute(
        'd',
        `M ${portX.toFixed(1)} ${portY.toFixed(1)} Q ${mCtrlX.toFixed(1)} ${mCtrlY.toFixed(1)} ${mEndX.toFixed(1)} ${mEndY.toFixed(1)}`
      );
    }

    lastMacX = macX;

    // C. Silky Inertia Sway for Floating Preview Card (zero jitter, frame-rate independent)
    if (renderingPreviewKey) {
      const prevX = curCardX;
      const posAlpha = still ? 1 : 1 - Math.exp(-13 * dt);
      curCardX += (targetCardX - curCardX) * posAlpha;
      curCardY += (targetCardY - curCardY) * posAlpha;

      // Smooth horizontal velocity (px/s) from already-smoothed position
      const instVx = (curCardX - prevX) / dt;
      smoothVx += (instVx - smoothVx) * (1 - Math.exp(-10 * dt));

      // Target tilt glides gently with horizontal inertia (like a weighted cup)
      const inertiaTilt = Math.max(-10, Math.min(10, smoothVx * 0.038));
      const targetRot = baseCardRot + inertiaTilt;

      // Soft, well-damped angular spring (smooth sway & gentle settle, no jitter)
      const rotAcc = (targetRot - curCardRot) * 120 - cardRotVel * 16.5;
      cardRotVel += rotAcc * dt;
      curCardRot = still ? baseCardRot : curCardRot + cardRotVel * dt;

      // Smooth scale ease
      curCardScale += (targetCardScale - curCardScale) * (still ? 1 : 1 - Math.exp(-16 * dt));

      const cardEl = previewMap[renderingPreviewKey].el;
      cardEl.style.transform = `translate3d(${curCardX.toFixed(2)}px, ${curCardY.toFixed(2)}px, 0) translate(-50%, -100%) scale(${curCardScale.toFixed(3)}) rotate(${curCardRot.toFixed(2)}deg)`;
    }

    if (!still && (isReturningHome || now < animateUntil)) {
      pendingFrame = requestAnimationFrame(renderFrame);
    }
  }

  const resize = new ResizeObserver(requestPaint);
  resize.observe(document.body);
  if (!document.documentElement.hasAttribute('data-leibox-motion-preview')) runHandwritingLoop();
  renderFrame(performance.now());
  let reducedBefore = reduced();
  return () => {
    if (reducedBefore !== reduced()) {
      reducedBefore = reduced();
      runHandwritingLoop();
    }
    requestPaint();
  };
}
