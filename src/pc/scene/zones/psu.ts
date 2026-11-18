import * as THREE from 'three';
import { mapped } from '../../../shared/scene/kit';
import { PALETTE } from '../../../shared/theme';
import { T } from '../layout';
import { label } from '../kit';
import type { PcCtx } from '../ctx';
import type { CaseShell } from '../zones/case';

export function buildPsuArea(c: PcCtx, shell: CaseShell) {
  const { dm, H, D, cg, rbox, hot, mats, s } = c;
  const { trayX, innerX0, innerCx, boardRear } = shell;
  const shroudG = new THREE.Group();
  cg.add(shroudG);
  const psuParts: THREE.Object3D[] = [];
  const storageParts: THREE.Object3D[] = [];
  let psuC: THREE.Vector3;
  let storageC: THREE.Vector3;
  const psuLabel = () =>
    new THREE.MeshBasicMaterial({ map: label([{ text: '750W', size: 54, color: PALETTE.ink }, { text: '80+ GOLD', size: 26, color: '#7a5b12' }], '#f1d46b', 256, 160) });
  if (dm.shroud) {
    const sTop = dm.shroud;
    psuC = new THREE.Vector3(innerCx, T + 44, -D / 2 + T + 82);
    psuParts.push(rbox(150, 86, 160, mats.darkMetal, cg, { at: [psuC.x, psuC.y, psuC.z], r: 4, ink: 'body' }));
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), psuLabel());
    lab.rotation.y = -Math.PI / 2;
    lab.position.set(psuC.x - 75.4, psuC.y, psuC.z);
    cg.add(lab);
    psuParts.push(lab);
    for (let i = 0; i < 4; i++) psuParts.push(rbox(26, 12, 2, mats.black, cg, { at: [psuC.x - 40 + (i % 2) * 40, psuC.y - 18 + Math.floor(i / 2) * 26, psuC.z + 80.6], r: 0.8, ink: null }));
    const cageZ0 = psuC.z + 92;
    const cageZ1 = D / 2 - T - 46;
    storageC = new THREE.Vector3(innerCx, T + 40, (cageZ0 + cageZ1) / 2);
    const cageLen = Math.min(150, cageZ1 - cageZ0);
    // Open-sided cage: back wall and rails, so the drives show once the cover is down.
    storageParts.push(rbox(3, 74, cageLen, mats.inner, cg, { at: [storageC.x + 56, storageC.y, storageC.z], r: 1 }));
    for (const dy of [-37, 0, 37]) storageParts.push(rbox(110, 3, cageLen, mats.inner, cg, { at: [storageC.x, storageC.y + dy, storageC.z], r: 1 }));
    const hddLabel = mapped(0xffffff, label([{ text: '4 TB', size: 44, color: PALETTE.ink }, { text: 'HDD', size: 26, color: '#4a5061' }], '#d9dde6', 256, 128));
    for (const dy of [-18, 18]) {
      storageParts.push(rbox(100, 25, cageLen - 8, mats.darkMetal, cg, { at: [storageC.x - 2, storageC.y + dy, storageC.z] }));
      const sticker = new THREE.Mesh(new THREE.PlaneGeometry(cageLen * 0.5, 18), hddLabel);
      sticker.rotation.y = -Math.PI / 2;
      sticker.position.set(storageC.x - 52.2, storageC.y + dy, storageC.z);
      cg.add(sticker);
      storageParts.push(sticker);
    }
    // Shroud: the top stays, the glass-side cover slides out.
    const sLen = D / 2 - T - 42 - (-D / 2 + T);
    const sz = -D / 2 + T + sLen / 2;
    const sTopPlate = rbox(trayX - innerX0, 3, sLen, mats.case, cg, { at: [innerCx, sTop - 1.5, sz], r: 1, ink: 'body' });
    shroudG.position.set(innerX0 + 2, T, 0);
    const sCover = rbox(3, sTop - T, sLen, mapped(0xffffff, label([{ text: 'DIY', size: 60, color: '#ffffff' }], s.caseColor, 512, 96)), shroudG, { at: [0, (sTop - T) / 2, sz], r: 1, ink: 'body' });
    sCover.userData.coverColor = true;
    psuParts.push(sTopPlate, sCover);
    storageParts.push(rbox(70, 7, 100, mapped(0xffffff, label([{ text: 'SSD', size: 60, color: PALETTE.text }], '#3a3f4e')), cg, { at: [trayX - 50, sTop + 3.5, boardRear + 60], r: 1.5 }));
  } else {
    psuC = new THREE.Vector3(innerCx, H - T - 35, D / 2 - T - 56);
    psuParts.push(rbox(125, 64, 100, mats.darkMetal, cg, { at: [psuC.x, psuC.y, psuC.z], r: 4, ink: 'body' }));
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(64, 40), psuLabel());
    lab.rotation.y = -Math.PI / 2;
    lab.position.set(psuC.x - 62.9, psuC.y, psuC.z);
    cg.add(lab);
    psuParts.push(lab);
    storageC = new THREE.Vector3(-14, 150, D / 2 - T - 8);
    storageParts.push(rbox(70, 100, 7, mapped(0xffffff, label([{ text: 'SSD', size: 60, color: PALETTE.text }], '#3a3f4e')), cg, { at: [storageC.x, storageC.y, storageC.z], r: 1.5 }));
  }
  hot('psu', ...psuParts);
  hot('storage', ...storageParts);
  return { shroudG, psuC, storageC };
}

export type PsuArea = ReturnType<typeof buildPsuArea>;
