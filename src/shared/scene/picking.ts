import * as THREE from 'three';
import { setHighlight } from '../toon';
import { shown } from './framing';
import { HOVER_LAYER, SELECT_LAYER } from './outline';
import type { StageRig } from './stage';

export interface Hit<Id> {
  id: Id;
  /** Whether it was the area's beacon that was hit. */
  beacon: boolean;
}

type Pickable<Id extends string> = Pick<StageRig<Id, string>, 'picks' | 'glow' | 'canPick'>;

/** The area under the pointer. */
export function createPicker<Id extends string>(canvas: HTMLCanvasElement, camera: THREE.Camera, rig: () => Pickable<Id>, selected: () => Id | null) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  // Zoomed in, a spot's generous pick box can fill the screen and leave nothing to tap to get out, so while
  // something is selected only the models themselves (and beacons and blockers) pick.
  let meshArea = new Map<THREE.Object3D, Id>();
  let closeFor: Pickable<Id> | null = null;
  let close: THREE.Object3D[] = [];
  function closePicks(): THREE.Object3D[] {
    const r = rig();
    if (closeFor !== r) {
      closeFor = r;
      meshArea = new Map();
      for (const [id, ms] of r.glow) for (const m of ms) meshArea.set(m, id);
      close = [...r.picks.filter((o) => o.userData.beacon || o.userData.blocker), ...meshArea.keys()];
    }
    return close;
  }

  return (ev: PointerEvent): Hit<Id> | null => {
    const r = rig();
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const areaOf = (o: THREE.Object3D) => (o.userData.area as Id | undefined) ?? meshArea.get(o);
    const live = (o: THREE.Object3D) => shown(o) && (!r.canPick || o.userData.blocker || r.canPick(areaOf(o) as Id));
    const hits = raycaster.intersectObjects(selected() ? closePicks() : r.picks, false);
    // Beacons draw on top of everything, so they win when hit.
    const beacon = hits.find((h) => h.object.userData.beacon && live(h.object));
    if (beacon) return { id: areaOf(beacon.object) as Id, beacon: true };
    // Pick boxes overlap: the nearest wins, unless a blocker is in front of it.
    const first = hits.find((h) => !h.object.userData.beacon && live(h.object));
    if (!first || first.object.userData.blocker) return null;
    const id = areaOf(first.object);
    return id ? { id, beacon: false } : null;
  };
}

/** Taps (a press that barely moves) and hover moves, picked at most once a frame. */
export function onPointer<Id>(canvas: HTMLCanvasElement, pick: (e: PointerEvent) => Hit<Id> | null, on: { tap(hit: Hit<Id> | null): void; move(id: Id | null): void; leave(): void }): void {
  let downAt: { x: number; y: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    downAt = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved <= 6) on.tap(pick(e));
  });
  let moveQueued = false;
  canvas.addEventListener('pointermove', (e) => {
    if (moveQueued) return;
    moveQueued = true;
    requestAnimationFrame(() => {
      moveQueued = false;
      on.move(pick(e)?.id ?? null);
    });
  });
  canvas.addEventListener('pointerleave', on.leave);
}

/** Lights the hovered and selected areas: 'hull' recolors each mesh's ink, 'outline' puts them on the rim pass's layers. */
export function showGlow<Id>(glow: Map<Id, THREE.Mesh[]>, mode: 'hull' | 'outline', hovered: Id | null, selected: Id | null): void {
  const set = (id: Id | null, level: 'none' | 'hover' | 'selected') => {
    if (!id) return;
    for (const m of glow.get(id) ?? []) {
      if (mode === 'hull') {
        setHighlight(m, level);
        continue;
      }
      m.layers.disable(HOVER_LAYER);
      m.layers.disable(SELECT_LAYER);
      if (level === 'hover') m.layers.enable(HOVER_LAYER);
      if (level === 'selected') m.layers.enable(SELECT_LAYER);
    }
  };
  for (const id of glow.keys()) set(id, 'none');
  if (hovered && hovered !== selected) set(hovered, 'hover');
  if (selected) set(selected, 'selected');
}
