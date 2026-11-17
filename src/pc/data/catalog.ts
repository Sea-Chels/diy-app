/**
 * A short, curated list of popular parts for the picker. Specs are rounded
 * from maker pages and only cover what the compatibility checks need; the UI
 * links every part to PCPartPicker for live prices and full specs.
 */
import type { CaseSize } from './setup';

export type Category = 'cpu' | 'board' | 'ram' | 'gpu' | 'cooler' | 'case' | 'psu' | 'storage';
export const CATEGORIES: Category[] = ['cpu', 'board', 'ram', 'gpu', 'cooler', 'case', 'psu', 'storage'];
export const CATEGORY_LABEL: Record<Category, string> = {
  cpu: 'CPU',
  board: 'Motherboard',
  ram: 'Memory',
  gpu: 'Graphics card',
  cooler: 'CPU cooler',
  case: 'Case',
  psu: 'Power supply',
  storage: 'Storage',
};
export const CATEGORY_PLURAL: Record<Category, string> = {
  cpu: 'CPUs',
  board: 'motherboards',
  ram: 'memory kits',
  gpu: 'graphics cards',
  cooler: 'CPU coolers',
  case: 'cases',
  psu: 'power supplies',
  storage: 'drives',
};
/** PCPartPicker's browse page for each category. */
export const PPP_CATEGORY: Record<Category, string> = {
  cpu: 'cpu',
  board: 'motherboard',
  ram: 'memory',
  gpu: 'video-card',
  cooler: 'cpu-cooler',
  case: 'case',
  psu: 'power-supply',
  storage: 'internal-hard-drive',
};

export type Socket = 'AM5' | 'AM4' | 'LGA1700' | 'LGA1851';
export type MemType = 'DDR4' | 'DDR5';
export type Form = 'ITX' | 'mATX' | 'ATX' | 'EATX';
export type PsuForm = 'ATX' | 'SFX';

interface Base {
  id: string;
  name: string;
  /** One line of key specs for the list. */
  blurb: string;
}
export interface Cpu extends Base { cat: 'cpu'; socket: Socket; gen: string; watts: number; igpu: boolean }
export interface Board extends Base { cat: 'board'; socket: Socket; form: Form; mem: MemType; slots: number; m2: number; gens: string[] }
export interface Ram extends Base { cat: 'ram'; mem: MemType; sticks: number; rgb: boolean }
export interface Gpu extends Base { cat: 'gpu'; length: number; watts: number }
export interface Cooler extends Base { cat: 'cooler'; type: 'air' | 'aio'; height: number; rad: number; sockets: Socket[]; lowProfile?: boolean }
export interface Case extends Base { cat: 'case'; size: CaseSize; forms: Form[]; gpuMax: number; coolerMax: number; radMax: number; psu: PsuForm[] }
export interface Psu extends Base { cat: 'psu'; watts: number; form: PsuForm }
export interface Storage extends Base { cat: 'storage'; type: 'm2' | 'sata' }
export type Part = Cpu | Board | Ram | Gpu | Cooler | Case | Psu | Storage;

const ALL_SOCKETS: Socket[] = ['AM5', 'AM4', 'LGA1700', 'LGA1851'];

export const CATALOG: Part[] = [
  // CPUs. watts = the most the chip will pull at stock (AMD PPT, Intel max turbo power).
  { cat: 'cpu', id: 'r5-7600', name: 'AMD Ryzen 5 7600', blurb: '6 cores · AM5 · 65 W · has graphics', socket: 'AM5', gen: 'ryzen7000', watts: 88, igpu: true },
  { cat: 'cpu', id: 'r5-9600x', name: 'AMD Ryzen 5 9600X', blurb: '6 cores · AM5 · 65 W · has graphics', socket: 'AM5', gen: 'ryzen9000', watts: 88, igpu: true },
  { cat: 'cpu', id: 'r7-9800x3d', name: 'AMD Ryzen 7 9800X3D', blurb: '8 cores · AM5 · 120 W · gaming favourite', socket: 'AM5', gen: 'ryzen9000', watts: 162, igpu: true },
  { cat: 'cpu', id: 'r9-9950x', name: 'AMD Ryzen 9 9950X', blurb: '16 cores · AM5 · 170 W', socket: 'AM5', gen: 'ryzen9000', watts: 230, igpu: true },
  { cat: 'cpu', id: 'r5-5600', name: 'AMD Ryzen 5 5600', blurb: '6 cores · AM4 · 65 W · no graphics', socket: 'AM4', gen: 'ryzen5000', watts: 76, igpu: false },
  { cat: 'cpu', id: 'r7-5700x3d', name: 'AMD Ryzen 7 5700X3D', blurb: '8 cores · AM4 · 105 W · no graphics', socket: 'AM4', gen: 'ryzen5000', watts: 142, igpu: false },
  { cat: 'cpu', id: 'i5-14400f', name: 'Intel Core i5-14400F', blurb: '10 cores · LGA1700 · no graphics', socket: 'LGA1700', gen: 'intel14', watts: 148, igpu: false },
  { cat: 'cpu', id: 'i5-14600k', name: 'Intel Core i5-14600K', blurb: '14 cores · LGA1700 · has graphics', socket: 'LGA1700', gen: 'intel14', watts: 181, igpu: true },
  { cat: 'cpu', id: 'u7-265k', name: 'Intel Core Ultra 7 265K', blurb: '20 cores · LGA1851 · has graphics', socket: 'LGA1851', gen: 'arrow', watts: 250, igpu: true },

  // Motherboards. gens = CPU generations that boot on the BIOS it shipped with.
  { cat: 'board', id: 'b650-tomahawk', name: 'MSI MAG B650 Tomahawk WiFi', blurb: 'ATX · AM5 · DDR5 · 4 RAM slots · 3 M.2', socket: 'AM5', form: 'ATX', mem: 'DDR5', slots: 4, m2: 3, gens: ['ryzen7000'] },
  { cat: 'board', id: 'b650m-elite', name: 'Gigabyte B650M Aorus Elite AX', blurb: 'Micro-ATX · AM5 · DDR5 · 4 RAM slots · 2 M.2', socket: 'AM5', form: 'mATX', mem: 'DDR5', slots: 4, m2: 2, gens: ['ryzen7000'] },
  { cat: 'board', id: 'b650i-strix', name: 'ASUS ROG Strix B650E-I Gaming WiFi', blurb: 'Mini-ITX · AM5 · DDR5 · 2 RAM slots · 2 M.2', socket: 'AM5', form: 'ITX', mem: 'DDR5', slots: 2, m2: 2, gens: ['ryzen7000'] },
  { cat: 'board', id: 'b550-tomahawk', name: 'MSI MAG B550 Tomahawk', blurb: 'ATX · AM4 · DDR4 · 4 RAM slots · 2 M.2', socket: 'AM4', form: 'ATX', mem: 'DDR4', slots: 4, m2: 2, gens: ['ryzen5000'] },
  { cat: 'board', id: 'z790-a', name: 'MSI PRO Z790-A WiFi', blurb: 'ATX · LGA1700 · DDR5 · 4 RAM slots · 4 M.2', socket: 'LGA1700', form: 'ATX', mem: 'DDR5', slots: 4, m2: 4, gens: ['intel13'] },
  { cat: 'board', id: 'b760m-mortar', name: 'MSI MAG B760M Mortar WiFi', blurb: 'Micro-ATX · LGA1700 · DDR5 · 4 RAM slots · 2 M.2', socket: 'LGA1700', form: 'mATX', mem: 'DDR5', slots: 4, m2: 2, gens: ['intel13'] },
  { cat: 'board', id: 'z890-tomahawk', name: 'MSI MAG Z890 Tomahawk WiFi', blurb: 'ATX · LGA1851 · DDR5 · 4 RAM slots · 4 M.2', socket: 'LGA1851', form: 'ATX', mem: 'DDR5', slots: 4, m2: 4, gens: ['arrow'] },

  // Memory
  { cat: 'ram', id: 'veng-ddr5-32', name: 'Corsair Vengeance 32 GB (2×16) DDR5-6000 CL30', blurb: 'DDR5 · 2 sticks', mem: 'DDR5', sticks: 2, rgb: false },
  { cat: 'ram', id: 'flare-x5-32', name: 'G.Skill Flare X5 32 GB (2×16) DDR5-6000 CL30', blurb: 'DDR5 · 2 sticks · low profile', mem: 'DDR5', sticks: 2, rgb: false },
  { cat: 'ram', id: 'tz5-rgb-32', name: 'G.Skill Trident Z5 RGB 32 GB (2×16) DDR5-6400', blurb: 'DDR5 · 2 sticks · RGB', mem: 'DDR5', sticks: 2, rgb: true },
  { cat: 'ram', id: 'fury-ddr5-64', name: 'Kingston Fury Beast 64 GB (2×32) DDR5-6000', blurb: 'DDR5 · 2 sticks', mem: 'DDR5', sticks: 2, rgb: false },
  { cat: 'ram', id: 'veng-ddr5-128', name: 'Corsair Vengeance 128 GB (4×32) DDR5-5600', blurb: 'DDR5 · 4 sticks', mem: 'DDR5', sticks: 4, rgb: false },
  { cat: 'ram', id: 'lpx-ddr4-32', name: 'Corsair Vengeance LPX 32 GB (2×16) DDR4-3200', blurb: 'DDR4 · 2 sticks', mem: 'DDR4', sticks: 2, rgb: false },
  { cat: 'ram', id: 'ripjaws-ddr4-32', name: 'G.Skill Ripjaws V 32 GB (2×16) DDR4-3600', blurb: 'DDR4 · 2 sticks', mem: 'DDR4', sticks: 2, rgb: false },

  // Graphics cards: typical partner-card length; the exact length depends on the brand.
  { cat: 'gpu', id: 'rtx5060', name: 'GeForce RTX 5060', blurb: '~145 W · dual-fan cards ~240 mm', length: 240, watts: 145 },
  { cat: 'gpu', id: 'rtx5060ti', name: 'GeForce RTX 5060 Ti 16 GB', blurb: '~180 W · dual-fan cards ~250 mm', length: 250, watts: 180 },
  { cat: 'gpu', id: 'rtx5070', name: 'GeForce RTX 5070', blurb: '~250 W · partner cards ~300 mm', length: 300, watts: 250 },
  { cat: 'gpu', id: 'rtx5070ti', name: 'GeForce RTX 5070 Ti', blurb: '~300 W · triple-fan cards ~320 mm', length: 320, watts: 300 },
  { cat: 'gpu', id: 'rtx5080', name: 'GeForce RTX 5080', blurb: '~360 W · triple-fan cards ~330 mm', length: 330, watts: 360 },
  { cat: 'gpu', id: 'rtx5090', name: 'GeForce RTX 5090', blurb: '~575 W · partner cards ~350 mm', length: 350, watts: 575 },
  { cat: 'gpu', id: 'rx9060xt', name: 'Radeon RX 9060 XT 16 GB', blurb: '~160 W · dual-fan cards ~240 mm', length: 240, watts: 160 },
  { cat: 'gpu', id: 'rx9070xt', name: 'Radeon RX 9070 XT', blurb: '~305 W · triple-fan cards ~320 mm', length: 320, watts: 305 },
  { cat: 'gpu', id: 'arc-b580', name: 'Intel Arc B580', blurb: '~190 W · dual-fan cards ~270 mm', length: 270, watts: 190 },

  // Coolers
  { cat: 'cooler', id: 'pa120se', name: 'Thermalright Peerless Assassin 120 SE', blurb: 'Dual-tower air · 155 mm tall', type: 'air', height: 155, rad: 0, sockets: ALL_SOCKETS },
  { cat: 'cooler', id: 'ak400', name: 'DeepCool AK400', blurb: 'Single-tower air · 155 mm tall', type: 'air', height: 155, rad: 0, sockets: ALL_SOCKETS },
  { cat: 'cooler', id: 'nhd15g2', name: 'Noctua NH-D15 G2', blurb: 'Dual-tower air · 168 mm tall', type: 'air', height: 168, rad: 0, sockets: ALL_SOCKETS },
  { cat: 'cooler', id: 'nhl9a-am5', name: 'Noctua NH-L9a-AM5', blurb: 'Low-profile air · 37 mm tall · AM5 only', type: 'air', height: 37, rad: 0, sockets: ['AM5'], lowProfile: true },
  { cat: 'cooler', id: 'lf3-240', name: 'Arctic Liquid Freezer III 240', blurb: '240 mm AIO', type: 'aio', height: 0, rad: 240, sockets: ALL_SOCKETS },
  { cat: 'cooler', id: 'kraken-280', name: 'NZXT Kraken 280', blurb: '280 mm AIO', type: 'aio', height: 0, rad: 280, sockets: ALL_SOCKETS },
  { cat: 'cooler', id: 'lf3-360', name: 'Arctic Liquid Freezer III 360', blurb: '360 mm AIO', type: 'aio', height: 0, rad: 360, sockets: ALL_SOCKETS },

  // Cases
  { cat: 'case', id: 'nr200p', name: 'Cooler Master NR200P', blurb: 'Mini-ITX · GPU ≤ 330 mm · cooler ≤ 155 mm · SFX', size: 'itx', forms: ['ITX'], gpuMax: 330, coolerMax: 155, radMax: 280, psu: ['SFX'] },
  { cat: 'case', id: 'a3-matx', name: 'Lian Li A3-mATX', blurb: 'Micro-ATX · GPU ≤ 415 mm · cooler ≤ 165 mm', size: 'mid', forms: ['mATX', 'ITX'], gpuMax: 415, coolerMax: 165, radMax: 360, psu: ['ATX', 'SFX'] },
  { cat: 'case', id: 'north', name: 'Fractal Design North', blurb: 'ATX mid tower · GPU ≤ 355 mm · cooler ≤ 170 mm', size: 'mid', forms: ['ATX', 'mATX', 'ITX'], gpuMax: 355, coolerMax: 170, radMax: 360, psu: ['ATX'] },
  { cat: 'case', id: 'h5-flow', name: 'NZXT H5 Flow', blurb: 'ATX mid tower · GPU ≤ 365 mm · cooler ≤ 165 mm', size: 'mid', forms: ['ATX', 'mATX', 'ITX'], gpuMax: 365, coolerMax: 165, radMax: 360, psu: ['ATX'] },
  { cat: 'case', id: 'o11-evo', name: 'Lian Li O11 Dynamic EVO', blurb: 'ATX mid tower · GPU ≤ 420 mm · cooler ≤ 167 mm', size: 'mid', forms: ['EATX', 'ATX', 'mATX', 'ITX'], gpuMax: 420, coolerMax: 167, radMax: 360, psu: ['ATX'] },
  { cat: 'case', id: 'enthoo-pro2', name: 'Phanteks Enthoo Pro 2', blurb: 'Full tower · GPU ≤ 500 mm · cooler ≤ 195 mm', size: 'full', forms: ['EATX', 'ATX', 'mATX', 'ITX'], gpuMax: 500, coolerMax: 195, radMax: 480, psu: ['ATX'] },

  // Power supplies
  { cat: 'psu', id: 'mag-a650', name: 'MSI MAG A650BN 650 W', blurb: 'ATX · 650 W · 80+ Bronze', watts: 650, form: 'ATX' },
  { cat: 'psu', id: 'rm750e', name: 'Corsair RM750e 750 W', blurb: 'ATX · 750 W · 80+ Gold · modular', watts: 750, form: 'ATX' },
  { cat: 'psu', id: 'rm850x', name: 'Corsair RM850x 850 W', blurb: 'ATX · 850 W · 80+ Gold · modular', watts: 850, form: 'ATX' },
  { cat: 'psu', id: 'focus-gx1000', name: 'Seasonic Focus GX-1000', blurb: 'ATX · 1000 W · 80+ Gold · modular', watts: 1000, form: 'ATX' },
  { cat: 'psu', id: 'sf750', name: 'Corsair SF750', blurb: 'SFX · 750 W · 80+ Platinum · modular', watts: 750, form: 'SFX' },
  { cat: 'psu', id: 'sf1000', name: 'Corsair SF1000', blurb: 'SFX · 1000 W · 80+ Platinum · modular', watts: 1000, form: 'SFX' },

  // Storage
  { cat: 'storage', id: '990pro-2', name: 'Samsung 990 Pro 2 TB', blurb: 'M.2 NVMe · PCIe 4.0', type: 'm2' },
  { cat: 'storage', id: 'sn850x-1', name: 'WD Black SN850X 1 TB', blurb: 'M.2 NVMe · PCIe 4.0', type: 'm2' },
  { cat: 'storage', id: 'p3plus-2', name: 'Crucial P3 Plus 2 TB', blurb: 'M.2 NVMe · PCIe 4.0 · budget', type: 'm2' },
  { cat: 'storage', id: '870evo-1', name: 'Samsung 870 EVO 1 TB', blurb: '2.5" SATA SSD', type: 'sata' },
  { cat: 'storage', id: 'barracuda-4', name: 'Seagate BarraCuda 4 TB', blurb: '3.5" SATA hard drive', type: 'sata' },
];

export const PART_BY_ID = new Map(CATALOG.map((p) => [p.id, p]));

export function partsIn<C extends Category>(cat: C): Extract<Part, { cat: C }>[] {
  return CATALOG.filter((p): p is Extract<Part, { cat: C }> => p.cat === cat);
}

/** Opens PCPartPicker's search for this part. */
export function pppSearch(name: string): string {
  return `https://pcpartpicker.com/search/?q=${encodeURIComponent(name)}`;
}
