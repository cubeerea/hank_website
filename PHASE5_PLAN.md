# Phase 5 — Globe Refinement, OG Tags, Typewriter, Resume Consistency

## 1. Tech Globe — Refinements

**Current state:** Fully working (`initTechGlobe()` in `main.ts`) with Fibonacci distribution, Y-axis rotation, depth-based opacity/scale, pause-on-hover, and visibility API pause.

**Refinements:**

### `src/main.ts`
- **Slow down rotation**: `rotY += 0.005` → `rotY += 0.003` — less dizzying, more premium
- **Deeper depth contrast**: `scale = 0.6 + depth * 0.7` → `scale = 0.5 + depth * 0.8` and `opacity = 0.15 + depth * 0.85` — icons in the back fade further, front icons pop more
- **Add slight X-axis drift**: introduce a slow oscillating tilt `rotX = 0.15 + Math.sin(Date.now() * 0.0003) * 0.12` instead of a fixed tilt, giving the globe a gentle breathing/wobble feel
- **Label show on hover**: on `mouseenter` of each `.tech-icon`, add a class that shows the `<span>` label with fade-in, hide on `mouseleave`

### `src/style.css`
- **`.tech-globe` height**: ensure `height: 420px` desktop / `300px` ≤768px so the bottom never clips
- **`.tech-icon span` (label)**: default `opacity: 0`, on `.tech-icon:hover span` → `opacity: 1` with `transition: opacity 0.2s`
- **Icon sizing**: `img` inside `.tech-icon` at `width: 36px; height: 36px` (currently may inherit block size)

---

## 2. OG / Social Meta Tags

**Current state:** `index.html` has `og:title` and `og:description` but is missing `og:image`, `og:url`, `og:type`, `twitter:card`, and `twitter:image` — so social preview cards won't render images.

### `index.html` `<head>`
Add the following after existing OG tags:
```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://hanksha.dev">
<meta property="og:image" content="https://hanksha.dev/assets/og-preview.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Hank Sha | AI & ML Engineering">
<meta name="twitter:description" content="Bridging ML, engineering & business impact in scalable AI products.">
<meta name="twitter:image" content="https://hanksha.dev/assets/og-preview.png">
```

### OG Preview Image
- Generate a `1200×630px` static preview image (`public/assets/og-preview.png`) — dark purple background, "Hank Sha" in Sora bold, subtitle "AI & ML Engineering", gradient accent bar

> [!NOTE]
> Replace `hanksha.dev` with your actual deployment domain once confirmed.

---

## 3. Hero Typewriter Effect

**Current state:** Hero shows static subtitle `"Graduating senior @ UC Santa Barbara · Data Science & ML"`.

**Plan:** Keep the static name `I'm Hank.` unchanged. Add a typewriter that cycles through role strings beneath it, replacing the static subtitle `<p>`.

### `index.html`
Replace the static subtitle `<p>` with:
```html
<p class="text-sm text-slate-dim mb-4">
  <span id="typewriter"></span><span class="typewriter-cursor">|</span>
</p>
```

### `src/main.ts` — add `initTypewriter()`
```ts
function initTypewriter(): void {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const phrases = [
    'Graduating senior @ UC Santa Barbara',
    'Applied ML & AI Engineering',
    'Mechanistic Interpretability',
    'Forward Deployed Engineering',
  ];

  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  const TYPING_SPEED = 55;   // ms per char
  const DELETE_SPEED = 28;   // ms per char (faster delete)
  const PAUSE_END = 2200;    // ms to hold full string
  const PAUSE_START = 400;   // ms before typing next

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
```

### `src/style.css` — cursor blink
```css
.typewriter-cursor {
  display: inline-block;
  color: var(--color-cyan);
  animation: cursor-blink 0.9s step-end infinite;
}
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

---

## 4. Resume Page — Color Consistency

**Problem:** `resume.html` uses hardcoded `rgba(10,15,28,0.85)` (old navy blue) for the header background and `border-t-cyan` in the spinner — these predate the purple theme.

### `resume.html`
- Header `bg-[rgba(10,15,28,0.85)]` → `bg-[rgba(8,7,15,0.85)]` (matches new `--color-ink`)
- Spinner: `border-t-cyan` → already resolves through CSS variable (no change needed)
- Download button: `border-cyan-dim text-cyan` hover shadows — already use CSS vars, fine
- Add missing `<meta name="robots" content="noindex">` to keep resume out of search index

---

## Files Modified

| File | Change |
|---|---|
| `src/main.ts` | Globe rotation speed, wobble, label hover; `initTypewriter()` added |
| `src/style.css` | Globe height, icon sizing, label fade, typewriter cursor |
| `index.html` | OG/Twitter meta tags, typewriter `<span>` |
| `resume.html` | Header bg color fix, noindex meta |
| `public/assets/og-preview.png` | New 1200×630 OG image |

## Verification
1. Visit site → typewriter cycles through all 4 phrases cleanly
2. Share URL in Slack/iMessage → rich preview card shows with image
3. Tech globe: labels appear on hover, back icons dim further, tilt wobbles gently
4. `/resume` header is dark purple, not navy blue
