import { DIFFICULTY_LABEL, type Guide } from '../data/guides';
import { rideOf } from '../data/parts';
import { RIDE_SEARCH } from '../data/rides';
import { getState, hasVehicle, setState, vehicleLabel } from '../store';
import { h } from '../../shared/dom';
import { fmtMinutes } from '../../shared/format';
import * as card from '../../shared/ui/guideCard';

export const guideChips = (g: Guide) =>
  h('span', { class: 'chips' }, h('span', { class: 'chip diff' }, DIFFICULTY_LABEL[g.difficulty]), h('span', { class: 'chip' }, fmtMinutes(g.minutes)));

export function guideCard(g: Guide, open: boolean): HTMLElement {
  return card.guideCard(g, {
    open,
    chips: guideChips(g),
    onToggle: () => setState({ openGuide: open ? null : g.id }),
    body: () => {
      const v = getState().vehicle;
      // The year, make and model describe the car; motorcycle and bike guides search generically.
      const car = rideOf(g.parts[0]) === 'car';
      const known = car && hasVehicle(v);
      return [
        card.summary(g),
        card.note('savings', 'savings', g.savings),
        card.videoButton(`${known ? vehicleLabel(v) : RIDE_SEARCH[rideOf(g.parts[0])]} ${g.query}`, known ? `Videos for your ${vehicleLabel(v)}` : undefined),
        car && !known && h('p', { class: 'hint-text' }, 'Pick your year, make and model above to get videos for your exact car.'),
        card.cautions(g),
        card.toolsAndSupplies(g, 'Parts & supplies'),
        ...card.steps(g),
      ];
    },
  });
}
