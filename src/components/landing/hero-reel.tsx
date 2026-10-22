"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export interface ReelItem {
  href: string;
  label: string;
}

const FIT_MAX_RATIO = 1.05;
const WIDE_RATIO = 0.52;
const R = 10;
const FOV = 110;
const DIM = 0.1;
const HOVER = 0.45;

interface Row {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  texture: THREE.CanvasTexture;
  aspect: number;
  alpha: number;
  fit: number;
  fitHalfHeight: number;
  href: string;
}

function bendPositions(
  flat: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  halfWidth: number,
  halfHeight: number,
) {
  const position = new THREE.BufferAttribute(
    new Float32Array(flat.count * 3),
    3,
  );
  for (let v = 0; v < flat.count; v++) {
    const lon = flat.getX(v) * 2 * halfWidth;
    const lat = flat.getY(v) * 2 * halfHeight;
    position.setXYZ(
      v,
      R * Math.sin(lon) * Math.cos(lat),
      R * Math.sin(lat),
      -R * Math.cos(lon) * Math.cos(lat),
    );
  }
  return position;
}

function drawLabel(
  canvas: HTMLCanvasElement,
  label: string,
  fontFamily: string,
) {
  const height = 160;
  const ctx = canvas.getContext("2d")!;
  const font = `600 ${height * 0.72}px ${fontFamily}`;
  ctx.font = font;
  const text = label;
  const width = Math.ceil(ctx.measureText(text).width) + 32;
  canvas.width = width;
  canvas.height = height;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, width / 2, height * 0.54);
  return width / height;
}

export function HeroReel({
  items,
  onActiveChange,
}: {
  items: ReelItem[];
  onActiveChange?: (index: number) => void;
}) {
  const router = useRouter();
  const holderRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);
  const [, setPausedState] = useState(false);
  const itemsRef = useRef(items);
  const onActiveChangeRef = useRef(onActiveChange);
  useEffect(() => {
    itemsRef.current = items;
    onActiveChangeRef.current = onActiveChange;
  });

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    const components = itemsRef.current;
    const count = components.length;
    if (count === 0) return;
    const step = (Math.PI * 2) / count;
    const fitMaxHalfHeight = step * FIT_MAX_RATIO;
    const wideHalfHeight = step * WIDE_RATIO;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    holder.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
    const group = new THREE.Group();
    scene.add(group);

    const fontFamily =
      getComputedStyle(holder).fontFamily || "system-ui, sans-serif";
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const rows: Row[] = components.map((component, i) => {
      const textCanvas = document.createElement("canvas");
      const aspect = drawLabel(textCanvas, component.label, fontFamily);
      const texture = new THREE.CanvasTexture(textCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = maxAnisotropy;
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        opacity: i === 0 ? 1 : DIM,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      mesh.userData.rowIndex = i;
      group.add(mesh);
      return {
        mesh,
        texture,
        aspect,
        alpha: i === 0 ? 1 : DIM,
        fit: i === 0 ? 1 : 0,
        fitHalfHeight: 0,
        href: component.href,
      };
    });

    let foreground = new THREE.Color("#000000");
    const probeCanvas = document.createElement("canvas");
    probeCanvas.width = probeCanvas.height = 1;
    const probeCtx = probeCanvas.getContext("2d", {
      willReadFrequently: true,
    })!;
    const readTheme = () => {
      probeCtx.clearRect(0, 0, 1, 1);
      probeCtx.fillStyle = getComputedStyle(holder).color;
      probeCtx.fillRect(0, 0, 1, 1);
      const [r, g, b] = probeCtx.getImageData(0, 0, 1, 1).data;
      foreground = new THREE.Color().setRGB(
        r / 255,
        g / 255,
        b / 255,
        THREE.SRGBColorSpace,
      );
      for (const row of rows) row.mesh.material.color.copy(foreground);
    };
    readTheme();
    const themeObserver = new MutationObserver(readTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const template = new THREE.PlaneGeometry(1, 1, 64, 12);
    const buildGeometries = () => {
      const fovH =
        2 * Math.atan(Math.tan((FOV * Math.PI) / 360) * camera.aspect);
      const fitCap = fovH * 0.44;
      const wideMin = fovH * 0.54;
      const wideMax = fovH * 0.82;
      const flat = template.attributes.position;
      rows.forEach((row, i) => {
        const fitHalfWidth = Math.min(fitCap, fitMaxHalfHeight * row.aspect);
        const fitHalfHeight = fitHalfWidth / row.aspect;
        row.fitHalfHeight = fitHalfHeight;
        const wideHalfWidth = THREE.MathUtils.clamp(
          wideHalfHeight * row.aspect,
          wideMin,
          wideMax,
        );
        const geometry = template.clone();
        const slot = new THREE.Matrix4().makeRotationX(-i * step);
        const wide = bendPositions(flat, wideHalfWidth, wideHalfHeight);
        wide.applyMatrix4(slot);
        const fitted = bendPositions(flat, fitHalfWidth, fitHalfHeight);
        fitted.applyMatrix4(slot);
        geometry.setAttribute("position", wide);
        geometry.morphAttributes.position = [fitted];
        row.mesh.geometry.dispose();
        row.mesh.geometry = geometry;
        row.mesh.updateMorphTargets();
        row.mesh.morphTargetInfluences![0] = row.fit;
      });
    };

    const resize = () => {
      const w = holder.clientWidth;
      const h = holder.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      buildGeometries();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(holder);

    let disposed = false;
    document.fonts?.ready.then(() => {
      if (disposed) return;
      rows.forEach((row, i) => {
        row.aspect = drawLabel(
          row.texture.image as HTMLCanvasElement,
          components[i].label,
          fontFamily,
        );
        row.texture.needsUpdate = true;
      });
      buildGeometries();
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered = -1;

    const pick = (event: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(group.children)[0];
      return hit ? (hit.object.userData.rowIndex as number) : -1;
    };
    const onPointerMove = (event: PointerEvent) => {
      hovered = pick(event);
      canvas.style.cursor = hovered >= 0 ? "pointer" : "";
    };
    const onClick = (event: MouseEvent) => {
      const picked = pick(event);
      if (picked >= 0) router.push(rows[picked].href);
    };
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("click", onClick);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let tick = 0;
    const interval = reducedMotion
      ? null
      : window.setInterval(() => {
          if (!pausedRef.current && !document.hidden) {
            tick += 1;
            onActiveChangeRef.current?.(tick % count);
          }
        }, 5000);

    let rotation = 0;
    let push = 0;
    let raf = 0;
    let last = performance.now();
    let inView = true;
    let running = false;

    const animate = () => {
      if (!inView || document.hidden) {
        running = false;
        return;
      }
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const target = tick * step;
      rotation += (target - rotation) * Math.min(1, dt * 5);
      group.rotation.x = rotation;

      const nearest = ((Math.round(rotation / step) % count) + count) % count;
      const pushGoal =
        Math.max(0, rows[nearest].fitHalfHeight + wideHalfHeight - step) +
        step * 0.12;
      push += (pushGoal - push) * Math.min(1, dt * 5);

      rows.forEach((row, i) => {
        const d =
          THREE.MathUtils.euclideanModulo(
            rotation - i * step + Math.PI,
            Math.PI * 2,
          ) - Math.PI;
        row.mesh.rotation.x = push * Math.tanh(d / (step * 0.6));
        const closeness = THREE.MathUtils.clamp(1 - Math.abs(d) / step, 0, 1);
        const f = closeness * closeness * (3 - 2 * closeness);
        row.fit += (f - row.fit) * Math.min(1, dt * 10);
        if (row.mesh.morphTargetInfluences)
          row.mesh.morphTargetInfluences[0] = row.fit;
        const goal = Math.max(DIM + (1 - DIM) * f, i === hovered ? HOVER : 0);
        row.alpha += (goal - row.alpha) * Math.min(1, dt * 10);
        row.mesh.material.opacity = row.alpha;
        row.mesh.renderOrder = Math.round(row.alpha * 100);
      });
      renderer.render(scene, camera);
      if (reducedMotion) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(animate);
    };

    const start = () => {
      if (running || !inView || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(animate);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    const viewObserver = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1]?.isIntersecting ?? true;
      if (inView) {
        start();
      } else {
        stop();
      }
    });
    viewObserver.observe(holder);

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    start();

    return () => {
      disposed = true;
      stop();
      if (interval !== null) window.clearInterval(interval);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("click", onClick);
      for (const row of rows) {
        row.mesh.geometry.dispose();
        row.mesh.material.dispose();
        row.texture.dispose();
      }
      template.dispose();
      renderer.dispose();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPaused = (value: boolean) => {
    pausedRef.current = value;
    setPausedState(value);
  };

  return (
    <div
      ref={holderRef}
      aria-label="Browse components"
      className="relative h-72 overflow-hidden rounded-2xl bg-muted sm:h-[26rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <nav aria-label="Components" className="sr-only">
        {items.map((component) => (
          <Link key={component.href} href={component.href}>
            {component.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
