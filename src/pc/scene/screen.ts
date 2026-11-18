/**
 * The monitor's picture, drawn on a canvas: POST, the BIOS, an OS installer
 * and a desktop. Comic styling to match the scene.
 */
import * as THREE from 'three';
import { PALETTE as P } from '../../shared/theme';

export type ScreenState = 'off' | 'post' | 'bios' | 'install' | 'desktop';

export interface Specs {
  cpu: string;
  ram: string;
  gpu: string;
  drive: string;
}

export const DEFAULT_SPECS: Specs = { cpu: 'AMD Ryzen 7 9800X3D', ram: '32 GB DDR5-6000', gpu: 'GeForce RTX 5070', drive: 'Samsung 990 Pro 2 TB' };

const W = 1024;
const H = 576;
const FONT = 'ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export interface Screen {
  texture: THREE.CanvasTexture;
  state(): ScreenState;
  set(state: ScreenState): void;
  setSpecs(s: Specs): void;
  update(t: number): void;
}

export function createScreen(): Screen {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  let current: ScreenState = 'desktop';
  let since = 0;
  let now = 0;
  let specs = DEFAULT_SPECS;
  let lastDraw = -1;

  function text(s: string, x: number, y: number, size: number, color: string, o: { weight?: number; align?: CanvasTextAlign; font?: string; stroke?: string; strokeW?: number } = {}): void {
    ctx.font = `${o.weight ?? 600} ${size}px ${o.font ?? FONT}`;
    ctx.textAlign = o.align ?? 'left';
    ctx.textBaseline = 'middle';
    if (o.stroke) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.strokeW ?? 8;
      ctx.strokeStyle = o.stroke;
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }

  function roundRect(x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, lw = 4): void {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function halftone(color: string, cell: number, fromY: number, toY: number, maxR: number): void {
    ctx.fillStyle = color;
    for (let y = fromY; y < toY; y += cell) {
      const r = maxR * ((y - fromY) / (toY - fromY));
      for (let x = (y / cell) % 2 ? cell / 2 : 0; x < W; x += cell) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function logo(cx: number, cy: number, size: number): void {
    text('DIY', cx, cy, size, P.yellow, { weight: 900, align: 'center', stroke: P.ink, strokeW: size * 0.14 });
  }

  function drawOff(): void {
    ctx.fillStyle = '#07070b';
    ctx.fillRect(0, 0, W, H);
    // A dim reflection band so the panel still reads as glass.
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0.35, 'rgba(255,255,255,0)');
    g.addColorStop(0.42, 'rgba(255,255,255,0.05)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawPost(e: number): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    logo(W / 2, H / 2 - 20, 150);
    const lines = [`CPU: ${specs.cpu}`, `Memory: ${specs.ram}`, `Storage: ${specs.drive}`];
    lines.forEach((l, i) => {
      if (e > 0.25 + i * 0.3) text(l, 40, 44 + i * 34, 24, '#c9cfdc', { font: MONO, weight: 500 });
    });
    if (Math.floor(e * 2.5) % 2 === 0 || e > 1.6) text('Press DEL to enter setup  ·  F11 boot menu', W / 2, H - 60, 26, '#e7e9ef', { align: 'center', font: MONO, weight: 500 });
  }

  function drawBios(e: number): void {
    ctx.fillStyle = '#141a33';
    ctx.fillRect(0, 0, W, H);
    halftone('rgba(110,231,255,0.07)', 18, H * 0.4, H, 4);
    ctx.fillStyle = '#0c1024';
    ctx.fillRect(0, 0, W, 64);
    text('UEFI BIOS', 28, 33, 30, P.cyan, { weight: 800 });
    text('EZ Mode  ·  F7 Advanced', W - 28, 33, 22, P.muted, { align: 'right', weight: 500 });
    roundRect(28, 88, 460, 300, 18, '#1d2547', '#2f3a6b', 3);
    text('System', 52, 120, 22, P.muted, { weight: 700 });
    const rows: [string, string][] = [['CPU', specs.cpu], ['Memory', specs.ram], ['Graphics', specs.gpu], ['CPU temp', `${38 + Math.round(Math.sin(e * 1.3) * 2)} °C`]];
    rows.forEach(([k, v], i) => {
      text(k, 52, 165 + i * 48, 22, P.muted, { weight: 500 });
      text(v.length > 26 ? `${v.slice(0, 25)}…` : v, 170, 165 + i * 48, 22, P.text, { weight: 700 });
    });
    roundRect(28, 408, 460, 70, 18, '#1d2547', '#2f3a6b', 3);
    text('XMP / EXPO', 52, 443, 24, P.text, { weight: 700 });
    roundRect(372, 425, 90, 36, 18, P.green);
    ctx.beginPath();
    ctx.arc(442, 443, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    text('Profile 1', 300, 443, 20, P.green, { align: 'center', weight: 700 });
    roundRect(516, 88, 480, 390, 18, '#1d2547', '#2f3a6b', 3);
    text('Boot priority', 540, 120, 22, P.muted, { weight: 700 });
    const boot = ['UEFI: USB  ·  DIY Installer', `NVMe: ${specs.drive}`, 'Network boot (off)'];
    const sel = 0;
    boot.forEach((b, i) => {
      const y = 160 + i * 66;
      const on = i === sel;
      const pulse = on ? 0.75 + 0.25 * Math.sin(e * 5) : 0;
      roundRect(540, y, 432, 52, 12, on ? `rgba(110,231,255,${0.2 + pulse * 0.2})` : '#262f57', on ? P.cyan : undefined, 3);
      text(`${i + 1}`, 566, y + 26, 24, on ? P.cyan : P.muted, { weight: 800 });
      text(b, 600, y + 26, 21, P.text, { weight: on ? 700 : 500 });
    });
    text('Drag to reorder', 540, 380, 18, '#7a84a8', { weight: 500 });
    ctx.fillStyle = '#0c1024';
    ctx.fillRect(0, H - 56, W, 56);
    text('F10 Save & Exit    ·    F11 Boot Menu    ·    F5 Defaults', W / 2, H - 28, 22, '#c9cfdc', { align: 'center', weight: 600 });
  }

  function drawInstall(e: number): void {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#2b1a5c');
    g.addColorStop(1, '#0f3f63');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    halftone('rgba(255,79,216,0.12)', 20, 0, H, 5);
    roundRect(182, 120, 660, 336, 22, '#f4f2fb', P.ink, 6);
    text('Installing your OS', 222, 172, 34, P.ink, { weight: 800 });
    const p = Math.min(1, e / 3.2);
    const steps = ['Copying files', 'Installing features', 'Finishing up'];
    steps.forEach((s, i) => {
      const done = p > (i + 1) / 3;
      const active = !done && p > i / 3;
      const y = 236 + i * 44;
      ctx.beginPath();
      ctx.arc(236, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = done ? P.green : active ? P.yellow : '#d6d3e3';
      ctx.fill();
      text(s, 262, y, 24, done || active ? P.ink : '#8d88a3', { weight: active ? 800 : 600 });
    });
    roundRect(222, 384, 580, 30, 15, '#d6d3e3', P.ink, 4);
    if (p > 0.01) roundRect(222, 384, Math.max(30, 580 * p), 30, 15, P.cyan, P.ink, 4);
    text(`${Math.round(p * 100)}%`, 802, 352, 24, P.ink, { align: 'right', weight: 800 });
  }

  function drawDesktop(): void {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, P.pink);
    g.addColorStop(0.55, P.purple);
    g.addColorStop(1, P.sky);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    halftone('rgba(22,17,31,0.22)', 16, 0, H, 5.5);
    ctx.save();
    ctx.translate(W / 2, H / 2 - 30);
    ctx.beginPath();
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const r = i % 2 ? 150 : 215;
      ctx.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
    ctx.restore();
    logo(W / 2, H / 2 - 30, 150);
    ctx.fillStyle = 'rgba(12,14,22,0.85)';
    ctx.fillRect(0, H - 52, W, 52);
    [P.cyan, P.yellow, P.green, '#ff7a59'].forEach((c, i) => roundRect(W / 2 - 92 + i * 48, H - 42, 32, 32, 8, c));
    text('12:00', W - 24, H - 26, 22, P.text, { align: 'right', weight: 600 });
  }

  function draw(): void {
    const e = now - since;
    if (current === 'off') drawOff();
    else if (current === 'post') drawPost(e);
    else if (current === 'bios') drawBios(e);
    else if (current === 'install') drawInstall(e);
    else drawDesktop();
    texture.needsUpdate = true;
  }

  draw();

  return {
    texture,
    state: () => current,
    set(s) {
      current = s;
      since = now;
      lastDraw = -1;
    },
    setSpecs(s) {
      specs = s;
      lastDraw = -1;
    },
    update(t) {
      now = t;
      const animated = current === 'post' || current === 'bios' || current === 'install';
      // Redraw at ~15 fps while something on screen moves, otherwise only on change.
      if (lastDraw < 0 || (animated && t - lastDraw > 1 / 15)) {
        lastDraw = t;
        draw();
      }
    },
  };
}
