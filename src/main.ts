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
// Tech Globe
// ========================================

function initTechGlobe(): void {
  const globe = document.getElementById('tech-globe');
  if (!globe) return;

  // Mobile: static grid, skip 3D
  if (window.matchMedia('(max-width: 480px)').matches) return;

  const icons = Array.from(globe.querySelectorAll<HTMLElement>('.tech-icon'));
  const N = icons.length;
  const radius = 160;

  // Fibonacci sphere distribution for even spread
  const positions: { x: number; y: number; z: number }[] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < N; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / N);
    const phi = (2 * Math.PI * i) / goldenRatio;
    positions.push({
      x: radius * Math.sin(theta) * Math.cos(phi),
      y: radius * Math.cos(theta),
      z: radius * Math.sin(theta) * Math.sin(phi),
    });
  }

  let rotY = 0;
  let paused = false;
  let rafId: number;
  const startTime = Date.now();

  globe.addEventListener('mouseenter', () => { paused = true; });
  globe.addEventListener('mouseleave', () => { paused = false; });

  function animate() {
    if (!paused) {
      rotY += 0.003; // slower, more premium
    }

    // Gentle oscillating X-tilt instead of fixed angle
    const rotX = 0.15 + Math.sin((Date.now() - startTime) * 0.0003) * 0.12;

    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    icons.forEach((icon, i) => {
      const p = positions[i];

      // Rotate around Y axis
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;

      // Rotate around X axis
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;

      // Stronger depth contrast: back icons fade further
      const depth = (z2 + radius) / (2 * radius); // 0 = back, 1 = front
      const scale = 0.5 + depth * 0.8;
      const opacity = 0.15 + depth * 0.85;

      icon.style.transform = `translate(${x1}px, ${y2}px) scale(${scale})`;
      icon.style.opacity = String(opacity.toFixed(3));
      icon.style.zIndex = String(Math.round(depth * 100));
    });

    rafId = requestAnimationFrame(animate);
  }

  animate();

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      animate();
    }
  });
}

// ========================================
// Typewriter Effect
// ========================================

function initTypewriter(): void {
  const raw = document.getElementById('typewriter');
  if (!raw) return;
  const el = raw as HTMLElement;

  const phrases = [
    'Graduating senior @ UC Santa Barbara',
    'Applied ML & AI Engineering',
    'Mechanistic Interpretability',
    'Forward Deployed Engineering',
  ];

  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  const TYPING_SPEED = 55;
  const DELETE_SPEED = 28;
  const PAUSE_END = 2200;
  const PAUSE_START = 400;

  function tick() {
    const current = phrases[phraseIdx];
    if (!deleting) {
      el.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(tick, PAUSE_END);
        return;
      }
    } else {
      el.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, PAUSE_START);
        return;
      }
    }
    setTimeout(tick, deleting ? DELETE_SPEED : TYPING_SPEED);
  }
  tick();
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
  initScrollTracking();
  initSectionTracking();
  initTimeTracking();
  initTechGlobe();
  initTypewriter();

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
