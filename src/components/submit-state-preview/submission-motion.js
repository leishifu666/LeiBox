// Gemini 3.1 Pro / High, AI Studio; geometry and interrupted-state cleanup adapted locally.
import { animateClassicSubmission } from "@/components/common/classic-submit-button";

export function animateSubmission({ id, state, root, gsap, reduced }) {
  if (id === 1) return animateClassicSubmission(root, state, reduced);
  // 1. 获取所有约定节点
  const label = root.querySelector('[data-submit-label]');
  const loader = root.querySelector('[data-submit-loader]');
  const ring = root.querySelector('[data-submit-ring]');
  const dots = root.querySelectorAll('[data-submit-dot]');
  const fill = root.querySelector('[data-submit-fill]');
  const successIcon = root.querySelector('[data-submit-success]');
  const errorIcon = root.querySelector('[data-submit-error]');

  // Static geometry lives in CSS: GSAP 3.12's inset shorthand collapsed the ring/fill.
  // Do not reset loader.left here: result transitions must fade it at its current position.

  // 3. 处理无障碍偏好：直接切至稳定态，返回 null 不保留运动 timeline
  if (reduced) {
    gsap.set([root, label, loader, ring, fill, ...dots, successIcon, errorIcon], { clearProps: "transform,scale,opacity" });
    gsap.set(root, { width: 104, borderRadius: 8 });
    gsap.set([loader, ring, fill, ...dots, successIcon, errorIcon], { opacity: 0 });
    
    if (state === 'loading') {
      gsap.set([loader, ring], { opacity: 1 });
      gsap.set(loader, { left: "24px", x: 0, y: 0, xPercent: -50, yPercent: -50 });
      gsap.set(label, { opacity: 1, x: 12 });
    } else if (state === 'success' || state === 'error') {
      gsap.set(state === 'success' ? successIcon : errorIcon, { opacity: 1 });
      gsap.set(label, { opacity: 1, x: 12 });
    } else {
      gsap.set(label, { opacity: 1, x: 0 }); // idle
    }
    return null;
  }

  // 4. 创建统一管理的 Timeline 从当前状态接续
  const tl = gsap.timeline();

  // Validation can interrupt a shrinking button in the comparison controls.
  if (state === 'invalid') {
    tl.to([loader, fill, successIcon, errorIcon], { opacity: 0, duration: 0.15 }, 0)
      .to(root, { width: 104, borderRadius: 8, scale: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0)
      .to(label, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.2 }, 0)
      .to(root, { x: 2, duration: 0.08, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.2)
      .set(root, { x: 0 });
    return tl;
  }

  // 通用恢复待机：平滑回到基准 104x40r8，隐藏所有装饰
  if (state === 'idle') {
    tl.to(root, { width: 104, borderRadius: 8, scale: 1, x: 0, duration: 0.3, ease: "power2.out" }, 0)
      .to(label, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.3 }, 0)
      .to([loader, fill, successIcon, errorIcon], { opacity: 0, duration: 0.2 }, 0);
    return tl;
  }

  // 为结果状态锁定当前图标
  const icon = state === 'success' ? successIcon : state === 'error' ? errorIcon : null;

  if (state === 'loading') {
    tl.to([successIcon, errorIcon], { opacity: 0, duration: 0.15 }, 0)
      .to(root, { x: 0, y: 0, duration: 0.2 }, 0);
    if (id !== 3) tl.to(fill, { opacity: 0, duration: 0.15 }, 0);
    if (id === 3 || id === 5) tl.to(loader, { opacity: 0, duration: 0.15 }, 0);
    if (id === 1 || id === 4) gsap.set(dots, { opacity: 0 });
    if (id === 2 || id === 6) gsap.set(ring, { opacity: 0 });
    if (id !== 4) tl.to(root, { width: 104, borderRadius: 8, duration: 0.25 }, 0);
  } else if (icon) {
    tl.to(state === 'success' ? errorIcon : successIcon, { opacity: 0, duration: 0.15 }, 0);
  }

  // 5. 六套不同质感的方案实现
  switch (id) {
    case 2: // 点阵波浪 dots-wave
      if (state === 'loading') {
        tl.set(dots, { opacity: 1, left: (i) => 2 + i * 6 }, 0)
          .to(loader, { opacity: 1, left: "24px", duration: 0.3 }, 0)
          .to(label, { x: 12, opacity: 0.8, duration: 0.3 }, 0)
          .to(dots, { y: -3, duration: 0.3, stagger: 0.1, yoyo: true, repeat: -1, ease: "sine.inOut" }, 0);
      } else if (icon) {
        tl.to(loader, { opacity: 0, duration: 0.2 }, 0)
          .to(icon, { opacity: 1, duration: 0.3 }, 0.1)
          .to(label, { x: 12, opacity: 1, duration: 0.3 }, 0);
      }
      break;

    case 3: // 底层呼吸 shimmer-fill
      if (state === 'loading') {
        tl.set(fill, { scaleX: 0, opacity: 0.15 }, 0)
          .to(fill, { scaleX: 1, duration: 1.2, repeat: -1, yoyo: true, ease: "power1.inOut" }, 0);
      } else if (icon) {
        tl.to(fill, { opacity: 0, duration: 0.3 }, 0)
          .to(icon, { opacity: 1, duration: 0.3 }, 0)
          .to(label, { x: 12, opacity: 1, duration: 0.3 }, 0);
      }
      break;

    case 4: // 结构形变 morph-circle (唯一隐藏文字的方案)
      if (state === 'loading') {
        tl.to(root, { width: 40, borderRadius: 20, duration: 0.4, ease: "power3.inOut" }, 0)
          .to(label, { opacity: 0, duration: 0.2 }, 0)
          .to(loader, { opacity: 1, left: "50%", duration: 0.3 }, 0.1)
          .to(ring, { opacity: 1, duration: 0.2 }, 0.1)
          .to(ring, { rotation: "+=360", duration: 1, repeat: -1, ease: "linear" }, 0.1);
      } else if (icon) {
        tl.to(loader, { opacity: 0, duration: 0.2 }, 0)
          .to(root, { width: 104, borderRadius: 8, duration: 0.5, ease: "back.out(1.2)" }, 0.1)
          .to(icon, { opacity: 1, duration: 0.3 }, 0.3)
          .to(label, { opacity: 1, x: 12, duration: 0.3 }, 0.3);
      }
      break;

    case 5: // 垂直滚轮 slide-up (仅文字微动效)
      if (state === 'loading') {
        tl.fromTo(label, { y: 12, opacity: 0 }, { y: 0, x: 0, opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }, 0)
          .to(label, { opacity: 0.7, scale: 0.98, duration: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut" }, 0.4);
      } else if (icon) {
        tl.fromTo(label, { y: 12, opacity: 0 }, { y: 0, opacity: 1, scale: 1, x: 12, duration: 0.4, ease: "power3.out" }, 0)
          .to(icon, { opacity: 1, duration: 0.3 }, 0);
      }
      break;

    case 6: // 心跳脉冲 pulse-glow
      if (state === 'loading') {
        tl.set(dots[0], { opacity: 1, left: "50%", xPercent: -50 }, 0)
          .to(label, { opacity: 1, x: 0, y: 0, duration: 0.2 }, 0)
          .to(loader, { opacity: 1, left: "calc(50% + 28px)", duration: 0.3 }, 0) // 将单点定位至文字右侧防遮挡
          .to(root, { scale: 0.97, duration: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut" }, 0)
          .to(dots[0], { opacity: 0.2, duration: 0.8, repeat: -1, yoyo: true, ease: "sine.inOut" }, 0);
      } else if (icon) {
        tl.to(loader, { opacity: 0, duration: 0.2 }, 0)
          .to(root, { scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 0)
          .to(icon, { opacity: 1, duration: 0.3 }, 0.1)
          .to(label, { x: 12, opacity: 1, duration: 0.3 }, 0.1);
      }
      break;
  }

  return tl;
}
