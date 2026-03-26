/**
 * Theme Script — FOUC Prevention & Smooth Transitions
 * Runs synchronously in <head> to prevent flash of unstyled content.
 * Default is dark mode. Light mode is toggled via the "light" class on <html>.
 */
(function () {
    'use strict';

    const theme = localStorage.getItem('theme');

    // Apply light mode if explicitly set, or if system prefers light and no preference saved
    if (theme === 'light' || (!theme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
        document.documentElement.classList.add('light');
    }

    // Enable transitions after initial paint to prevent FOUC fade-in
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableTransitions);
    } else {
        enableTransitions();
    }

    function enableTransitions() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.documentElement.classList.add('theme-ready');
            });
        });
    }
})();
