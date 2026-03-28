/**
 * Portfolio Site — Main TypeScript
 * Handles: cursor aura, expand/collapse cards, scroll animations,
 * nav active state, scroll tracking, and template variables.
 */

import './style.css';

declare global {
  interface Window {
    __portfolioAnalytics: Analytics;
    ANALYTICS_ENDPOINT?: string;
  }
}

// Central source for 'Last updated' timestamp
const DATETIME = 'March 21, 2026';

interface AnalyticsEvent {
  name: string;
  timestamp: number;
  [key: string]: unknown;
}

interface Analytics {
  sessionStart: number;
  maxScrollDepth: number;
  sectionsViewed: Set<string>;
  events: AnalyticsEvent[];
}

const analytics: Analytics = {
  sessionStart: Date.now(),
  maxScrollDepth: 0,
  sectionsViewed: new Set(),
  events: [],
};

// ========================================
// Analytics
// ========================================

function trackEvent(eventName: string, data: Record<string, unknown> = {}): void {
  const event: AnalyticsEvent = {
    name: eventName,
    timestamp: Date.now() - analytics.sessionStart,
    ...data,
  };
  analytics.events.push(event);

  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    console.log('[Analytics]', eventName, data);
  }

  if (window.ANALYTICS_ENDPOINT) {
    sendAnalytics(event);
  }
}

function sendAnalytics(event: AnalyticsEvent): void {
  if (navigator.sendBeacon && window.ANALYTICS_ENDPOINT) {
    navigator.sendBeacon(window.ANALYTICS_ENDPOINT, JSON.stringify(event));
  }
}

// ========================================
// Template Variables
// ========================================

function applyTemplates(): void {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
  );
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeValue?.includes('${datetime}')) {
      node.nodeValue = node.nodeValue.replace(/\$\{datetime\}/g, DATETIME);
    }
  }
}

// ========================================
// Cursor Aura
// ========================================

function initCursorAura(): void {
  const aura = document.getElementById('cursor-aura');
  if (!aura) return;

  window.addEventListener('mousemove', (e: MouseEvent) => {
    aura.style.setProperty('--x', `${e.clientX}px`);
    aura.style.setProperty('--y', `${e.clientY}px`);
  });
}

// ========================================
// Fade-in on Scroll
// ========================================

function initFadeInObserver(): void {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  elements.forEach((el) => observer.observe(el));
}

// ========================================
// Active Nav Link Tracking
// ========================================

function initNavTracking(): void {
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-link');
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('text-white', isActive);
            link.classList.toggle('border-b', isActive);
            link.classList.toggle('border-cyan-dim', isActive);
            link.classList.toggle('text-slate-text', !isActive);
          });
        }
      });
    },
    { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' },
  );

  sections.forEach((section) => observer.observe(section));
}

// ========================================
// Expand/Collapse Experience Cards
// ========================================

function initExperienceCards(): void {
  const cards = document.querySelectorAll<HTMLElement>('.experience-card');

  cards.forEach((card) => {
    const header = card.querySelector<HTMLButtonElement>('.card-header');
    if (!header) return;

    header.addEventListener('click', () => {
      const isExpanded = card.dataset.expanded === 'true';
      const newState = !isExpanded;

      card.dataset.expanded = String(newState);
      header.setAttribute('aria-expanded', String(newState));

      if (newState) {
        const title =
          card.querySelector('.card-title')?.textContent || 'Unknown';
        trackEvent('experience_expanded', { title });
      }
    });

    header.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });
}

// ========================================
// Theme Toggle
// ========================================

function initThemeToggle(): void {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    trackEvent('theme_toggle', { theme: isLight ? 'light' : 'dark' });
  });
}

// ========================================
// Scroll & Section Tracking
// ========================================

function initScrollTracking(): void {
  const handler = throttle(() => {
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;

    const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
    const milestone = Math.floor(scrollPercent / 25) * 25;

    if (milestone > analytics.maxScrollDepth) {
      analytics.maxScrollDepth = milestone;
      trackEvent('scroll_depth', { depth: milestone });
    }
  }, 250);

  window.addEventListener('scroll', handler, { passive: true });
}

function initSectionTracking(): void {
  const sections = document.querySelectorAll('section[id]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          if (!analytics.sectionsViewed.has(sectionId)) {
            analytics.sectionsViewed.add(sectionId);
            trackEvent('section_viewed', { section: sectionId });
          }
        }
      });
    },
    { threshold: 0.5 },
  );

  sections.forEach((section) => observer.observe(section));
}

function initTimeTracking(): void {
  window.addEventListener('beforeunload', () => {
    const timeSpent = Math.round(
      (Date.now() - analytics.sessionStart) / 1000,
    );
    trackEvent('session_end', {
      duration: timeSpent,
      maxScrollDepth: analytics.maxScrollDepth,
      sectionsViewed: Array.from(analytics.sectionsViewed),
    });
  });

  const milestones = [30, 60, 120, 300];
  milestones.forEach((seconds) => {
    setTimeout(() => {
      trackEvent('time_milestone', { seconds });
    }, seconds * 1000);
  });
}

// ========================================
// Utilities
// ========================================

function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ========================================
// Initialize
// ========================================

function init(): void {
  applyTemplates();
  initCursorAura();
  initFadeInObserver();
  initNavTracking();
  initExperienceCards();
  initThemeToggle();
  initScrollTracking();
  initSectionTracking();
  initTimeTracking();

  trackEvent('page_view', {
    referrer: document.referrer || 'direct',
    path: window.location.pathname,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.__portfolioAnalytics = analytics;
