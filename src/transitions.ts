/**
 * Theme Script — Smooth Transition Init
 * Adds theme-ready class after paint to enable CSS transitions without FOUC.
 */

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.add('theme-ready');
  });
});
