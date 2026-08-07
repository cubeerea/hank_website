/** Shared by all three entry points (main, paper, resume). */
export function initCursorAura(): void {
  const aura = document.getElementById('cursor-aura');
  if (!aura) return;

  // The aura repaints a full-viewport radial gradient, so coalesce moves
  // into one write per frame instead of one per mousemove event.
  let x = 0;
  let y = 0;
  let queued = false;

  window.addEventListener(
    'mousemove',
    (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        aura.style.setProperty('--x', `${x}px`);
        aura.style.setProperty('--y', `${y}px`);
      });
    },
    { passive: true },
  );
}
