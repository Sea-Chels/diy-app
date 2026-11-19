import * as THREE from 'three';
import { outline, type InkWeight } from '../../shared/toon';
import { tag } from '../../shared/scene/sceneTags';

interface Batch {
  parent: THREE.Object3D;
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  ink: InkWeight | null;
  wind: number;
  shadow: boolean;
  matrices: THREE.Matrix4[];
  colors: THREE.Color[];
}

/** Collect many copies of one geometry + material under a parent; `flush` turns each set into an InstancedMesh. */
export class Batches {
  private batches = new Map<string, Batch>();

  add(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, matrix: THREE.Matrix4, o: { color?: THREE.ColorRepresentation; ink?: InkWeight | null; wind?: number; shadow?: boolean } = {}): void {
    const ink = o.ink === undefined ? 'thin' : o.ink;
    const wind = o.wind ?? 0;
    const key = `${parent.uuid}|${geo.uuid}|${mat.uuid}|${ink}|${wind}`;
    let b = this.batches.get(key);
    if (!b) {
      b = { parent, geo, mat, ink, wind, shadow: o.shadow ?? true, matrices: [], colors: [] };
      this.batches.set(key, b);
    }
    b.matrices.push(matrix);
    b.colors.push(new THREE.Color(o.color ?? 0xffffff));
  }

  flush(): void {
    for (const b of this.batches.values()) {
      const inst = new THREE.InstancedMesh(b.geo, b.mat, b.matrices.length);
      b.matrices.forEach((m, i) => {
        inst.setMatrixAt(i, m);
        inst.setColorAt(i, b.colors[i]);
      });
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      inst.castShadow = b.shadow;
      inst.receiveShadow = true;
      inst.computeBoundingSphere();
      tag(inst, 'sharedGeometry', true); // the geometry is cached across rebuilds; the material isn't
      if (b.ink) outline(inst, b.ink, b.wind);
      b.parent.add(inst);
    }
    this.batches.clear();
  }
}
