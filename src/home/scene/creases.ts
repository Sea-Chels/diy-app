import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { INK, lineMaterials } from '../../shared/toon';
import type { V3 } from '../../shared/scene/kit';
import { K, X0, X1, Z0, Z1, T, WH } from './room';
import type { HomeCtx } from './ctx';

export function addCreases(c: HomeCtx, fanBlades: THREE.Group) {
  const { lidHooks, root } = c;
  // Ink hulls only trace silhouettes; these add the hard edges (wall tops, cabinet corners, rims) in the same ink.
  {
    const mat = new LineMaterial({ color: INK, linewidth: 1.5, worldUnits: false });
    mat.resolution.set(window.innerWidth, window.innerHeight);
    lineMaterials.add(mat);
    const cache = new Map<THREE.BufferGeometry, number[] | null>();
    const size = new THREE.Vector3();
    const ws = new THREE.Vector3();
    const edgesFor = (g: THREE.BufferGeometry, optIn: boolean): number[] | null => {
      if (cache.has(g)) return cache.get(g)!;
      let src: THREE.BufferGeometry | null = null;
      const p = (g as THREE.BoxGeometry).parameters;
      if (g.type === 'BoxGeometry' || g.type === 'RoundedBoxGeometry') src = new THREE.EdgesGeometry(new THREE.BoxGeometry(p.width, p.height, p.depth));
      else if (g.type === 'CylinderGeometry' || g.type === 'ExtrudeGeometry' || optIn) src = new THREE.EdgesGeometry(g, 50);
      let out: number[] | null = null;
      if (src) {
        // Nudge every vertex 3 mm outward so the line sits just proud of its faces.
        g.computeBoundingBox();
        const c = g.boundingBox!.getCenter(new THREE.Vector3()).toArray();
        const pos = src.getAttribute('position') as THREE.BufferAttribute;
        out = [];
        for (let i = 0; i < pos.count; i++) {
          const v = [pos.getX(i), pos.getY(i), pos.getZ(i)];
          for (let a = 0; a < 3; a++) out.push(v[a] + Math.sign(Math.round((v[a] - c[a]) * 1e4)) * 0.003);
        }
        src.dispose();
      }
      cache.set(g, out);
      return out;
    };
    // Anything a lid or the fan moves keeps its own lines; the rest merge into one draw call.
    const moving = new Set<THREE.Object3D>();
    {
      root.updateMatrixWorld(true);
      const snap = new Map<THREE.Object3D, THREE.Matrix4>();
      root.traverse((o) => snap.set(o, o.matrixWorld.clone()));
      for (const hook of Object.values(lidHooks)) hook?.(1);
      root.updateMatrixWorld(true);
      root.traverse((o) => {
        if (!snap.get(o)!.equals(o.matrixWorld)) moving.add(o);
      });
      for (const hook of Object.values(lidHooks)) hook?.(0);
      root.updateMatrixWorld(true);
      fanBlades.traverse((o) => moving.add(o));
    }
    const targets: THREE.Mesh[] = [];
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.ink || m.userData.beacon || m.userData.noCrease || (m as unknown as { isInstancedMesh?: boolean }).isInstancedMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      if (mats.some((x) => !x.visible || x.transparent || (x as THREE.MeshBasicMaterial).isMeshBasicMaterial || (x as THREE.ShaderMaterial).isShaderMaterial)) return;
      m.geometry.computeBoundingBox();
      m.geometry.boundingBox!.getSize(size);
      m.getWorldScale(ws);
      // Skip screws, wires and leaves: lines on those just turn to fuzz.
      if (Math.max(size.x * ws.x, size.y * ws.y, size.z * ws.z) / K < 0.05) return;
      targets.push(m);
    });
    const ink = (g: LineSegmentsGeometry, parent: THREE.Object3D) => {
      const l = new LineSegments2(g, mat);
      l.userData.ink = true;
      l.raycast = () => {};
      parent.add(l);
    };
    // The outer walls as two clean boxes: top edges, cut ends and the inside corner.
    const seg: number[] = [];
    const line = (a: V3, b: V3) => seg.push(...a, ...b);
    const e = 0.003;
    line([X0 + e, WH + e, Z0 + e], [X1 + e, WH + e, Z0 + e]);
    line([X0 - T - e, WH + e, Z0 - T - e], [X1 + e, WH + e, Z0 - T - e]);
    line([X0 + e, WH + e, Z0 + e], [X0 + e, WH + e, Z1 + e]);
    line([X0 - T - e, WH + e, Z0 - T - e], [X0 - T - e, WH + e, Z1 + e]);
    line([X0 + e, 0, Z0 + e], [X0 + e, WH, Z0 + e]);
    for (const [x, z] of [[X1 + e, Z0 + e], [X1 + e, Z0 - T - e]]) line([x, 0, z], [x, WH, z]);
    line([X1 + e, WH + e, Z0 - T], [X1 + e, WH + e, Z0]);
    for (const [x, z] of [[X0 + e, Z1 + e], [X0 - T - e, Z1 + e]]) line([x, 0, z], [x, WH, z]);
    line([X0 - T, WH + e, Z1 + e], [X0, WH + e, Z1 + e]);
    // Static edges, moved into root space.
    const rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const rel = new THREE.Matrix4();
    const v = new THREE.Vector3();
    const own = new Map<number[], LineSegmentsGeometry>();
    for (const m of targets) {
      const arr = edgesFor(m.geometry, Boolean(m.userData.crease));
      if (!arr) continue;
      if (moving.has(m)) {
        if (!own.has(arr)) own.set(arr, new LineSegmentsGeometry().setPositions(arr));
        ink(own.get(arr)!, m);
        continue;
      }
      rel.multiplyMatrices(rootInv, m.matrixWorld);
      for (let i = 0; i < arr.length; i += 3) {
        v.set(arr[i], arr[i + 1], arr[i + 2]).applyMatrix4(rel);
        seg.push(v.x, v.y, v.z);
      }
    }
    ink(new LineSegmentsGeometry().setPositions(seg), root);
  }
}
