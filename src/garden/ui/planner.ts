/**
 * Bed planner: pick plants for a raised bed, see them laid out square-foot
 * style, and check companions, spacing, sun, water and soil pH.
 */
import { BED_SIZES, checkPlan, planRows, suggestions, type PlanIssue } from '../data/plan';
import { PLANTS, PLANT_BY_ID, SUN_LABEL, TYPE_LABEL, squares, type Plant, type PlantType } from '../data/plants';
import { getState, setState } from '../store';
import { h, clear } from '../../shared/dom';
import { keepFocus } from '../../shared/focus';
import { icon, type IconName } from '../../shared/icons';
import { openModal } from '../../shared/modal';
import { openPlantGuide } from './plantGuide';
import { chip } from '../../shared/ui/choices';
import { must } from '../../shared/must';
import { resultAnnouncer } from '../../shared/announce';

const LEVEL_ICON: Record<PlanIssue['level'], IconName> = { error: 'bad', warn: 'alert', ok: 'ok' };
const BED_KEY = 'diy-garden:bed';

function loadBed(): string {
  try {
    const v = localStorage.getItem(BED_KEY);
    if (v && BED_SIZES.some((b) => b.id === v)) return v;
  } catch {
    /* ignore */
  }
  return '4x8';
}

function perLabel(p: Plant): string {
  const sq = squares(p);
  return sq.squares > 1 ? `1 plant per ${sq.squares} sq ft` : `${sq.perSquare} per sq ft`;
}

export function openPlanner(): void {
  let bedId = loadBed();
  let query = '';
  let type: PlantType | null = null;

  const list = h('div', { class: 'builder-list planner-list' });
  const side = h('aside', { class: 'builder-side' });
  const body = h('div', { class: 'modal-body builder-body' }, list, side);
  const input = h('input', { type: 'search', placeholder: 'Find a plant…', 'aria-label': 'Search plants', autocomplete: 'off' });
  const chips = h('div', { class: 'filter-row' });
  const options = h('div', { class: 'planner-options' });
  list.append(input, chips, options, h('p', { class: 'fine-print' }, 'Fruit trees are left out: they belong in the ground, not a bed. Find them in the plant guide.'));
  input.addEventListener('input', () => { query = input.value.trim().toLowerCase(); renderOptions(); });

  const plan = () => getState().plan;
  const setPlan = (p: string[]) => {
    setState({ plan: p });
    renderOptions();
    renderSide();
  };
  const add = (id: string) => setPlan([...plan(), id]);
  const remove = (id: string) => {
    const p = [...plan()];
    p.splice(p.lastIndexOf(id), 1);
    setPlan(p);
  };
  const removeAll = (id: string) => setPlan(plan().filter((x) => x !== id));

  const renderChips = () => keepFocus(chips, renderChipsNow);
  function renderChipsNow(): void {
    clear(chips);
    const mk = (label: string, t: PlantType | null) => chip(label, type === t, () => { type = t; renderChips(); renderOptions(); });
    chips.append(mk('Everything', null), ...(Object.keys(TYPE_LABEL) as PlantType[]).map((t) => mk(TYPE_LABEL[t], t)));
  }

  const renderOptions = () => keepFocus(options, renderOptionsNow);
  function renderOptionsNow(): void {
    const keep = options.scrollTop;
    clear(options);
    const inPlan = new Set(plan());
    const ps = PLANTS.filter((p) => p.life !== 'tree' && (!type || p.type === type) && (!query || `${p.name} ${p.latin}`.toLowerCase().includes(query)))
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const p of ps) {
      const n = plan().filter((id) => id === p.id).length;
      options.append(
        h('div', { class: `plan-opt t-${p.type}${inPlan.has(p.id) ? ' picked' : ''}` },
          h('button', { class: 'plan-opt-main', 'data-key': `add-${p.id}`, onClick: () => add(p.id), 'aria-label': `Add ${p.name}` },
            h('span', { class: 'opt-name' }, p.name),
            h('span', { class: 'muted small' }, `${perLabel(p)} · ${SUN_LABEL[p.sun]}`)),
          n ? h('button', { class: 'icon-btn small-btn', 'data-key': `less-${p.id}`, 'aria-label': `One less ${p.name}`, onClick: () => remove(p.id) }, icon('minus', 15)) : null,
          n ? h('span', { class: 'opt-tick' }, `×${n}`) : null,
          h('button', { class: 'icon-btn small-btn', 'data-key': `more-${p.id}`, 'aria-label': `Add ${p.name}`, onClick: () => add(p.id) }, icon('plus', 15))),
      );
    }
    options.scrollTop = keep;
  }

  const renderSide = () => keepFocus(side, renderSideNow);
  const sayResult = resultAnnouncer();
  function renderSideNow(): void {
    clear(side);
    const bed = must(BED_SIZES.find((b) => b.id === bedId), `bed size ${bedId}`);
    const total = bed.w * bed.l;
    const rows = planRows(plan());
    const used = rows.reduce((n, r) => n + r.squares, 0);
    const { issues, good } = checkPlan(rows, total);
    const checks = issues.filter((i) => i.level !== 'ok').length;
    sayResult(`${used} of ${total} square feet planted${checks ? `, ${checks} thing${checks > 1 ? 's' : ''} to check` : ''}`);

    const seg = h('div', { class: 'seg' }, ...BED_SIZES.map((b) => h('button', { class: b.id === bedId ? 'active' : '', onClick: () => {
      bedId = b.id;
      try { localStorage.setItem(BED_KEY, bedId); } catch { /* ignore */ }
      renderSide();
    } }, b.label)));

    // Square-foot grid, filled in plan order.
    const grid = h('div', { class: 'sqft', style: `--cols:${bed.l}` });
    const cells: HTMLElement[] = [];
    for (const r of rows) {
      for (let i = 0; i < r.squares; i++) {
        const sq = squares(r.plant);
        cells.push(h('button', { class: `sq t-${r.plant.type}${i ? ' cont' : ''}`, title: `${r.plant.name}: click to remove one`, 'aria-label': `Remove one ${r.plant.name}`, onClick: () => remove(r.plant.id) },
          i ? '' : h('span', {}, r.plant.name.split(' (')[0]), i || sq.squares > 1 ? '' : h('small', {}, `×${sq.perSquare}`)));
      }
    }
    for (let i = 0; i < Math.max(total, cells.length); i++) {
      const c = cells[i] ?? h('span', { class: 'sq empty' });
      if (i >= total) c.classList.add('over');
      grid.append(c);
    }

    side.append(
      h('p', { class: 'group-label' }, 'Bed size'), seg,
      h('div', { class: `meter${used > total ? ' over' : ''}` }, h('span', { style: `width:${Math.min(100, (used / total) * 100)}%` })),
      h('p', { class: 'muted small' }, `${used} of ${total} square feet planted${rows.length ? ' · click a square to remove it' : ''}`),
      grid,
    );

    if (!rows.length) {
      side.append(h('p', { class: 'muted' }, 'Add plants from the list. Each click plants one square foot (or one plant, for big ones like squash and tomatoes).'));
      return;
    }

    side.append(h('h4', { class: 'side-h' }, 'In the bed'),
      h('ul', { class: 'plan-rows' }, ...rows.map((r) => h('li', {},
        h('button', { class: 'plan-name', onClick: () => openPlantGuide(r.plant.id) }, r.plant.name),
        h('span', { class: 'muted small' }, `${r.plants} plant${r.plants > 1 ? 's' : ''} · ${r.squares} sq ft`),
        h('span', { class: 'stepper' },
          h('button', { class: 'icon-btn small-btn', 'aria-label': `One less ${r.plant.name}`, onClick: () => remove(r.plant.id) }, icon('minus', 14)),
          h('button', { class: 'icon-btn small-btn', 'aria-label': `One more ${r.plant.name}`, onClick: () => add(r.plant.id) }, icon('plus', 14)),
          h('button', { class: 'icon-btn small-btn danger', 'aria-label': `Remove all ${r.plant.name}`, title: 'Remove from the bed', onClick: () => removeAll(r.plant.id) }, icon('trash', 14)))))));

    side.append(h('h4', { class: 'side-h' }, 'Checks'), h('ul', { class: 'issues' }, ...issues.map((i) => h('li', { class: `lvl-${i.level}` }, icon(LEVEL_ICON[i.level], 16), h('span', {}, i.text)))));
    if (good.length) {
      side.append(h('h4', { class: 'side-h' }, 'Good companions here'),
        h('div', { class: 'plant-chips' }, ...good.map(([a, b]) => h('span', { class: 'link-chip good' }, `${a.name} + ${b.name}`))));
    }
    const sugg = suggestions(plan());
    if (sugg.length) {
      side.append(h('h4', { class: 'side-h' }, 'Would get on well here'),
        h('div', { class: 'plant-chips' }, ...sugg.map((p) => h('button', { class: 'link-chip', onClick: () => add(p.id) }, icon('plus', 13), p.name))));
    }
    side.append(h('div', { class: 'side-actions' },
      h('button', { class: 'ghost-btn danger', onClick: () => setPlan([]) }, icon('trash', 16), 'Clear the bed')));
  }

  const n = new Set(plan().filter((id) => PLANT_BY_ID.has(id))).size;
  openModal({ title: 'Bed planner', sub: n ? `${n} plants in your bed. Saved on this device.` : 'Plan a raised bed square by square and check which plants get along.', className: 'builder-modal', body });
  renderChips();
  renderOptions();
  renderSide();
}
