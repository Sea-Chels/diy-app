import * as THREE from 'three';

export const HOVER_LAYER = 1;
export const SELECT_LAYER = 2;

/**
 * One cyan rim around a whole spot's silhouette, instead of tinting every
 * leaf's ink. Meshes on HOVER_LAYER / SELECT_LAYER are drawn into a mask
 * (red = hovered, green = selected), and a full-screen pass turns its edge
 * into the rim.
 */
export function createOutlinePass(renderer: THREE.WebGLRenderer) {
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
        // near: within the rim width of the mask. cover: how surrounded this pixel is, so gaps between leaves don't get a rim.
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
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    setSize(w: number, h: number, pr: number): void {
      target.setSize(Math.round(w * pr), Math.round(h * pr));
      uniforms.uTexel.value.set(1 / (w * pr), 1 / (h * pr));
      uniforms.uScale.value = pr;
    },
    render(scene: THREE.Scene, camera: THREE.Camera): void {
      const layers = camera.layers.mask;
      const bg = scene.background;
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      scene.overrideMaterial = mask;
      scene.background = null;
      const shadows = renderer.shadowMap.autoUpdate;
      renderer.shadowMap.autoUpdate = false;
      for (const [layer, col] of [[HOVER_LAYER, 0xff0000], [SELECT_LAYER, 0x00ff00]] as const) {
        camera.layers.set(layer);
        mask.color.setHex(col);
        mask.blending = THREE.AdditiveBlending;
        renderer.autoClear = false;
        renderer.render(scene, camera);
      }
      renderer.shadowMap.autoUpdate = shadows;
      scene.overrideMaterial = null;
      scene.background = bg;
      camera.layers.mask = layers;
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCam);
      renderer.autoClear = true;
    },
  };
}
