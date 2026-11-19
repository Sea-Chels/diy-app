const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const focusables = (root: ParentNode): HTMLElement[] => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];

/**
 * Runs a render that clears and rebuilds `root`, then puts keyboard focus back on the
 * matching control, which clearing would otherwise drop to <body>. Controls match by
 * `data-key` or `id` when they have one, otherwise by their position among `root`'s controls.
 */
export function keepFocus(root: HTMLElement, render: () => void): void {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !root.contains(active)) {
    render();
    return;
  }
  const at = focusables(root).indexOf(active);
  const key = active.dataset.key;
  const id = active.id;
  render();
  if (root.contains(active)) return;
  const next =
    (key && root.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)) ||
    (id && document.getElementById(id)) ||
    focusables(root)[at];
  next?.focus({ preventScroll: true });
}

/**
 * Focus for a side panel whose render toggles `.open`: opening moves focus to its heading,
 * closing hands focus back to whatever had it, and Escape inside the panel closes it.
 */
export function panelFocus(root: HTMLElement, close: () => void): (render: () => void) => void {
  let opener: HTMLElement | null = null;
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !e.defaultPrevented) {
      e.preventDefault();
      close();
    }
  });
  return (render) => {
    const was = root.classList.contains('open');
    const before = document.activeElement;
    const hadFocus = root.contains(before);
    keepFocus(root, render);
    const head = root.querySelector<HTMLElement>('h2');
    if (head) {
      head.id = `${root.id}-title`;
      head.tabIndex = -1;
    }
    const open = root.classList.contains('open');
    if (open && !was) {
      opener = before instanceof HTMLElement && before !== document.body && !hadFocus ? before : null;
      head?.focus({ preventScroll: true });
    } else if (!open && was && hadFocus) {
      const back = opener;
      opener = null;
      // After the rest of this store update, which may lift the inert the open sheet put on the opener.
      queueMicrotask(() => back?.isConnected && back.focus({ preventScroll: true }));
    }
  };
}
