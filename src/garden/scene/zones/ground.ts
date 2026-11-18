import * as THREE from 'three';
import { add, jitter, tube, UNIT_BOX, V } from '../../../shared/scene/kit';
import type { GardenCtx } from '../ctx';
import { MAT } from '../../../shared/scene/materials';

export function buildGround(c: GardenCtx) {
  const { r, root, M, inst } = c;
  const ground = add(new THREE.CircleGeometry(8.6, 72), MAT.ground(), root, { at: [0, -0.005, 0], rot: [-Math.PI / 2, 0, 0], ink: null });
  ground.castShadow = false;
  const gravelShape = new THREE.Shape();
  {
    const w = 5.9;
    const d = 4.9;
    const rr = 0.8;
    gravelShape.moveTo(-w + rr, -d);
    gravelShape.lineTo(w - rr, -d);
    gravelShape.quadraticCurveTo(w, -d, w, -d + rr);
    gravelShape.lineTo(w, d - rr);
    gravelShape.quadraticCurveTo(w, d, w - rr, d);
    gravelShape.lineTo(-w + rr, d);
    gravelShape.quadraticCurveTo(-w, d, -w, d - rr);
    gravelShape.lineTo(-w, -d + rr);
    gravelShape.quadraticCurveTo(-w, -d, -w + rr, -d);
  }
  const gravelGeo = new THREE.ShapeGeometry(gravelShape, 8);
  {
    // Planar UVs across the whole patch.
    const pos = gravelGeo.getAttribute('position') as THREE.BufferAttribute;
    const uv = gravelGeo.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + 5.9) / 11.8, (pos.getY(i) + 4.9) / 9.8);
  }
  const gravel = add(gravelGeo, M.gravel, root, { at: [0, 0.004, 0], rot: [-Math.PI / 2, 0, 0], ink: null });
  gravel.castShadow = false;
  tube(gravelShape.getSpacedPoints(120).map((p) => V(p.x, 0.02, -p.y)), 0.02, M.galvDark, root, { radial: 4, seg: 240 });

  // Stepping stones: a path up the middle and one across.
  const stones = new THREE.Group();
  stones.userData.batchRoot = true;
  root.add(stones);
  const stone = (x: number, z: number) => inst(stones, UNIT_BOX, M.stone, [x + jitter(r, 0.02), 0.025, z + jitter(r, 0.02)], [0.44, 0.05, 0.44], new THREE.Color(0xffffff).offsetHSL(0, 0, jitter(r, 0.05)), [0, jitter(r, 0.08), 0]);
  for (let z = 4.4; z > -1.7; z -= 0.56) if (Math.abs(z - 1.25) > 0.3) stone(0, z);
  for (let x = -3.6; x < 4.2; x += 0.56) stone(x, 1.25);
}
