import { h } from '../dom';

/**
 * Builds the 3D scene, or, when WebGL won't start, puts a short notice where the canvas was and
 * hands back a stand-in that ignores every call, so the panel, guides and quick fixes still work.
 */
export function sceneOr<T extends object>(canvas: HTMLCanvasElement, make: () => T): T {
  try {
    return make();
  } catch {
    canvas.replaceWith(
      h('div', { class: 'scene-off', role: 'note' },
        h('strong', {}, 'The 3D view needs WebGL'),
        h('span', {}, 'This browser couldn’t start it, but every guide still works from the panel and the guide buttons.'),
      ),
    );
    return new Proxy({} as T, { get: () => () => {} });
  }
}
