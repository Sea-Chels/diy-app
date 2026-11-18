import { AREAS } from '../data/areas';
import { guidesForPlant } from '../data/guides';
import { LIFE_LABEL, PLANTS, PLANT_BY_ID, SUN_LABEL, TYPE_LABEL, WATER_LABEL, plantName, type Plant, type PlantType } from '../data/plants';
import { getState, select, setState } from '../store';
import { h, clear } from '../../shared/dom';
import { keepFocus } from '../../shared/focus';
import { openModal, closeModal } from '../../shared/modal';
import { searchUrl } from '../../shared/youtube';
import { icon } from '../../shared/icons';
import { chip } from '../../shared/ui/choices';

type Filter = PlantType | 'unusual' | null;

/** Plant care cards: search, filter, then open one for the full card. */
export function openPlantGuide(startAt?: string): void {
  let query = '';
  let filter: Filter = null;
  let current: string | null = startAt && PLANT_BY_ID.has(startAt) ? startAt : null;
  let listScroll = 0;

  const body = h('div', { class: 'modal-body plant-body' });
  const input = h('input', { type: 'search', placeholder: 'Search: pawpaw, goji, shade, acid soil, zone 4…', 'aria-label': 'Search plants', autocomplete: 'off' });
  const chips = h('div', { class: 'filter-row' });
  const grid = h('div', { class: 'plant-grid' });
  input.addEventListener('input', () => { query = input.value; renderGrid(); });

  const renderChips = () => keepFocus(chips, renderChipsNow);
  function renderChipsNow(): void {
    clear(chips);
    const mk = (label: string, f: Filter) => chip(label, filter === f, () => { filter = f; renderChips(); renderGrid(); });
    chips.append(mk('Everything', null), ...(Object.keys(TYPE_LABEL) as PlantType[]).map((t) => mk(TYPE_LABEL[t], t)), mk('Unusual & exotic', 'unusual'));
  }

  function matches(p: Plant, q: string): boolean {
    if (filter === 'unusual' ? !p.unusual : filter && p.type !== filter) return false;
    if (!q) return true;
    const zones = p.zones ? `zone ${p.zones[0]} zone ${p.zones[1]}` : '';
    const hay = [p.name, p.latin, TYPE_LABEL[p.type], LIFE_LABEL[p.life], SUN_LABEL[p.sun], WATER_LABEL[p.water], p.ph ? 'acid soil ph' : '', p.note ?? '', zones, ...p.problems].join(' ').toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }

  function renderGrid(): void {
    clear(grid);
    const q = query.trim().toLowerCase();
    const list = PLANTS.filter((p) => matches(p, q)).sort((a, b) => a.name.localeCompare(b.name));
    if (!list.length) {
      grid.append(h('p', { class: 'muted' }, 'No plants match. Try a broader word.'));
      return;
    }
    for (const p of list) {
      grid.append(
        h('button', { class: `plant-tile t-${p.type}`, 'data-key': p.id, onClick: () => { listScroll = body.scrollTop; show(p.id); } },
          h('span', { class: 'plant-name' }, p.name, p.unusual ? h('span', { class: 'badge' }, 'Unusual') : null),
          h('span', { class: 'latin' }, p.latin),
          h('span', { class: 'chips' }, h('span', { class: 'chip' }, LIFE_LABEL[p.life]), h('span', { class: 'chip' }, SUN_LABEL[p.sun]))),
      );
    }
  }

  function showList(): void {
    const from = current;
    const hadFocus = body.contains(document.activeElement);
    current = null;
    clear(body);
    body.append(input, chips, grid);
    renderChips();
    renderGrid();
    body.scrollTop = listScroll;
    if (hadFocus && from) grid.querySelector<HTMLElement>(`[data-key="${from}"]`)?.focus({ preventScroll: true });
  }

  function relChips(ids: string[], cls: string): HTMLElement {
    if (!ids.length) return h('p', { class: 'muted small' }, 'None in particular.');
    return h('div', { class: 'plant-chips' }, ...ids.map((id) => PLANT_BY_ID.has(id)
      ? h('button', { class: `rel-chip ${cls}`, onClick: () => show(id) }, plantName(id))
      : h('span', { class: `rel-chip ${cls}` }, plantName(id))));
  }

  function show(id: string): void {
    const p = PLANT_BY_ID.get(id)!;
    current = id;
    const hadFocus = body.contains(document.activeElement);
    clear(body);
    const facts = [LIFE_LABEL[p.life], SUN_LABEL[p.sun], WATER_LABEL[p.water], p.zones ? `Zones ${p.zones[0]}–${p.zones[1]}` : null, `${p.spacing} in apart`, p.height, p.ph ? `pH ${p.ph}` : null];
    const guides = guidesForPlant(id);
    const inPlan = getState().plan.includes(id);
    const addBtn = h('button', { class: 'ghost-btn', disabled: inPlan, onClick: () => {
      setState({ plan: [...getState().plan, id] });
      addBtn.textContent = 'In your bed plan';
      addBtn.setAttribute('disabled', '');
    } }, icon('list', 16), inPlan ? 'In your bed plan' : 'Add to bed planner');

    body.append(
      h('button', { class: 'back-link', onClick: showList }, icon('back', 15), 'All plants'),
      h('div', { class: `plant-detail t-${p.type}` },
        h('div', { class: 'plant-title' },
          h('h3', {}, p.name, p.unusual ? h('span', { class: 'badge' }, 'Unusual') : null),
          h('p', { class: 'latin' }, p.latin, ' · ', TYPE_LABEL[p.type])),
        h('div', { class: 'chips' }, ...facts.filter(Boolean).map((f) => h('span', { class: 'chip' }, f!))),
        p.note ? h('p', { class: 'summary' }, p.note) : null,
        h('div', { class: 'plant-actions' },
          h('a', { class: 'primary-btn', href: searchUrl(`how to grow ${p.name} ${p.latin.split(' /')[0]}`), target: '_blank', rel: 'noopener noreferrer' }, icon('play', 16), 'Growing videos', icon('external', 15)),
          p.area ? h('button', { class: 'ghost-btn', onClick: () => { closeModal(); select(p.area!); } }, icon('click', 16), `Show in garden: ${AREAS[p.area].label}`) : null,
          addBtn),
        h('div', { class: 'two-col plant-cols' },
          h('div', {}, h('h4', {}, 'Planting'), h('p', {}, p.sow), h('p', { class: 'muted small' }, `First harvest: ${p.days}`)),
          h('div', {}, h('h4', {}, 'Harvest'), h('p', {}, p.harvest))),
        h('h4', {}, 'Care'), h('ul', { class: 'care' }, ...p.care.map((c) => h('li', {}, c))),
        h('h4', {}, 'Watch for'), h('ul', { class: 'problems' }, ...p.problems.map((c) => h('li', {}, icon('alert', 14), h('span', {}, c)))),
        h('div', { class: 'two-col' },
          h('div', {}, h('h4', {}, 'Good companions'), relChips(p.friends, 'good')),
          h('div', {}, h('h4', {}, 'Keep apart'), relChips(p.avoid, 'bad'))),
        guides.length ? h('h4', {}, 'Guides') : null,
        guides.length ? h('div', { class: 'plant-chips' }, ...guides.map((g) =>
          h('button', { class: 'link-chip', onClick: () => { closeModal(); select(g.spots[0], g.id); } }, icon('book', 13), g.title))) : null,
      ),
    );
    body.scrollTop = 0;
    if (hadFocus) body.querySelector<HTMLElement>('.back-link')?.focus({ preventScroll: true });
  }

  const unusual = PLANTS.filter((p) => p.unusual).length;
  openModal({ title: 'Plant guide', sub: `${PLANTS.length} plants, from tomatoes to ${unusual} unusual ones like pawpaw, goji and marshmallow.`, className: 'glossary-modal plant-modal', body });
  if (current) show(current);
  else {
    showList();
    input.focus();
  }
}
