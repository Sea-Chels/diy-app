import * as THREE from 'three';
import { add, canvasTex, remap, type V3, textured } from '../../../shared/scene/kit';
import { X0, X1, Z0, Z1, T, WH, PH, BX, BZ, PT, HOLE, WIN, DOOR } from '../room';
import { hexTile, floorTex } from '../textures';
import type { HomeCtx } from '../ctx';

/** Floor slab, cut to show the layers. */
export function buildFloor(c: HomeCtx) {
  const { root, M, slab, s, look } = c;
  const floorFront = textured(canvasTex(256, 64, (ctx) => {
    // Front cut: finish floor, underlayment, subfloor, joist ends every 16 in, drywall ceiling below.
    ctx.fillStyle = '#2a2420';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#c8955c'; ctx.fillRect(0, 0, 256, 4);
    ctx.fillStyle = '#5b6f8a'; ctx.fillRect(0, 4, 256, 2);
    ctx.fillStyle = '#b8935c'; ctx.fillRect(0, 6, 256, 6);
    ctx.fillStyle = '#e9b9c8'; ctx.fillRect(0, 12, 256, 46);
    for (let x = 0; x < 256; x += 36) {
      ctx.fillStyle = '#d9b07a'; ctx.fillRect(x, 12, 9, 46);
      ctx.fillStyle = '#b8935c'; ctx.fillRect(x + 1, 13, 1, 44);
    }
    ctx.fillStyle = '#f4efe4'; ctx.fillRect(0, 58, 256, 6);
  }, [2, 1]));
  const floorSide = textured(canvasTex(256, 64, (ctx) => {
    // Side cut runs along a joist.
    ctx.fillStyle = '#c8955c'; ctx.fillRect(0, 0, 256, 4);
    ctx.fillStyle = '#5b6f8a'; ctx.fillRect(0, 4, 256, 2);
    ctx.fillStyle = '#b8935c'; ctx.fillRect(0, 6, 256, 6);
    ctx.fillStyle = '#d9b07a'; ctx.fillRect(0, 12, 256, 46);
    ctx.strokeStyle = 'rgba(120,80,40,0.4)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(0, 16 + i * 7); ctx.bezierCurveTo(80, 18 + i * 7, 170, 14 + i * 7, 256, 16 + i * 7); ctx.stroke();
    }
    ctx.fillStyle = '#f4efe4'; ctx.fillRect(0, 58, 256, 6);
  }, [3, 1]));
  slab([X0 - T, -0.34, Z0 - T], [X1, 0, Z1], [floorSide, M.concrete, M.dark, M.dark, floorFront, M.concrete]);

  // Finish floor with a hole at the front where planks lift out (the floor area).
  const floorMat = textured(floorTex(s.floor), { halftone: 0.6 });
  look((n) => remap(floorMat, floorTex(n.floor)));
  {
    const sh = new THREE.Shape();
    // Shape y is world -z. L-shape around the bathroom.
    const pts: [number, number][] = [[BX + PT, Z0], [X1, Z0], [X1, Z1], [X0, Z1], [X0, BZ + PT], [BX + PT, BZ + PT]];
    pts.forEach(([x, z], i) => { if (i) sh.lineTo(x, -z); else sh.moveTo(x, -z); });
    const hole = new THREE.Path();
    hole.moveTo(HOLE.x0, -HOLE.z0); hole.lineTo(HOLE.x0, -HOLE.z1); hole.lineTo(HOLE.x1, -HOLE.z1); hole.lineTo(HOLE.x1, -HOLE.z0);
    sh.holes.push(hole);
    const g = new THREE.ShapeGeometry(sh);
    g.rotateX(-Math.PI / 2);
    const f = add(g, floorMat, root, { at: [0, 0.002, 0], ink: null });
    f.castShadow = false;
    f.userData.crease = true;
  }
  {
    const g = new THREE.PlaneGeometry(BX - X0, BZ - Z0);
    g.rotateX(-Math.PI / 2);
    const f = add(g, textured(hexTile([4, 6]), { halftone: 0.5 }), root, { at: [(X0 + BX) / 2, 0.003, (Z0 + BZ) / 2], ink: null });
    f.castShadow = false;
  }
}

export function buildWalls(c: HomeCtx) {
  const { root, M, siding, blocker, slab } = c;
  // Back wall: interior face +z. Faces: +x, -x, +y, -y, +z, -z.
  const backWall = (x0: number, x1: number, y0: number, y1: number, paint: THREE.Material, endCut = false) =>
    blocker(slab([x0, y0, Z0 - T], [x1, y1, Z0], [endCut ? M.secExtU : M.cut, M.cut, M.secExtV, M.dark, paint, siding(y0, y1)], root, null));
  // Left wall: interior face +x.
  const leftWall = (z0: number, z1: number, y0: number, y1: number, paint: THREE.Material, endCut = false) =>
    blocker(slab([X0 - T, y0, z0], [X0, y1, z1], [paint, siding(y0, y1), M.secExtU, M.dark, endCut ? M.secExtU : M.cut, M.cut], root, null));

  backWall(X0 - T, BX + PT / 2, 0, WH, M.bathPaint);
  backWall(BX + PT / 2, WIN.x0, 0, WH, M.paint);
  backWall(WIN.x0, WIN.x1, 0, WIN.y0, M.paint);
  backWall(WIN.x0, WIN.x1, WIN.y1, WH, M.paint);
  backWall(WIN.x1, X1, 0, WH, M.paint, true);
  leftWall(Z0, BZ + PT / 2, 0, WH, M.bathPaint);
  leftWall(BZ + PT / 2, DOOR.z0, 0, WH, M.paint);
  leftWall(DOOR.z0, DOOR.z1, DOOR.y1, WH, M.paint);
  leftWall(DOOR.z1, Z1, 0, WH, M.paint, true);
  // Bathroom partitions, cut at PH. Kitchen side painted, bathroom side pale aqua.
  slab([BX, 0, Z0], [BX + PT, PH, BZ + PT], [M.paint, M.bathPaint, M.secIntU, M.dark, M.secIntU, M.cut]);
  slab([X0, 0, BZ], [-2.75, PH, BZ + PT], [M.secIntU, M.cut, M.secIntV, M.dark, M.paint, M.bathPaint]);
  const base = (min: V3, max: V3) => slab(min, max, M.trim, root, 'thin');
  base([BX + PT, 0, Z0], [X1, 0.09, Z0 + 0.015]);
  base([X0, 0, BZ + PT], [X0 + 0.015, 0.09, DOOR.z0 - 0.07]);
  base([X0, 0, DOOR.z1 + 0.07], [X0 + 0.015, 0.09, Z1]);
  base([X0, 0, BZ + PT], [-2.75, 0.09, BZ + PT + 0.015]);
}
