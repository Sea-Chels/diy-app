import { FILL_LABEL, HYDRO_LABEL, SEASON_LABEL, type Setup } from '../data/setup';
import { getState, select, setSetup, subscribe } from '../store';
import { h } from '../../shared/dom';
import { segControl } from '../../shared/ui/choices';
import { sceneMenu } from '../../shared/ui/sceneMenu';

/** Floating "Your garden" menu: season, how the cutaway bed is filled, and the hydro system. */
export function mountGardenMenu(root: HTMLElement): void {
  const { toggle, card } = sceneMenu(root, { id: 'garden-card', icon: 'sliders', label: 'Your garden', title: 'Garden setup' });

  const season = segControl('Season', SEASON_LABEL, (v) => setSetup({ season: v }));
  const fill = segControl('Raised bed fill', FILL_LABEL, (v) => { setSetup({ fill: v }); select('bed'); });
  const hydro = segControl('Hydroponics', HYDRO_LABEL, (v) => { setSetup({ hydro: v }); select('hydro'); });

  card.append(
    h('p', { class: 'paint-label' }, 'Season'), season.el,
    h('p', { class: 'paint-label' }, 'Raised bed fill'), fill.el,
    h('p', { class: 'paint-label' }, 'Hydroponics'), hydro.el,
  );

  const DOT: Record<Setup['season'], string> = { spring: 'var(--lime)', summer: 'var(--green)', fall: 'var(--ochre)' };
  function sync(): void {
    const s = getState().setup;
    season.sync(s.season);
    fill.sync(s.fill);
    hydro.sync(s.hydro);
    toggle.style.setProperty('--c', DOT[s.season]);
  }

  subscribe((s, prev) => {
    if (s.setup !== prev.setup) sync();
  });
  sync();
}
