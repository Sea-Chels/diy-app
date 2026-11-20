/**
 * Parts picker: choose a part per category, see what clashes, then push the
 * build into the 3D rig. Every part links out to PCPartPicker for prices.
 */
import { CATEGORIES, CATEGORY_LABEL, PART_BY_ID, partsIn, pppSearch, type Category, type Part } from '../data/catalog';
import { checkBuild, conflictsFor, estimateWatts, resolve, suggestedPsu, type Build, type Issue } from '../data/compat';
import type { Setup } from '../data/setup';
import { getState, select, setSetup, setState } from '../store';
import { h, clear } from '../../shared/dom';
import { keepFocus } from '../../shared/focus';
import { icon, type IconName } from '../../shared/icons';
import { closeModal, openModal } from '../../shared/modal';
import { resultAnnouncer } from '../../shared/announce';

const LEVEL_ICON: Record<Issue['level'], IconName> = { error: 'bad', warn: 'alert', ok: 'ok' };

export function openBuilder(focus?: Category): void {
  const first = () => CATEGORIES.find((c) => (c === 'storage' ? !getState().build.storage.length : !getState().build[c])) ?? 'cpu';
  let active: Category | null = focus ?? first();

  const list = h('div', { class: 'builder-list' });
  const side = h('aside', { class: 'builder-side' });
  const body = h('div', { class: 'modal-body builder-body' }, list, side);

  const build = () => getState().build;
  const setBuild = (b: Build) => {
    setState({ build: b });
    render();
  };

  function pick(part: Part): void {
    const b = build();
    if (part.cat === 'storage') {
      const has = b.storage.includes(part.id);
      setBuild({ ...b, storage: has ? b.storage.filter((id) => id !== part.id) : [...b.storage, part.id] });
      return;
    }
    const next = { ...b, [part.cat]: b[part.cat] === part.id ? undefined : part.id };
    // Move on to the next empty category.
    if (next[part.cat]) active = CATEGORIES.find((c) => c !== part.cat && (c === 'storage' ? !next.storage.length : !next[c])) ?? null;
    setBuild(next);
  }

  function renderList(issues: Issue[]): void {
    const keep = list.scrollTop;
    clear(list);
    const b = build();
    for (const cat of CATEGORIES) {
      const chosen = cat === 'storage' ? b.storage.map((id) => PART_BY_ID.get(id)?.name).filter(Boolean).join(', ') : b[cat] ? PART_BY_ID.get(b[cat])?.name : '';
      const bad = issues.some((i) => i.level === 'error' && i.cats.includes(cat));
      const open = active === cat;
      const row = h('section', { class: `cat-row${bad ? ' bad' : ''}${open ? ' open' : ''}${chosen ? ' chosen' : ''}` });
      row.append(
        h('button', { class: 'cat-head', 'aria-expanded': String(open), onClick: () => { active = open ? null : cat; render(); } },
          h('span', { class: 'cat-label' }, CATEGORY_LABEL[cat]),
          h('span', { class: 'cat-pick' }, chosen || h('span', { class: 'muted' }, `Choose ${cat === 'storage' ? 'drives' : 'one'}`)),
          bad ? icon('bad', 16) : chosen ? icon('check', 16) : null),
      );
      if (open) {
        const grid = h('div', { class: 'opt-grid' });
        for (const p of partsIn(cat)) {
          const picked = cat === 'storage' ? b.storage.includes(p.id) : b[cat] === p.id;
          const clash = picked ? [] : conflictsFor(b, p);
          grid.append(
            h('div', { class: `opt${picked ? ' picked' : ''}${clash.length ? ' clash' : ''}` },
              h('button', { class: 'opt-main', onClick: () => pick(p), 'aria-pressed': String(picked) },
                h('span', { class: 'opt-name' }, p.name),
                h('span', { class: 'muted small' }, p.blurb),
                clash.length ? h('span', { class: 'opt-clash' }, icon('bad', 14), h('span', {}, clash[0].text)) : null,
                picked ? h('span', { class: 'opt-tick' }, icon('check', 14), 'Picked') : null),
              h('a', { class: 'opt-ppp hit-pad', href: pppSearch(p.name), target: '_blank', rel: 'noopener noreferrer', title: 'Prices and specs on PCPartPicker' }, 'PCPartPicker', icon('external', 12))),
          );
        }
        row.append(grid);
      }
      list.append(row);
    }
    list.scrollTop = keep;
  }

  function renderSide(issues: Issue[]): void {
    clear(side);
    const b = build();
    const p = resolve(b);
    const errors = issues.filter((i) => i.level === 'error').length;
    const verdict = errors ? `${errors} problem${errors > 1 ? 's' : ''} to fix` : 'No clashes found';
    const watts = p.cpu || p.gpu ? `Estimated peak draw ~${estimateWatts(p)} W · suggest ${suggestedPsu(p)} W or more` : '';
    side.append(
      h('div', { class: `verdict ${errors ? 'bad' : 'good'}` },
        icon(errors ? 'bad' : 'ok', 22),
        h('div', {},
          h('strong', {}, verdict),
          h('span', { class: 'muted small' }, errors ? 'Red parts don’t work together.' : 'Double-check exact sizes on PCPartPicker.'))),
    );
    if (watts) side.append(h('p', { class: 'watts' }, icon('zap', 16), h('span', {}, watts)));
    sayResult(watts ? `${verdict}. ${watts}` : verdict);
    side.append(h('ul', { class: 'issues' }, ...issues.map((i) => h('li', { class: `lvl-${i.level}` }, icon(LEVEL_ICON[i.level], 15), h('span', {}, i.text)))));

    const patch = setupFromBuild(b);
    const show = h('button', { class: 'primary-btn', disabled: !patch, onClick: () => { if (!patch) return; setSetup(patch); select(null); closeModal(); } }, icon('cpu', 16), 'Show this build in 3D');
    const copyLabel = h('span', {}, 'Copy parts list');
    const copy = h('button', { class: 'ghost-btn', onClick: () => {
      const text = CATEGORIES.flatMap((c) => (c === 'storage' ? b.storage : b[c] ? [b[c]] : []).map((id) => `${CATEGORY_LABEL[c]}: ${PART_BY_ID.get(id)?.name}`)).join('\n');
      navigator.clipboard?.writeText(text || 'Empty build').then(() => {
        copyLabel.textContent = 'Copied';
        setTimeout(() => (copyLabel.textContent = 'Copy parts list'), 1600);
      }, () => {});
    } }, icon('copy', 15), copyLabel);
    side.append(
      h('div', { class: 'side-actions' },
        show,
        copy,
        h('a', { class: 'ghost-btn', href: 'https://pcpartpicker.com/list/', target: '_blank', rel: 'noopener noreferrer' }, 'Build it on PCPartPicker', icon('external', 14)),
        h('button', { class: 'ghost-btn danger', onClick: () => { active = 'cpu'; setBuild({ storage: [] }); } }, icon('trash', 15), 'Clear')),
      h('p', { class: 'fine-print' }, 'A curated starter list with rounded specs. Lengths and clearances vary by model, so confirm the exact part on PCPartPicker or the maker’s page before buying.'),
    );
  }

  const render = () => keepFocus(body, renderNow);
  const sayResult = resultAnnouncer();
  function renderNow(): void {
    const issues = checkBuild(build());
    renderList(issues);
    renderSide(issues);
  }

  openModal({ title: 'Parts picker', sub: 'Pick parts, check they fit together, then compare prices on PCPartPicker.', className: 'builder-modal', body });
  render();
}

/** What the 3D rig should show for a build, or null if nothing visual is picked yet. */
export function setupFromBuild(b: Build): Partial<Setup> | null {
  const p = resolve(b);
  const patch: Partial<Setup> = {};
  if (p.case) patch.size = p.case.size;
  if (p.cooler) patch.cooling = p.cooler.type;
  if (p.gpu) patch.gpu = p.gpu.watts >= 290 || p.gpu.length >= 310 ? 'triple' : 'dual';
  else if (p.cpu?.igpu) patch.gpu = 'none';
  if (p.ram?.rgb && getState().setup.rgb === 'off') patch.rgb = 'rainbow';
  return Object.keys(patch).length ? patch : null;
}
