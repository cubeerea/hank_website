/** Shared zoom logic between the resume viewer (resume.ts) and the paper viewer (paper.ts). */

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3.0;
export const ZOOM_STEP = 0.25;

/** Column width available to a page: container width minus gutter, capped at `cap`. */
export function computeAvailableWidth(containerWidth: number, cap: number): number {
  const gutter = window.innerWidth <= 480 ? 16 : 48;
  return Math.min(containerWidth - gutter, cap);
}

export function updateZoomDisplay(
  display: HTMLElement,
  zoom: number,
  zoomInBtn: HTMLButtonElement,
  zoomOutBtn: HTMLButtonElement,
): void {
  display.textContent = `${Math.round(zoom * 100)}%`;
  zoomInBtn.disabled = zoom >= MAX_ZOOM;
  zoomOutBtn.disabled = zoom <= MIN_ZOOM;
}

/** Ignores modifier combos (e.g. Cmd/Ctrl+=) so this doesn't hijack browser zoom. */
export function bindZoomKeys(zoomIn: () => void, zoomOut: () => void): void {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomIn();
    } else if (e.key === '-') {
      e.preventDefault();
      zoomOut();
    }
  });
}
