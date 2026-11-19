import * as THREE from 'three';
import { disposeTree } from '../../shared/toon';
import type { StageRig, View } from '../../shared/scene/stage';
import { rideOf, type LidId, type PartId } from '../data/parts';
import type { BodyKind } from '../data/paint';
import type { RideId } from '../data/rides';
import { buildCar, type Paint } from './rig';
import { buildMoto } from './moto';
import { buildBike } from './bike';
import { glowFocus, viewInParent, viewsInParent, type Ride } from './parts3d';

/**
 * A row across the floor, all facing +z. The car's close-ups are on its right or high, so the
 * two-wheelers park off its left: the motorcycle with its chain side to the car and room to walk
 * between, the bike outermost with its drive side facing out.
 */
const PARKING: Record<RideId, { pos: [number, number, number]; yaw: number }> = {
  car: { pos: [1.5, 0, 0], yaw: 0 },
  moto: { pos: [-1.4, 0, 0.35], yaw: -0.06 },
  bike: { pos: [-2.8, 0, 0.05], yaw: 0.08 },
};

export interface GarageRig extends StageRig<PartId, LidId> {
  setPaint(p: Paint, instant?: boolean): void;
  /** Points the overview at a vehicle. */
  setRide(ride: RideId): void;
  focus(part: PartId | null): void;
  canPick(part: PartId): boolean;
  /** The car alone, which is all a body swap rebuilds. */
  car: THREE.Group;
}

export function buildGarage(kind: BodyKind, ride: RideId): GarageRig {
  const car = buildCar(kind);
  const moto = buildMoto();
  const bike = buildBike();
  const rides: Record<RideId, Ride> = { car, moto, bike };
  const group = new THREE.Group();
  const overviews = {} as Record<RideId, View>;
  const hotspots = new Map<PartId, THREE.Mesh[]>();
  const beacons = new Map<PartId, THREE.Mesh>();
  for (const [id, r] of Object.entries(rides) as [RideId, Ride][]) {
    r.group.position.set(...PARKING[id].pos);
    r.group.rotation.y = PARKING[id].yaw;
    group.add(r.group);
    overviews[id] = viewInParent(r.overview, r.group);
    r.hotspots.forEach((m, p) => hotspots.set(p, m));
    r.beacons.forEach((b, p) => beacons.set(p, b));
  }
  const views: Record<PartId, View> = {
    ...viewsInParent(car.views, car.group),
    ...viewsInParent(moto.views, moto.group),
    ...viewsInParent(bike.views, bike.group),
  };
  let current = ride;

  return {
    key: kind,
    group,
    car: car.group,
    picks: [...[...hotspots.values()].flat(), ...beacons.values()],
    glow: hotspots,
    beacons,
    views,
    get overview() {
      return overviews[current];
    },
    setRide: (r) => (current = r),
    setLid: (lid, open) => Object.values(rides).forEach((r) => r.setLid(lid, open)),
    setPaint: car.setPaint,
    focus: glowFocus(hotspots),
    canPick: (p) => rides[rideOf(p)].canPick(p),
    poke: (p) => rides[rideOf(p)].poke(p),
    update: () => false,
    dispose: () => disposeTree(group),
  };
}
