# Phase 3 — Hero Snap & Globe Icon Fixes

## 1. Hero as Full-Screen Snap Section with Resistance Effect

**Problem:** Hero and Skill Map bleed together with no visual boundary; the user wants the hero to feel like its own "page" with a natural resistance before the next section scrolls in.

**Approach:** CSS `scroll-snap` on the page container. The hero takes `min-height: 100vh`, is a snap point (`scroll-snap-align: start`), and the rest of the page scrolls freely below it. A bottom scroll-hint arrow with bounce animation gives a visual cue.

**Changes to `index.html`:**
- Wrap the entire `<main>` (or use body) as a `scroll-snap-type: y mandatory` container
- Give the `<header id="hero">` a class of `hero-snap` so it snaps (`min-height: 100svh`, `scroll-snap-align: start`)
- Add a scroll-hint arrow div at the bottom of the hero: `<div class="scroll-hint">↓</div>`
- The `<main>` content after the hero continues as a normal scroll-flow (`scroll-snap-align: none`)
- On mobile: keep `min-height: 100svh` but reduce padding so content fits

**Changes to `src/style.css`:**
```css
/* Snap container */
html, body {
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  height: 100%;
}

.hero-snap {
  min-height: 100svh;
  scroll-snap-align: start;
  scroll-snap-stop: always;  /* the "resistance" — must fully stop here */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Scroll hint arrow */
@keyframes bounce-hint {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(6px); opacity: 1; }
}
.scroll-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: var(--color-slate-dim);
  font-size: 1.25rem;
  animation: bounce-hint 2s ease-in-out infinite;
  cursor: pointer;
}
```

> [!NOTE]
> `scroll-snap-stop: always` is the key directive that creates the "resistance" — the browser is forced to stop at the hero before continuing, even during a fast fling.

---

## 2. Icon Corrections

All 4 icons currently use incorrect/placeholder representations. Fixes:

| Tool | Current | Fix |
|---|---|---|
| **Claude Code** | `✦` text glyph | Use `https://cdn.simpleicons.org/anthropic/CC785C` (Anthropic logo, warm clay color) |
| **R** | Text `"R"` | Use `https://cdn.simpleicons.org/r/276DC3` (official R language logo, blue) |
| **n8n** | Text `"n8n"` | Use `https://cdn.simpleicons.org/n8n/EA4B71` (official n8n logo, pink-red) |
| **Pinecone** | 📌 emoji | No simpleicons entry — use a custom inline SVG pine cone shape in `#70B981` (Pinecone brand green), or use a styled badge |

**Pinecone fallback SVG** (inline, minimal pine cone silhouette):
```html
<svg viewBox="0 0 24 24" fill="#70B981">
  <ellipse cx="12" cy="16" rx="5" ry="6"/>
  <path d="M12 2 C10 6 8 8 8 11 C10 9 12 8 12 8 C12 8 14 9 16 11 C16 8 14 6 12 2Z"/>
</svg>
```

**Change:** Update the 4 `data-tech` divs in `index.html` with the correct img/svg sources.

---

## 3. Globe Visual Fix — Not Cut Off

**Problem:** The globe container doesn't have a defined `height`, causing the bottom to be clipped.

**Fix in `src/style.css`:**
- Set `.tech-globe` to `height: 420px` (desktop), `height: 340px` (≤768px), `height: 280px` (≤480px) — explicit heights so the container is never clipped
- Add `overflow: visible` to the globe container and `overflow: hidden` with appropriate padding to the parent section instead

---

## Files Modified

| File | Changes |
|---|---|
| `index.html` | `hero-snap` class on header, scroll-hint arrow, 4 icon src updates |
| `src/style.css` | Snap container rules, `.hero-snap`, `.scroll-hint`, globe height fix |

## Verification

1. Load page → hero fills viewport, no other sections visible
2. Scroll slowly → resistance before Skill Map section appears
3. Tech globe: R shows blue R logo, n8n shows chain logo, Claude shows Anthropic mark, Pinecone shows green icon
4. Globe is not cut off at bottom — full sphere visible
