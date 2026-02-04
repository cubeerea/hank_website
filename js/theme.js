/**
 * Theme Script — FOUC Prevention & Smooth Transitions
 * This script runs synchronously in the <head> to prevent flash of unstyled content.
 * Transitions are enabled only after initial render to prevent "fade-in" on page load.
 */
(function() {
    'use strict';

    const theme = localStorage.getItem('theme');

    // Apply dark mode if explicitly set, or if system prefers dark and no preference saved
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    // Enable transitions after initial paint to prevent FOUC fade-in
    // Using requestAnimationFrame to ensure the initial render is complete
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableTransitions);
    } else {
        enableTransitions();
    }

    function enableTransitions() {
        // Wait for next frame after DOM is ready to ensure styles are applied
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.documentElement.classList.add('theme-ready');
            });
        });
    }
})();
