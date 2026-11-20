import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { add, textured } from '../../../shared/scene/kit';
import { C, M, rbox } from '../kit';
import { tireTex } from '../textures';
import type { CarCtx } from '../ctx';
import { TONE } from '../../../shared/theme';
import { FINISH } from '../../../shared/scene/materials';

export function buildWheels(c: CarCtx) {
  const { S, group, tag } = c;
  const R = S.wheelR;
  const W = S.wheelW;
  const tireGeom = (() => {
    const prof: THREE.Vector2[] = [
      [0.64 * R, -W / 2],
      [R - 0.06, -W / 2],
      [R - 0.015, -W / 2 + 0.02],
      [R, -W / 2 + 0.06],
      [R, W / 2 - 0.06],
      [R - 0.015, W / 2 - 0.02],
      [R - 0.06, W / 2],
      [0.64 * R, W / 2],
      [0.64 * R, -W / 2],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.LatheGeometry(prof, 48);
    g.rotateZ(Math.PI / 2);
    return g;
  })();
  const wheelMeshes: THREE.Mesh[] = [];
  const brakeMeshes: THREE.Mesh[] = [];
  for (const [side, z] of [[1, S.wheelZ[0]], [-1, S.wheelZ[0]], [1, S.wheelZ[1]], [-1, S.wheelZ[1]]] as const) {
    const wg = new THREE.Group();
    wg.position.set(side * S.track, R, z);
    group.add(wg);
    const face = side * (W / 2 - 0.03);
    wheelMeshes.push(add(tireGeom, textured(tireTex(), { shine: 0.15 }), wg, { ink: 'body' }));
    const barrel = new THREE.CylinderGeometry(0.63 * R, 0.63 * R, W * 0.8, 28, 1, true);
    barrel.rotateZ(Math.PI / 2);
    add(barrel, toon(C.barrel, { side: THREE.DoubleSide, halftone: 0.6 }), wg, { ink: null });
    const lip = new THREE.TorusGeometry(0.62 * R, 0.022, 8, 36);
    lip.rotateY(Math.PI / 2);
    wheelMeshes.push(add(lip, M.metal('bright'), wg, { at: [face, 0, 0] }));
    for (let k = 0; k < 5; k++) {
      const g = rbox(0.035, 0.52 * R, 0.085, 0.015);
      g.translate(0, 0.3 * R, 0);
      const spoke = add(g, M.metal('bright'), wg, { at: [face, 0, 0] });
      spoke.rotation.x = (k * Math.PI * 2) / 5;
      wheelMeshes.push(spoke);
    }
    const hub = new THREE.CylinderGeometry(0.15 * R, 0.15 * R, 0.05, 20);
    hub.rotateZ(Math.PI / 2);
    wheelMeshes.push(add(hub, M.chrome(), wg, { at: [face, 0, 0] }));
    for (let k = 0; k < 5; k++) {
      const a = ((k + 0.5) * Math.PI * 2) / 5;
      const lug = new THREE.CylinderGeometry(0.016, 0.016, 0.03, 6);
      lug.rotateZ(Math.PI / 2);
      wheelMeshes.push(add(lug, toon(C.trim, FINISH.brushed), wg, { at: [face + side * 0.012, Math.sin(a) * 0.22 * R, Math.cos(a) * 0.22 * R], ink: null }));
    }
    const disc = new THREE.CylinderGeometry(0.5 * R, 0.5 * R, 0.025, 28);
    disc.rotateZ(Math.PI / 2);
    brakeMeshes.push(add(disc, toon(C.disc, FINISH.brushed), wg));
    const hat = new THREE.CylinderGeometry(0.27 * R, 0.27 * R, 0.04, 24);
    hat.rotateZ(Math.PI / 2);
    brakeMeshes.push(add(hat, toon(C.barrel, { metal: 0.5 }), wg, { at: [side * 0.01, 0, 0], ink: null }));
    const caliper = add(rbox(0.07, 0.17, 0.12, 0.03), toon(TONE.brightRed, { shine: 0.6 }), wg, { at: [side * 0.03, 0.26 * R, -0.28 * R] });
    caliper.rotation.x = 0.6;
    brakeMeshes.push(caliper);
  }
  tag('wheel', ...wheelMeshes);
  tag('brakes', ...brakeMeshes);
}
