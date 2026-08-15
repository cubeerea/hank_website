/**
 * Off the Ledger's portrait deck — three prints stacked on each other, cycling
 * on a timer and on click.
 *
 * The stack positions live in CSS, keyed off `data-pos` (0 = top). This module
 * only ever reassigns which card holds which position, so every angle, offset
 * and z-index stays in the stylesheet where the rest of the Loose Page
 * treatment is. Advancing is `top = (top + 1) % n` and one re-stamp.
 *
 * Three things stop the rotation from being a thing that happens *at* the
 * reader: it only runs while the deck is on screen, it pauses while a pointer
 * or keyboard focus is on it, and it never auto-runs under reduced motion.
 * Click and Enter/Space still work in every one of those states — the card is
 * a button, so the motion is an offer rather than the only way to see photo 3.
 */

/** Long enough to actually look at a photo, short enough to notice it moved. */
const HOLD_MS = 6000;

export function initPortraitDeck(): void {
  const found = document.querySelector<HTMLButtonElement>('[data-portrait-deck]');
  if (!found) return;
  const deck = found;

  const cards = Array.from(deck.querySelectorAll<HTMLImageElement>('.portrait-card'));
  const counter = deck.querySelector<HTMLElement>('[data-portrait-idx]');
  if (cards.length < 2) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let top = 0;
  let timer: number | undefined;
  let onScreen = false;
  let held = false;

  function render(): void {
    cards.forEach((card, i) => {
      card.dataset.pos = String((i - top + cards.length) % cards.length);
    });

    const caption = cards[top].dataset.caption ?? '';
    // The label describes what is visible and what activating does, in that
    // order, so the state is announced before the affordance.
    deck.setAttribute('aria-label', `${caption}. Photo ${top + 1} of ${cards.length} — activate for the next one.`);

    if (counter) {
      counter.firstChild!.textContent = String(top + 1).padStart(2, '0');
    }
  }

  function advance(): void {
    top = (top + 1) % cards.length;
    render();
  }

  function stop(): void {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
  }

  /* Re-armed after each advance rather than run on an interval: a setInterval
     keeps firing while the tab is backgrounded and then delivers its backlog
     all at once, which lands as the deck flickering when you return to it. */
  function schedule(): void {
    stop();
    if (!onScreen || held || reduced.matches) return;
    timer = window.setTimeout(() => {
      advance();
      schedule();
    }, HOLD_MS);
  }

  deck.addEventListener('click', () => {
    advance();
    schedule(); // a manual advance restarts the hold, so the next auto-turn isn't instant
  });

  // Pause while someone is actually looking at or operating the deck. `held`
  // is separate from `onScreen` so leaving with the tab backgrounded doesn't
  // resume a deck the pointer is still resting on.
  const hold = () => {
    held = true;
    stop();
  };
  const release = () => {
    held = false;
    schedule();
  };
  deck.addEventListener('pointerenter', hold);
  deck.addEventListener('pointerleave', release);
  deck.addEventListener('focusin', hold);
  deck.addEventListener('focusout', release);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        onScreen = entries[0].isIntersecting;
        schedule();
      },
      { threshold: 0.25 },
    ).observe(deck);
  } else {
    onScreen = true;
  }

  // Honour a preference change mid-session rather than only at load.
  reduced.addEventListener('change', schedule);

  render();
  schedule();
}
