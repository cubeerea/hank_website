/**
 * Portfolio Site — Main TypeScript
 * Handles: expand/collapse work rows, scroll reveal, nav active state,
 * and the "last updated" footer stamp.
 */

import './style.css';

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
    { threshold: 0.1 },
  );

  elements.forEach((el) => observer.observe(el));
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
  initFadeInObserver();
  initNavStuck();
  initNavTracking();
  initExperienceCards();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
