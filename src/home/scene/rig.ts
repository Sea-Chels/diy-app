/**
 * The comic cutaway house: one open room with the front and right walls
 * removed, like a dollhouse. A kitchen runs along the back wall, a small
 * bathroom sits behind half-height walls in the back-left corner, and the
 * left wall carries the breaker panel, an outlet, a hole in the drywall and
 * the front door. Modelled in meters and scaled down; the contract with the
 * scene is `Rig`. Every AreaId in data/areas.ts gets a pick proxy, a beacon
 * and a view.
 */
import * as THREE from 'three';
import { disposeTree, shared, toon } from '../../shared/toon';
import { idleClock, reducedMotion } from '../../shared/motion';
import type { V3 } from '../../shared/scene/kit';
import { hex } from '../../shared/theme';
import type { StageRig, View } from '../../shared/scene/stage';
import { createBeacons, createLids, glowMeshes, viewFrom } from '../../shared/scene/rigKit';
import type { AreaId, LidId } from '../data/areas';
import type { Setup } from '../data/setup';
import { createCtx } from './ctx';
import { buildFloor, buildWalls } from './zones/shell';
import { buildKitchen } from './zones/kitchen';
import { buildBathroom } from './zones/bathroom';
import { buildLeftWall } from './zones/leftWall';
import { buildLiving, buildLights, buildPaintCorner, buildFloorCutaway } from './zones/living';
import { buildExterior } from './zones/exterior';
import { addCreases } from './creases';
import { K, X0, Z0, WH } from './room';

export type Rig = StageRig<AreaId, LidId>;

export const rigKey = (s: Setup) => `${s.counter}|${s.ceiling}|${s.floor}|${s.wall}`;

export function buildRig(s: Setup): Rig {
  const c = createCtx(s);
  const { lidHooks, root, areas, picks } = c;
  buildFloor(c);
  buildWalls(c);
  const { sink, appliances, SINK, DRIP_FROM } = buildKitchen(c);
  const { TZ, tankWater, flapper, handleArm } = buildBathroom(c);
  const { PZ, tripped, OZ, lightSwitch, knobs } = buildLeftWall(c);
  buildLiving(c);
  const { FX, FZ, fanBlades, bulbMats, lamp } = buildLights(c);
  buildPaintCorner(c);
  buildFloorCutaway(c);
  const { XO, ZO, OV, porchBulb } = buildExterior(c);
  addCreases(c, fanBlades);

  const glow = glowMeshes(areas);

  const { beacons, beaconAt } = createBeacons<AreaId>(root, { radius: 0.09, segments: [16, 12], onTop: true, picks });
  beaconAt('counters', [1.15, 1.15, Z0 + 0.45]);
  beaconAt('sink', [SINK.cx, 1.4, Z0 + 0.45]);
  beaconAt('appliances', [-1.38, 1.3, Z0 + 0.6]);
  beaconAt('window', [-0.15, 2.32, Z0 + 0.15]);
  beaconAt('toilet', [X0 + 0.35, 1.0, TZ]);
  beaconAt('bath', [-2.7, 0.85, Z0 + 0.4]);
  beaconAt('utility', [X0 + 0.15, 1.98, PZ]);
  beaconAt('outlets', [X0 + 0.15, 0.62, OZ]);
  beaconAt('wall', [X0 + 0.15, 1.18, 0.86]);
  beaconAt('door', [X0 + 0.15, 2.3, 2.0]);
  beaconAt('lights', [FX + 0.5, 2.0, FZ + 0.4]);
  beaconAt('gutters', [-2.3, WH + 0.3, ZO - OV - 0.06]);
  beaconAt('exterior', [XO - 0.3, 1.25, -0.15]);
  beaconAt('paint', [-0.85, 1.08, 1.6]);
  beaconAt('floor', [0.8, 0.28, 2.35]);
  // Which side of the outer walls the camera must be on to see each beacon.
  for (const [id, b] of beacons) {
    b.userData.seen =
      id === 'gutters' ? (c: THREE.Vector3) => c.z < Z0 * K || c.x < X0 * K || c.y > (WH + 1.2) * K
      : id === 'exterior' ? (c: THREE.Vector3) => c.x < XO * K
      : (c: THREE.Vector3) => c.x > X0 * K && c.z > Z0 * K;
  }

  const view = (target: V3, dir: V3, dist: number) => viewFrom(target, dir, dist, K);
  const views: Record<AreaId, View> = {
    counters: view([0.45, 1.05, Z0 + 0.4], [0.15, 0.5, 1], 3.4),
    sink: view([SINK.cx, 0.7, Z0 + 0.35], [0.15, 0.35, 1], 2.3),
    appliances: view([0.3, 0.95, Z0 + 0.4], [0.02, 0.14, 1], 5.0),
    window: view([-0.15, 1.55, Z0], [0.1, 0.15, 1], 2.5),
    toilet: view([X0 + 0.22, 0.6, TZ], [0.6, 1.7, 0.22], 2.1),
    bath: view([-2.75, 0.7, -1.55], [0.75, 0.95, 0.75], 3.3),
    utility: view([X0, 1.15, -0.02], [1, 0.25, 0.1], 2.6),
    outlets: view([X0 + 0.05, 0.7, OZ], [1, 0.35, 0.65], 2.1),
    wall: view([X0 + 0.05, 0.85, 0.86], [1, 0.4, 0.55], 2.1),
    door: view([X0, 1.1, 1.95], [1, 0.3, 0.25], 3.8),
    lights: view([FX, 2.2, FZ], [0.45, 0.02, 1], 2.6),
    paint: view([-0.8, 0.5, 1.65], [0.35, 0.6, 1], 2.6),
    floor: view([0.8, 0.05, 2.3], [0.3, 0.9, 1], 2.2),
    gutters: view([-2.2, 1.5, ZO - 0.4], [-0.45, 0.75, -1], 4.6),
    exterior: view([XO, 0.95, -0.15], [-1, 0.4, 0.3], 4.8),
  };
  const overview: View = view([0, 0.6, 0.1], [0.85, 0.95, 1.1], 11.5);

  const { setLid } = createLids<LidId>(lidHooks, { tag: 'home-lid', ms: 900 });
  let clock = 0;
  const idle = idleClock();
  const drops: THREE.Mesh[] = [];
  const dropMat = new THREE.MeshBasicMaterial({ color: hex('water') });
  const dropGeo = new THREE.SphereGeometry(0.008, 8, 6);
  let nextDrip = 1.5;
  let spin = 1.6;
  let lightOn = true;
  let flushAt = -10;
  let burnAt = -10;
  let jiggleAt = -10;
  const burners = (appliances.userData.burners ?? []) as THREE.Mesh[];
  const burnerCold = burners[0]?.material as THREE.Material;
  const burnerHot = new THREE.MeshBasicMaterial({ color: 0xff5a1f });
  const drip = () => {
    const d = new THREE.Mesh(dropGeo, dropMat);
    d.position.copy(DRIP_FROM);
    d.userData.born = clock;
    sink.add(d);
    drops.push(d);
  };
  const setLight = (on: boolean) => {
    lightOn = on;
    lamp.intensity = on ? 0.9 : 0;
    for (const m of bulbMats) (m as THREE.MeshToonMaterial).emissiveIntensity = on ? 0.9 : 0.05;
    for (const p of lightSwitch) ((p.userData.device as THREE.Group).children[0].rotation.x = on ? -0.35 : 0.35);
  };

  return {
    key: rigKey(s),
    group: new THREE.Group().add(root),
    picks,
    glow,
    beacons,
    views,
    overview,
    setLid,
    poke(id) {
      if (id === 'sink') for (let i = 0; i < 5; i++) setTimeout(drip, i * 160);
      else if (id === 'lights') {
        if (s.ceiling === 'fan') spin = 9;
        else setLight(!lightOn);
      } else if (id === 'outlets') setLight(!lightOn);
      else if (id === 'toilet') flushAt = clock;
      else if (id === 'appliances') burnAt = clock;
      else if (id === 'door') jiggleAt = clock;
      else if (id === 'exterior') porchBulb.emissiveIntensity = porchBulb.emissiveIntensity > 0.5 ? 0.05 : 0.9;
      else if (id === 'utility') {
        // Reset the tripped breaker: all the way off, then on.
        const handle = tripped.children[1];
        (handle as THREE.Mesh).material = toon(0x3a3d44);
        handle.position.z = -0.012;
      }
    },
    update(t) {
      const dt = Math.min(0.05, t - clock);
      clock = t;
      const it = idle(t);
      shared.uTime.value = it;
      // The idle drip waits on the idle clock; a poked sink's drops fall whatever the setting.
      if (it > nextDrip) {
        drip();
        nextDrip = it + 2.4;
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        const age = t - d.userData.born;
        d.position.y = DRIP_FROM.y - 4.9 * age * age;
        if (d.position.y < 0.68) {
          sink.remove(d);
          drops.splice(i, 1);
        }
      }
      // Fan blades: a lazy spin, faster for a while when poked.
      spin += (1.6 - spin) * Math.min(1, dt * 0.6);
      fanBlades.rotation.y += spin * (reducedMotion() ? 0 : dt);
      // Flush: handle down, flapper up, tank drains and refills.
      const fl = t - flushAt;
      if (fl >= 0 && fl < 6) {
        const open = fl < 1.2 ? Math.min(1, fl * 4) : Math.max(0, 1 - (fl - 1.2) * 3);
        handleArm.rotation.x = 0;
        handleArm.rotation.z = 0;
        handleArm.rotation.y = 0;
        handleArm.position.y = 0.72 + 0.03 * open;
        flapper.rotation.z = 1.1 * open;
        const level = fl < 1.5 ? 1 - fl / 1.5 : Math.min(1, (fl - 1.5) / 4);
        for (const w of tankWater) {
          w.scale.y = Math.max(0.05, level);
          w.position.y = 0.42 + (0.26 * Math.max(0.05, level)) / 2;
        }
      }
      const hot = t - burnAt < 3;
      for (const b of burners) b.material = hot ? burnerHot : burnerCold;
      const jg = t - jiggleAt;
      knobs.forEach((k) => (k.rotation.x = jg < 0.8 ? Math.sin(jg * 30) * 0.3 * (1 - jg / 0.8) : 0));
    },
    dispose() {
      disposeTree(root);
    },
  };
}
