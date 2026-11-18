import * as THREE from 'three';
import { canvasTex as kitTex, label as kitLabel, stripes as kitStripes } from '../../shared/scene/kit';

// PC textures have never used anisotropic filtering; turning it on visibly sharpens the angled front mesh and labels.
export const canvasTex: typeof kitTex = (w, h, draw, repeat) => kitTex(w, h, draw, repeat, 1);
export const label: typeof kitLabel = (lines, bg, w, h) => kitLabel(lines, bg, w, h, 1);

export const C = {
  pcb: 0x1e2433,
  trace: 0x3a4870,
  slot: 0x2c303d,
  black: 0x18171e,
  plastic: 0x2b2d36,
  metal: 0xb7bfcf,
  darkMetal: 0x4a5061,
  copper: 0xd88a4f,
  sleeve: 0x1f1e27,
  ihs: 0xd3d8e2,
  ramBody: 0x30333f,
  gpu: 0x2a2c36,
  blade: 0x3a3e4c,
  m2: 0x1d3b30,
};

export const stripes: typeof kitStripes = (repeat, light, dark) => kitStripes(repeat, light, dark, 1);

/** Front mesh: dark sheet with transparent holes so the fans' glow shows through. */
export const perforated = (repeat: [number, number]) =>
  canvasTex(32, 32, (ctx) => {
    ctx.fillStyle = 'rgba(14,13,20,0.86)';
    ctx.fillRect(0, 0, 32, 32);
    ctx.globalCompositeOperation = 'destination-out';
    for (const [x, y] of [[8, 8], [24, 24], [24, 8], [8, 24]]) {
      ctx.beginPath();
      ctx.arc(x, y, 5.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, repeat);

/** A hard-tube run through `pts`, with each corner rounded to radius `bend`. */
export function bentPath(pts: THREE.Vector3[], bend = 14): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();
  let from = pts[0].clone();
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (i === pts.length - 1) {
      path.add(new THREE.LineCurve3(from, p.clone()));
      break;
    }
    const next = pts[i + 1];
    const inDir = p.clone().sub(pts[i - 1]).normalize();
    const outDir = next.clone().sub(p).normalize();
    const r = Math.min(bend, p.distanceTo(pts[i - 1]) / 2, p.distanceTo(next) / 2);
    const a = p.clone().addScaledVector(inDir, -r);
    const b = p.clone().addScaledVector(outDir, r);
    path.add(new THREE.LineCurve3(from, a));
    path.add(new THREE.QuadraticBezierCurve3(a, p.clone(), b));
    from = b;
  }
  return path;
}
