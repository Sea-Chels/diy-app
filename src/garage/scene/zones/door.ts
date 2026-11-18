import * as THREE from 'three';
import { inkLine, toon } from '../../../shared/toon';
import { ringLine, ringPoint, shell, surfaceLine, tAtY, type Section } from '../loft';
import { C, rbox } from '../kit';
import type { CarCtx } from '../ctx';

export function buildDoors(c: CarCtx) {
  const { S, group, paint, put, tag, chromeMat, LOWER_N, lower, fender, sideX } = c;
  const [doorZ0, doorZ1] = S.door;
  const doorMid = lower((doorZ0 + doorZ1) / 2);
  const tLow = tAtY(doorMid, S.doorY[0], LOWER_N);
  const tHigh = tAtY(doorMid, S.doorY[1], LOWER_N);
  const doorHinge = ringPoint(lower(doorZ1), (tLow + tHigh) / 2, LOWER_N);
  const doorPivot = new THREE.Group();
  doorPivot.position.copy(doorHinge);
  group.add(doorPivot);
  const doorGeom = shell(lower, LOWER_N, doorZ0, doorZ1, tLow, tHigh, 0.006, 0.026, 24, 14);
  doorGeom.translate(-doorHinge.x, -doorHinge.y, -doorHinge.z);
  const door = put(doorPivot, doorGeom, paint());
  put(group, shell(lower, LOWER_N, doorZ0 + 0.02, doorZ1 - 0.02, tLow + 0.01, tHigh - 0.01, 0.002, 0.002, 10, 8), toon(C.bay, { halftone: 0.5, side: THREE.DoubleSide }), undefined, false);
  const handleY = S.doorY[1] - 0.12;
  const doorHandle = put(doorPivot, rbox(0.035, 0.04, 0.16, 0.012), chromeMat(), [sideX(doorZ0 + 0.2, handleY, 1, 0.045) - doorHinge.x, handleY - doorHinge.y, doorZ0 + 0.2 - doorHinge.z], 'thin');
  const charY = S.belt - 0.17;
  const doorLine = inkLine(surfaceLine(lower, LOWER_N, doorZ0 + 0.01, doorZ1 - 0.01, (s) => tAtY(s, charY, LOWER_N), 0.034, 20));
  doorLine.position.set(-doorHinge.x, -doorHinge.y, -doorHinge.z);
  doorPivot.add(doorLine);

  const mirrorMeshes: THREE.Mesh[] = [];
  for (const side of [1, -1]) {
    const parent = side > 0 ? doorPivot : group;
    const off = side > 0 ? doorHinge : new THREE.Vector3();
    const mx = side * (S.ghW[0] + 0.12);
    const my = S.belt + 0.1;
    const mz = S.cowlZ - 0.16;
    put(parent, rbox(0.14, 0.04, 0.05, 0.015), toon(C.trim), [side * (S.ghW[0] + 0.04) - off.x, my - 0.03 - off.y, mz - off.z], 'thin');
    const m = put(parent, rbox(0.12, 0.11, 0.19, 0.045), paint(), [mx - off.x, my - off.y, mz - off.z]);
    m.rotation.y = side * 0.12;
    mirrorMeshes.push(m);
  }
  tag('door', door, doorHandle, ...mirrorMeshes);

  const seam = (side: number, z0: number, z1: number) => {
    const s = lower((z0 + z1) / 2);
    let t0 = tAtY(s, S.doorY[0], LOWER_N);
    let t1 = tAtY(s, S.doorY[1], LOWER_N);
    if (side < 0) [t0, t1] = [0.5 - t1, 0.5 - t0];
    const tt = (tv: number) => () => tv;
    const pts = [
      ...surfaceLine(lower, LOWER_N, z0, z1, tt(t0), 0.004, 16),
      ...ringLine(lower, LOWER_N, z1, t0, t1, 0.004, 10),
      ...surfaceLine(lower, LOWER_N, z1, z0, tt(t1), 0.004, 16),
      ...ringLine(lower, LOWER_N, z0, t1, t0, 0.004, 10),
    ];
    group.add(inkLine(pts, 1.6));
    put(group, rbox(0.035, 0.04, 0.16, 0.012), chromeMat(), [sideX(z0 + 0.2, handleY, side, 0.02), handleY, z0 + 0.2], 'thin');
  };
  seam(-1, doorZ0, doorZ1);
  seam(1, S.rearDoor[0], S.rearDoor[1]);
  seam(-1, S.rearDoor[0], S.rearDoor[1]);

  for (const side of [1, -1]) {
    const tq = (s: Section) => {
      const t = tAtY(s, charY, LOWER_N);
      return side > 0 ? t : 0.5 - t;
    };
    group.add(inkLine(surfaceLine(lower, LOWER_N, S.tailZ + 0.12, side > 0 ? doorZ0 : S.cowlZ, tq, 0.004, 60), 1.8));
    group.add(inkLine(surfaceLine(fender(side), LOWER_N, S.cowlZ, S.fasciaZ + 0.04, tq, 0.004, 30), 1.8));
  }
  return { doorPivot, doorZ0, doorZ1 };
}
