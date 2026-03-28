/**
 * Theme Script — FOUC Prevention & Smooth Transitions
 * Runs synchronously in <head> to prevent flash of unstyled content.
 * Default is dark mode. Light mode is toggled via the "light" class on <html>.
 */

const theme = localStorage.getItem('theme');

if (
  theme === 'light' ||
  (!theme && window.matchMedia('(prefers-color-scheme: light)').matches)
) {
  document.documentElement.classList.add('light');
}

function enableTransitions(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.add('theme-ready');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', enableTransitions);
} else {
  enableTransitions();
}
