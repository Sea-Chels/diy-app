import type * as THREE from 'three';
import type { HullSet, ToonUniforms } from '../toon';

/** What scene code marks objects, materials and textures with for other scene code. Kept in userData, so a tag goes wherever its object goes. */
export interface SceneTags {
  /** The spot an object picks for or highlights with. */
  spot: string;
  /** A beacon drawn over everything, so picked before whatever is behind it. */
  beacon: true;
  /** A surface that hides any pick behind it. */
  blocker: true;
  /** On a beacon: whether a camera at `cam` can see it. */
  seen: (cam: THREE.Vector3) => boolean;
  /** An ink hull; it never takes a click or a highlight of its own. */
  ink: true;
  /** On a hull: the materials it switches between to highlight. */
  hl: HullSet;
  /** On a mesh: the merged hull its ink went into. */
  hull: THREE.Mesh;
  /** Its own position, rotation, scale or visibility animates at runtime. */
  moves: true;
  /** Geometry cached across rebuilds, which disposing the rig leaves alone. */
  sharedGeometry: true;
  /** A texture cached across rebuilds, which disposing the rig leaves alone. */
  sharedTexture: true;
  /** On a toon material: its own uniforms. */
  uniforms: ToonUniforms;
}

interface Tagged { userData: Record<string, unknown> }

export const tag = <K extends keyof SceneTags>(o: Tagged, k: K, v: SceneTags[K]): void => {
  o.userData[k] = v;
};

export const tagOf = <K extends keyof SceneTags>(o: Tagged, k: K): SceneTags[K] | undefined => o.userData[k] as SceneTags[K] | undefined;

export const spotOf = <S extends string>(o: Tagged): S | undefined => tagOf(o, 'spot') as S | undefined;
