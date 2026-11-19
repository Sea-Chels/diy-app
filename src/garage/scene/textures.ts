import type * as THREE from 'three';
import { canvasTex, label, mapped, stripes } from '../../shared/scene/kit';
import { cssHex, PALETTE } from '../../shared/theme';
import { C } from './kit';
import { tag } from '../../shared/scene/sceneTags';


// Built once and shared by both bodies, so swapping sedan/SUV doesn't make new canvases.
const once = (make: () => THREE.Texture) => {
  let v: THREE.Texture | undefined;
  return () => {
    if (!v) {
      v = make();
      tag(v, 'sharedTexture', true);
    }
    return v;
  };
};

/**
 * Lathe UVs run v = point index / 8 across the tire profile in wheels.ts:
 * 0–⅛ and ¾–⅞ are the two sidewalls, ⅜–½ is the tread.
 */
export const tireTex = once(() =>
  canvasTex(1024, 128, (ctx) => {
    const band = (v0: number, v1: number) => [(1 - v1) * 128, (v1 - v0) * 128] as const;
    ctx.fillStyle = cssHex(C.tire);
    ctx.fillRect(0, 0, 1024, 128);
    const [ty, th] = band(3 / 8, 4 / 8);
    ctx.fillStyle = '#141219';
    for (const k of [0.3, 0.7]) ctx.fillRect(0, ty + th * k - 1, 1024, 2);
    for (let x = 0; x < 1024; x += 16) {
      ctx.fillRect(x, ty, 3, th * 0.3);
      ctx.fillRect(x + 8, ty + th * 0.7, 3, th * 0.3);
    }
    ctx.font = '800 11px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#6d6878';
    for (const [v0, v1] of [[0, 1 / 8], [6 / 8, 7 / 8]]) {
      const [y, h] = band(v0, v1);
      for (let x = 0; x < 1024; x += 256) ctx.fillText('DIY  ALL-SEASON  225/45 R17', x + 20, y + h / 2);
    }
  }),
);

export const plateTex = once(() => label([{ text: 'DIY·4U', size: 46, color: PALETTE.ink }, { text: 'GARAGE STATE', size: 15, color: '#2b6cb0' }], '#e8f2ff', 256, 80));
export const plateMat = () => mapped(0xffffff, plateTex(), { shine: 0.5, halftone: 0.3 });
/** The MX-5's oval mouth: grille mesh inside a stadium outline, transparent outside it. */
export const mouthTex = once(() =>
  canvasTex(512, 96, (ctx) => {
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 88, 44);
    ctx.clip();
    ctx.fillStyle = '#100e15';
    ctx.fillRect(0, 0, 512, 96);
    ctx.fillStyle = '#34303f';
    for (let x = 0; x < 512; x += 24) for (let y = 0; y < 96; y += 24) {
      const ox = (y / 24) % 2 ? 12 : 0;
      ctx.fillRect(x + ox, y + 6, 14, 6);
    }
  }),
);
export const radiatorTex = once(() => stripes([60, 1], '#8a91a2', '#2b2f3a'));
export const seatTex = once(() => stripes([1, 5], '#47434f', '#34313d'));
export const engineLabel = once(() => label([{ text: 'DIY', size: 64, color: '#e6ecf5' }, { text: '2.0 · 16V', size: 22, color: PALETTE.cyan }], cssHex(C.cover), 256, 128));
export const batteryLabel = once(() => label([{ text: '12V', size: 52, color: PALETTE.ink }, { text: 'DIY POWER', size: 20, color: PALETTE.ink }], PALETTE.yellow, 256, 128));
export const fuseLabel = once(() => label([{ text: 'FUSE', size: 44, color: '#e6ecf5' }, { text: '· RELAY ·', size: 20, color: PALETTE.muted }], cssHex(C.darkPart), 256, 128));

/** The washer cap's windshield-and-spray symbol, the one every car uses. */
export const washerIcon = once(() =>
  canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = cssHex(C.washerCap);
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(30, 88);
    ctx.quadraticCurveTo(64, 70, 98, 88);
    ctx.lineTo(90, 48);
    ctx.quadraticCurveTo(64, 38, 38, 48);
    ctx.closePath();
    ctx.stroke();
    ctx.lineWidth = 5;
    for (const dx of [-14, 0, 14]) {
      ctx.beginPath();
      ctx.moveTo(64 + dx * 0.4, 80);
      ctx.lineTo(64 + dx, 54);
      ctx.stroke();
    }
  }),
);

/** The oil can with a drip, as printed on oil filler caps. */
export const oilIcon = once(() =>
  canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = cssHex(C.oil);
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.moveTo(26, 56);
    ctx.lineTo(76, 56);
    ctx.lineTo(104, 46);
    ctx.lineTo(80, 82);
    ctx.lineTo(26, 82);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(44, 46, 16, 10);
    ctx.beginPath();
    ctx.arc(104, 70, 6, 0, Math.PI * 2);
    ctx.fill();
  }),
);

export const gaugeTex = once(() =>
  canvasTex(256, 96, (ctx) => {
    ctx.fillStyle = '#141219';
    ctx.fillRect(0, 0, 256, 96);
    for (const [cx, needle, col] of [[70, -0.4, PALETTE.cyan], [186, 0.5, PALETTE.pink]] as const) {
      ctx.strokeStyle = '#3a3646';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, 52, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#d8dce6';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI * 0.75 + (i / 8) * Math.PI * 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 28, 52 + Math.sin(a) * 28);
        ctx.lineTo(cx + Math.cos(a) * 33, 52 + Math.sin(a) * 33);
        ctx.stroke();
      }
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, 52);
      ctx.lineTo(cx + Math.sin(needle) * 28, 52 - Math.cos(needle) * 28);
      ctx.stroke();
    }
  }),
);

export const screenTex = once(() =>
  canvasTex(128, 80, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 128, 80);
    g.addColorStop(0, '#2a1b4a');
    g.addColorStop(1, '#123a52');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 80);
    ctx.strokeStyle = PALETTE.cyan;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(14, 70);
    ctx.lineTo(40, 46);
    ctx.lineTo(70, 52);
    ctx.lineTo(104, 18);
    ctx.stroke();
    ctx.fillStyle = PALETTE.pink;
    ctx.beginPath();
    ctx.arc(104, 18, 7, 0, Math.PI * 2);
    ctx.fill();
  }),
);

