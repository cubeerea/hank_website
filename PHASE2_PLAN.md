# Phase 2 Refinements — Implementation Plan

## 1. Hero + About Layout Fix

**Problem:** Hero section consumes too much vertical space, pushing About below the fold. The user wants both visible on first load.

**Solution:** Merge Hero and About into a single above-the-fold section with a two-column layout on desktop.

**Changes to `index.html`:**
- Remove the separate `<section id="about">` wrapper
- Fold the About tagline + "Outside of work..." blurb directly into the hero's left column, below the CTA buttons, separated by a thin horizontal rule
- Reduce hero top padding: `pt-16` → `pt-10` and remove `mb-10` margin from the header
- On mobile, the stacked column keeps the same order: name → chips → status → CTAs → divider → about blurb

**No CSS changes needed for this item.**

---

## 2. Skill Map → Rotating 3D Globe with Tech Icons

**Problem:** The current skill map is three text cards. User wants a rotating 3D sphere with floating technology icons (like the screenshot provided).

**Approach:** Pure vanilla JS + CSS 3D transforms (no Three.js/external libs). Technique: distribute icon `<div>` elements on a sphere surface using spherical coordinate math, rotate the sphere continuously with `requestAnimationFrame`, fade icons based on their Z depth.

**Tech stack icons (15 total):** PyTorch, Python, TypeScript, R, LangChain, HuggingFace, Git, MongoDB, Pinecone, PostgreSQL, n8n, Claude Code, Docker, Scikit-learn, React

**Icon source:** Simple SVG logos fetched from `https://cdn.simpleicons.org/{slug}` (CDN, no install needed). Custom text fallback for tools without Simple Icons entries (R, LangChain, n8n, Pinecone, Claude Code).

**Changes to `index.html`:**
- Replace the entire `<section id="skills">` content with:
  - Section heading "Skill Map" (kept)
  - A `<div id="tech-globe" class="tech-globe">` container
  - Inside: one `<div class="tech-icon">` per tech, containing an `<img>` or SVG + label
- Keep section heading and fade-in animation

**Changes to `src/style.css`:**
- Add `.tech-globe` styles: centered container, `perspective: 800px`, relative positioning, defined `height`
- Add `.tech-icon` styles: `position: absolute`, `transform-style: preserve-3d`, icon sizing, label typography
- Add depth-fade logic via `opacity` and `scale` driven by JS

**Changes to `src/main.ts`:**
- Add `initTechGlobe()` function:
  - Distribute N icons on sphere surface: `x = r·sin(φ)·cos(θ)`, `y = r·cos(φ)`, `z = r·sin(φ)·sin(θ)` using Fibonacci sphere distribution for even spread
  - Animate rotation quaternion each frame (`rotateY` on the globe container)
  - Per-icon: compute final 3D position, update `translateX/Y/Z`, set `opacity` based on z depth (back = dim, front = bright), set `scale` based on z (parallax feel)
  - Pause on hover, resume on mouse leave

---

## 3. Typography, Spacing & Consistency Audit

**Problem:** Multiple font weight, spacing, and color inconsistencies across sections.

**Fixes in `index.html`:**
- All `<h2>` section headers → uniform class: `font-display text-2xl font-semibold tracking-tight text-white pb-2 border-b border-border mb-6`
- All body text → `text-slate-text` (no mixing of `text-slate-dim` for body copy)
- `text-slate-dim` reserved only for metadata (dates, secondary labels)
- Section vertical spacing → uniform `mb-20` at desktop, `mb-14` at 768px, `mb-10` at 480px (already set via class, audit will verify consistency)
- Card padding → uniform `p-5` on bento cells, `p-6` on work cards
- Remove any inline `text-white` overrides on paragraph body text (those should be `text-slate-text`)

**Fixes in `src/style.css`:**
- `.writing-link` light mode: add `html.light .writing-link { text-decoration-color: rgba(0,0,0,0.15); color: #0f172a; }` so link text is dark in light mode
- Ensure `h3` card titles inside `.experience-card` inherit white in dark / `#0f172a` in light properly via CSS variable

---

## 4. Light Mode Font Color Fix

**Problem:** Text elements hardcoded to `text-white` in Tailwind classes remain white in light mode since Tailwind's `text-white` is always `#ffffff`.

**Root cause:** Classes like `text-white` on `<h1>`, `<h3>` card titles, `<strong>` tags, writing links, and nav links are not overridden by the `html.light` CSS block.

**Fix strategy:** In `src/style.css`, add targeted light-mode overrides:

```css
/* Light mode base text */
html.light body {
  color: #0f172a;
}

/* Headings that are hardcoded text-white */
html.light h1,
html.light h2,
html.light h3,
html.light h4,
html.light .card-title,
html.light strong,
html.light .text-white {
  color: #0f172a !important;
}

/* Nav links */
html.light .nav-link {
  color: #334155;
}
html.light .nav-link:hover,
html.light .nav-pill a[style*="border-bottom"] {
  color: #0f172a;
}

/* Writing links */
html.light .writing-link {
  color: #0f172a;
  text-decoration-color: rgba(0, 0, 0, 0.2);
}

/* Card content text */
html.light .card-header {
  color: #0f172a;
}
```

**Verification:** After changes, use the browser subagent to:
1. Open `http://localhost:5173`
2. Toggle to light mode
3. Screenshot to confirm all text is dark and readable

---

## Files Modified

| File | Changes |
|---|---|
| `index.html` | Hero+About merge, Skill Map globe HTML, text-white audit |
| `src/style.css` | Light mode overrides, tech-globe CSS, writing-link light fix |
| `src/main.ts` | `initTechGlobe()` function |

## Verification Steps

1. Dark mode: hero + about content visible on first load without scrolling
2. Skill globe rotates smoothly, icons distributed evenly, pauses on hover
3. Light mode: toggle and screenshot — all text dark/readable
4. Mobile (480px): globe collapses to a simple icon grid, no overflow
