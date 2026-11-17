/** Ties the parts picker to guides and the monitor: names for video searches and the BIOS screen. */
import { PART_BY_ID, type Category } from '../data/catalog';
import type { Build } from '../data/compat';
import type { PartId } from '../data/parts';
import { DEFAULT_SPECS, type Specs } from '../scene/screen';

export function pickedName(build: Build, cat: Category): string | null {
  const id = cat === 'storage' ? build.storage[0] : build[cat];
  return id ? PART_BY_ID.get(id)?.name ?? null : null;
}

/** "Corsair Vengeance 32 GB (2×16) DDR5-6000 CL30" → "32 GB DDR5-6000" */
function ramShort(name: string): string {
  const gb = name.match(/(\d+)\s*GB/);
  const kind = name.match(/DDR\d-\d+/);
  return gb && kind ? `${gb[1]} GB ${kind[0]}` : name;
}

export function specsFor(build: Build): Specs {
  const ram = pickedName(build, 'ram');
  return {
    cpu: pickedName(build, 'cpu') ?? DEFAULT_SPECS.cpu,
    ram: ram ? ramShort(ram) : DEFAULT_SPECS.ram,
    gpu: pickedName(build, 'gpu') ?? DEFAULT_SPECS.gpu,
    drive: pickedName(build, 'storage') ?? DEFAULT_SPECS.drive,
  };
}

/** Which picker category a 3D part belongs to, for the "browse on PCPartPicker" link. */
export const PART_CATEGORY: Partial<Record<PartId, Category>> = {
  cpu: 'cpu',
  cooler: 'cooler',
  ram: 'ram',
  gpu: 'gpu',
  motherboard: 'board',
  cmos: 'board',
  m2: 'storage',
  storage: 'storage',
  psu: 'psu',
  case: 'case',
  fans: 'case',
};
