import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { add, canvasTex, mapped, range } from '../../../shared/scene/kit';
import { V } from '../geometry';
import type { GardenCtx } from '../ctx';

export function buildWildlife(c: GardenCtx) {
  const { season, r, b, root } = c;
  const critters = new THREE.Group();
  root.add(critters);
  const bodyMat = mapped(0xffffff, canvasTex(32, 16, (ctx) => {
    ctx.fillStyle = '#f2c21a';
    ctx.fillRect(0, 0, 32, 16);
    ctx.fillStyle = '#1a1410';
    for (let x = 4; x < 32; x += 8) ctx.fillRect(x, 0, 4, 16);
  }));
  const wingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  const flowersAt = [V(4.45, 1.6, 3.0), V(1.75, 0.8, 0.3), V(-4.3, 0.9, 1.3), V(0, 2.1, 4.25), V(-1.3, 1.3, -2.5), V(4.8, 1.0, -0.6)];
  type Critter = { g: THREE.Group; wings: THREE.Mesh[]; home: THREE.Vector3; speed: number; phase: number; rad: number; bee: boolean };
  const bugs: Critter[] = [];
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group();
    const bodyG = new THREE.CapsuleGeometry(0.018, 0.03, 3, 8);
    bodyG.rotateZ(Math.PI / 2);
    add(bodyG, bodyMat, g, [0, 0, 0], { ink: 'thin' });
    const wings: THREE.Mesh[] = [];
    for (const sd of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.022, 10).translate(0, 0, 0.022), wingMat);
      w.position.set(0, 0.015, 0);
      w.userData.side = sd;
      g.add(w);
      wings.push(w);
    }
    critters.add(g);
    bugs.push({ g, wings, home: flowersAt[i % flowersAt.length].clone(), speed: range(r, 1.4, 2.4), phase: r() * 6.28, rad: range(r, 0.25, 0.6), bee: true });
  }
  const bfly = [0xff8a1a, 0xffffff, 0x6ec8ff, 0xffd23f];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    add(new THREE.CapsuleGeometry(0.007, 0.04, 3, 6), toon(0x1a1410), g, [0, 0, 0], { rot: [Math.PI / 2, 0, 0], ink: null });
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.03, 0.05, 0.08, 0.04, 0.07, 0.0);
    shape.bezierCurveTo(0.08, -0.04, 0.03, -0.05, 0, 0);
    const wg = new THREE.ShapeGeometry(shape, 8);
    wg.rotateX(-Math.PI / 2);
    const wm = toon(bfly[i % bfly.length], { side: THREE.DoubleSide });
    const wings: THREE.Mesh[] = [];
    for (const sd of [-1, 1]) {
      const w = add(wg, wm, g, [0, 0, 0], { ink: 'thin', scale: [sd, 1, 1] });
      w.userData.side = sd;
      wings.push(w);
    }
    critters.add(g);
    bugs.push({ g, wings, home: flowersAt[(i * 2 + 1) % flowersAt.length].clone().add(V(0, 0.3, 0)), speed: range(r, 0.5, 0.8), phase: r() * 6.28, rad: range(r, 0.6, 1.1), bee: false });
  }
  if (season === 'fall') bugs.splice(6, 4);

  b.flush();
  return { bugs };
}
