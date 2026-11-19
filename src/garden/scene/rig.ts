/**
 * The comic garden: galvanized and cedar raised beds on gravel, a Three
 * Sisters patch, compost bays, a hydroponic rack, a herb spiral, a fruit
 * corner, a shed pantry, a rain barrel, a potting bench, an arbor and a tool
 * fence. Modelled in meters and scaled down; the contract with the scene is
 * `Rig`. Every AreaId in data/areas.ts gets a pick proxy, a beacon and a view.
 */
import * as THREE from 'three';
import { disposeTree, shared } from '../../shared/toon';
import { idleClock, reducedMotion } from '../../shared/motion';
import { jitter, V, type V3 } from '../../shared/scene/kit';
import { hex } from '../../shared/theme';
import type { StageRig, View } from '../../shared/scene/stage';
import { createBeacons, createLids, glowMeshes, viewFrom } from '../../shared/scene/rigKit';
import type { AreaId, LidId } from '../data/areas';
import type { Setup } from '../data/setup';
import { createCtx } from './ctx';
import { buildGround } from './zones/ground';
import { buildBeds, buildSisters } from './zones/beds';
import { buildCompost } from './zones/compost';
import { buildToolFence, buildPantry } from './zones/shed';
import { buildRainBarrel, buildHydro } from './zones/water';
import { buildHerbSpiral, buildPollinators } from './zones/herbs';
import { buildFruit, buildArbor } from './zones/fruit';
import { buildPottingBench } from './zones/bench';
import { buildWildlife } from './zones/wildlife';
import { findMovers, mergeInk, moves } from '../../shared/scene/ink';
import { K, LOW_SPHERE } from './geometry';

export type Rig = StageRig<AreaId, LidId>;

export const rigKey = (s: Setup) => `${s.season}|${s.fill}|${s.hydro}`;

export function buildRig(s: Setup): Rig {
  const c = createCtx(s);
  const { r, lidHooks, steam, steamBase, toolSwing, spigot, root, areas, picks } = c;
  buildGround(c);
  buildBeds(c);
  buildSisters(c);
  buildCompost(c);
  buildToolFence(c);
  buildPantry(c);
  buildRainBarrel(c);
  buildHydro(c);
  buildHerbSpiral(c);
  buildFruit(c);
  buildPollinators(c);
  buildPottingBench(c);
  buildArbor(c);
  const { bugs } = buildWildlife(c);

  const glow = glowMeshes(areas);
  moves(...toolSwing, ...steam, ...bugs.flatMap((b) => [b.g, ...b.wings]));
  mergeInk(root, findMovers(root, Object.values(lidHooks)), glow);

  const { beacons, beaconAt } = createBeacons<AreaId>(root, { radius: 0.11, segments: [16, 12], onTop: true, picks });
  const pos = (id: AreaId) => areas.get(id)!.position;
  const at = (id: AreaId, dx: number, y: number, dz: number): V3 => [pos(id).x + dx, y, pos(id).z + dz];
  beaconAt('bed', at('bed', 1.2, 0.95, 0.6));
  beaconAt('kitchen', at('kitchen', 0.9, 1.35, 0.4));
  beaconAt('tunnel', at('tunnel', -1.0, 1.15, 0.4));
  beaconAt('sisters', at('sisters', 0.4, 2.3, 0.4));
  beaconAt('compost', at('compost', -0.9, 1.25, 0.4));
  beaconAt('tools', at('tools', -0.6, 1.75, 0.2));
  beaconAt('pantry', at('pantry', 0.7, 2.6, 0.9));
  beaconAt('water', at('water', 0.0, 1.45, 0.2));
  beaconAt('hydro', at('hydro', 0.5, 2.5, 0.2));
  beaconAt('herbs', at('herbs', 0.2, 1.4, 0.2));
  beaconAt('fruit', at('fruit', -0.2, 3.4, -0.9));
  beaconAt('pollinators', at('pollinators', -0.5, 2.45, -0.4));
  beaconAt('seedlings', at('seedlings', 0.0, 1.65, 0.0));
  beaconAt('arbor', at('arbor', -0.95, 2.55, 0.0));

  const view = (target: V3, dir: V3, dist: number) => viewFrom(target, dir, dist, K);
  const views: Record<AreaId, View> = {
    bed: view(at('bed', 0.65, 0.4, 0.3), [0.3, 0.55, 1], 3.9),
    kitchen: view(at('kitchen', 0, 0.75, 0), [0.25, 0.6, 1], 3.6),
    tunnel: view(at('tunnel', 0, 0.5, 0), [-0.3, 0.75, 1], 3.6),
    sisters: view(at('sisters', 0, 1.0, 0), [0.4, 0.45, 1], 5.2),
    compost: view(at('compost', 0, 0.5, 0), [-0.65, 0.75, 1], 3.8),
    tools: view(at('tools', 0, 0.9, 0), [0, 0.3, 1], 3.6),
    pantry: view(at('pantry', 0, 1.1, 0.4), [-0.2, 0.4, 1], 4.4),
    water: view(at('water', -0.1, 0.55, 0.4), [0.25, 0.8, 1], 3.5),
    hydro: view(at('hydro', 0, 1.1, 0), [0.2, 0.35, 1], 3.8),
    herbs: view(at('herbs', 0.1, 0.6, 0), [0.6, 0.7, 1], 3.6),
    fruit: view(at('fruit', -0.2, 1.4, -0.2), [-0.7, 0.35, 1], 5.6),
    pollinators: view(at('pollinators', -0.1, 1.0, 0), [-0.35, 0.3, 1], 4.4),
    seedlings: view(at('seedlings', 0, 1.0, 0), [1, 0.5, 0.25], 2.6),
    arbor: view(at('arbor', 0, 1.3, 0), [0.25, 0.25, 1], 4.4),
  };
  const overview: View = view([0, 0.2, 0.2], [0.16, 0.72, 1], 15.5);

  const { setLid } = createLids<LidId>(lidHooks, { tag: 'garden-lid', ms: 900 });
  let gustUntil = 0;
  let clock = 0;
  const idle = idleClock();
  const drops: THREE.Mesh[] = [];
  const dropMat = new THREE.MeshBasicMaterial({ color: hex('water') });
  let swingStart = -10;
  let swarmStart = -10;

  return {
    group: new THREE.Group().add(root),
    picks,
    glow,
    beacons,
    views,
    overview,
    setLid,
    poke(id) {
      if (id === 'water' || id === 'hydro') {
        for (let i = 0; i < 6; i++) {
          const d = new THREE.Mesh(LOW_SPHERE, dropMat);
          d.scale.setScalar(0.018);
          d.userData.born = clock + i * 0.12;
          d.userData.from = id === 'water' ? spigot.clone() : V(pos('hydro').x + jitter(r, 0.3), 1.3, pos('hydro').z + 0.1);
          d.visible = false;
          root.add(d);
          drops.push(d);
        }
      } else if (id === 'tools') swingStart = clock;
      else if (id === 'pollinators' || id === 'fruit' || id === 'herbs' || id === 'arbor') swarmStart = clock;
      if (id !== 'pantry' && id !== 'water') gustUntil = clock + 1.8;
    },
    update(t) {
      const dt = Math.min(0.05, t - clock);
      clock = t;
      const it = idle(t);
      shared.uTime.value = it;
      const target = t < gustUntil ? 3.2 : 1;
      shared.uGust.value += (target - shared.uGust.value) * Math.min(1, dt * 3);
      const swarm = Math.max(0, 1 - (t - swarmStart) / 4);
      for (const c of bugs) {
        const a = it * c.speed + c.phase;
        const rad = c.rad * (1 - 0.5 * swarm);
        const x = Math.cos(a) * rad + Math.sin(a * 2.3) * 0.12;
        const z = Math.sin(a * 1.1) * rad;
        const y = Math.sin(a * 1.7) * 0.15 + (c.bee ? 0 : 0.2);
        c.g.position.set(c.home.x + x, c.home.y + y, c.home.z + z);
        const vx = -Math.sin(a) * rad;
        const vz = Math.cos(a * 1.1) * rad * 1.1;
        c.g.rotation.y = Math.atan2(-vz, vx);
        const flap = c.bee ? Math.sin(it * 60) * 0.6 : Math.sin(it * 9 + c.phase) * 1.0;
        for (const w of c.wings) w.rotation.x = w.userData.side * (c.bee ? 0.3 + flap : flap);
      }
      for (const p of steam) {
        const k2 = (it * 0.25 + p.userData.phase) % 1;
        p.position.set(steamBase.x + Math.sin(k2 * 6 + p.userData.phase * 9) * 0.08, 0.62 + k2 * 0.7, -0.02);
        p.scale.setScalar(0.05 + k2 * 0.12);
        (p.material as THREE.MeshBasicMaterial).opacity = 0.4 * Math.sin(k2 * Math.PI);
      }
      const sw = t - swingStart;
      toolSwing.forEach((g, i) => (g.rotation.z = sw < 3 ? Math.sin(sw * 6 + i) * 0.12 * (1 - sw / 3) : 0));
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        const age = t - d.userData.born;
        if (age < 0) continue;
        d.visible = true;
        const from = d.userData.from as THREE.Vector3;
        d.position.set(from.x, from.y - 4.9 * age * age, from.z);
        if (d.position.y < 0.02) {
          root.remove(d);
          drops.splice(i, 1);
        }
      }
      if (!reducedMotion() || sw < 3 || swarm > 0) return 'casters';
      // Wind sways only the drawn plants; their shadows stand still.
      return drops.length > 0 || Math.abs(target - shared.uGust.value) > 1e-3 ? 'picture' : false;
    },
    dispose() {
      disposeTree(root);
    },
  };
}
