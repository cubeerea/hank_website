/**
 * Portfolio Site — Main TypeScript
 * Handles: cursor aura, expand/collapse cards, scroll animations,
 * nav active state, typewriter, and the projects marquee.
 */

import './style.css';
import { initCursorAura } from './cursor-aura';
import { debounce } from './debounce';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
    { threshold: 0.15 },
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
 * and so never fires at all. Expanding the work cards made #work 3663px tall,
 * whose maximum achievable ratio was 0.246 against a 0.3 threshold — the nav
 * simply stopped updating. Measuring positions directly has no such failure.
 */
function initNavTracking(): void {
  const NAV_LINE = 96; // must match --scroll-offset / scroll-padding-top

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
// Expand/Collapse Experience Cards
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
// Typewriter Effect
// ========================================

function initTypewriter(): void {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const phrases = [
    'UCSB · Applied ML & AI Engineering',
    'Production LLM Systems',
    'Mechanistic Interpretability',
    'Forward Deployed Engineering',
  ];

  // Nothing should animate under reduced motion, and the line still needs
  // content so the layout doesn't collapse.
  if (reducedMotion.matches) {
    el.textContent = phrases[0];
    document.querySelector('.typewriter-cursor')?.remove();
    return;
  }

  const TYPING_SPEED = 55;
  const DELETE_SPEED = 28;
  const PAUSE_END = 2200;
  const PAUSE_START = 400;

  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let timer: number | undefined;

  function tick(): void {
    const current = phrases[phraseIdx];

    if (!deleting) {
      el!.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) {
        deleting = true;
        timer = window.setTimeout(tick, PAUSE_END);
        return;
      }
    } else {
      el!.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        timer = window.setTimeout(tick, PAUSE_START);
        return;
      }
    }

    timer = window.setTimeout(tick, deleting ? DELETE_SPEED : TYPING_SPEED);
  }

  // Don't keep a timer loop alive in a background tab.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearTimeout(timer);
    } else {
      tick();
    }
  });

  tick();
}

// ========================================
// Projects Marquee
// ========================================

/**
 * Continuous right-to-left marquee.
 *
 * The group of cards is authored once in HTML and cloned at runtime until the
 * track is at least twice the viewport width, so the loop is seamless on any
 * display. The animation shifts the track by exactly one group + one gap.
 *
 * Degrades on purpose:
 *   - no JS            -> native scroll-snap carousel (CSS `:not(.marquee--animated)`)
 *   - reduced motion   -> same carousel, nothing moves on its own
 *   - touch / coarse   -> same carousel; swiping beats chasing a moving target
 *   - off-screen       -> animation paused, no wasted compositing
 */
function initProjectsMarquee(): void {
  const marquee = document.querySelector<HTMLElement>('[data-marquee]');
  const track = marquee?.querySelector<HTMLElement>('[data-marquee-track]');
  const group = marquee?.querySelector<HTMLElement>('[data-marquee-group]');
  if (!marquee || !track || !group) return;

  const PIXELS_PER_SECOND = 53;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function measureScrollbar(): void {
    const width = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-w', `${width}px`);
  }

  function build(): void {
    track!.querySelectorAll('[data-marquee-clone]').forEach((n) => n.remove());
    marquee!.classList.remove('marquee--animated');

    if (reducedMotion.matches || !finePointer.matches) return;

    const gap = parseFloat(getComputedStyle(track!).columnGap) || 0;
    const groupWidth = group!.getBoundingClientRect().width;
    const viewportWidth = marquee!.getBoundingClientRect().width;
    if (!groupWidth || !viewportWidth) return;

    const copies = Math.max(2, Math.ceil((viewportWidth * 2) / (groupWidth + gap)));
    for (let i = 1; i < copies; i += 1) {
      const clone = group!.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('data-marquee-clone', '');
      clone.removeAttribute('data-marquee-group');
      // Clones must not be reachable by keyboard — each project is tabbable once.
      clone
        .querySelectorAll<HTMLElement>('a')
        .forEach((a) => a.setAttribute('tabindex', '-1'));
      track!.appendChild(clone);
    }

    const shift = groupWidth + gap;
    track!.style.setProperty('--marquee-shift', `${shift}px`);
    track!.style.setProperty(
      '--marquee-duration',
      `${(shift / PIXELS_PER_SECOND).toFixed(2)}s`,
    );
    marquee!.classList.add('marquee--animated');
  }

  function rebuild(): void {
    measureScrollbar();
    build();
  }

  rebuild();

  // Web fonts land after first paint and change card width — remeasure.
  if (document.fonts?.ready) {
    document.fonts.ready.then(rebuild).catch(() => {});
  }

  window.addEventListener('resize', debounce(rebuild, 200));

  reducedMotion.addEventListener('change', rebuild);
  finePointer.addEventListener('change', rebuild);

  // Don't burn compositing on an off-screen animation.
  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        marquee.classList.toggle('marquee--paused', !entry.isIntersecting);
      });
    },
    { threshold: 0 },
  ).observe(marquee);
}

// ========================================
// Initialize
// ========================================

function init(): void {
  initLastUpdated();
  initCursorAura();
  initFadeInObserver();
  initNavTracking();
  initExperienceCards();
  initTypewriter();
  initProjectsMarquee();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
