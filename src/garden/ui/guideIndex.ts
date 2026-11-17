import { AREAS, AREA_ORDER, type AreaId } from '../data/areas';
import { GUIDES, KIND_LABEL, type Guide, type GuideKind } from '../data/guides';
import { setState } from '../store';
import { h, clear } from '../../shared/dom';
import { openModal, closeModal } from '../../shared/modal';
import { guideChips } from './guideCard';

/** Every guide, searchable and filterable by kind. */
export function openGuideIndex(): void {
  let query = '';
  let kind: GuideKind | null = null;

  const input = h('input', { type: 'search', placeholder: 'Search: compost, hugelkultur, canning, aphids, pH…', 'aria-label': 'Search guides', autocomplete: 'off' });
  const results = h('div', { class: 'glossary-results' });
  const chips = h('div', { class: 'filter-row' });

  function renderChips(): void {
    clear(chips);
    const mk = (label: string, active: boolean, onClick: () => void) => h('button', { class: `chip-btn${active ? ' active' : ''}`, onClick }, label);
    chips.append(
      mk('Everything', kind === null, () => { kind = null; renderAll(); }),
      ...(Object.keys(KIND_LABEL) as GuideKind[]).map((k) => mk(KIND_LABEL[k], kind === k, () => { kind = k; renderAll(); })),
    );
  }

  function matches(g: Guide, q: string): boolean {
    if (!q) return true;
    const hay = [g.title, ...g.aliases, ...g.areas.map((a) => AREAS[a].label), ...(g.plants ?? []), g.summary].join(' ').toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }

  function renderResults(): void {
    clear(results);
    const q = query.trim().toLowerCase();
    const byArea = new Map<AreaId, Guide[]>();
    let count = 0;
    for (const g of GUIDES) {
      if (kind && g.kind !== kind) continue;
      if (!matches(g, q)) continue;
      byArea.set(g.areas[0], [...(byArea.get(g.areas[0]) ?? []), g]);
      count++;
    }
    if (!count) {
      results.append(h('p', { class: 'muted' }, 'No guides match. Try a broader word, or look the plant up in the plant guide.'));
      return;
    }
    for (const area of AREA_ORDER) {
      const list = byArea.get(area);
      if (!list) continue;
      results.append(h('h3', { class: 'section-label' }, AREAS[area].label));
      for (const g of list) {
        results.append(
          h('button', { class: `glossary-item diff-${g.difficulty}`, onClick: () => { closeModal(); setState({ selectedArea: g.areas[0], openGuide: g.id }); } },
            h('span', { class: 'repair-title' }, g.title), guideChips(g), h('span', { class: 'muted small' }, g.summary)),
        );
      }
    }
  }

  function renderAll(): void {
    renderChips();
    renderResults();
  }

  input.addEventListener('input', () => { query = input.value; renderResults(); });
  openModal({ title: 'Every guide', sub: `${GUIDES.length} guides: building beds, growing, fixing problems and preserving the harvest.`, className: 'glossary-modal', body: h('div', { class: 'modal-body' }, input, chips, results) });
  renderAll();
  input.focus();
}
