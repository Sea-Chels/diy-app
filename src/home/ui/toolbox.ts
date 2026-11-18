import { CAT_LABEL, TOOLS, type ToolCat } from '../data/tools';
import { GUIDES } from '../data/guides';
import { getState, setState, subscribe } from '../store';
import { h, clear } from '../../shared/dom';
import { openModal, closeModal } from '../../shared/modal';
import { icon } from '../../shared/icons';
import { toggleOwned, toolCount } from './guideCard';

/** Every tool, what it's for, and which guides you're ready for with what you own. */
export function openToolbox(): void {
  const body = h('div', { class: 'modal-body toolbox' });
  const used = new Map<string, number>();
  for (const g of GUIDES) for (const t of g.tools) used.set(t, (used.get(t) ?? 0) + 1);

  function render(): void {
    clear(body);
    const owned = new Set(getState().owned);
    const ready = GUIDES.filter((g) => {
      const c = toolCount(g);
      return c.of > 0 && c.have === c.of;
    });
    body.append(
      h('div', { class: 'tool-stats' },
        h('span', {}, h('strong', {}, `${owned.size}`), ` of ${TOOLS.length} tools`),
        h('span', {}, h('strong', {}, `${ready.length}`), ` of ${GUIDES.length} guides ready to go`),
        h('button', { class: 'chip-btn', onClick: () => setState({ owned: [...new Set([...owned, ...TOOLS.filter((t) => t.starter).map((t) => t.id)])] }) }, 'I have the starter kit'),
        owned.size ? h('button', { class: 'chip-btn', onClick: () => setState({ owned: [] }) }, 'Clear') : null),
      h('p', { class: 'fine-print' }, 'Tick what you own. Guides show which tools you\'re missing. Saved in this browser.'),
    );
    for (const cat of Object.keys(CAT_LABEL) as ToolCat[]) {
      body.append(h('h3', { class: 'section-label' }, CAT_LABEL[cat]));
      const grid = h('div', { class: 'tool-grid' });
      for (const t of TOOLS.filter((x) => x.cat === cat)) {
        const has = owned.has(t.id);
        grid.append(h('button', { class: `tool-tile${has ? ' has' : ''}`, 'aria-pressed': String(has), onClick: () => toggleOwned(t.id) },
          h('span', { class: 'tool-name' }, icon(has ? 'boxChecked' : 'box', 16), t.name, t.starter && cat !== 'starter' ? h('span', { class: 'badge' }, 'Starter kit') : null),
          h('span', { class: 'muted small' }, t.use),
          h('span', { class: 'tool-meta' }, h('span', {}, t.cost), h('span', {}, `${used.get(t.id) ?? 0} guides`))));
      }
      body.append(grid);
    }
    if (ready.length) {
      body.append(h('h3', { class: 'section-label' }, 'You\'re ready for'),
        h('div', { class: 'panel-links' }, ...ready.map((g) => h('button', { class: 'link-chip', onClick: () => { closeModal(); setState({ selectedArea: g.areas[0], openGuide: g.id }); } }, g.title))));
    }
  }

  const off = subscribe((s, prev) => {
    if (s.owned !== prev.owned) render();
  });
  openModal({ title: 'Toolbox', sub: 'What each tool is for, and what to buy first.', className: 'toolbox-modal', body, onClose: off });
  render();
}
