/**
 * Portfolio Site — Main TypeScript
 * Handles: expand/collapse work rows, scroll reveal, nav active state,
 * magnetic CTAs, and the "last updated" footer stamp.
 */

import './style.css';
import { animate, inView, stagger } from 'motion';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ========================================
// Last Updated (injected at build time)
// ========================================

function initLastUpdated(): void {
  const el = document.getElementById('last-updated');
  if (!(el instanceof HTMLTimeElement)) return;

  const built = new Date(__BUILD_DATE__);
  // Both must come from the same calendar day. toISOString() is UTC while
  // toLocaleDateString() is local, which disagreed across the date boundary.
  const pad = (n: number) => String(n).padStart(2, '0');
  el.dateTime = `${built.getFullYear()}-${pad(built.getMonth() + 1)}-${pad(built.getDate())}`;
  el.textContent = built.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ========================================
// Hero Entrance
// ========================================

function initHeroEntrance(): void {
  if (prefersReducedMotion()) return;

  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('.hero-headline, .hero-intro, .spec'),
  );
  if (!targets.length) return;

  targets.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
  });

  animate(
    targets,
    { opacity: 1, transform: 'translateY(0px)' },
    { delay: stagger(0.09), duration: 0.6, ease: EASE_OUT },
  );
}

// ========================================
// Scroll Reveal (staggered per-row, via Motion)
// ========================================

/**
 * Sections stay visible by default in CSS (see .fade-in in style.css) so
 * content never disappears if JS fails to load. Only once we know Motion is
 * about to run do we hide each row/card, then reveal it staggered as its
 * section scrolls into view.
 */
function initScrollReveal(): void {
  if (prefersReducedMotion()) return;

  const sections = document.querySelectorAll<HTMLElement>('.fade-in');
  if (!sections.length) return;

  sections.forEach((section) => {
    const targets = Array.from(
      section.querySelectorAll<HTMLElement>('.spotlight, .ledger > article, .stack-grid > .stack-col'),
    );
    if (!targets.length) return;

    targets.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(14px)';
    });

    inView(
      section,
      () => {
        animate(
          targets,
          { opacity: 1, transform: 'translateY(0px)' },
          { delay: stagger(0.06), duration: 0.5, ease: EASE_OUT },
        );
      },
      { amount: 0.1 },
    );
  });
}

// ========================================
// Magnetic CTA Buttons
// ========================================

/** Subtle cursor-follow on the two hero pill buttons — fine pointers only. */
function initMagneticButtons(): void {
  if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;

  const MAX_OFFSET = 6;
  const STRENGTH = 0.35;

  document.querySelectorAll<HTMLElement>('.spec .cta').forEach((btn) => {
    btn.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      const x = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relX * STRENGTH));
      const y = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relY * STRENGTH));
      animate(btn, { transform: `translate(${x}px, ${y}px)` }, { duration: 0.25, ease: EASE_OUT });
    });

    btn.addEventListener('pointerleave', () => {
      animate(btn, { transform: 'translate(0px, 0px)' }, { type: 'spring', stiffness: 300, damping: 20 });
    });
  });
}

// ========================================
// Active Nav Link Tracking
// ========================================

/**
 * Highlights the section whose top edge is closest above the nav line.
 *
 * An IntersectionObserver can't do this reliably: with a fixed threshold, a
 * section taller than `viewport / threshold` never reaches the required ratio
 * and so never fires at all. #work can run past 3000px with a couple of rows
 * expanded. Measuring positions directly has no such failure.
 */
function initNavTracking(): void {
  const NAV_LINE = 64; // must match scroll-padding-top in style.css

  const targets = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.nav-link'),
  )
    .map((link) => {
      const id = link.getAttribute('href')?.replace('#', '');
      const el = id ? document.getElementById(id) : null;
      return el ? { link, el } : null;
    })
    .filter((t): t is { link: HTMLAnchorElement; el: HTMLElement } => t !== null);

  if (!targets.length) return;

  let queued = false;

  function update(): void {
    queued = false;

    let active = targets[0];

    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;

    if (atBottom) {
      // Trailing sections can be too short to ever cross the nav line.
      active = targets[targets.length - 1];
    } else {
      let closest = -Infinity;
      targets.forEach((t) => {
        const offset = t.el.getBoundingClientRect().top - NAV_LINE;
        if (offset <= 0 && offset > closest) {
          closest = offset;
          active = t;
        }
      });
    }

    targets.forEach(({ link }) => {
      link.classList.toggle('is-active', link === active.link);
    });
  }

  function schedule(): void {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
}

// ========================================
// Nav Sticky Border
// ========================================

function initNavStuck(): void {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 0);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ========================================
// Expand/Collapse Work Rows
// ========================================

function initExperienceCards(): void {
  const cards = document.querySelectorAll<HTMLElement>('.experience-card');

  cards.forEach((card) => {
    const header = card.querySelector<HTMLButtonElement>('.card-header');
    if (!header) return;

    header.addEventListener('click', () => {
      const expanded = card.dataset.expanded !== 'true';
      card.dataset.expanded = String(expanded);
      header.setAttribute('aria-expanded', String(expanded));
    });
  });
}

// ========================================
// Initialize
// ========================================

function init(): void {
  initLastUpdated();
  initHeroEntrance();
  initScrollReveal();
  initMagneticButtons();
  initNavStuck();
  initNavTracking();
  initExperienceCards();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
