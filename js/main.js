/**
 * Portfolio Site — Main JavaScript
 * Handles: expand/collapse cards, scroll tracking, section visibility analytics, and template variables.
 */

(function () {
    'use strict';

    // Central source for 'Last updated' timestamp
    const datetime = 'January 25, 2026';

    /**
     * Automatically replaces placeholders like ${datetime} in the DOM.
     */
    function applyTemplates() {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue.includes('${datetime}')) {
                node.nodeValue = node.nodeValue.replace(/\$\{datetime\}/g, datetime);
            }
        }

        // Also update machine-readable datetime if it exists
        const timeEl = document.querySelector('.hero__timestamp time');
        if (timeEl) {
            timeEl.setAttribute('datetime', '2026-01-25');
        }
    }

    // ========================================
    // Expand/Collapse Experience Cards
    // ========================================

    function initExperienceCards() {
        const cards = document.querySelectorAll('.experience-card');

        cards.forEach(card => {
            const header = card.querySelector('.experience-card__header');
            if (!header) return;

            header.addEventListener('click', () => {
                const isExpanded = card.dataset.expanded === 'true';
                const newState = !isExpanded;

                card.dataset.expanded = newState;
                header.setAttribute('aria-expanded', newState);

                if (newState) {
                    const title = card.querySelector('.experience-card__title')?.textContent || 'Unknown';
                    trackEvent('experience_expanded', { title });
                }
            });

            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
                }
            });
        });
    }

    // ========================================
    // Lightweight Analytics
    // ========================================

    const analytics = {
        sessionStart: Date.now(),
        maxScrollDepth: 0,
        sectionsViewed: new Set(),
        events: []
    };

    function trackEvent(eventName, data = {}) {
        const event = {
            name: eventName,
            timestamp: Date.now() - analytics.sessionStart,
            ...data
        };
        analytics.events.push(event);

        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('[Analytics]', eventName, data);
        }

        if (window.ANALYTICS_ENDPOINT) {
            sendAnalytics(event);
        }
    }

    function sendAnalytics(event) {
        if (navigator.sendBeacon && window.ANALYTICS_ENDPOINT) {
            navigator.sendBeacon(window.ANALYTICS_ENDPOINT, JSON.stringify(event));
        }
    }

    // ========================================
    // Scroll & Section Tracking
    // ========================================

    let throttledScrollHandler;

    function initScrollTracking() {
        throttledScrollHandler = throttle(() => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollHeight <= 0) return;

            const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
            const milestone = Math.floor(scrollPercent / 25) * 25;

            if (milestone > analytics.maxScrollDepth) {
                analytics.maxScrollDepth = milestone;
                trackEvent('scroll_depth', { depth: milestone });
            }
        }, 250);

        window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    }

    function initSectionTracking() {
        const sections = document.querySelectorAll('.section[id]');
        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    if (!analytics.sectionsViewed.has(sectionId)) {
                        analytics.sectionsViewed.add(sectionId);
                        trackEvent('section_viewed', { section: sectionId });
                    }
                }
            });
        }, { threshold: 0.5 });

        sections.forEach(section => observer.observe(section));
    }

    function initTimeTracking() {
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - analytics.sessionStart) / 1000);
            trackEvent('session_end', {
                duration: timeSpent,
                maxScrollDepth: analytics.maxScrollDepth,
                sectionsViewed: Array.from(analytics.sectionsViewed)
            });
        });

        const milestones = [30, 60, 120, 300];
        milestones.forEach(seconds => {
            setTimeout(() => {
                trackEvent('time_milestone', { seconds });
            }, seconds * 1000);
        });
    }

    // ========================================
    // Utilities
    // ========================================

    function throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ========================================
    // Initialize
    // ========================================

    function init() {
        applyTemplates();
        initExperienceCards();
        initScrollTracking();
        initSectionTracking();
        initTimeTracking();

        trackEvent('page_view', {
            referrer: document.referrer || 'direct',
            path: window.location.pathname
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.__portfolioAnalytics = analytics;

})();
