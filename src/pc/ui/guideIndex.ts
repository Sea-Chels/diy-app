import { PARTS, PART_ORDER, type PartId } from '../data/parts';
import { GUIDES, DIFFICULTY_LABEL, KIND_LABEL, appliesTo, type Guide, type GuideKind } from '../data/guides';
import { getState, setState } from '../store';
import { h, clear, fmtMinutes } from '../../shared/dom';
import { openModal, closeModal } from '../../shared/modal';

/** Every guide, searchable and filterable by kind. */
export function openGuideIndex(): void {
  let query = '';
  let kind: GuideKind | null = null;

  const input = h('input', { type: 'search', placeholder: 'Search: no post, bios, xmp, thermal paste, install windows…', 'aria-label': 'Search guides', autocomplete: 'off' });
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
    const hay = [g.title, ...g.aliases, ...g.parts.map((p) => PARTS[p].label), g.summary].join(' ').toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }

  function renderResults(): void {
    clear(results);
    const cooling = getState().setup.cooling;
    const q = query.trim().toLowerCase();
    const byPart = new Map<PartId, Guide[]>();
    let count = 0;
    for (const g of GUIDES) {
      if (!appliesTo(g, cooling)) continue;
      if (kind && g.kind !== kind) continue;
      if (!matches(g, q)) continue;
      byPart.set(g.parts[0], [...(byPart.get(g.parts[0]) ?? []), g]);
      count++;
    }
    if (!count) {
      results.append(h('p', { class: 'muted' }, 'No guides match. Try a broader word.'));
      return;
    }
    for (const part of PART_ORDER) {
      const list = byPart.get(part);
      if (!list) continue;
      results.append(h('h3', { class: 'section-label' }, PARTS[part].label));
      for (const g of list) {
        results.append(
          h('button', { class: `glossary-item diff-${g.difficulty}`, onClick: () => { closeModal(); setState({ selectedPart: g.parts[0], openGuide: g.id }); } },
            h('span', { class: 'repair-title' }, g.title),
            h('span', { class: 'chips' },
              h('span', { class: `chip kind kind-${g.kind}` }, KIND_LABEL[g.kind]),
              h('span', { class: 'chip diff' }, DIFFICULTY_LABEL[g.difficulty]),
              h('span', { class: 'chip' }, fmtMinutes(g.minutes))),
            h('span', { class: 'muted small' }, g.summary)),
        );
      }
    }
  }

  function renderAll(): void {
    renderChips();
    renderResults();
  }

  input.addEventListener('input', () => { query = input.value; renderResults(); });
  const count = GUIDES.filter((g) => appliesTo(g, getState().setup.cooling)).length;
  openModal({ title: 'Every guide', sub: `${count} guides: troubleshooting, replacing parts, BIOS and OS setup.`, className: 'glossary-modal', body: h('div', { class: 'modal-body' }, input, chips, results) });
  renderAll();
  input.focus();
}
