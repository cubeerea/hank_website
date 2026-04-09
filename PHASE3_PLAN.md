# Phase 4 — Polish: Fonts, Nav Order, Icon Footer

## 1. Font Consistency

**Problem:** Mixed font classes across sections — some headings use `font-display` (Sora), some body text accidentally picks up `font-display`, and `font-ui` (Inter) isn't always explicit on body copy.

**Rules to enforce:**
| Element | Font | Class |
|---|---|---|
| `h1`, `h2`, `h3`, `h4`, section headings, nav links, badges, card labels | Sora | `font-display` |
| All body paragraphs, list items, metadata/dates, link text | Inter | `font-ui` (default body) |
| Monospaced/label text (skill bullets, gist grid headers) | Already Sora via `font-display` — keep |

**Changes to `src/style.css`:**
- Set `body { font-family: var(--font-ui); }` explicitly (ensures Inter everywhere not overridden)
- Add `html.light h1, html.light h2, html.light h3, html.light h4 { color: #0f172a; }` for light mode heading fix (part of the outstanding light mode fix)

**Changes to `index.html`:**
- Audit every `<p>`, `<span class="text-slate-text">`, `<li>` — none should have `font-display`
- Writing section timeline text → confirm `font-ui`
- Bento cell descriptions → confirm `font-ui`
- Footer copyright/timestamp → confirm `font-ui`

---

## 2. Nav Bar — Correct Section Order

**Problem:** Nav links don't match page scroll order.

**Current order:** Home · About · Work · Writing · Projects · Contact

**Correct order** (matches DOM top→bottom):
Home · Skills · Writing · Projects · Work · Contact

> [!NOTE]
> `About` is now merged into the Hero section so it is `#about` anchor inside the hero — it's a sub-scroll of Home, not a separate nav entry. Remove it from the nav.

**Change to `index.html` nav:**
```
Home → #top
Skills → #skills
Writing → #writing
Projects → #projects
Work → #work
Contact → #contact
```

---

## 3. Contact Footer — Icons Instead of Text

**Problem:** Footer links are plain text labels (Email, GitHub, Medium, LinkedIn, Resume).

**Solution:** Replace each with an SVG icon button — circular icon, tooltip on hover, smooth hover transition. No labels visible by default; label appears as a `title` attribute (native browser tooltip) and optionally as a visually-hidden `<span>` for accessibility.

**Icons (all inline SVG, no CDN dependency):**
| Link | Icon |
|---|---|
| Email (hankssha@gmail.com) | Envelope SVG |
| GitHub (cubeerea) | GitHub mark SVG |
| Medium (@cubeerea) | Medium M SVG |
| LinkedIn (/hank-sha) | LinkedIn `in` SVG |
| Resume (/resume) | Document/file SVG |

**New HTML structure:**
```html
<div class="contact-icons flex gap-4 flex-wrap">
  <a href="mailto:..." class="contact-icon-btn" title="Email" aria-label="Email">
    <!-- envelope SVG -->
  </a>
  ...
</div>
```

**New CSS in `src/style.css`:**
```css
.contact-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  color: var(--color-slate-text);
  transition: color 0.2s, border-color 0.2s, transform 0.15s;
}
.contact-icon-btn:hover {
  color: var(--color-cyan);
  border-color: var(--color-cyan-dim);
  transform: translateY(-2px);
}
.contact-icon-btn svg {
  width: 18px;
  height: 18px;
}
```

---

## Files Modified

| File | Changes |
|---|---|
| `index.html` | Nav reorder (remove About, correct sequence), footer icons |
| `src/style.css` | `body` font-family explicit, `.contact-icon-btn` styles |
