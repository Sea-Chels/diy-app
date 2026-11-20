import * as THREE from 'three';
import { toon } from '../../shared/toon';
import { add, type V3 } from '../../shared/scene/kit';
import { C, M, rbox } from './kit';
import { plateMat } from './textures';
import { chain, coil, createCycle, onAxle, pipe, rod, tire } from './cycle';
import type { RideRig } from './parts3d';
import { viewFrom } from '../../shared/scene/rigKit';
import type { MotoPart } from '../data/parts';
import { TONE } from '../../shared/theme';

/** Side-stand lean, toward the rider's left (+x). */
const LEAN = -0.09;

/**
 * A standard naked motorcycle: cast wheels, a front disc, twin shocks, the chain on the
 * left and the exhaust on the right. The seat lifts to show the battery.
 */
export function buildMoto(): RideRig<MotoPart> {
  const { body, tag, groundY, finish } = createCycle(LEAN);
  const paint = () => toon(C.motoPaint, { shine: 0.85, metal: 0.3 });

  const FZ = 0.71;
  const RZ = -0.71;
  const wheel = (z: number, R: number, tube: number, hubW: number) => {
    const w = new THREE.Group();
    w.position.set(0, R, z);
    body.add(w);
    const rimR = R - 2 * tube + 0.01;
    const meshes = [add(tire(R, tube), M.rubber(), w, { ink: 'body' })];
    meshes.push(add(onAxle(new THREE.TorusGeometry(rimR, 0.012, 8, 40), 'z'), M.chrome(), w, { ink: null }));
    add(onAxle(new THREE.CylinderGeometry(rimR, rimR, tube * 1.6, 32, 1, true)), toon(C.barrel, { side: THREE.DoubleSide, halftone: 0.6 }), w, { ink: null });
    meshes.push(add(onAxle(new THREE.CylinderGeometry(0.045, 0.045, hubW, 16)), M.chrome(), w));
    for (let i = 0; i < 5; i++) {
      const spoke = add(rbox(0.022, rimR - 0.04, 0.03, 0.008), M.metal(), w);
      spoke.geometry.translate(0, (rimR - 0.04) / 2 + 0.03, 0);
      spoke.rotation.x = (i / 5) * Math.PI * 2;
    }
    return { w, meshes };
  };
  const front = wheel(FZ, 0.3, 0.055, 0.14);
  const rear = wheel(RZ, 0.31, 0.07, 0.18);
  tag('moto_tire', ...front.meshes, ...rear.meshes);

  // Raked 25 degrees back from the front axle to the top clamp.
  const rake = Math.tan(0.436);
  const forkZ = (y: number) => FZ - (y - 0.3) * rake;
  for (const x of [0.09, -0.09]) {
    add(rod([x, 0.3, FZ], [x, 0.56, forkZ(0.56)], 0.032), M.metal(), body);
    add(rod([x, 0.56, forkZ(0.56)], [x, 1.03, forkZ(1.03)], 0.022), M.chrome(), body);
  }
  for (const y of [0.86, 1.0]) {
    const clamp = add(rbox(0.26, 0.03, 0.08, 0.012), M.frame(), body, { at: [0, y, forkZ(y) - 0.02] });
    clamp.rotation.x = -0.436;
  }
  const headTop: V3 = [0, 1.0, forkZ(1.0) - 0.05];
  const headBottom: V3 = [0, 0.86, forkZ(0.86) - 0.05];
  add(rod(headBottom, headTop, 0.035), M.frame(), body);

  for (const x of [0.11, -0.11]) {
    add(rod(headTop, [x, 0.84, -0.12], 0.024), M.frame(), body);
    add(rod(headBottom, [x, 0.6, -0.2], 0.024), M.frame(), body);
    add(rod([x, 0.84, -0.12], [x * 0.9, 0.84, -0.75], 0.017), M.frame(), body);
    add(rod([x, 0.55, -0.2], [x * 0.9, 0.82, -0.58], 0.016), M.frame(), body);
    add(rod([x * 0.55, 0.86, forkZ(0.86) - 0.06], [x * 0.55, 0.24, 0.28], 0.02), M.frame(), body);
    add(rod([x, 0.4, -0.2], [x, 0.31, RZ], 0.028), M.frame(), body);
  }

  add(rbox(0.3, 0.22, 0.38, 0.05), M.casting(), body, { at: [0, 0.36, 0.06], ink: 'body' });
  const jug = new THREE.Group();
  jug.position.set(0, 0.56, 0.2);
  jug.rotation.x = 0.3;
  body.add(jug);
  add(rbox(0.24, 0.2, 0.15, 0.02), M.casting(), jug);
  for (let y = -0.07; y <= 0.08; y += 0.03) add(rbox(0.3, 0.012, 0.2, 0.004), M.metal(), jug, { at: [0, y, 0], ink: null });
  add(rbox(0.26, 0.06, 0.17, 0.02), toon(TONE.cover), jug, { at: [0, 0.12, 0] });
  const leftCover = add(onAxle(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 28)), M.metal('bright'), body, { at: [0.155, 0.36, 0.02] });
  const sight = add(onAxle(new THREE.CylinderGeometry(0.024, 0.024, 0.012, 20)), M.lamp(C.oil, 0.25), body, { at: [0.176, 0.3, 0.12], ink: null });
  const sightRim = add(onAxle(new THREE.TorusGeometry(0.026, 0.006, 6, 20), 'z'), M.chrome(), body, { at: [0.178, 0.3, 0.12], ink: null });
  const filler = add(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 14), toon(C.oil), body, { at: [0.12, 0.49, 0.1] });
  tag('moto_oil', leftCover, sight, sightRim, filler);

  add(pipe([[-0.05, 0.6, 0.3], [-0.08, 0.36, 0.36], [-0.1, 0.17, 0.12], [-0.13, 0.19, -0.2], [-0.17, 0.3, -0.36]], 0.022), M.metal('bright'), body);
  add(rod([-0.17, 0.3, -0.36], [-0.19, 0.44, -0.86], 0.062, 20), toon(C.trim, { shine: 0.5 }), body, { ink: 'body' });
  add(rod([-0.19, 0.44, -0.86], [-0.195, 0.455, -0.91], 0.05, 20), M.chrome(), body);

  // The chain runs on the left (+x), the side every close-up looks from; the exhaust is on the right.
  const CX = 0.17;
  const sprocketF = { c: [-0.14, 0.38] as [number, number], r: 0.05, wrap: 1 as const };
  const sprocketR = { c: [RZ, 0.31] as [number, number], r: 0.12, wrap: 1 as const };
  const chainMeshes = [
    add(chain([sprocketF, sprocketR], CX, 0.011), toon(TONE.gunmetal, { shine: 0.6, metal: 0.5 }), body),
    add(onAxle(new THREE.CylinderGeometry(sprocketR.r, sprocketR.r, 0.008, 36)), M.metal(), body, { at: [CX, 0.31, RZ] }),
    add(onAxle(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 20)), toon(TONE.cover), body, { at: [CX + 0.005, 0.38, -0.14] }),
  ];
  tag('moto_chain', ...chainMeshes);

  for (const x of [0.13, -0.13]) {
    add(rod([x, 0.36, -0.56], [x, 0.8, -0.47], 0.016), M.trim(), body);
    add(coil([x, 0.42, -0.547], [x, 0.74, -0.483], 0.03, 0.006, 7), toon(TONE.brightRed), body, { ink: null });
  }

  const disc = (x: number, z: number, y: number, r: number) =>
    add(onAxle(new THREE.CylinderGeometry(r, r, 0.006, 40)), toon(C.disc, { shine: 0.9, metal: 0.8 }), body, { at: [x, y, z] });
  const brakeMeshes = [
    disc(0.07, FZ, 0.3, 0.15),
    add(rbox(0.035, 0.1, 0.06, 0.012), toon(TONE.brightRed, { shine: 0.6 }), body, { at: [0.08, 0.39, FZ - 0.1] }),
    disc(-0.095, RZ, 0.31, 0.11),
    add(rbox(0.03, 0.06, 0.08, 0.01), toon(TONE.brightRed, { shine: 0.6 }), body, { at: [-0.1, 0.22, RZ + 0.06] }),
    add(rbox(0.05, 0.035, 0.045, 0.01), M.trim(), body, { at: [-0.17, 1.12, forkZ(1.12) - 0.04] }),
  ];
  brakeMeshes[1].rotation.x = 0.8;
  tag('moto_brakes', ...brakeMeshes);

  const tank = add(new THREE.SphereGeometry(1, 28, 18).scale(0.17, 0.12, 0.29), paint(), body, { at: [0, 0.96, 0.1], ink: 'body' });
  tank.rotation.x = -0.12;
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16), M.chrome(), body, { at: [0, 1.075, 0.17], ink: null });
  for (const x of [0.13, -0.13]) add(rbox(0.03, 0.13, 0.26, 0.012), paint(), body, { at: [x, 0.73, -0.3] });

  // Hinged at its front edge so the back lifts clear of the battery tray below.
  const seatPivot = new THREE.Group();
  seatPivot.position.set(0, 0.86, -0.07);
  body.add(seatPivot);
  const seat = add(rbox(0.27, 0.075, 0.52, 0.035), toon(C.darkPart, { halftone: 0.6 }), seatPivot, { at: [0, 0.02, -0.26], ink: 'body' });
  seat.rotation.x = 0.08;
  add(rbox(0.22, 0.015, 0.42, 0.005), toon(TONE.blackPart), body, { at: [0, 0.685, -0.33], ink: null });
  const battery = [
    add(rbox(0.14, 0.1, 0.12, 0.01), toon(TONE.plastic, { halftone: 0.5 }), body, { at: [0, 0.74, -0.3] }),
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10), toon(TONE.brightRed), body, { at: [0.045, 0.8, -0.3], ink: null }),
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10), M.trim(), body, { at: [-0.045, 0.8, -0.3], ink: null }),
  ];
  tag('moto_battery', ...battery);

  const tail = add(new THREE.SphereGeometry(1, 20, 14).scale(0.11, 0.06, 0.2), paint(), body, { at: [0, 0.86, -0.72], ink: 'body' });
  tail.rotation.x = 0.15;
  const lights = [add(rbox(0.12, 0.04, 0.03, 0.012), M.lamp(C.taillight, 0.6), body, { at: [0, 0.86, -0.9] })];
  add(rod([0, 0.82, -0.86], [0, 0.6, -0.95], 0.01), M.trim(), body, { ink: null });
  const plate = add(rbox(0.18, 0.12, 0.01, 0.008), plateMat(), body, { at: [0, 0.58, -0.96] });
  plate.rotation.y = Math.PI;
  plate.rotation.x = -0.2;

  const headlight = new THREE.Group();
  headlight.position.set(0, 0.9, forkZ(0.9) + 0.12);
  body.add(headlight);
  lights.push(add(new THREE.CylinderGeometry(0.095, 0.072, 0.11, 28).rotateX(Math.PI / 2), M.trim(), headlight));
  lights.push(add(new THREE.CylinderGeometry(0.085, 0.085, 0.01, 28).rotateX(Math.PI / 2), M.lamp(C.lamp, 0.35), headlight, { at: [0, 0, 0.056], ink: null }));
  lights.push(add(new THREE.TorusGeometry(0.09, 0.008, 8, 32), M.chrome(), headlight, { at: [0, 0, 0.058], ink: null }));
  for (const [x, y, z] of [[0.16, 0.93, forkZ(0.93) + 0.06], [-0.16, 0.93, forkZ(0.93) + 0.06], [0.13, 0.8, -0.86], [-0.13, 0.8, -0.86]] as V3[]) {
    add(rod([Math.sign(x) * 0.08, y, z - Math.sign(z) * 0.03], [x, y, z], 0.007), M.trim(), body, { ink: null });
    lights.push(add(new THREE.CapsuleGeometry(0.018, 0.03, 4, 10).rotateX(Math.PI / 2), M.lamp(C.marker, 0.4), body, { at: [x, y, z] }));
  }
  tag('moto_lights', ...lights);

  const fender = add(new THREE.TorusGeometry(0.335, 0.04, 8, 24, 1.5).rotateY(-Math.PI / 2).rotateX(-0.45).scale(1.6, 1, 1), paint(), body, { at: [0, 0.3, FZ] });
  fender.castShadow = false;

  const barY = (x: number) => 1.06 + Math.abs(x) * 0.11;
  const barZ = (x: number) => forkZ(1.03) - 0.01 - Math.abs(x) * 0.18;
  const bar: V3[] = [-0.37, -0.15, 0, 0.15, 0.37].map((x) => [x, barY(x), barZ(x)]);
  const controls = [add(pipe(bar, 0.013), toon(C.trim, { shine: 0.5 }), body)];
  for (const s of [1, -1]) {
    controls.push(add(rod([s * 0.26, barY(0.26), barZ(0.26)], [s * 0.37, barY(0.37), barZ(0.37)], 0.019), M.trim(), body));
    controls.push(add(rod([s * 0.21, barY(0.21) - 0.005, barZ(0.21) + 0.03], [s * 0.35, barY(0.35) - 0.01, barZ(0.35) + 0.07], 0.007), M.chrome(), body, { ink: null }));
    const stalkTop: V3 = [s * 0.28, 1.33, barZ(0.28) - 0.03];
    controls.push(add(rod([s * 0.2, barY(0.2), barZ(0.2)], stalkTop, 0.007), M.trim(), body, { ink: null }));
    const mirror = add(new THREE.CylinderGeometry(0.055, 0.055, 0.018, 24).rotateX(Math.PI / 2), M.trim(), body, { at: [stalkTop[0], stalkTop[1] + 0.03, stalkTop[2]] });
    mirror.rotation.y = s * 0.25;
    controls.push(mirror, add(new THREE.CircleGeometry(0.047, 24).rotateY(Math.PI), toon(C.mirror, { shine: 1, halftone: 0 }), mirror, { at: [0, 0, -0.0095], ink: null }));
  }
  tag('moto_controls', ...controls);
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 24).rotateX(Math.PI / 2 - 0.5), toon(TONE.cover), body, { at: [0, 1.1, forkZ(1.1) + 0.03] });

  // Footpegs sit outboard of the chain.
  for (const s of [1, -1]) add(rod([s * 0.2, 0.37, -0.22], [s * 0.31, 0.37, -0.23], 0.014), M.trim(), body, { ink: null });
  add(rod([0.14, 0.33, -0.12], [0.3, groundY(0.3), -0.05], 0.012), M.trim(), body, { ink: null });

  return finish<MotoPart>({
    lids: { moto_seat: { pivot: seatPivot, axis: 'x', open: 1.0 } },
    dots: {
      moto_tire: [0.1, 0.64, FZ],
      moto_chain: [0.25, 0.42, -0.45],
      moto_brakes: [0.14, 0.47, FZ - 0.08],
      moto_oil: [0.25, 0.28, 0.13],
      moto_battery: [0.19, 0.82, -0.3],
      moto_lights: [0, 1.02, forkZ(1.02) + 0.17],
      moto_controls: [0.38, 1.17, barZ(0.37)],
    },
    views: {
      moto_tire: viewFrom([0, 0.32, FZ - 0.05], [1, 0.35, 0.5], 1.5),
      moto_chain: viewFrom([CX, 0.34, -0.42], [1, 0.25, -0.1], 1.25),
      moto_brakes: viewFrom([0.07, 0.38, FZ - 0.03], [1, 0.3, 0.55], 1.1),
      moto_oil: viewFrom([0.16, 0.33, 0.1], [1, 0.15, 0.4], 1.0),
      moto_battery: viewFrom([0, 0.76, -0.32], [0.55, 0.9, -0.75], 1.2),
      moto_lights: viewFrom([0, 0.9, 0.55], [0.45, 0.25, 1], 1.5),
      moto_controls: viewFrom([0.08, 1.1, 0.3], [0.9, 0.75, -0.35], 1.25),
    },
    overview: viewFrom([0, 0.6, 0.05], [0.6, 0.45, 1], 3.0),
  });
}
