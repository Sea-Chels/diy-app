import * as THREE from 'three';
import type { Setup } from '../data/setup';
import { canvasTex, range, rng } from '../../shared/scene/kit';

/** Wall cross-section: drywall, stud, sheathing, siding (or drywall both sides for partitions). */
export function sectionTex(layers: [string, number][], vertical: boolean): THREE.CanvasTexture {
  return canvasTex(64, 64, (ctx) => {
    let at = 0;
    for (const [col, frac] of layers) {
      ctx.fillStyle = col;
      const n = frac * 64;
      if (vertical) ctx.fillRect(at, 0, n + 1, 64);
      else ctx.fillRect(0, at, 64, n + 1);
      at += n;
    }
  });
}
export const EXT_LAYERS: [string, number][] = [['#f4efe4', 0.1], ['#d9b07a', 0.62], ['#b48a52', 0.1], ['#7d93a6', 0.18]];
export const INT_LAYERS: [string, number][] = [['#f4efe4', 0.14], ['#d9b07a', 0.72], ['#f4efe4', 0.14]];

export function subway(repeat: [number, number], base = '#f6f4ee', grout = '#c9c4b8'): THREE.CanvasTexture {
  return canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = grout;
    ctx.fillRect(0, 0, 128, 128);
    for (let row = 0; row < 8; row++) {
      for (let c = -1; c < 3; c++) {
        ctx.fillStyle = base;
        ctx.fillRect(c * 64 + (row % 2) * 32 + 1.5, row * 16 + 1.5, 61, 13);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(c * 64 + (row % 2) * 32 + 4, row * 16 + 3, 20, 2);
      }
    }
  }, repeat);
}

export function hexTile(repeat: [number, number]): THREE.CanvasTexture {
  return canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = '#9b978f';
    ctx.fillRect(0, 0, 128, 128);
    const r = 128 / 6 / Math.sqrt(3);
    const w = Math.sqrt(3) * r;
    for (let row = -1; row < 8; row++) {
      for (let c = -1; c < 8; c++) {
        const cx = c * w + (row % 2 ? w / 2 : 0);
        const cy = row * r * 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 6 + (i * Math.PI) / 3;
          ctx.lineTo(cx + Math.cos(a) * (r - 1.4), cy + Math.sin(a) * (r - 1.4));
        }
        ctx.closePath();
        ctx.fillStyle = (row * 7 + c * 3) % 11 === 0 ? '#2d3340' : '#f2f0ea';
        ctx.fill();
      }
    }
  }, repeat);
}

/** Floor boards: rows `rows` boards tall on a 256 canvas, staggered joints. */
export function boards(base: string[], seam: string, rows: number, repeat: [number, number], seed: number): THREE.CanvasTexture {
  return canvasTex(256, 256, (ctx) => {
    const r = rng(seed);
    const h = 256 / rows;
    for (let row = 0; row < rows; row++) {
      let x = -r() * 200;
      while (x < 256) {
        const len = range(r, 120, 240);
        ctx.fillStyle = base[Math.floor(r() * base.length)];
        ctx.fillRect(x, row * h, len, h);
        ctx.strokeStyle = 'rgba(60,35,15,0.18)';
        for (let g = 0; g < 3; g++) {
          const y = row * h + range(r, 2, h - 2);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + len * 0.3, y + range(r, -2, 2), x + len * 0.7, y + range(r, -2, 2), x + len, y);
          ctx.stroke();
        }
        ctx.fillStyle = seam;
        ctx.fillRect(x, row * h, 1.5, h);
        x += len;
      }
      ctx.fillStyle = seam;
      ctx.fillRect(0, row * h, 256, 1.5);
    }
  }, repeat);
}

export function bigTile(repeat: [number, number]): THREE.CanvasTexture {
  return canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = '#8d8a84';
    ctx.fillRect(0, 0, 128, 128);
    const r = rng(5);
    for (const [x, y] of [[0, 0], [64, 0], [0, 64], [64, 64]]) {
      ctx.fillStyle = ['#cfcac0', '#c6c0b4', '#d6d1c7'][Math.floor(r() * 3)];
      ctx.fillRect(x + 1.5, y + 1.5, 61, 61);
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = 'rgba(120,110,100,0.25)';
        ctx.fillRect(x + 2 + r() * 58, y + 2 + r() * 58, 2, 2);
      }
    }
  }, repeat);
}

/** Lap siding, 8 boards per 1.2 m, offset so boards line up across separate wall pieces. */
export function lapSiding(y0: number, y1: number): THREE.CanvasTexture {
  const t = canvasTex(64, 64, (ctx) => {
    for (let i = 0; i < 8; i++) {
      const y = i * 8;
      ctx.fillStyle = '#7d93a6'; ctx.fillRect(0, y, 64, 8);
      ctx.fillStyle = '#93a8ba'; ctx.fillRect(0, y, 64, 1.5);
      ctx.fillStyle = '#4e6273'; ctx.fillRect(0, y + 6.5, 64, 1.5);
    }
  }, [2, (y1 - y0) / 1.2]);
  t.offset.y = y0 / 1.2;
  return t;
}

export const floorTex = (floor: Setup['floor']): THREE.CanvasTexture => ({
  oak: () => boards(['#c8955c', '#bd8a52', '#d1a06a', '#b98050'], '#6b4526', 12, [1 / 1.6, 1 / 1.0], 3),
  lvp: () => boards(['#a99a86', '#9d8f7c', '#b3a591', '#958774'], '#5f5547', 6, [1 / 1.9, 1 / 1.1], 9),
  tile: () => bigTile([1 / 1.2, 1 / 1.2]),
})[floor]();
