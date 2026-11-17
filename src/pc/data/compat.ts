/** Compatibility checks for a parts-picker build. */
import { CATEGORIES, CATEGORY_LABEL, PART_BY_ID, type Board, type Case, type Category, type Cooler, type Cpu, type Gpu, type Part, type Psu, type Ram, type Storage } from './catalog';

/** One pick per category, except storage which can hold several. */
export interface Build {
  cpu?: string;
  board?: string;
  ram?: string;
  gpu?: string;
  cooler?: string;
  case?: string;
  psu?: string;
  storage: string[];
}

export type Level = 'error' | 'warn' | 'ok';
export interface Issue {
  level: Level;
  text: string;
  /** Categories this issue involves, so the picker can flag them. */
  cats: Category[];
  /** Categories whose candidates should still be warned about it, without flagging the row. */
  also?: Category[];
}

export interface Picked {
  cpu?: Cpu;
  board?: Board;
  ram?: Ram;
  gpu?: Gpu;
  cooler?: Cooler;
  case?: Case;
  psu?: Psu;
  storage: Storage[];
}

export function resolve(b: Build): Picked {
  const get = <T extends Part>(id?: string) => (id ? (PART_BY_ID.get(id) as T | undefined) : undefined);
  return {
    cpu: get<Cpu>(b.cpu),
    board: get<Board>(b.board),
    ram: get<Ram>(b.ram),
    gpu: get<Gpu>(b.gpu),
    cooler: get<Cooler>(b.cooler),
    case: get<Case>(b.case),
    psu: get<Psu>(b.psu),
    storage: b.storage.map((id) => get<Storage>(id)).filter((s): s is Storage => Boolean(s)),
  };
}

/** Rough worst-case draw: CPU and GPU at their limits plus ~75 W for the board, RAM, drives and fans. */
export function estimateWatts(p: Picked): number {
  return (p.cpu?.watts ?? 0) + (p.gpu?.watts ?? 0) + 75;
}

/** Suggested PSU size: the estimate plus ~30% headroom, rounded up to the next 50 W. */
export function suggestedPsu(p: Picked): number {
  return Math.ceil((estimateWatts(p) * 1.3) / 50) * 50;
}

export function checkBuild(b: Build): Issue[] {
  const p = resolve(b);
  const out: Issue[] = [];
  const err = (text: string, ...cats: Category[]) => out.push({ level: 'error', text, cats });
  const warn = (text: string, ...cats: Category[]) => out.push({ level: 'warn', text, cats });
  const ok = (text: string, ...cats: Category[]) => out.push({ level: 'ok', text, cats });

  const { cpu, board, ram, gpu, cooler, psu } = p;
  const box = p.case;

  if (cpu && board) {
    if (cpu.socket !== board.socket) err(`${cpu.name} is ${cpu.socket}, but the ${board.name} is ${board.socket}. They won’t fit.`, 'cpu', 'board');
    else if (!board.gens.includes(cpu.gen)) warn(`Boards that left the factory before this CPU launched may need a BIOS update to boot it. Check for BIOS Flashback, which updates without a working CPU.`, 'cpu', 'board');
    else ok(`CPU and motherboard share the ${cpu.socket} socket.`, 'cpu', 'board');
  }
  if (ram && board) {
    if (ram.mem !== board.mem) err(`The motherboard takes ${board.mem}, this kit is ${ram.mem}. They are keyed differently and won’t fit.`, 'ram', 'board');
    else if (ram.sticks > board.slots) err(`${ram.sticks} sticks, but the board only has ${board.slots} memory slots.`, 'ram', 'board');
    else ok(`${ram.mem} memory matches the motherboard.`, 'ram', 'board');
  }
  if (board && box) {
    if (!box.forms.includes(board.form)) err(`A ${formName(board.form)} board doesn’t fit the ${box.name}.`, 'board', 'case');
    else ok(`${formName(board.form)} motherboard fits the case.`, 'board', 'case');
  }
  if (gpu && box) {
    if (gpu.length > box.gpuMax) err(`Typical ${gpu.name} cards are ~${gpu.length} mm; the case fits ${box.gpuMax} mm.`, 'gpu', 'case');
    else if (gpu.length > box.gpuMax - 15) warn(`Tight fit: ~${gpu.length} mm card in a ${box.gpuMax} mm space. Check your exact card’s length.`, 'gpu', 'case');
    else ok(`Graphics card length fits (${box.gpuMax} mm max).`, 'gpu', 'case');
  }
  if (cooler && box) {
    if (cooler.type === 'air' && cooler.height > box.coolerMax) err(`The cooler is ${cooler.height} mm tall; the case fits ${box.coolerMax} mm.`, 'cooler', 'case');
    else if (cooler.type === 'aio' && cooler.rad > box.radMax) err(`A ${cooler.rad} mm radiator is bigger than the case supports (${box.radMax} mm).`, 'cooler', 'case');
    else ok(cooler.type === 'aio' ? `The ${cooler.rad} mm radiator has a mount.` : `Cooler height fits (${box.coolerMax} mm max).`, 'cooler', 'case');
  }
  if (cooler && cpu) {
    if (!cooler.sockets.includes(cpu.socket)) err(`The ${cooler.name} has no mount for ${cpu.socket}.`, 'cooler', 'cpu');
    else if (cooler.lowProfile && cpu.watts > 100) warn(`A low-profile cooler on a ${cpu.watts} W chip will run hot and loud. Fine for light use.`, 'cooler', 'cpu');
  }
  if (psu && box) {
    if (!box.psu.includes(psu.form)) err(`The case takes ${box.psu.join(' or ')} power supplies, not ${psu.form}.`, 'psu', 'case');
    else if (psu.form === 'SFX' && box.psu.includes('ATX')) warn(`An SFX supply in an ATX mount needs an SFX-to-ATX bracket (often in the PSU box).`, 'psu', 'case');
  }
  if (psu && (cpu || gpu)) {
    const need = estimateWatts(p);
    const rec = suggestedPsu(p);
    if (psu.watts < need) out.push({ level: 'error', text: `Estimated peak draw is ~${need} W, more than the ${psu.watts} W supply.`, cats: ['psu'], also: ['cpu', 'gpu'] });
    else if (psu.watts < rec) warn(`Estimated peak draw ~${need} W. ${rec} W or more leaves comfortable headroom.`, 'psu');
    else ok(`${psu.watts} W covers the estimated ~${need} W peak with headroom.`, 'psu');
  }
  if (cpu && !cpu.igpu && !gpu) err(`The ${cpu.name} has no built-in graphics. Add a graphics card or there’s no picture.`, 'cpu', 'gpu');
  if (board) {
    const m2 = p.storage.filter((s) => s.type === 'm2').length;
    if (m2 > board.m2) err(`${m2} M.2 drives, but the board has ${board.m2} M.2 slots.`, 'storage', 'board');
  }

  const missing = CATEGORIES.filter((c) => (c === 'storage' ? b.storage.length === 0 : !b[c]) && !(c === 'gpu' && cpu?.igpu));
  if (missing.length) out.push({ level: 'warn', text: `Still to pick: ${missing.map((c) => CATEGORY_LABEL[c]).join(', ')}.`, cats: missing });

  const rank: Record<Level, number> = { error: 0, warn: 1, ok: 2 };
  return out.sort((a, z) => rank[a.level] - rank[z.level]);
}

/** Problems a candidate part would cause with the rest of the build. */
export function conflictsFor(b: Build, part: Part): Issue[] {
  const trial: Build = part.cat === 'storage' ? { ...b, storage: b.storage.includes(part.id) ? b.storage : [...b.storage, part.id] } : { ...b, [part.cat]: part.id };
  return checkBuild(trial).filter((i) => i.level === 'error' && (i.cats.includes(part.cat) || i.also?.includes(part.cat)));
}

function formName(f: Board['form']): string {
  return { ITX: 'Mini-ITX', mATX: 'Micro-ATX', ATX: 'ATX', EATX: 'E-ATX' }[f];
}
