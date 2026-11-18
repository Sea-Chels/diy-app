import * as THREE from 'three';
import { toon } from '../../shared/toon';
import type { V3 } from '../../shared/scene/kit';
import { C, M, rbox } from './kit';
import { chain, createCycle, onAxle, pipe, rod, spokes, tire, type Pulley } from './cycle';
import { view, type RideRig } from './parts3d';
import type { BikePart } from '../data/parts';

/** Kickstand lean, toward the rider's left (+x). */
const LEAN = -0.1;

/**
 * A hybrid bike: diamond frame, 700c wheels, V-brakes and a flat bar. The drivetrain is
 * on the right (-x), the chain running through a rear derailleur.
 */
export function buildBike(): RideRig<BikePart> {
  const { body, put, tag, groundY, finish } = createCycle(LEAN);
  const paint = () => toon(C.bikePaint, { shine: 0.8, metal: 0.25 });

  const R = 0.34;
  const FZ = 0.52;
  const RZ = -0.52;
  const tireMeshes: THREE.Mesh[] = [];
  for (const z of [FZ, RZ]) {
    const w = new THREE.Group();
    w.position.set(0, R, z);
    body.add(w);
    tireMeshes.push(put(w, tire(R, 0.018), M.rubber(), undefined, 'thin'));
    tireMeshes.push(put(w, onAxle(new THREE.TorusGeometry(R - 0.03, 0.009, 8, 48), 'z').scale(1.6, 1, 1), M.metal(), undefined, 'thin'));
    put(w, spokes(28, 0.024, 0.028, R - 0.036, 0.0018), toon(C.spoke, { shine: 0.6, halftone: 0 }), undefined, false);
    put(w, onAxle(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 14)), M.metal(), undefined, 'thin');
  }
  tag('bike_tire', ...tireMeshes);

  const BB: V3 = [0, 0.27, -0.09];
  const seatTop: V3 = [0, 0.76, -0.24];
  const headTop: V3 = [0, 0.84, 0.345];
  const headBottom: V3 = [0, 0.7, 0.393];
  const tube = (a: V3, b: V3, r: number) => put(body, rod(a, b, r), paint(), undefined, 'thin');
  tube(seatTop, headTop, 0.016);
  tube(headBottom, BB, 0.02);
  tube(BB, [0, 0.8, -0.253], 0.016);
  tube(headBottom, headTop, 0.022);
  for (const s of [1, -1]) {
    tube([s * 0.025, 0.27, -0.1], [s * 0.065, R, RZ], 0.01);
    tube([s * 0.02, 0.745, -0.25], [s * 0.065, R + 0.02, RZ + 0.01], 0.009);
    put(body, pipe([[s * 0.045, 0.67, 0.405], [s * 0.048, 0.5, 0.468], [s * 0.05, R, FZ]], 0.012), paint(), undefined, 'thin');
  }
  put(body, rbox(0.11, 0.03, 0.05, 0.012), paint(), [0, 0.675, 0.402], 'thin');

  const barZ = 0.42;
  const barY = 0.905;
  put(body, rod([0, 0.84, 0.345], [0, 0.875, 0.33], 0.018), M.trim(), undefined, 'thin');
  put(body, rod([0, 0.865, 0.335], [0, barY, barZ], 0.016), M.trim(), undefined, 'thin');
  put(body, rod([-0.34, barY, barZ - 0.02], [0.34, barY, barZ - 0.02], 0.012), M.trim(), undefined, 'thin');
  const brakeMeshes: THREE.Mesh[] = [];
  for (const s of [1, -1]) {
    put(body, rod([s * 0.24, barY, barZ - 0.02], [s * 0.34, barY, barZ - 0.02], 0.017), toon(C.darkPart), undefined, 'thin');
    brakeMeshes.push(put(body, rod([s * 0.2, barY, barZ - 0.01], [s * 0.31, barY - 0.01, barZ + 0.05], 0.006), M.metal(), undefined, false));
  }
  const shifter = put(body, rbox(0.04, 0.03, 0.04, 0.01), M.trim(), [-0.19, barY - 0.025, barZ - 0.03], 'thin');

  const vbrake = (y: number, z: number, x0: number) => {
    for (const s of [1, -1]) {
      brakeMeshes.push(put(body, rod([s * x0, y - 0.04, z], [s * (x0 + 0.01), y + 0.07, z + 0.01], 0.006), M.metal(), undefined, false));
      brakeMeshes.push(put(body, rbox(0.012, 0.016, 0.045, 0.005), M.trim(), [s * 0.022, y, z], false));
    }
    brakeMeshes.push(put(body, rod([-(x0 + 0.01), y + 0.07, z + 0.01], [x0 + 0.01, y + 0.07, z + 0.01], 0.003), M.trim(), undefined, false));
  };
  vbrake(0.64, 0.48, 0.05);
  vbrake(0.6, -0.35, 0.045);
  brakeMeshes.push(put(body, pipe([[0.25, barY, barZ], [0.2, 0.86, 0.5], [0.06, 0.78, 0.5], [0.06, 0.71, 0.49]], 0.003), M.trim(), undefined, false));
  brakeMeshes.push(put(body, pipe([[-0.25, barY, barZ], [-0.12, 0.88, 0.36], [0.018, 0.82, 0.2], [0.018, 0.79, -0.18], [-0.05, 0.67, -0.34]], 0.003), M.trim(), undefined, false));
  tag('bike_brakes', ...brakeMeshes);

  const CX = -0.072;
  const ring = { c: [BB[2], BB[1]] as [number, number], r: 0.1, wrap: 1 as const };
  const cog = { c: [RZ, R] as [number, number], r: 0.042, wrap: 1 as const };
  const guide = { c: [RZ - 0.015, R - 0.105] as [number, number], r: 0.024, wrap: -1 as const };
  const tension = { c: [RZ + 0.02, R - 0.19] as [number, number], r: 0.024, wrap: 1 as const };
  const chainMeshes = [
    put(body, chain([ring, cog, guide, tension] as Pulley[], CX, 0.006), toon(C.chain, { shine: 0.6, metal: 0.5 }), undefined, 'thin'),
    put(body, onAxle(new THREE.TorusGeometry(0.098, 0.01, 6, 40), 'z').scale(0.4, 1, 1), M.metal(), [CX - 0.004, BB[1], BB[2]], 'thin'),
  ];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    chainMeshes.push(put(body, rod([CX - 0.006, BB[1], BB[2]], [CX - 0.006, BB[1] + Math.sin(a) * 0.09, BB[2] + Math.cos(a) * 0.09], 0.007), M.trim(), undefined, false));
  }
  const crankEnd = (s: number): V3 => [s * 0.09, BB[1] - s * 0.085, BB[2] + s * 0.147];
  for (const s of [-1, 1]) {
    const end = crankEnd(s);
    chainMeshes.push(put(body, rod([s * 0.085, BB[1], BB[2]], end, 0.013), M.trim(), undefined, 'thin'));
    put(body, rbox(0.08, 0.02, 0.07, 0.008), M.trim(), [end[0] + s * 0.05, end[1], end[2]], 'thin');
  }
  put(body, onAxle(new THREE.CylinderGeometry(0.03, 0.03, 0.17, 14)), M.trim(), BB, false);
  tag('bike_chain', ...chainMeshes);

  const gearMeshes = [shifter];
  for (let i = 0; i < 6; i++) {
    const r = 0.052 - i * 0.006;
    gearMeshes.push(put(body, onAxle(new THREE.CylinderGeometry(r, r, 0.003, 28)), M.metal(), [-0.04 - i * 0.006, R, RZ], false));
  }
  const cage = new THREE.Group();
  body.add(cage);
  for (const p of [guide, tension] as Pulley[]) {
    gearMeshes.push(put(cage, onAxle(new THREE.CylinderGeometry(p.r, p.r, 0.008, 16)), M.trim(), [CX, p.c[1], p.c[0]], 'thin'));
  }
  gearMeshes.push(put(cage, rod([CX - 0.012, guide.c[1], guide.c[0]], [CX - 0.012, tension.c[1], tension.c[0]], 0.012), toon(C.cover, { shine: 0.5 }), undefined, 'thin'));
  gearMeshes.push(put(cage, rbox(0.03, 0.06, 0.04, 0.01), toon(C.cover, { shine: 0.5 }), [CX - 0.02, R - 0.05, RZ - 0.03], 'thin'));
  gearMeshes.push(put(body, pipe([[-0.21, barY - 0.03, barZ - 0.04], [-0.1, 0.82, 0.38], [-0.02, 0.62, 0.22], [-0.03, 0.3, -0.12], [-0.06, 0.3, -0.42], [CX - 0.03, R - 0.03, RZ - 0.03]], 0.003), M.trim(), undefined, false));
  tag('bike_gears', ...gearMeshes);

  // Seatpost follows the seat tube's angle; the saddle narrows to its nose.
  const postTop: V3 = [0, 0.97, -0.305];
  const saddle = [
    put(body, rod([0, 0.75, -0.237], postTop, 0.0135), M.metal(), undefined, 'thin'),
    put(body, new THREE.TorusGeometry(0.019, 0.006, 6, 16).rotateX(Math.PI / 2 - 0.29), M.trim(), [0, 0.78, -0.25], false),
  ];
  const seatGeo = rbox(0.16, 0.05, 0.27, 0.024);
  const sp = seatGeo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < sp.count; i++) sp.setX(i, sp.getX(i) * (0.55 + 0.45 * (0.135 - sp.getZ(i)) / 0.27));
  seatGeo.computeVertexNormals();
  saddle.push(put(body, seatGeo, toon(C.darkPart, { halftone: 0.6 }), [0, 0.995, -0.29]));
  tag('bike_saddle', ...saddle);

  put(body, rod([0.045, 0.3, -0.17], [0.22, groundY(0.22), -0.33], 0.009), M.trim(), undefined, false);

  return finish<BikePart>('bike', {
    dots: {
      bike_tire: [-0.05, R, FZ + R + 0.07],
      bike_chain: [-0.15, 0.32, -0.25],
      bike_brakes: [-0.11, 0.74, 0.47],
      bike_gears: [-0.15, 0.2, RZ - 0.04],
      bike_saddle: [-0.1, 1.06, -0.3],
    },
    views: {
      bike_tire: view([0, 0.36, FZ - 0.02], [-1, 0.35, 0.55], 1.5),
      bike_chain: view([CX, 0.27, -0.28], [-1, 0.28, 0.15], 1.25),
      bike_brakes: view([-0.02, 0.66, 0.47], [-0.9, 0.4, 0.6], 0.8),
      bike_gears: view([CX - 0.01, 0.24, RZ], [-1, 0.15, -0.35], 0.85),
      bike_saddle: view([0, 0.95, -0.29], [-1, 0.55, -0.35], 1.0),
    },
    overview: view([0, 0.5, 0], [-1, 0.32, 0.45], 3.2),
  });
}
