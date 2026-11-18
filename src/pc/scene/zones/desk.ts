import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toon } from '../../../shared/toon';
import { createScreen } from '../screen';
import type { PcCtx } from '../ctx';

export function buildDesk(c: PcCtx) {
  const { W, D, root, mesh, rbox, hot, mats } = c;
  const mon = new THREE.Group();
  const monX = W / 2 + 330;
  const monZ = D / 2 + 60;
  mon.position.set(monX, 0, monZ);
  mon.rotation.y = -Math.PI / 4;
  root.add(mon);
  const screen = createScreen();
  const monParts = [
    rbox(230, 10, 170, mats.black, mon, 0, 5, -30, 4, 'body'),
    rbox(46, 250, 22, mats.darkMetal, mon, 0, 135, -48, 6, 'body'),
    rbox(600, 350, 26, mats.black, mon, 0, 300, -24, 10, 'body'),
  ];
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(574, 323), new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false }));
  scr.position.set(0, 300, -10.6);
  mon.add(scr);
  monParts.push(scr);
  hot('monitor', ...monParts);
  const keys: THREE.BufferGeometry[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 14; c++) {
      if (r === 4 && c > 3 && c < 10) continue;
      const k = new THREE.BoxGeometry(19, 7, 18);
      k.translate(-143 + c * 22, 18, -46 + r * 23);
      keys.push(k);
    }
  }
  const space = new THREE.BoxGeometry(129, 7, 18);
  space.translate(-143 + 6.5 * 22, 18, -46 + 4 * 23);
  keys.push(space);
  const kb = new THREE.Group();
  kb.position.set(0, 0, 200);
  kb.rotation.y = 0.08;
  mon.add(kb);
  rbox(330, 14, 130, mats.plastic, kb, 0, 7, 0, 5, 'body');
  mesh(mergeGeometries(keys)!, toon(0x3d4150, { shine: 0.3 }), kb, 0, 0, 0, 'thin');
  return { mon, monX, monZ, screen };
}

export type Desk = ReturnType<typeof buildDesk>;
