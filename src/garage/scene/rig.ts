/**
 * Stylized comic-book car. Two generic bodies (sedan, SUV) are lofted from
 * profile curves, cel-shaded and inked. The contract with the scene is `Rig`;
 * every PartId in data/parts.ts gets hotspot meshes, a beacon and a camera view.
 */
import * as THREE from 'three';
import { tween, easeInOutCubic, lerp } from '../../shared/tween';
import { disposeTree, type ToonUniforms } from '../../shared/toon';
import type { V3 } from '../../shared/scene/kit';
import { hex } from '../../shared/theme';
import type { StageRig, View } from '../../shared/scene/stage';
import { PARTS, type LidId, type PartId } from '../data/parts';
import type { BodyKind } from '../data/paint';
import { createCtx } from './ctx';
import { buildBody } from './zones/body';
import { buildHood } from './zones/hood';
import { buildTrunk } from './zones/trunk';
import { buildDoors } from './zones/door';
import { buildCabin } from './zones/cabin';
import { buildEngineBay } from './zones/bay';
import { buildFront } from './zones/front';
import { buildRear } from './zones/rear';
import { buildWipers } from './zones/wipers';
import { buildWheels } from './zones/wheels';

export interface Paint {
  color: string;
  shine: number;
  metal: number;
}

export interface Rig extends StageRig<PartId, LidId> {
  setPaint(p: Paint, instant?: boolean): void;
  /** Tints the selected part's own glow, so small dark parts read as selected too. */
  focus(part: PartId | null): void;
  canPick(part: PartId): boolean;
}

export function buildRig(kind: BodyKind): Rig {
  const c = createCtx(kind);
  const { S, group, hotspots, paintMats, roofLine, hoodLine } = c;
  buildBody(c);
  const { hoodPivot, hoodZ0, hoodZ1 } = buildHood(c);
  const trunk = buildTrunk(c);
  const { trunkPivot, trunkOpen, trunkBeacon, trunkView, suvLampPos } = trunk;
  const { doorPivot, doorZ0, doorZ1 } = buildDoors(c);
  const { dashZ } = buildCabin(c);
  const { F, bz0, bm, tankZ } = buildEngineBay(c);
  const { lightY, lampX, lampZ, lampR, blink } = buildFront(c);
  const { tailTop, tipZ, fuelY, fuelZ } = buildRear(c, trunk);
  const { wipeZ, wipe } = buildWipers(c);
  buildWheels(c);
  const R = S.wheelR;

  const lidState: Record<LidId, boolean> = { hood: false, trunk: false, door: false };
  const lids: Record<LidId, { pivot: THREE.Group; axis: 'x' | 'y'; open: number }> = {
    hood: { pivot: hoodPivot, axis: 'x', open: -1.1 },
    trunk: { pivot: trunkPivot, axis: 'x', open: trunkOpen },
    door: { pivot: doorPivot, axis: 'y', open: -1.0 },
  };

  function setLid(lid: LidId, open: boolean): void {
    if (lidState[lid] === open) return;
    lidState[lid] = open;
    const { pivot, axis, open: angle } = lids[lid];
    const from = pivot.rotation[axis];
    const to = open ? angle : 0;
    tween({
      duration: 750,
      ease: easeInOutCubic,
      tag: `lid:${kind}:${lid}`,
      update: (k) => {
        pivot.rotation[axis] = lerp(from, to, k);
      },
    });
  }

  const canPick = (part: PartId) => {
    const { behind, seeThrough } = PARTS[part];
    return !behind || seeThrough === true || lidState[behind];
  };

  // Unlike the other workshops' beacons these are depth-tested, so the car hides them and they pick like any other part.
  const beacons = new Map<PartId, THREE.Mesh>();
  const beaconGeom = new THREE.SphereGeometry(0.045, 16, 16);
  const beaconAt = (part: PartId, p: V3) => {
    const b = new THREE.Mesh(beaconGeom, new THREE.MeshBasicMaterial({ color: hex('cyan'), transparent: true, opacity: 0.92 }));
    b.position.set(...p);
    b.renderOrder = 3;
    b.userData.area = part;
    b.userData.seen = () => canPick(part);
    group.add(b);
    beacons.set(part, b);
  };
  const hoodMidZ = (hoodZ0 + hoodZ1) / 2;
  beaconAt('hood', [0, hoodLine(hoodMidZ) + 0.12, hoodMidZ]);
  beaconAt('oil', [0.14, F + 0.47, bm - 0.07]);
  beaconAt('battery', [-0.34, F + 0.33, bz0 + 0.16]);
  beaconAt('airbox', [0.42, F + 0.3, bz0 + 0.12]);
  beaconAt('coolant', [0.43, F + 0.42, tankZ]);
  beaconAt('washer', [-0.43, F + 0.42, tankZ]);
  beaconAt('fusebox_engine', [-0.38, F + 0.2, bm + 0.05]);
  beaconAt('engine', [0.02, F + 0.47, bm + 0.16]);
  beaconAt('wiper', [0, S.belt + 0.12, S.cowlZ - 0.06]);
  beaconAt('headlight', [lampX, lightY + lampR + 0.08, lampZ - 0.08]);
  const lampAt: V3 = suvLampPos ? [suvLampPos.x, suvLampPos.y, suvLampPos.z] : [0.56, tailTop - 0.1, S.tailZ];
  beaconAt('taillight', suvLampPos ? [lampAt[0] + 0.06, lampAt[1] + 0.14, lampAt[2] - 0.1] : [0.56, tailTop + 0.05, S.tailZ - 0.08]);
  beaconAt('wheel', [S.halfW + 0.12, R + 0.32, S.wheelZ[0]]);
  beaconAt('brakes', [S.halfW + 0.12, R, S.wheelZ[1]]);
  beaconAt('trunk', trunkBeacon);
  beaconAt('door', [S.halfW + 0.12, S.belt - 0.28, (doorZ0 + doorZ1) / 2]);
  beaconAt('cabin', [0.36, roofLine(S.seatZ) + 0.14, S.seatZ]);
  beaconAt('fusebox_cabin', [S.halfW + 0.1, S.belt + 0.06, dashZ]);
  beaconAt('fueldoor', [-(S.halfW + 0.12), fuelY, fuelZ]);
  beaconAt('exhaust', [-0.5, S.bottom - 0.12, tipZ - 0.08]);

  const view = (target: V3, dir: V3, dist: number): View => {
    const d = new THREE.Vector3(...dir).normalize().multiplyScalar(dist);
    return { target, pos: [target[0] + d.x, target[1] + d.y, target[2] + d.z] };
  };
  const bayDir: V3 = [0.5, 1.1, 0.9];
  const views: Record<PartId, View> = {
    hood: view([0, hoodLine(hoodMidZ), hoodMidZ], [0.55, 0.75, 1], 3.4),
    engine: view([0.02, F + 0.25, bm], bayDir, 1.9),
    battery: view([-0.34, F + 0.1, bz0 + 0.16], [-0.6, 1.1, 0.9], 1.7),
    oil: view([0.14, F + 0.3, bm - 0.05], bayDir, 1.7),
    airbox: view([0.4, F + 0.15, bz0 + 0.17], [0.45, 1.5, 0.8], 1.7),
    // Steep and from the front: the tanks sit right behind the nose, and the open hood stands up behind them.
    coolant: view([0.43, F + 0.22, tankZ], [0.45, 1.7, 0.75], 1.6),
    washer: view([-0.43, F + 0.22, tankZ], [-0.45, 1.7, 0.75], 1.6),
    fusebox_engine: view([-0.38, F + 0.08, bm + 0.05], [-0.55, 1.5, 0.2], 1.6),
    wiper: view([0.05, roofLine(wipeZ - 0.22), wipeZ - 0.22], [0.35, 0.75, 1], 2.5),
    headlight: view([lampX - 0.1, lightY - 0.12, lampZ], [0.55, 0.45, 1], 2.2),
    taillight: view(lampAt, [0.6, 0.25, -1], 2.3),
    wheel: view([S.track, R, S.wheelZ[0]], [1, 0.25, 0.45], 2.4),
    brakes: view([S.track, R, S.wheelZ[1]], [1, 0.15, -0.35], 2.0),
    trunk: view([0, S.belt, S.deck ? (S.deck[0] + S.deck[1]) / 2 : S.tailZ], trunkView, 3.3),
    door: view([S.halfW, S.belt - 0.2, (doorZ0 + doorZ1) / 2], [1, 0.3, 0.25], 3.2),
    cabin: view([0.3, S.belt, S.seatZ], [1, 0.45, 0.2], 2.8),
    fusebox_cabin: view([S.ghW[0] - 0.16, S.belt - 0.14, dashZ - 0.12], [1, 0.55, 0.3], 1.9),
    fueldoor: view([-S.halfW, fuelY, fuelZ], [-1, 0.2, -0.45], 2.1),
    exhaust: view([-0.5, S.bottom, S.tailZ], [-0.4, 0.2, -1], 2.2),
  };
  const overview: View = S.suv ? { pos: [4.6, 2.68, 5.38], target: [0, 0.85, 0] } : { pos: [4.21, 2.41, 4.99], target: [0, 0.65, 0] };

  let current: Paint | null = null;
  function paintTo(p: Paint, instant: boolean): void {
    current = p;
    const target = new THREE.Color(p.color);
    for (const m of paintMats) {
      const u = m.userData.uniforms as ToonUniforms;
      const c0 = m.color.clone();
      const s0 = u.uShine.value;
      const m0 = u.uMetal.value;
      if (instant) {
        m.color.copy(target);
        u.uShine.value = p.shine;
        u.uMetal.value = p.metal;
        continue;
      }
      tween({
        duration: 420,
        ease: easeInOutCubic,
        tag: `paint:${m.uuid}`,
        update: (k) => {
          m.color.copy(c0).lerp(target, k);
          u.uShine.value = lerp(s0, p.shine, k);
          u.uMetal.value = lerp(m0, p.metal, k);
        },
      });
    }
  }

  const lift = new THREE.Color(hex('cyan'));
  const baseGlow = new Map<THREE.MeshToonMaterial, { color: THREE.Color; intensity: number }>();
  function focus(part: PartId | null): void {
    for (const [mat, base] of baseGlow) {
      mat.emissive.copy(base.color);
      mat.emissiveIntensity = base.intensity;
    }
    baseGlow.clear();
    for (const m of part ? hotspots.get(part) ?? [] : []) {
      const mat = m.material as THREE.MeshToonMaterial;
      if (!mat.emissive || baseGlow.has(mat)) continue;
      baseGlow.set(mat, { color: mat.emissive.clone(), intensity: mat.emissiveIntensity });
      mat.emissive.lerp(lift, 0.1);
      mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 1);
    }
  }

  return {
    key: kind,
    group,
    picks: [...[...hotspots.values()].flat(), ...beacons.values()],
    glow: hotspots,
    beacons,
    views,
    overview,
    setLid,
    setPaint(p: Paint, instant = false): void {
      if (current && p.color === current.color && p.shine === current.shine && p.metal === current.metal) return;
      paintTo(p, instant);
    },
    focus,
    canPick,
    update: () => {},
    poke: (part) => {
      if (part === 'wiper') wipe();
      if (part === 'headlight') blink();
    },
    dispose: () => disposeTree(group),
  };
}
