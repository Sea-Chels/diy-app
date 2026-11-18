import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AREAS, type AreaId, type LidId } from '../data/areas';
import type { Setup } from '../data/setup';
import { buildRig, rigKey, type Rig } from './rig';
import { tween, updateTweens, easeInOutCubic, easeOutBack, lerp } from '../../shared/tween';
import { lineMaterials, shared, toon } from '../../shared/toon';

export interface SceneApi {
  focus(area: AreaId | null): void;
  onSelect(cb: (area: AreaId | null) => void): void;
  onHover(cb: (area: AreaId | null) => void): void;
  setSetup(s: Setup): void;
}

const ALL_LIDS: LidId[] = ['sinkDoors', 'sash', 'tankLid', 'vanityDoors', 'panelDoor', 'coverPlates', 'frontDoor', 'canopy', 'drawer', 'planks', 'gutterGuard', 'sidingPanel'];
const HOVER_LAYER = 1;
const SELECT_LAYER = 2;

/** Mask of the highlighted area (red = hovered, green = selected) turned into a cyan rim. */
function makeOutline(): { target: THREE.WebGLRenderTarget; mask: THREE.MeshBasicMaterial; quad: THREE.Mesh; cam: THREE.OrthographicCamera; uniforms: { uMask: { value: THREE.Texture }; uTexel: { value: THREE.Vector2 }; uScale: { value: number } } } {
  const target = new THREE.WebGLRenderTarget(1, 1);
  const mask = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
  const uniforms = { uMask: { value: target.texture as THREE.Texture }, uTexel: { value: new THREE.Vector2(1, 1) }, uScale: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D uMask; uniform vec2 uTexel; uniform float uScale;
      varying vec2 vUv;
      void main() {
        vec2 c = texture2D(uMask, vUv).rg;
        // Near the mask (rim width) and how surrounded we are (to skip gaps between leaves).
        vec2 near = vec2(0.0), cover = vec2(0.0);
        for (int i = 0; i < 16; i++) {
          float a = float(i) * 0.3927;
          vec2 d = vec2(cos(a), sin(a)) * uTexel * uScale;
          vec2 s1 = texture2D(uMask, vUv + d * 1.6).rg;
          vec2 s2 = texture2D(uMask, vUv + d * 3.2).rg;
          near = max(near, max(s1, s2));
          cover += step(0.5, texture2D(uMask, vUv + d * 14.0).rg);
        }
        cover /= 16.0;
        float sel = near.g * (1.0 - c.g) * (1.0 - smoothstep(0.55, 0.75, cover.g));
        float hover = near.r * (1.0 - c.r) * (1.0 - smoothstep(0.55, 0.75, cover.r)) * 0.85;
        float rim = max(sel, hover);
        if (rim < 0.01) discard;
        gl_FragColor = vec4(0.431, 0.906, 1.0, rim);
      }`,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  return { target, mask, quad, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), uniforms };
}

export function createScene(canvas: HTMLCanvasElement, initial: Setup): SceneApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 100);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.6;
  controls.maxDistance = 12;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;
  controls.enablePan = false;

  // Same comic lighting as the PC: warm key, cool fill, magenta + cyan rims.
  scene.add(new THREE.HemisphereLight(0xd9e2ff, 0x2a1830, 0.85));
  const key = new THREE.DirectionalLight(0xfff0dc, 1.5);
  // Key light from the open front-right corner, so it falls into the room.
  key.position.set(4, 9, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.camera.left = key.shadow.camera.bottom = -5.4;
  key.shadow.camera.right = key.shadow.camera.top = 5.4;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const magenta = new THREE.DirectionalLight(0xff4fd8, 0.7);
  magenta.position.set(7, 3, -5);
  scene.add(magenta);
  const cyan = new THREE.DirectionalLight(0x45e0ff, 0.6);
  cyan.position.set(-7, 2.5, -6);
  scene.add(cyan);
  const front = new THREE.DirectionalLight(0xb8c4ff, 0.35);
  front.position.set(-3, 3, 8);
  scene.add(front);


  const ground = new THREE.Mesh(new THREE.CircleGeometry(3.25, 72), toon(0x1d2133, { halftone: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.21;
  ground.receiveShadow = true;
  scene.add(ground);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3.25, 3.62, 72),
    new THREE.MeshBasicMaterial({ color: 0x0f1218, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.208;
  scene.add(ring);

  let rig: Rig = buildRig(initial);
  scene.add(rig.group);

  function overviewFit(): { pos: [number, number, number]; target: [number, number, number] } {
    const { pos, target } = rig.overview;
    const k = Math.min(3.2, Math.max(0.85, 1.48 / camera.aspect));
    const t = new THREE.Vector3(...target);
    const p = new THREE.Vector3(...pos).sub(t).multiplyScalar(k).add(t);
    // Portrait screens need to back off further than the desktop limit.
    controls.maxDistance = Math.max(12, p.distanceTo(t) * 1.15);
    return { pos: [p.x, p.y, p.z], target };
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let hovered: AreaId | null = null;
  let selected: AreaId | null = null;
  const selectCbs: ((a: AreaId | null) => void)[] = [];
  const hoverCbs: ((a: AreaId | null) => void)[] = [];

  // Highlights draw one outline around an area's silhouette instead of
  // tinting every leaf's ink. Hovered meshes go on layer 1, selected on 2.
  function setGlow(a: AreaId | null, level: 'none' | 'hover' | 'selected'): void {
    if (!a) return;
    for (const m of rig.glow.get(a) ?? []) {
      m.layers.disable(HOVER_LAYER);
      m.layers.disable(SELECT_LAYER);
      if (level === 'hover') m.layers.enable(HOVER_LAYER);
      if (level === 'selected') m.layers.enable(SELECT_LAYER);
    }
  }
  function refreshGlow(): void {
    for (const a of rig.glow.keys()) setGlow(a, 'none');
    if (hovered && hovered !== selected) setGlow(hovered, 'hover');
    if (selected) setGlow(selected, 'selected');
  }

  function pickArea(ev: PointerEvent): AreaId | null {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(rig.picks, false);
    const beacon = hits.find((h) => h.object.userData.beacon && h.object.visible);
    if (beacon) return beacon.object.userData.area as AreaId;
    // Pick boxes overlap: prefer the nearest, unless an outer wall is in front of it.
    const first = hits.find((h) => !h.object.userData.beacon);
    if (!first || first.object.userData.blocker) return null;
    return first.object.userData.area as AreaId;
  }

  let downAt: { x: number; y: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    downAt = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 6) return;
    const a = pickArea(e);
    if (a && a === selected) rig.poke(a);
    selectCbs.forEach((cb) => cb(a));
  });
  let moveQueued = false;
  canvas.addEventListener('pointermove', (e) => {
    if (moveQueued) return;
    moveQueued = true;
    requestAnimationFrame(() => {
      moveQueued = false;
      const a = pickArea(e);
      if (a !== hovered) {
        hovered = a;
        canvas.style.cursor = a ? 'pointer' : 'grab';
        refreshGlow();
        hoverCbs.forEach((cb) => cb(a));
      }
    });
  });
  canvas.addEventListener('pointerleave', () => {
    hovered = null;
    refreshGlow();
    hoverCbs.forEach((cb) => cb(null));
  });

  let idleTimer: number | undefined;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    window.clearTimeout(idleTimer);
  });
  controls.addEventListener('end', () => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (!selected) controls.autoRotate = true;
    }, 9000);
  });

  function flyTo(pos: [number, number, number], target: [number, number, number]): void {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const p1 = new THREE.Vector3(...pos);
    const t1 = new THREE.Vector3(...target);
    const lift = Math.min(0.8, p0.distanceTo(p1) * 0.12);
    tween({
      duration: 1200,
      ease: easeInOutCubic,
      tag: 'camera',
      update: (k) => {
        camera.position.lerpVectors(p0, p1, k);
        camera.position.y += Math.sin(k * Math.PI) * lift;
        controls.target.lerpVectors(t0, t1, k);
      },
    });
  }

  function applyLids(a: AreaId | null): void {
    const want = new Set<LidId>(a ? AREAS[a].opens ?? [] : []);
    for (const lid of ALL_LIDS) rig.setLid(lid, want.has(lid));
  }

  function flyToArea(a: AreaId | null): void {
    if (a) {
      const v = rig.views[a];
      const t = new THREE.Vector3(...v.target);
      const p = new THREE.Vector3(...v.pos);
      if (window.innerWidth <= 720) {
        p.sub(t).multiplyScalar(1.3).add(t);
        const down = new THREE.Vector3(0, -1, 0).multiplyScalar(p.distanceTo(t) * 0.2);
        t.add(down);
        p.add(down);
      } else {
        const right = new THREE.Vector3().subVectors(t, p).cross(new THREE.Vector3(0, 1, 0)).normalize();
        const shift = right.multiplyScalar(p.distanceTo(t) * 0.2);
        t.add(shift);
        p.add(shift);
      }
      flyTo([p.x, p.y, p.z], [t.x, t.y, t.z]);
    } else {
      const o = overviewFit();
      flyTo(o.pos, o.target);
      idleTimer = window.setTimeout(() => (controls.autoRotate = true), 4000);
    }
  }

  function focus(a: AreaId | null): void {
    selected = a;
    controls.autoRotate = false;
    window.clearTimeout(idleTimer);
    applyLids(a);
    flyToArea(a);
    refreshGlow();
    if (a) rig.poke(a);
  }

  // ---------- rebuilds when the season, bed fill or hydro system changes ----------
  let swapping = false;
  let pending: Setup | null = null;

  function swap(s: Setup): void {
    swapping = true;
    const old = rig;
    tween({
      duration: 220,
      ease: (t) => t * t,
      tag: 'swap-out',
      update: (k) => old.group.scale.setScalar(Math.max(0.001, lerp(1, 0, k))),
      done: () => {
        scene.remove(old.group);
        old.dispose();
        rig = buildRig(s);
        rig.group.scale.setScalar(0.001);
        scene.add(rig.group);
        syncLineResolution();
        applyLids(selected);
        refreshGlow();
        tween({
          duration: 560,
          ease: easeOutBack,
          tag: 'swap-in',
          update: (k) => rig.group.scale.setScalar(Math.max(0.001, k)),
          done: () => {
            swapping = false;
            if (pending) {
              const next = pending;
              pending = null;
              setSetup(next);
            }
          },
        });
      },
    });
  }

  function setSetup(s: Setup): void {
    if (swapping) {
      pending = s;
      return;
    }
    if (rigKey(s) !== rig.key) swap(s);
  }

  // ---------- render loop ----------
  function syncLineResolution(): void {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement ?? canvas;
    lineMaterials.forEach((m) => m.resolution.set(w, h));
  }
  const outline = makeOutline();
  const maskScene = new THREE.Scene();
  maskScene.add(outline.quad);
  function renderOutline(): void {
    if (!hovered && !selected) return;
    const layers = camera.layers.mask;
    const bg = scene.background;
    renderer.setRenderTarget(outline.target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    scene.overrideMaterial = outline.mask;
    scene.background = null;
    const shadows = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    for (const [layer, col] of [[HOVER_LAYER, 0xff0000], [SELECT_LAYER, 0x00ff00]] as const) {
      camera.layers.set(layer);
      outline.mask.color.setHex(col);
      outline.mask.blending = THREE.AdditiveBlending;
      renderer.autoClear = false;
      renderer.render(scene, camera);
    }
    renderer.shadowMap.autoUpdate = shadows;
    scene.overrideMaterial = null;
    scene.background = bg;
    camera.layers.mask = layers;
    renderer.setRenderTarget(null);
    renderer.render(maskScene, outline.cam);
    renderer.autoClear = true;
  }

  function resize(): void {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement ?? canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    shared.uDotSize.value = 5.5 * renderer.getPixelRatio();
    const pr = renderer.getPixelRatio();
    outline.target.setSize(Math.round(w * pr), Math.round(h * pr));
    outline.uniforms.uTexel.value.set(1 / (w * pr), 1 / (h * pr));
    outline.uniforms.uScale.value = pr;
    syncLineResolution();
  }
  window.addEventListener('resize', resize);
  resize();
  const start = overviewFit();
  camera.position.set(...start.pos);
  controls.target.set(...start.target);

  const keyDir = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    updateTweens(performance.now());
    rig.update(t);
    const pulse = 1 + Math.sin(t * 3.2) * 0.12;
    rig.beacons.forEach((b, a) => {
      // Beacons on the far side of an outer wall hide (they draw without depth testing).
      const seen = b.userData.seen as ((cam: THREE.Vector3) => boolean) | undefined;
      b.visible = a !== selected && (!seen || seen(camera.position));
      b.getWorldPosition(tmpV);
      b.scale.setScalar(pulse * Math.min(1.3, Math.max(0.3, tmpV.distanceTo(camera.position) / 6)));
    });
    controls.update();
    camera.updateMatrixWorld();
    keyDir.copy(key.position).sub(key.target.position).normalize();
    shared.uKeyDir.value.copy(keyDir).transformDirection(camera.matrixWorldInverse);
    shared.uUpView.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse);
    renderer.render(scene, camera);
    renderOutline();
  });
  (window as unknown as { __home?: unknown }).__home = { renderer, camera, controls, scene };

  return {
    focus,
    onSelect: (cb) => selectCbs.push(cb),
    onHover: (cb) => hoverCbs.push(cb),
    setSetup,
  };
}
