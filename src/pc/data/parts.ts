/**
 * The clickable parts of the PC. The 3D rig must provide a hotspot, a beacon
 * and a camera view for every PartId listed here; the UI and guide catalog key
 * off these ids.
 */
export type PartId =
  | 'case'
  | 'power'
  | 'motherboard'
  | 'cpu'
  | 'cooler'
  | 'ram'
  | 'gpu'
  | 'm2'
  | 'storage'
  | 'psu'
  | 'fans'
  | 'cmos'
  | 'monitor';

/** Things that move out of the way so a part can be seen. */
export type LidId = 'glass' | 'cooler' | 'heatsink' | 'shroud';

export interface PartInfo {
  id: PartId;
  label: string;
  blurb: string;
  /** Parts whose guides are also shown when this one is selected. */
  related?: PartId[];
  /** Lids that open while this part is in focus. */
  opens?: LidId[];
}

export const PARTS: Record<PartId, PartInfo> = {
  case: { id: 'case', label: 'Case & side panel', blurb: 'Thumbscrews at the back hold the glass on. Dust filters live on the front, top and bottom.', related: ['fans'], opens: ['glass'] },
  power: { id: 'power', label: 'Power button & front I/O', blurb: 'Press it to boot. Its wires plug into a tiny header at the bottom edge of the motherboard.', related: ['psu', 'monitor'] },
  motherboard: { id: 'motherboard', label: 'Motherboard', blurb: 'Everything plugs into this. It decides which CPU, RAM and how many drives you can use.', related: ['cmos', 'cpu', 'ram', 'm2'], opens: ['glass'] },
  cpu: { id: 'cpu', label: 'CPU', blurb: 'The processor sits in the socket under the cooler, with a thin layer of thermal paste on top.', related: ['cooler', 'motherboard'], opens: ['glass', 'cooler'] },
  cooler: { id: 'cooler', label: 'CPU cooler', blurb: 'Pulls heat off the CPU. A tower of fins with a fan, an AIO pump and radiator, or a custom loop.', related: ['cpu', 'fans'], opens: ['glass'] },
  ram: { id: 'ram', label: 'Memory (RAM)', blurb: 'Sticks clip into the slots beside the CPU. Two sticks go in slots 2 and 4 on most boards.', related: ['motherboard'], opens: ['glass'] },
  gpu: { id: 'gpu', label: 'Graphics card', blurb: 'Plugs into the top long slot, screws to the back of the case and takes its own power cable.', related: ['psu', 'monitor'], opens: ['glass'] },
  m2: { id: 'm2', label: 'M.2 SSD', blurb: 'A gum-stick drive under a heatsink on the motherboard. Usually where the operating system lives.', related: ['storage', 'motherboard'], opens: ['glass', 'cooler', 'heatsink'] },
  storage: { id: 'storage', label: 'SATA drives', blurb: '2.5" SSDs and 3.5" hard drives sit in sleds and take a SATA data cable plus a SATA power cable.', related: ['m2', 'psu'], opens: ['glass', 'shroud'] },
  psu: { id: 'psu', label: 'Power supply', blurb: 'Turns wall power into what the parts need. It hides under the shroud at the bottom.', related: ['power', 'gpu'], opens: ['glass', 'shroud'] },
  fans: { id: 'fans', label: 'Case fans', blurb: 'Front fans pull cool air in, rear and top fans push hot air out.', related: ['case', 'cooler'] },
  cmos: { id: 'cmos', label: 'CMOS battery', blurb: 'A coin cell that keeps BIOS settings and the clock. Pulling it resets the BIOS.', related: ['motherboard', 'monitor'], opens: ['glass'] },
  monitor: { id: 'monitor', label: 'Monitor, BIOS & OS', blurb: 'Where you watch it boot, enter the BIOS and install an operating system.', related: ['power', 'gpu'] },
};

/** Order parts are listed in the guide index. */
export const PART_ORDER: PartId[] = ['power', 'monitor', 'cpu', 'cooler', 'ram', 'gpu', 'motherboard', 'm2', 'storage', 'psu', 'fans', 'cmos', 'case'];
