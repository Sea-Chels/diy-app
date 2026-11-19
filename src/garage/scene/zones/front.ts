import * as THREE from 'three';
import { toon } from '../../../shared/toon';
import { tween, easeInOutCubic, lerp } from '../../../shared/tween';
import { add, mapped } from '../../../shared/scene/kit';
import { moves } from '../../../shared/scene/ink';
import { C, M, rbox } from '../kit';
import { mouthTex, plateMat } from '../textures';
import type { CarCtx } from '../ctx';

/**
 * An NA MX-5 face: slanted pop-up headlamps that blink shut when clicked,
 * clear parking lamps across the bumper and a low oval mouth behind the plate.
 */
export function buildFront(c: CarCtx) {
  const { S, kind, group, paint, tag, fasciaWidth, fasciaBottom, noseTopY, onNose } = c;
  const heads: THREE.Mesh[] = [];
  const along = (g: THREE.BufferGeometry) => g.rotateX(Math.PI / 2);
  const base = fasciaBottom(S.fasciaZ);

  // Each pod is a black wedge under a body-color lid, hinged where the lid's rear edge meets the hood.
  // Open (the resting pose) the lid slants up to the front and the lamp sits in the wedge's upright face;
  // closed, the lid lies flush on the nose and the wedge, which is all below the lid, goes with it.
  const lampX = 0.52;
  const lidL = 0.32;
  const lidW = 0.25;
  const zr = S.fasciaZ + 0.04;
  const yr = noseTopY(lampX, zr);
  const closed = Math.atan2(yr - noseTopY(lampX, zr + lidL), lidL);
  const skinBelow = (a: number) => noseTopY(lampX, zr + lidL * Math.cos(a)) - yr;
  // A fixed slant like the NA's; the lamp then fills the face that stands clear of the nose, less its rim.
  const rise = 0.6;
  const open = -rise;
  const tipZ = lidL * Math.cos(rise);
  const tipY = lidL * Math.sin(rise);
  const skinY = skinBelow(rise);
  const lampR = Math.min(0.1, (tipY - skinY) / 2 - 0.018);
  // In the open pose's upright frame, pivot at the origin; the bottom edge runs below the skin so no gap shows.
  const wedge = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(tipZ, tipY), new THREE.Vector2(tipZ, skinY - 0.04), new THREE.Vector2(0, -0.03)]);
  const wedgeGeo = new THREE.ExtrudeGeometry(wedge, { depth: lidW - 0.012, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2 });
  wedgeGeo.rotateY(-Math.PI / 2).translate((lidW - 0.012) / 2, 0, 0);
  const lampY = (tipY + skinY) / 2;
  const pivots: THREE.Group[] = [];
  for (const side of [1, -1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * lampX, yr + 0.003, zr);
    pivot.rotation.x = open;
    group.add(pivot);
    pivots.push(pivot);
    moves(pivot);
    heads.push(add(rbox(lidW, 0.016, lidL + 0.01, 0.006), paint(), pivot, { at: [0, 0, lidL / 2] }));
    const upright = new THREE.Group();
    upright.rotation.x = -open;
    pivot.add(upright);
    heads.push(add(wedgeGeo, toon(C.lampBezel, { halftone: 0.4 }), upright, { at: [0, -0.008, 0] }));
    const lampAt = (dz: number): [number, number, number] => [0, lampY, tipZ + 0.006 + dz];
    heads.push(add(along(new THREE.CylinderGeometry(lampR, lampR, 0.016, 32)), M.lamp(C.lamp, 0.35, C.lampGlow), upright, { at: lampAt(0), ink: null }));
    heads.push(add(new THREE.TorusGeometry(lampR, 0.011, 8, 36), M.chrome(), upright, { at: lampAt(0.008), ink: null }));
    heads.push(add(new THREE.TorusGeometry(lampR * 0.5, 0.004, 6, 28), M.chrome(), upright, { at: lampAt(0.011), ink: null }));
  }
  const blink = () =>
    tween({
      duration: 1800,
      ease: (k) => k,
      tag: `blink:${kind}`,
      update: (k) => {
        const shut = k < 0.35 ? easeInOutCubic(k / 0.35) : k < 0.65 ? 1 : 1 - easeInOutCubic((k - 0.65) / 0.35);
        for (const p of pivots) p.rotation.x = lerp(open, closed, shut);
      },
    });

  const parkY = base + 0.25;
  for (const side of [1, -1]) {
    const at = onNose(side * 0.45, parkY, 0.006);
    const lamp = new THREE.Group();
    lamp.position.set(...at.pos);
    lamp.rotation.set(at.pitch, at.yaw, 0, 'YXZ');
    group.add(lamp);
    const capsule = new THREE.CapsuleGeometry(0.026, 0.13, 6, 14).rotateZ(Math.PI / 2).scale(1, 1, 0.45);
    heads.push(add(capsule, M.lamp(C.reverse, 0.15, C.lampGlow), lamp));
    heads.push(add(rbox(0.07, 0.03, 0.012, 0.012), M.lamp(C.marker, 0.4), lamp, { at: [-side * 0.045, 0, 0.008], ink: null }));
    const markerZ = S.fasciaZ + 0.14;
    heads.push(add(rbox(0.012, 0.035, 0.1, 0.006), M.lamp(C.marker, 0.5), group, { at: [side * (fasciaWidth(markerZ) + 0.004), base + 0.16, markerZ], ink: null }));
  }
  tag('headlight', ...heads);

  // The mouth is a strip of the nose's own skin, so it wraps the curve; its texture cuts the oval.
  const mouthY = base + 0.11;
  const mouthGeo = new THREE.PlaneGeometry(0.9, 0.11, 30, 4);
  const mp = mouthGeo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < mp.count; i++) {
    const at = onNose(mp.getX(i), mouthY + mp.getY(i), 0.004);
    mp.setXYZ(i, ...at.pos);
  }
  mouthGeo.computeVertexNormals();
  const mouthMat = mapped(0xffffff, mouthTex(), { halftone: 0.4 });
  mouthMat.alphaTest = 0.5;
  add(mouthGeo, mouthMat, group, { ink: null });

  const plate = onNose(0, base + 0.1, 0.012);
  const plateMesh = add(rbox(0.32, 0.1, 0.012, 0.01), plateMat(), group, { at: plate.pos });
  plateMesh.rotation.x = plate.pitch;
  add(rbox(1.4, 0.06, 0.16, 0.03), toon(C.trim, { halftone: 0.5 }), group, { at: [0, S.bottom + 0.05, S.noseZ - 0.16] });

  const lightY = yr + lampY;
  return { lightY, lampX, lampZ: zr + tipZ, lampR, blink };
}
