/**
 * Portfolio Site — Main TypeScript
 * Handles: expand/collapse work rows, scroll reveal, nav active state,
 * magnetic CTAs, the typed availability line, and the "last updated" footer
 * stamp.
 */

import './style.css';
import { animate, inView, stagger } from 'motion';
import { initPortraitDeck } from './portrait-deck';

/* The same curve as `--ease-out` in style.css, in the tuple form motion wants.
   These two have to stay in step: everything on the page arrives on one clock,
   and a JS entrance easing differently from the CSS transition it hands off to
   is the kind of mismatch you feel without being able to name. */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
// Typed Availability Line
// ========================================

/**
 * Types the hero spec's "Open to —" value through the things Hank is actually
 * open to, then deletes and moves on. The line lives in the mono spec table,
 * so the typewriter reads as the site's own voice rather than a widget.
 *
 * Three things keep it honest:
 *   - the element ships with real text in the HTML, so no-JS sees a true line;
 *   - reduced-motion returns before any timer is created and leaves that text;
 *   - the loop only runs while the hero is on screen and the tab is visible —
 *     an animation nobody is looking at is just a wakeup.
 */
function initTypewriter(): void {
  const el = document.getElementById('typewriter');
  if (!el || prefersReducedMotion()) return;

  // Keep every phrase under ~26 characters: the row is one mono line at 320px,
  // and a phrase that wraps makes the whole spec table jump a line-height each
  // time it comes round. ("Mechanistic interpretability" was exactly that.)
  const phrases = [
    'Applied AI',
    'FDE roles',
    'Building agentic systems',
    'ML research',
  ];

  const TYPE_MS = 52;
  const DELETE_MS = 26;
  const HOLD_MS = 2400;
  const GAP_MS = 420;
  // Long enough for the hero entrance to finish *and* for the line's shipped
  // value to be read before it deletes itself. Two things animating at once
  // reads as noise, and a phrase that erases before you've read it reads as a
  // glitch.
  const START_MS = 2200;

  let phraseIdx = 0;
  let charIdx = phrases[0].length;
  let deleting = true;
  let timer: number | undefined;
  let onScreen = true;
  let running = false;

  function tick(): void {
    running = true;
    const current = phrases[phraseIdx];
    let next: number;

    if (deleting) {
      charIdx -= 1;
      el!.textContent = current.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        next = GAP_MS;
      } else {
        next = DELETE_MS;
      }
    } else {
      charIdx += 1;
      el!.textContent = current.slice(0, charIdx);
      if (charIdx === current.length) {
        deleting = true;
        next = HOLD_MS;
      } else {
        next = TYPE_MS;
      }
    }

    timer = window.setTimeout(tick, next);
  }

  function resume(delay: number): void {
    if (running || document.hidden || !onScreen) return;
    timer = window.setTimeout(tick, delay);
    running = true;
  }

  function pause(): void {
    window.clearTimeout(timer);
    running = false;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else resume(GAP_MS);
  });

  // The hero is the only place this line exists, so scrolling past it should
  // stop the timer rather than leave it typing into an offscreen node.
  const hero = document.getElementById('top');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen) resume(GAP_MS);
      else pause();
    }).observe(hero);
  }

  resume(START_MS);
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
      section.querySelectorAll<HTMLElement>(
        '.flagship-inner, .bento > .bento-tile, .ledger > article, .stack-grid > .stack-col, .personal > *',
      ),
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

/** Subtle cursor-follow on the site's two filled CTA pills (hero + nav
 *  Résumé) — the same pair named in DESIGN.md's 60/30/10 rule — fine
 *  pointers only. */
function initMagneticButtons(): void {
  if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;

  const MAX_OFFSET = 6;
  const STRENGTH = 0.35;

  document.querySelectorAll<HTMLElement>('.spec .cta, .nav-cta').forEach((btn) => {
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
  const NAV_LINE = 72; // must match scroll-padding-top in style.css
  const PILL_PAD = 8; // px of breathing room the pill adds on each side of the link's own box

  const navList = document.querySelector<HTMLElement>('.nav-list');
  const pill = document.querySelector<HTMLElement>('.nav-pill');

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

  // Rides behind whichever link is active, in `.nav-list`'s own coordinate
  // space — both share that as their nearest positioned ancestor, so plain
  // getBoundingClientRect() deltas line up without a scroll-offset correction.
  function positionPill(link: HTMLAnchorElement): void {
    if (!pill || !navList) return;

    // Below 720px, Home and Stack's <li> go display:none (see the 720px
    // breakpoint in style.css) but the links stay in `targets`, so the
    // "active" section can still resolve to one of them. A hidden link's
    // rect is all zeros — positioning against that would fling the pill
    // off to a bogus corner, so just hide it instead of showing garbage.
    if (link.offsetParent === null) {
      pill.style.opacity = '0';
      return;
    }

    const listRect = navList.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    pill.style.left = `${linkRect.left - listRect.left - PILL_PAD}px`;
    pill.style.width = `${linkRect.width + PILL_PAD * 2}px`;
    pill.style.opacity = '1';
  }

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
    positionPill(active.link);
  }

  function schedule(): void {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
  // Self-hosted webfonts can still swap in after first layout and nudge link
  // widths a few px — resync once they're actually ready rather than leaving
  // the pill stale until the next scroll or resize.
  document.fonts?.ready.then(update).catch(() => {});
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
// Copy Email
// ========================================

/**
 * The Contact row's address is a `mailto:` link, which is dead on a machine
 * with no mail client bound — a common state on a locked-down corporate
 * laptop, which is exactly what a recruiter is using. The button is the way
 * out of that dead end.
 *
 * The label doubles as the confirmation rather than a toast: the feedback
 * belongs on the control that was pressed, and a `role="status"` on the
 * label means a screen reader hears the change without focus moving.
 */
function initCopyEmail(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.copy-email');

  buttons.forEach((btn) => {
    const label = btn.querySelector<HTMLElement>('.copy-email-label');
    const address = btn.dataset.copy;
    if (!label || !address) return;

    const idle = label.textContent ?? 'Copy address';
    let revert: ReturnType<typeof setTimeout> | undefined;

    btn.addEventListener('click', async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(address);
        ok = true;
      } catch {
        // Denied permission, or a non-secure origin where the API doesn't
        // exist at all. Say so instead of claiming a copy that didn't happen —
        // the address is on screen next to the button either way.
        ok = false;
      }

      label.textContent = ok ? 'Copied' : 'Copy blocked — select the address';
      clearTimeout(revert);
      revert = setTimeout(() => {
        label.textContent = idle;
      }, 2000);
    });
  });
}

// ========================================
// Initialize
// ========================================

function init(): void {
  initLastUpdated();
  initHeroEntrance();
  initTypewriter();
  initScrollReveal();
  initMagneticButtons();
  initNavTracking();
  initExperienceCards();
  initCopyEmail();
  initPortraitDeck();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
