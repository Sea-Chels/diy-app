/**
 * Bed planner checks: square-foot space, companion pairs and the things that
 * don't share a bed well (sun, water, soil pH, permanence).
 */
import { PLANTS, PLANT_BY_ID, relation, squares, type Plant } from './plants';

export interface BedSize { id: string; label: string; w: number; l: number }
export const BED_SIZES: BedSize[] = [
  { id: '4x4', label: '4 × 4 ft', w: 4, l: 4 },
  { id: '3x6', label: '3 × 6 ft', w: 3, l: 6 },
  { id: '4x8', label: '4 × 8 ft', w: 4, l: 8 },
];

export interface PlanRow { plant: Plant; count: number; squares: number; plants: number }
export interface PlanIssue { level: 'error' | 'warn' | 'ok'; text: string }

/** Plan ids repeat: each repeat is one more square (small plants) or one more plant (big ones). */
export function planRows(plan: string[]): PlanRow[] {
  const counts = new Map<string, number>();
  for (const id of plan) if (PLANT_BY_ID.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, count]) => {
    const plant = PLANT_BY_ID.get(id)!;
    const sq = squares(plant);
    return { plant, count, squares: count * sq.squares, plants: count * sq.perSquare };
  });
}

const DEFAULT_PH: [number, number] = [6.0, 7.0];
function phRange(p: Plant): [number, number] {
  const m = p.ph?.match(/([\d.]+)\D+([\d.]+)/);
  return m ? [Number(m[1]), Number(m[2])] : DEFAULT_PH;
}

const list = (ps: Plant[]) => {
  const names = ps.map((p) => p.name);
  return names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

export function checkPlan(rows: PlanRow[], bedSquares: number): { issues: PlanIssue[]; good: [Plant, Plant][]; bad: [Plant, Plant][] } {
  const issues: PlanIssue[] = [];
  const ps = rows.map((r) => r.plant);
  const good: [Plant, Plant][] = [];
  const bad: [Plant, Plant][] = [];
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const r = relation(ps[i].id, ps[j].id);
      if (r === 'friend') good.push([ps[i], ps[j]]);
      else if (r === 'avoid') bad.push([ps[i], ps[j]]);
    }
  }

  const used = rows.reduce((n, r) => n + r.squares, 0);
  if (used > bedSquares) issues.push({ level: 'error', text: `That needs ${used} square feet but the bed has ${bedSquares}. Remove some, or grow vines up a trellis.` });

  const permanent = ps.filter((p) => p.life === 'tree' || p.life === 'shrub');
  if (permanent.length) {
    const many = permanent.length > 1;
    const what = many ? 'shrubs or trees and need' : `a ${permanent[0].life} and needs`;
    issues.push({ level: 'warn', text: `${list(permanent)} grow${many ? '' : 's'} into ${what} the ground or a big pot of ${many ? 'their' : 'its'} own, not a vegetable bed.` });
  }
  const vines = ps.filter((p) => p.life === 'vine');
  if (vines.length) issues.push({ level: 'warn', text: `${list(vines)} ${vines.length > 1 ? 'are' : 'is a'} perennial vine${vines.length > 1 ? 's' : ''}: give ${vines.length > 1 ? 'them' : 'it'} a permanent trellis or arbor.` });
  const perennials = ps.filter((p) => p.life === 'perennial');
  if (perennials.length && ps.some((p) => p.life === 'annual')) issues.push({ level: 'ok', text: `${list(perennials)} come${perennials.length > 1 ? '' : 's'} back every year: plant ${perennials.length > 1 ? 'them' : 'it'} at one end so you can dig and replant the rest.` });

  const shade = ps.filter((p) => p.sun === 'shade');
  const full = ps.filter((p) => p.sun === 'full');
  if (shade.length && full.length) issues.push({ level: 'warn', text: `${list(shade)} want${shade.length > 1 ? '' : 's'} shade while ${list(full.slice(0, 3))}${full.length > 3 ? ' and others' : ''} need full sun. Tuck shade lovers on the north side under taller plants, or use separate spots.` });
  else if (ps.some((p) => p.sun === 'part') && full.length) issues.push({ level: 'ok', text: 'Put part-sun plants on the north side, in the shadow of the tall ones.' });

  const dry = ps.filter((p) => p.water === 'low');
  const wet = ps.filter((p) => p.water === 'high');
  if (dry.length && wet.length) issues.push({ level: 'warn', text: `${list(dry)} like${dry.length > 1 ? '' : 's'} it dry and ${list(wet)} like${wet.length > 1 ? '' : 's'} it wet. Give them opposite ends of the bed, or separate beds.` });

  // Soil pH: report each odd one out once, against everything it clashes with.
  const clashes = new Map(ps.map((p) => [p, ps.filter((q) => q !== p && (phRange(p)[1] < phRange(q)[0] || phRange(q)[1] < phRange(p)[0]))]));
  const reported = new Set<Plant>();
  for (const [p, others] of [...clashes].sort((x, y) => y[1].length - x[1].length)) {
    const left = others.filter((q) => !reported.has(q));
    if (!left.length || !p.ph) continue;
    reported.add(p);
    const names = left.length > 3 ? `${list(left.slice(0, 3))} and ${left.length - 3} more` : list(left);
    issues.push({ level: 'warn', text: `${p.name} wants soil pH ${p.ph}, which doesn't suit ${names}. Give it its own bed or pot.` });
  }

  for (const [a, b] of bad) issues.push({ level: 'error', text: `${a.name} and ${b.name} are poor neighbours. Keep them apart.` });
  if (rows.length && !issues.some((i) => i.level !== 'ok')) issues.unshift({ level: 'ok', text: 'No clashes. This bed works.' });
  return { issues, good, bad };
}

/** Plants that get on with what's planned and clash with none of it. */
export function suggestions(plan: string[], max = 8): Plant[] {
  const ids = new Set(plan);
  if (!ids.size) return [];
  return PLANTS.filter((p) => !ids.has(p.id) && p.life !== 'tree' && p.life !== 'shrub' && p.life !== 'vine')
    .map((p) => {
      let score = 0;
      for (const id of ids) {
        const r = relation(p.id, id);
        if (r === 'avoid') return { p, score: -1 };
        if (r === 'friend') score++;
      }
      return { p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .slice(0, max)
    .map((s) => s.p);
}
