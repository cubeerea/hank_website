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
// Ambient Dot Field
// ========================================

interface FieldDot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  onInk: boolean;
}

/**
 * A quiet dot grid, fixed to the viewport, that ripples away from the
 * cursor and springs back — drawn to a single canvas rather than one DOM
 * node per dot, since a page-wide field at a usable density runs well into
 * the thousands of dots and canvas draws them for a fraction of the cost.
 *
 * The page alternates light paper/cream bands with dark ink bands (see
 * Band Rhythm in DESIGN.md), and this layer is one fixed sheet drawn over
 * all of them — a single dot color would either vanish on the ink bands or
 * blow out on the paper ones. So each dot is colored per its *base* grid
 * position against the ink-band rects currently under it, the same
 * paper-tone/ink-tone pairing the rest of the system already uses for
 * cross-band text (Soft Ink / Ink Dim). Recomputed on scroll and (in the
 * animated path) every frame, since which band sits under a given fixed
 * viewport position changes as the page scrolls underneath it.
 */
function initDotField(): void {
  const canvasEl = document.querySelector<HTMLCanvasElement>('.dot-field');
  const ctx2d = canvasEl?.getContext('2d');
  if (!canvasEl || !ctx2d) return;
  // Re-bound as non-null: TS's control-flow narrowing above doesn't carry
  // into the hoisted `function` declarations below, only into values these
  // closures actually capture — so the helpers close over these instead.
  const canvas = canvasEl;
  const ctx = ctx2d;

  const SPACING = 28;
  const DOT_RADIUS = 1.4;
  const REPULSION_RADIUS = 110;
  const REPULSION_STRENGTH = 26;
  const STIFFNESS = 210;
  const DAMPING = 24;
  const REST_EPS = 0.02;
  const DOT_ON_PAPER = '111, 96, 82'; // --color-ink-3, this system's tertiary/quiet ink
  const DOT_ON_INK = '246, 241, 232'; // --color-paper, at reduced alpha below
  const DOT_ALPHA = 0.14;

  const animated = !prefersReducedMotion() && window.matchMedia('(pointer: fine)').matches;
  const bandEls = Array.from(document.querySelectorAll<HTMLElement>('.band-ink'));

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let dots: FieldDot[] = [];
  let mouseX = Infinity;
  let mouseY = Infinity;
  let lastT = 0;
  let rafId: number | undefined;
  let resizeQueued = false;

  function onInkBand(y: number, bandRects: DOMRect[]): boolean {
    return bandRects.some((r) => y >= r.top && y < r.bottom);
  }

  function buildGrid(): void {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bandRects = bandEls.map((el) => el.getBoundingClientRect());
    const cols = Math.ceil(width / SPACING);
    const rows = Math.ceil(height / SPACING);
    const next: FieldDot[] = [];
    for (let row = 0; row <= rows; row++) {
      const y = row * SPACING;
      const onInk = onInkBand(y, bandRects);
      for (let col = 0; col <= cols; col++) {
        const x = col * SPACING;
        next.push({ baseX: x, baseY: y, x, y, vx: 0, vy: 0, onInk });
      }
    }
    dots = next;
  }

  // Scroll doesn't move anything in this fixed layer — it only changes which
  // band rect a given baseY now falls under, so this skips rebuilding the
  // grid and just relabels each dot's color.
  function recolor(): void {
    const bandRects = bandEls.map((el) => el.getBoundingClientRect());
    dots.forEach((dot) => {
      dot.onInk = onInkBand(dot.baseY, bandRects);
    });
  }

  function draw(): void {
    ctx.clearRect(0, 0, width, height);
    dots.forEach((dot) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${dot.onInk ? DOT_ON_INK : DOT_ON_PAPER}, ${DOT_ALPHA})`;
      ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function step(now: number): void {
    const dt = lastT ? Math.min((now - lastT) / 1000, 1 / 30) : 1 / 60;
    lastT = now;

    const bandRects = bandEls.map((el) => el.getBoundingClientRect());
    ctx.clearRect(0, 0, width, height);

    dots.forEach((dot) => {
      dot.onInk = onInkBand(dot.baseY, bandRects);

      const dx = dot.baseX - mouseX;
      const dy = dot.baseY - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let targetX = dot.baseX;
      let targetY = dot.baseY;
      if (dist < REPULSION_RADIUS) {
        const force = (1 - dist / REPULSION_RADIUS) * REPULSION_STRENGTH;
        const angle = Math.atan2(dy, dx);
        targetX = dot.baseX + Math.cos(angle) * force;
        targetY = dot.baseY + Math.sin(angle) * force;
      }

      const atRest =
        targetX === dot.baseX &&
        targetY === dot.baseY &&
        Math.abs(dot.x - dot.baseX) < REST_EPS &&
        Math.abs(dot.y - dot.baseY) < REST_EPS &&
        Math.abs(dot.vx) < REST_EPS &&
        Math.abs(dot.vy) < REST_EPS;

      if (!atRest) {
        // Semi-implicit Euler spring: pull toward the repulsion target,
        // damped so it settles instead of oscillating past it.
        dot.vx += (-STIFFNESS * (dot.x - targetX) - DAMPING * dot.vx) * dt;
        dot.vy += (-STIFFNESS * (dot.y - targetY) - DAMPING * dot.vy) * dt;
        dot.x += dot.vx * dt;
        dot.y += dot.vy * dt;
      } else {
        dot.x = dot.baseX;
        dot.y = dot.baseY;
        dot.vx = 0;
        dot.vy = 0;
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(${dot.onInk ? DOT_ON_INK : DOT_ON_PAPER}, ${DOT_ALPHA})`;
      ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    rafId = requestAnimationFrame(step);
  }

  function rebuild(): void {
    resizeQueued = false;
    buildGrid();
    if (!animated) draw();
  }

  function scheduleRebuild(): void {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(rebuild);
  }

  buildGrid();
  draw();

  window.addEventListener('resize', scheduleRebuild, { passive: true });

  if (animated) {
    window.addEventListener(
      'mousemove',
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      },
      { passive: true },
    );
    // Fires reliably when the pointer leaves the viewport entirely (unlike
    // mouseleave on window, which doesn't fire for this) — without it, a
    // dot could stay repelled forever after the cursor exits the page.
    document.documentElement.addEventListener('mouseleave', () => {
      mouseX = Infinity;
      mouseY = Infinity;
    });
    rafId = requestAnimationFrame(step);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId !== undefined) cancelAnimationFrame(rafId);
        rafId = undefined;
        lastT = 0;
      } else if (rafId === undefined) {
        rafId = requestAnimationFrame(step);
      }
    });
  } else {
    // No spring loop, but the field still needs to stay visually correct
    // as different bands scroll under this fixed layer.
    window.addEventListener(
      'scroll',
      () => {
        recolor();
        draw();
      },
      { passive: true },
    );
  }
}

// ========================================
// Initialize
// ========================================

function init(): void {
  initLastUpdated();
  initDotField();
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
