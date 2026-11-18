import * as THREE from 'three';
import { loft } from '../loft';
import type { CarCtx } from '../ctx';
import { add } from '../../../shared/scene/kit';

export function buildHood(c: CarCtx) {
  const { S, group, paint, tag, hoodLine, hoodW, hoodZ1 } = c;
  const hoodZ0 = S.cowlZ + 0.02;
  const hoodPivot = new THREE.Group();
  hoodPivot.position.set(0, hoodLine(hoodZ0), hoodZ0);
  group.add(hoodPivot);
  const hoodGeom = loft((z) => ({ z, yb: hoodLine(z) - 0.016, yt: hoodLine(z) + 0.008, wb: hoodW, wt: hoodW - 0.01 }), hoodZ0, hoodZ1, 10, 30);
  hoodGeom.translate(0, -hoodLine(hoodZ0), -hoodZ0);
  const hood = add(hoodGeom, paint(), hoodPivot, { ink: 'body' });
  tag('hood', hood);
  return { hoodPivot, hoodZ0, hoodZ1 };
}
