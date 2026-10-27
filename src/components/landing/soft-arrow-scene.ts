import { gsap } from "gsap";
import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  OrthographicCamera,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
  type Material,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export async function createSoftArrow(host: HTMLElement, canvas: HTMLCanvasElement, signal: AbortSignal) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(32, 32, false);
  renderer.setClearColor(0, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new Scene();
  const camera = new OrthographicCamera(-1.3, 1.3, 1.3, -1.3, .1, 20);
  camera.position.z = 6;
  const studio = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, .035);
  scene.environment = environment.texture;
  studio.dispose();
  pmrem.dispose();

  const key = new DirectionalLight(0xffffff, 3);
  key.position.set(-3, 4, 5);
  const rim = new DirectionalLight(0xe5efff, 1.8);
  rim.position.set(4, -1, 2);
  scene.add(key, rim);
  const material = new MeshPhysicalMaterial({
    color: 0xc9d1de, metalness: .78, roughness: .18,
    clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: 1.6,
  });
  const group = new Group();
  group.rotation.set(-.1, -.24, -.025);
  scene.add(group);

  let model;
  try {
    model = await new GLTFLoader().loadAsync("/landing/soft-arrow/soft-arrow.glb");
  } catch (error) {
    material.dispose(); environment.dispose(); renderer.dispose();
    throw error;
  }
  const meshes: Mesh[] = [];
  const originalMaterials = new Set<Material>();
  model.scene.traverse(object => {
    if (!(object instanceof Mesh)) return;
    meshes.push(object);
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => originalMaterials.add(m));
    object.material = material;
  });
  originalMaterials.forEach(m => m.dispose());
  group.add(model.scene);
  const dispose = () => {
    meshes.forEach(mesh => mesh.geometry.dispose());
    material.dispose(); environment.dispose(); renderer.dispose();
  };
  if (signal.aborted) { dispose(); return () => {}; }

  const pose = { turn: -.24, tilt: -.1, roll: -.025, tip: 0, tail: 0 };
  const draw = () => {
    group.rotation.set(pose.tilt, pose.turn, pose.roll);
    for (const mesh of meshes) {
      const keys = mesh.morphTargetDictionary;
      const weights = mesh.morphTargetInfluences;
      if (!keys || !weights) continue;
      weights[keys["Tip flex"]] = pose.tip;
      weights[keys["Tail follow"]] = pose.tail;
    }
    renderer.render(scene, camera);
  };
  const updateMaterial = () => {
    const dark = document.documentElement.classList.contains("dark");
    material.color.copy(new Color(dark ? 0x12161c : 0xc9d1de));
    material.metalness = dark ? .24 : .78;
    material.roughness = dark ? .19 : .18;
    material.envMapIntensity = dark ? 2 : 1.6;
    draw();
  };
  const theme = new MutationObserver(updateMaterial);
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  // Turn and flexible ends have different timing, so the silhouette deforms
  // instead of rotating like a rigid, flat icon. The button never drives hover motion.
  const motion = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.8, onUpdate: draw })
    .to(pose, { turn: .56, tilt: .12, roll: -.065, duration: 1.05, ease: "sine.inOut" }, 0)
    .to(pose, { tip: -.7, tail: .3, duration: .7, ease: "sine.inOut" }, .16)
    .to(pose, { turn: -.4, tilt: -.08, roll: .045, duration: 1.0, ease: "sine.inOut" }, 1.05)
    .to(pose, { tip: .75, tail: -.45, duration: .9, ease: "sine.inOut" }, 1.15)
    .to(pose, { turn: -.24, tilt: -.1, roll: -.025, duration: 1.15, ease: "elastic.out(1, 0.65)" }, 2.05)
    .to(pose, { tip: 0, tail: 0, duration: 1.25, ease: "elastic.out(1, 0.55)" }, 2.05);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = true;
  const updatePlayback = () => {
    if (reduced.matches) {
      motion.pause(0);
      Object.assign(pose, { turn: -.24, tilt: -.1, roll: -.025, tip: 0, tail: 0 });
      draw();
    } else if (visible && !document.hidden) motion.resume();
    else motion.pause();
    host.dataset.motion = reduced.matches ? "reduced" : motion.paused() ? "paused" : "playing";
  };
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    updatePlayback();
  });
  observer.observe(host);
  reduced.addEventListener("change", updatePlayback);
  document.addEventListener("visibilitychange", updatePlayback);
  updateMaterial();
  host.dataset.render = "live";
  updatePlayback();

  return () => {
    motion.kill(); observer.disconnect(); theme.disconnect();
    reduced.removeEventListener("change", updatePlayback);
    document.removeEventListener("visibilitychange", updatePlayback);
    dispose();
  };
}
