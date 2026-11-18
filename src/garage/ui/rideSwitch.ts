import { RIDES, RIDE_LABEL, type RideId } from '../data/rides';
import { getState, setState, subscribe } from '../store';
import { h } from '../../shared/dom';

/**
 * Car / Motorcycle / Bike: flies the camera to that vehicle and closes any open part.
 * Picking the vehicle already in view calls `home`, since no state changes to move the camera.
 */
export function mountRideSwitch(root: HTMLElement, home: () => void): void {
  const pick = (r: RideId) => {
    const { ride, selected } = getState();
    if (r === ride && !selected) home();
    else setState({ ride: r, selected: null, openGuide: null });
  };
  const btns = RIDES.map((r) => {
    const b = h('button', { 'aria-pressed': 'false', onClick: () => pick(r) }, RIDE_LABEL[r]);
    root.append(b);
    return [r, b] as const;
  });
  const sync = () => {
    const { ride } = getState();
    for (const [r, b] of btns) {
      b.classList.toggle('active', r === ride);
      b.setAttribute('aria-pressed', String(r === ride));
    }
  };
  subscribe((s, prev) => {
    if (s.ride !== prev.ride) sync();
  });
  sync();
}
