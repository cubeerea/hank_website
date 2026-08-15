---
name: Hank Sha — Portfolio
description: A field ledger for real work — numbered entries, terracotta marginalia, warm paper, zero decoration that isn't information.
colors:
  terracotta-ink: "#B0442A"
  terracotta-dim: "rgba(176, 68, 42, 0.35)"
  terracotta-glow: "rgba(176, 68, 42, 0.16)"
  terracotta-tint: "rgba(176, 68, 42, 0.045)"
  warm-paper: "#F6F1E8"
  warm-paper-card: "#FBF8F2"
  deep-ink: "#211A14"
  mid-ink: "#5A4C40"
  soft-ink: "#77675A"
  hairline-rule: "rgba(33, 26, 20, 0.14)"
  hairline-rule-soft: "rgba(33, 26, 20, 0.085)"
  cream: "#EFE7D8"
  terracotta-light: "#D9724F"
  terracotta-light-dim: "rgba(217, 114, 79, 0.45)"
  rule-inverse: "rgba(246, 241, 232, 0.14)"
  rule-inverse-soft: "rgba(246, 241, 232, 0.08)"
  ink-dim: "rgba(246, 241, 232, 0.55)"
typography:
  display:
    fontFamily: "IBM Plex Serif, Georgia, Times New Roman, serif"
    fontSize: "clamp(3.25rem, 11vw, 6.25rem)"
    fontWeight: 600
    lineHeight: 0.94
    letterSpacing: "-0.032em"
  body:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.04em"
rounded:
  sharp: "0px"
  soft: "7px"
  soft-lg: "12px"
  pill: "9999px"
components:
  contact-link:
    backgroundColor: "transparent"
    textColor: "{colors.mid-ink}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.9rem"
  contact-link-hover:
    textColor: "{colors.terracotta-ink}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.mid-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sharp}"
    padding: "0.12rem 0.5rem"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.soft-ink}"
    typography: "{typography.label}"
  nav-link-active:
    textColor: "{colors.deep-ink}"
---

# Design System: Hank Sha — Portfolio

## Overview

**Creative North Star: "The Field Ledger"**

This is a researcher's logbook rendered as a website: numbered entries, terse monospace labels, hairline rules standing in for ruled paper, and a single terracotta ink used sparingly for annotation — never for decoration. Nothing on the page exists to look nice; every mark (an index number, a section rule, an uppercase mono label) carries information about what it's attached to. Outside the Projects grid and the Off the Ledger media the system is flat: no shadows, no gradients, no rounded cards. Depth comes from ink weight and rule contrast, not elevation.

The palette stays warm and paper-like on its light bands (`#F6F1E8` and one cream step down), with near-black warm ink for text, so the terracotta accent (`#B0442A`) reads as a rubber-stamp or red-pen mark against the page rather than a "brand color" wash. Confirmed rejection: no saturated multi-color palette — the identity is monochrome-plus-one-accent, and that restraint is load-bearing, not a placeholder.

The page is no longer one uninterrupted field. It runs as a sequence of **full-bleed color bands** — Warm Paper, Cream (one subtle step down), and three Deep Ink bands — so the scroll has a pulse. The ledger identity is unchanged; it now plays out across alternating surfaces instead of a single one. See "Band Rhythm" below for the exact order, which is load-bearing.

**Key Characteristics:**
- Alternating full-bleed bands: paper → ink → cream → ink → paper → cream → ink, capped at three ink bands
- Ledger rows: numbered, hairline-ruled, terracotta-on-hover — the structural unit for Writing, Experience, and Contact
- Projects renders as an asymmetric bento grid instead, and Off the Ledger as a 12-column spread — the two places the system allows shadow/elevation (see Components)
- Warm paper and cream both stay paper-like; the cream step is deliberately subtle, so the ink bands carry the contrast
- Serif display type for the hero only; monospace for every structural/label element; sans for body prose
- Zero elevation everywhere except the Projects bento grid and the Off the Ledger media — flat surfaces, ruled dividers instead of shadows
- Terracotta used at low frequency and small scale: labels, hover states, one italic word in the hero. On ink bands it steps up to Terracotta Light for contrast.

## Colors

Warm and restrained: one ink family for paper and text, one accent used mostly for marks and state, with two named exceptions where it fills a primary action (see the 60/30/10 rule below).

### Primary
- **Terracotta Ink** (#B0442A): The single accent. Used for section-number labels, hover states on rows/links/nav, the italicized word in the hero subhead, and the `::selection` highlight. Never used as a background fill for anything larger than a hairline rule.
- **Terracotta Dim** (rgba(176, 68, 42, 0.35)): Divider rules directly under the hero spec block and the top of each ledger — a slightly warmer, more present rule than the standard hairline.
- **Terracotta Glow** (rgba(176, 68, 42, 0.16)): Reserved token for accent-adjacent glow states; currently defined but lightly used — treat as available headroom, not an invitation to add new glow effects freely.
- **Terracotta Tint** (rgba(176, 68, 42, 0.045)): The near-invisible wash behind a ledger row on hover. The whole point is that it's barely perceptible — a page catching light, not a highlighted list item.

### Neutral
- **Warm Paper** (#F6F1E8): Page background, every page. Never pure white.
- **Warm Paper Card** (#FBF8F2): Slightly lighter paper used for isolated content blocks (e.g. the résumé/paper viewer chrome). Defined but used sparingly — most of the site is single-surface (no card layer).
- **Deep Ink** (#211A14): Primary text, headings, active nav state, `<strong>`/`<b>` emphasis. Never pure black. Also the fill of all three ink bands (Flagship, Writing, Contact+footer) — see Band Rhythm.
- **Mid Ink** (#5A4C40): Secondary text — descriptions, body copy in the ledger, footnotes.
- **Soft Ink** (#77675A): Tertiary text — index numbers, inactive nav links, timestamps/meta.
- **Paper Dim** (rgba(246, 241, 232, 0.72)): Warm Paper at reduced opacity — secondary/body text on ink bands, the ink-band twin of Mid Ink (8.4:1 on Deep Ink).
- **Hairline Rule** (rgba(33, 26, 20, 0.14)): Standard row and section dividers.
- **Hairline Rule Soft** (rgba(33, 26, 20, 0.085)): Interior dividers between rows within the same list, one step quieter than Hairline Rule.
- **Cream** (#EFE7D8): Exactly one step down from Warm Paper. The alternating band tone (Projects, Selected Experience). The subtlety is the point — it should register as the page shifting weight, not as a second background color. A more saturated oat was tried and rejected: with three ink bands already carrying the contrast, a loud cream made the page busy rather than warm.
- **Terracotta Light** (#D9724F): Terracotta lightened for use on ink bands — eyebrow labels, hovers, link underlines. Deep Ink puts base Terracotta at only 3.1:1, which fails body text; this clears 5.3:1. It is a tonal step of the same hue, not a second accent, and it appears **only** on ink bands.
- **Rule Inverse** (rgba(246, 241, 232, 0.14)) / **Rule Inverse Soft** (rgba(246, 241, 232, 0.08)): The ink-band twins of Hairline Rule and Hairline Rule Soft.
- **Ink Dim** (rgba(246, 241, 232, 0.55)): Tertiary text on ink bands — index numbers, meta, footer. The ink-band twin of Soft Ink (5.5:1 on Deep Ink).

### Band Rhythm

Every `<section>` is a full-bleed color band (`<main>` is unconstrained, so no `100vw` breakout trick is needed) with a `.section-inner` restoring the 68rem reading column. Three band classes: `.band-paper`, `.band-cream`, `.band-ink`.

The order, top to bottom:

| # | Section | Band |
|---|---|---|
| — | Hero | Paper (body default) |
| 1 | **Flagship** (Biotech Intelligence Engine) | **Ink** |
| 2 | Projects (bento grid) | Cream |
| 3 | **Writing** | **Ink** |
| 4 | Stack | Paper |
| 5 | Selected Experience | Cream |
| 6 | Off the Ledger (personal) | Paper |
| 7 | **Contact** + footer | **Ink** |

**The Three-Band Rule.** Exactly three ink bands, and they are spaced — near the top (right under the hero), in the middle, and at the bottom running into the footer. Two would make the page feel unbalanced; four turns a punctuation mark into wallpaper. The paper/cream sections between them alternate so no two consecutive non-ink bands share a tone.

**Ink bands invert, they don't restyle.** On an ink band every token flips to its paper-side twin — Hairline Rule → Rule Inverse, Soft Ink → Ink Dim, Terracotta → Terracotta Light. Components are not redesigned for dark; a ledger row on ink is the same ledger row with inverted tokens. All inversions live in one `.band-ink .…` block in `style.css`, so adding a section to an ink band requires no new component work.

**Section padding is symmetric.** `.section` uses `padding-block`, not `padding-top` alone. Once sections carry their own background, a top-only rule leaves content jammed against the next band's edge — this was the actual defect behind the Stack section feeling abrupt.

### Named Rules
**The One Accent Rule.** Terracotta Ink is the only saturated color anywhere in the system. Terracotta Light is a tonal step of it for ink bands, not a second hue. If a design needs a genuinely different "pop" color, that is a sign to reconsider the design, not add a token.

**The 60/30/10 Rule.** Warm Paper is the ~60% field (background, dominant everywhere). The ink family (Deep/Mid/Soft) is the ~30% — body copy, structure, hierarchy. Terracotta Ink is the ~10% — and that 10% is allowed to be *seen*, not just implied: eyebrow labels, hovers, underlines, the headline's inverted highlight block, and **two filled CTA pills — the primary CTA pill** (`.spec .cta`, "Get in touch →") **and the nav's Résumé button** (`.nav-cta`). Both are solid terracotta fill, paper-colored text — the same primary-action stamp, used in the two places a visitor actually needs to act (get in touch, get the résumé). These are named exceptions, not an open precedent: they're capped at two, both are primary actions (not decoration/badges), and a third filled element anywhere else would push past what "10%" means. If boldness is needed elsewhere, reach for type scale/weight, icon presence, or the band rhythm before reaching for another fill.

## Typography

**Display Font:** IBM Plex Serif (with Georgia, Times New Roman fallback)
**Body Font:** IBM Plex Sans (with system sans fallback)
**Label/Mono Font:** IBM Plex Mono (with system monospace fallback)

**Character:** A serif masthead against an otherwise typewriter-and-report voice. The serif appears in exactly one place — the `<h1>` hero headline (a positioning line, not the name) — with its single emphasized word set in Terracotta Ink; everything structural — nav, section headers, index numbers, meta, chips, footer — runs in mono. Body prose (descriptions, work details, the hero intro paragraph) runs in plain sans. Low-ego by design: "Hank Sha" the name appears small in the nav wordmark and once, in sans body text, at the top of the hero intro paragraph — it never runs at display scale. The big, bold, serif moment is reserved for what the work is about, not who's saying it.

### Hierarchy
- **Display** (600, `clamp(3.25rem, 11vw, 6.25rem)`, line-height 0.94, serif): The hero `<h1>` (`.hero-headline`) — the positioning line ("Broad by instinct, deep by choice."), not the name. Tight tracking (-0.032em), nearly touching line-height — a masthead, not a byline. Its single italic word runs in Terracotta Ink at the same giant scale — this is the one place a large surface of the accent color is visible on the page, and it's the site's boldest color moment by design.
- **Hero Intro** (400, `clamp(1.0625rem, 2.2vw, 1.25rem)`, sans, max 52ch, `--color-ink-2`): The paragraph under the headline — first-person, names the person ("I'm **Hank Sha**", `<strong>` in `--color-ink`) and what they do. Replaces what used to be a one-line positioning statement; this is where biography lives now, not the display line.
- **Label** (500, 0.6875–0.8125rem, mono, uppercase where noted, letter-spacing 0.04–0.15em): Nav links, section eyebrow numbers ("01", "02"), row index numbers, meta text, chip labels, footer. This is the dominant typographic voice of the page.
- **Body** (400–500, 0.875–1.0625rem, sans/mono mixed by context, line-height 1.35–1.6): Row titles (sans, 500 weight), row descriptions and work-detail prose (sans, 400 weight, ~56–65ch max width).

### Named Rules
**The One-Serif Rule.** Serif type appears in exactly one place per page: the hero headline (including its emphasized word). It is never used for the name, section headers, body copy, or UI chrome. *(Supersedes the old "Two-Serif Rule" — the name moved out of serif/display scale entirely when the hero was rebalanced to lead with positioning over identity.)*

**Low-Ego Hero.** The person's name is never the biggest thing on the page. It lives at label scale (nav) and body scale (first line of the intro paragraph) — never at display scale. What the headline says about the work always outranks who's saying it.

## Layout

Sections run full-bleed to carry their band color; content inside is a single centered column, `max-width: 68rem`, with consistent `clamp()` inline padding (`1.15rem` mobile → `3rem` desktop) shared by nav, hero, and every `.section-inner`. Vertical rhythm is generous and symmetric, driven by `clamp()` (`padding-block: 3.25rem → 5rem`), so spacing compresses gracefully on small screens without a separate mobile spacing scale.

Content is structured as **ledger rows** for Writing, Skills, and Work: each row is `grid-template-areas: "idx main meta arrow"` (index number · title+description · right-aligned meta · trailing arrow), full-bleed hairline dividers between rows. Below 720px, rows collapse to two lines (`"idx meta" / "main main"`), the trailing arrow disappears, and meta right-alignment becomes left-alignment — the ledger stays a ledger, it doesn't become a card stack.

Two sections depart from ledger rows entirely: Projects (an asymmetric bento grid) and Off the Ledger (a 12-column spread with a full-width meta band). See both under Components.

Nav is sticky, fixed 3.25rem tall at every breakpoint, transparent-to-hairline border on scroll (`.is-stuck`). No hamburger menu — the nav-list stays inline and just tightens tracking/gaps on mobile; the wordmark drops out below 720px to make room.

## Elevation & Depth

Flat by default, with two scoped exceptions. Depth and separation are conveyed entirely through **rule weight** (Hairline Rule vs. Hairline Rule Soft vs. Terracotta Dim) and **ink contrast**, the way a printed ledger uses line weight instead of drop shadows to separate sections — everywhere except the Projects bento grid and the Off the Ledger media.

### Named Rules
**The Flat-By-Default Rule.** No element outside the two named exceptions ever lifts, floats, or casts a shadow. A ledger row's only "hover elevation" is the terracotta tint wash and a 4px arrow nudge — both in-plane, nothing leaves the surface.

**The Projects Elevation Exception.** The bento grid's tiles (`.bento-tile`) carry a resting `box-shadow` (soft, offset, black-based — never a colored halo) that deepens and lifts the tile 3px on hover. This is a deliberate departure from Flat-By-Default, scoped to a single section, because the bento layout's asymmetric tiles read as a grid of objects rather than ruled rows — shadow separates them the way rule weight separates a ledger.

**The Loose Page Exception.** In Off the Ledger only, and only for the two photographic objects — the portrait deck and the album sleeves — the system relaxes: soft corners, a warm-ink drop shadow (`--shadow-print`), and a fraction of rotation off the page's axis. They read as prints laid on the page rather than surfaces printed into it, and hovering one straightens it and lifts it clear (`--shadow-print-lift`).

The portrait is a *deck* of three prints, not one photo (`.portrait-deck` / `.portrait-card`, `src/portrait-deck.ts`). It is still one object under this exception — three cards in one frame, cycling — not a third exception. Two rules keep it that way: every card carries a `0.6rem` paper border (`--color-card`), so what shows past the top card is a print's own edge rather than a slice of whatever image is beneath it; and no card tilts more than ~3° from the top card, because past that its corner swings further than the paper edge is wide and its photograph shows through as a colored sliver that reads as a rendering fault. Stack positions live in CSS keyed off `data-pos`; the module only reassigns which card holds which position.

*Why this is allowed here and nowhere else:* the section's whole premise is that it is the material the record doesn't hold. It is the one place the ledger is supposed to loosen, and the objects doing the loosening are physical reproductions, not UI. Everything typographic in the section stays strictly on-grid — the tilt is confined to the media, which is what keeps it reading as deliberate rather than as a broken layout. Extending shadow, rotation, or soft corners to a third element, or to type, ends the exception and starts a habit.

Between them, these two account for every `box-shadow` and every `rotate()` on the page. A third is a design decision, not a detail.

## Motion

Powered by [Motion](https://motion.dev) (`src/main.ts`), used sparingly and only where it communicates something real — never decoration for its own sake.

- **Hero entrance**: headline, intro paragraph, and spec table fade/rise in on load, staggered ~90ms apart (`initHeroEntrance`).
- **Typed availability line** (`initTypewriter`): the hero spec's "Open to —" value types through four things Hank is open to, holds each ~2.4s, deletes, and moves on. **This is the page's one authored motion moment.** It sits in the mono spec table because the whole site is a typewritten ledger — the effect is the house voice, not a widget. It starts ~2.2s in so it doesn't compete with the hero entrance and so its shipped value can be read before it erases; it stops when the tab is hidden or the hero scrolls out of view. The element ships with real text in the HTML, so no-JS and reduced-motion both see a true line. The typed span is `aria-hidden` with an `.sr-only` sibling carrying the same content as one static string — a live region stuttering a character at a time is worse than no animation.
- **Nav underline wipe**: `.nav-link::after` scales in from its left edge on hover and out toward its right (`transform-origin` flips between the two states), so the rule reads as a pen stroke following the cursor rather than a bar switching on. The active link parks the same rule at full width from the left. `.nav-mark` carries the identical wipe in ink rather than terracotta.
- **Scroll reveal**: ledger rows and stack columns fade/rise in, staggered ~60ms apart, the first time their section crosses 10% into the viewport (`initScrollReveal`). Sections are visible-by-default in CSS — JS only hides a row the instant before it schedules that row's reveal, so a JS failure never leaves content invisible.
- **Magnetic CTA**: the hero pill button (`.spec .cta`) nudges up to 6px toward the cursor on `pointermove`, springs back on `pointerleave`. Fine-pointer devices only (`(pointer: fine)`) — never on touch. There is one such button in the markup; `.cta-outline` has styling but no instance.
- **Loose Page straightening**: hovering the portrait deck's top card or an album sleeve rotates it back to level and lifts it (see the Loose Page Exception). The border and shadow half of that hover is unconditional; only the transform sits behind `prefers-reduced-motion: no-preference`, so the state is never invisible — it just doesn't travel.
- **Portrait deck cycling** (`initPortraitDeck`): the top print moves to the back every 6s, and on click. It is the page's second timed motion and the only one the visitor can operate, which is what earns it: it runs *only* while the deck is on screen, pauses while a pointer or keyboard focus rests on it, and never auto-runs under reduced motion — where click still cycles, it just arrives instead of travelling. The timer re-arms after each turn rather than running on an interval, so a backgrounded tab doesn't deliver a backlog of turns at once when you come back to it.

**One easing curve.** `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`) is the page's only authored curve, in CSS *and* in JS — `EASE_OUT` in `src/main.ts` is the same curve in the tuple form motion wants, and the two have to stay in step. Everything arrives on the same clock; a second curve would need a reason a visitor could feel.

*This rule was broken for a long time in a way that is easy to reintroduce.* `main.ts` shipped `[0.22, 1, 0.36, 1]` against the stylesheet's `cubic-bezier(0.16, 1, 0.3, 1)`, so every JS entrance eased differently from the CSS transition it handed off to; and 20 of the stylesheet's 29 `transition` declarations used the bare `ease` keyword rather than `var(--ease-out)`. Both are invisible one at a time and unmistakable in aggregate. **Never write a bare `ease` in a `transition`** — the token is the only correct value.

**Never write a global `transition` rule.** A leftover `html.theme-ready *, *::before, *::after { transition: background-color, color, border-color, box-shadow }` from the pre-ledger dark design sat in `style.css` for a long time. It switched nothing — there is no theme toggle — but at specificity (0,1,2) it outranked and *replaced* every component's own `transition`, so **nothing on the page could animate `transform` at all**: the nav underline snapped instead of wiping, the row arrow teleported its 4px, the work toggle's `+` jumped to its cross, and the media straightening was instant. All of it looked "fine", which is why it survived so long — a transition that silently doesn't run reads as a design choice. Transitions belong on the component that owns the state. If a global rule ever becomes necessary, scope it to specific properties and elements and keep `transform` out of it.

### Named Rules
**The Purposeful Motion Rule.** Every animation maps to something real: reading progress, entrance order, cursor proximity, a value that genuinely changes. If a motion effect doesn't encode information the user can read, cut it — the "Flat-By-Default" system does not become an invitation for gratuitous motion just because a library is available.

**One Authored Moment.** The typed availability line is it. Everything else is feedback (hover, focus) or entrance order (stagger). Adding a second thing that runs on its own timer competes with it rather than adding to it.

**Reduced Motion Is Off, Not Slow.** `prefersReducedMotion()` is checked before hero entrance, the typed line, scroll reveal, and magnetic buttons ever hide, type, or bind anything — reduced-motion visitors get the finished, static layout, not a faster version of the same animation. CSS-side, the caret's blink is switched off and hover transitions collapse to instant; the media's resting tilt stays, because a static rotation is a style, not motion.

## Shapes

**Objects are rounded. Structure is not.** This reverses the system's original rule — sharp-cornered by default, with radius reserved for photographic media. The distinction that replaced it is not decorative: an *object* is a thing sitting on the page, and it gets a radius; *structure* is the page itself — full-bleed colour bands, hairline rules, the edges of the viewport — and it stays square. A rounded full-bleed band just leaves paper showing in its corners, and a rounded ledger rule stops reading as a ruled line.

**Radius reads optically, so the scale is sized to the surface**, not chosen from a menu. 3px on a 22px chip and 12px on a 300px tile are the same softness to the eye; one value across both makes the large surface look sharper than the small one sitting beside it.

| Token | Value | Surfaces |
|---|---|---|
| `--radius-xs` | 3px | Chips and tags (`.chip-preferred`), ~20–24px tall |
| `--radius-sm` | 5px | Controls: `.copy-email`, `.viewer-btn`, `.viewer-download`, `.skip-link` |
| `--radius-md` | 7px | Mid surfaces: album sleeves, `.gist-grid`, the PDF canvas, hover panes |
| `--radius-lg` | 12px | Large surfaces: `.bento-tile`, the Off the Ledger portrait deck |
| `--radius-pill` | 9999px | The two filled CTA pills — stamped tokens, not page furniture |

**Rounded frames clip their contents.** `.gist-grid` and the album sleeves set `overflow: hidden`, so internal dividers and images clip to the rounded frame instead of squaring off the corners the border just rounded. The portrait cards need no clip — they *are* images, and their paper border rounds with them.

**The ledger rows are the one place the two rules meet.** A row's hover tint is an object; the hairline beneath it is structure. So the tint is a rounded `::before` pane inset `0 0 1px` — it stops a pixel short of the rule — rather than a background on the row itself, which would have bent the rule with it. `.row` and `.work-header` carry `isolation: isolate` so that pane's `z-index: -1` stays inside the row and paints under the content but over the band. Same treatment on both, for the same reason.

What stays square: the colour bands, every hairline rule, section boundaries, and the page edge.

## Components

### Ledger Row (signature component)
The core structural unit of most of the site — Writing, Skills, and Work render as ledger rows, not distinct card components. Projects is the one exception (see Bento Grid below).
- **Shape:** No radius; full-bleed hairline bottom border (`Hairline Rule Soft`), last row in a list gets the stronger `Hairline Rule`.
- **Layout:** `idx / main / meta / arrow` grid; index number in Soft Ink mono, title in Deep Ink sans (500), description in Mid Ink sans, meta right-aligned mono in Soft Ink, trailing `→` in a faint ink tint.
- **Hover:** Background washes to Terracotta Tint; title and arrow shift to Terracotta Ink; arrow nudges 4px right. A `.row-static` variant (no link) explicitly suppresses this — hovering it does nothing, signaling non-interactivity.

### Navigation
- Sticky, mono labels in Soft Ink; hover/active state shifts to Deep Ink with a 1.5px Terracotta underline (active = current section via scroll-spy).
- **The underline is directional.** It wipes in from the left on hover and out toward the right on leave — one rule with `transform-origin` flipped between the two states. A centre-out scale reads as a bar switching on; the wipe reads as a pen stroke. Same treatment on `.nav-mark`, drawn in ink rather than terracotta since the wordmark is a destination, not a section marker.
- Mobile: wordmark hides, gaps and tracking tighten, no overlay/hamburger — the same inline list just gets denser.
- **Six items is the mobile ceiling.** Below 720px, Home and Stack drop out (Home is covered by the wordmark; Stack is reference material rather than a destination), leaving Projects · Writing · Work · About · Contact · CV. Below 360px a final density step tightens gaps and type. Verified to fit without clipping the CV pill at 320/360/390/420px — **re-measure at 320px before adding a seventh nav item**, since the list has no overflow affordance and the pill clips silently.

### Section Header
- **Structure:** `<h2><span>05</span>Off the Ledger</h2>` in mono, uppercase, `0.15em` tracking.
- **Two-tone by rule:** the index number takes the accent (Terracotta, or Terracotta Light on ink bands) and the label runs in the primary text ink (Deep Ink, or Warm Paper on ink bands). They are never the same color — the number should read as a red-pen index mark against a written label, not as one uniform terracotta string. Verified: Terracotta on Warm Paper is 5.0:1, on Cream 4.6:1, Terracotta Light on Deep Ink 5.3:1.

### Chips
- **Does not exist.** This entry described a bordered chip for the Stack section's tool lists; no markup ever used it. Stack renders as bare `<li>` with small square Terracotta markers — see *Stack Columns* below, which is the accurate description. Kept here as a marker so the component isn't reinvented from a stale doc entry.

### Focus Ring
- **Shape:** `2px solid`, Terracotta Ink, `outline-offset: 3px`. Terracotta Light inside `.band-ink` — base Terracotta measures 3.03:1 there, below the 3:1 floor for a UI indicator.
- **Scope:** One ring for every focusable on every page, declared once as `:where(a, button, [tabindex]):focus-visible` so any component with its own authored ring still wins on specificity. Focus is a state, and marks-and-hovers is what the accent is for.
- **Two containers take the ring instead of the link:** `.bento-tile` and `.flagship-lead`. Both wrap a title anchor carrying a full-block `::after` overlay, so the anchor's own border box is just the title text — a ring there boxes a few words inside a 405px tile and leaves the focused target ambiguous. `:has(a:focus-visible)` moves it to the box the overlay actually covers, and the anchor's own outline is set to `none`.
- **Why it's a named component:** it used to be six authored rings and twenty-six fall-throughs to Chrome's default `rgb(0, 95, 204)` — the loudest off-palette color on a page whose whole identity is monochrome-plus-one-accent, and worse, two different focus vocabularies depending on which control you tabbed to. A focus indicator is part of the visual system, not an accessibility afterthought bolted to the end of it.

### Social Icon Link
- **Shape:** A 14–15px monoline SVG (stroke `currentColor`, stroke-width 1.75, matching the glyph language already established on the résumé/paper-viewer utility pages) inline before the text label, `0.4–0.55rem` gap.
- **Where:** The Contact section's ledger rows (GitHub, LinkedIn, Medium-as-pen, Email, Résumé-as-document) — the hero used to duplicate this list in an "Index" row; that row was removed since the Contact section is the single source of truth for socials and the hero's CTA pill already routes there.
- **State:** Icon defaults to a slightly dimmed ink tone (Soft Ink / 0.75 opacity) and sharpens to full Terracotta Ink together with its label on hover/row-hover — the icon never carries color on its own, it rides the existing link/row hover state.

### Primary CTA Pill (the two filled surface exceptions)
- **Shape:** Fully rounded, solid Terracotta Ink background, Warm Paper text.
- **Hover:** Background shifts to Deep Ink, lifts 1px — the fill stays solid, it just darkens rather than washing out.
- **Instances:** The hero's "Get in touch →" (`.spec .cta`, in the Contact spec row) and the nav's "Résumé" (`.nav-cta`, last item in `.nav-list`, smaller/denser to fit the nav's fixed height — no `↗`, since `↗` marks leaving the site and `/resume` does not). Same visual language, two contexts.
- **Rule:** Capped at these two (see the 60/30/10 rule above). Don't reuse this fill for a third button or a badge.

### Flagship Band
- **Shape:** The first ink band, sitting directly under the hero. Two uneven columns on Deep Ink (`1.35fr / 1fr`, bottom-aligned). Left: Terracotta Light mono eyebrow ("Flagship · Live"), a large title (`clamp(1.875rem, 4.5vw, 3rem)`, capped at 20ch so it wraps to two lines), one description line, an underlined CTA. Right: a spec table in the hero's key/value voice, stacked label-over-value because the column is too narrow for side-by-side. One column below 860px.
- **Why two columns:** as a single left block it left ~55% of a full-bleed dark band empty — the flagship *asserting* it was the flagship with no evidence in it, in the first slot after the hero on a surface where the artifact is supposed to lead. The right column is a reserved artifact slot: add an img with class `flagship-art` ahead of the spec and the spec falls underneath it, no re-layout.
- **The column also bounds the click target.** `.flagship-title a::after` is `inset: 0` against `.flagship-lead`, not against the band. Positioned against the band it measured 1088×258 and covered the empty half, so clicking apparently-blank dark space navigated off-site.
- **Why it's a band, not a tile:** The one project with real live usage gets the page's first color break to itself. Inside the Projects grid it was one tile among tiles; as a band it's the first thing after the hero and reads as a headline act.
- **Interaction:** The whole band is one click target (`::after` overlay on the title link, same pattern as `.row-title a`); the CTA underline shifts to Terracotta Light on band hover.

### Projects Bento Grid
- **Shape:** A 3-column, 3-row CSS grid (`.bento`) of six tiles at desktop, named by `grid-template-areas`: the PID Steering research tile anchors a 2×2, two small tiles stack beside it, three close the bottom row. Collapses to a 2-column grid at 900px, then a single flex column (source order) below 720px.
- **Surface:** Tiles use Warm Paper Card on the Cream band, so they lift off their background rather than blending into it.
- **Elevation:** Every `.bento-tile` carries a resting shadow and lifts 3px with a deeper shadow on hover (see "The Projects Elevation Exception" above) — the one place the system uses elevation instead of rule weight to separate content.
- **Anchor tile** (`.bento-pid`): The 2×2 gets a larger title to match its extra area. No color change — area and type scale carry the emphasis, not a fill.
- **Anchor spec** (`.bento-spec`): Four ruled key/value rows filling the 2×2's extra area, mono uppercase Terracotta labels against sans values, one hairline per row. `align-content: space-between` — the tile's height is set by the two tiles stacked beside it, not by anything inside it, so a start-aligned list leaves whatever is left over as a hole above the foot rule; spreading the rows turns that slack into the table's own spacing. **Area is this tile's emphasis mechanism, so the area has to carry something.** Before the spec existed the tile ran 405px tall with content ending at y≈105 — roughly 225px of void in the most-emphasized project on the page, which reads as unfinished rather than important. Values come from the paper's own abstract, caveat included; verify against `/assets/global-pid-steering.pdf` before editing a number. An img with class `bento-art` above the list takes the room instead.
- **Static tile** (`.bento-static`): For content with no link yet (the topological-signatures research write-up) — no hover lift or shadow deepening, mirroring `.row-static`'s non-interactive signal.

### Favicon
- **Artwork:** Warm Paper ground, Terracotta `HS` set in IBM Plex Mono 600, a Terracotta hairline border at 40% and one short Terracotta rule beneath the initials — the ledger's own three ingredients at 64px. Square-cornered, matching the system default. The previous violet-to-pink gradient on near-black belonged to the pre-ledger design and matched nothing on the page.
- **Sized for 16px.** The initials fill most of the tile because at a browser tab's real size the border and rule read as texture, not detail — the mark has to carry it alone. Check any change at 16px before 192px.
- **Regeneration:** `bash scripts/favicons.sh` rasterises `public/favicon.svg` into the three PNG fallbacks (32, 180, 192). It drives a headless browser rather than a fontconfig rasteriser on purpose: IBM Plex Mono is self-hosted, not installed, so `rsvg-convert`/ImageMagick silently substitute another mono face and the PNGs stop matching the SVG. The artwork is duplicated in `scripts/favicon-render.html` because an SVG inside an `<img>` can't see the page's webfont — **edit both together.**
- `site.webmanifest`'s `theme_color`/`background_color` and the `<meta name="theme-color">` all carry Warm Paper. They're part of the mark; a stale value there shows as a dark browser chrome strip on mobile.

### Contact Pill Button
- **Does not exist.** Described here as a fully-rounded bordered pill with a 44px target and a translate-on-hover; the Contact section renders as ledger rows (measured: `padding: 0`, `border-radius: 0`, 23–28px tall). Same class of stale entry as *Chips* above. Kept as a marker, not a spec — if Contact ever needs a pill, that is a new decision, not the recovery of an old one.

### Off the Ledger (personal section)
- **Name:** The section's own pun — the site is a ledger, so this is the material the record doesn't hold. It's the one section header that isn't a plain noun, and that's deliberate: it's the one section that isn't about the work.
- **Layout:** A 12-column spread, not two columns. Media in columns **1–4**, prose in **6–12**, and the meta rows running **full width underneath** as a footer band. Column 5 is deliberately empty. Collapses to a single stacked column at 900px, media first.
- **Why a spread and not two columns:** Two equal-weight columns of equal-weight content is exactly what made this section read as uniform — a rectangle stacked on a rectangle facing a wall of three identically-set paragraphs, both ending flush. The spread breaks that four ways: an uneven column split, an empty gutter, a ruled margin the prose hangs off, and a horizontal band closing the section. **This is the one section on the page laid out as a composition rather than as a list.** Every other section is a ledger or a grid, and should stay one.
- **The ruled margin:** `.personal-main` carries a `border-left` hairline and hangs its text off it at `--prose-gutter`. That single custom property is shared by the rule, the pull quote's outdent, and the meta band's cell dividers, so all three measure from the same place. Change it once.
- **Why media is consolidated:** Splitting images across both columns (photo one side, album art the other) reads as two unrelated decorations. Grouped, the left column is a single "who this is" panel and the right column is the voice. It also keeps the section from resembling the common portfolio arrangement of prose-left / headshot-right.
- **Column balance is automatic:** `.personal-media` is a grid with rows `minmax(0, 1fr) auto`, so the portrait absorbs whatever height the prose column ends up being and the two columns always end flush. No ratio to re-tune when the copy changes.
- **Portrait deck** (`.portrait-deck` / `.portrait-card`): Three prints stacked in one frame, cycling every 6s and on click — see *The Loose Page Exception* for why it stays one object, and *Motion* for the cycling rules. Stretches to the row height (`align-items: stretch` + `height: 100%` + `object-fit: cover`) rather than holding a fixed `aspect-ratio`. A pinned ratio had to be re-tuned every time the left column gained content (square → 4:5 → …) and drifted out of balance again each time; stretching removes that failure mode permanently. The crop is centered, so **source images should be portrait-orientation with the subject near the middle** — all three are pre-cropped to 3:4 at 840×1120 WebP, so cover-cropping only ever trims edges. Below 900px the grid is single-column with nothing to stretch against, so it falls back to a fixed 4:5. Softly rounded at `--radius-soft-lg`, top card tilted −0.9° with a print shadow; hovering the deck straightens the top card only.
  - **It is a `<button>`, not a div.** The timer is an offer; the deck has to be operable by click and by keyboard, or photos 2 and 3 are hostage to a visitor waiting out an animation. The button carries the accessible name for whichever print is on top (updated with the state), so the images take `alt=""` — three alts on one stack announces three photos where a sighted visitor sees one.
  - **Frame number** (`.portrait-idx`): `01/03` in mono, stamped in the top card's bottom-right on the card's own tilt, on a 72% ink plate. The plate isn't decoration — the prints run from a bright sandstone wall to a near-black silhouette, and nothing else holds contrast across all three. It says how many prints there are without a dot row or an icon, and it is the one number on the page that counts something the reader can act on.
- **Album covers** (`.albums`): Three sleeves under the portrait, each linking to the album on Spotify, **shingled rather than set in an even row**: they overlap ~13%, lean at hand-set angles (−3.2° / +1.4° / −1.1°), and run a little past the column's right edge into the empty gutter. Records leaning in a crate — which is also what stops the media column from reading as two stacked rectangles. Softly rounded (`--radius-soft`), see Shapes. Hovering one straightens it, lifts it 7px, scales it 1.05, and raises it above its neighbours; the others stay put, so the stack reads as a physical thing being pulled from rather than a row of buttons.
- **Source order is visual order.** The shingle is built from negative margins and `z-index`, never a reversed `flex-direction`, so tab order still walks the sleeves left to right. Angles are hand-set for the same reason the overlap isn't generated: an even sequence reintroduces the regularity the shingle exists to break.
- **Covers are self-hosted, never hot-linked.** `scripts/album-covers.sh` takes a Spotify album URL, reads the cover from Spotify's oEmbed endpoint, upgrades it to the larger CDN variant (the size is encoded in the image path), resizes to 400px, converts to WebP into `public/assets/albums/`, and prints the markup. This keeps the page at **zero third-party requests**, the same reason the fonts are self-hosted (see the note atop `style.css`).
- **400px, not 640px.** Tiles render ~175px wide, so 400px covers a 2x display with headroom. Shipping the full 640px original roughly tripled the weight of detailed artwork (one cover went 84KB → 26KB) for resolution no screen resolves. Re-check this if the grid ever gets wider.
- **Spotify embeds were considered and rejected:** several hundred KB and third-party cookies per iframe against a ~31KB gzipped page, plus a rounded Spotify-green widget that fights the palette.
- **Meta rows:** Reuses the hero's `.spec` `dt`/`dd` tokens rather than introducing a second key-value pattern — same Terracotta mono label, same hairline separators — but runs them **across the foot of the spread as three ragged-width cells**, label above value, with vertical hairlines between. Rows: **Outside work · Music Taste · On the desk**. Each is one line to edit, values separated by ` · `, so the list grows without a layout change.
- **The band's columns size themselves.** `minmax(0, max-content) minmax(0, max-content) minmax(0, 1fr)` — the first two cells take their natural single-line width and the last absorbs the remainder, so longer copy re-balances the band instead of needing a new hand-tuned ratio, and all three shrink and wrap rather than overflow once the row runs out of room. **Don't replace this with even thirds**: three equal cells re-introduce the exact rhythm the section was redesigned to lose.
- **Hyphens in values break lines.** `Hip‑hop` uses a non-breaking hyphen (U+2011) because a plain one is a break opportunity and split the word across two lines in the narrow middle cell. Any new hyphenated value needs the same treatment.
- **Prose has three weights, not one.** A lead line (`.personal-lead`, one step up, Deep Ink, ~30ch) opens the section; body paragraphs (`.personal-note`) carry it; and one line is promoted to a pull quote (`.personal-pull`) that outdents clear through the ruled margin into the gutter, marked by a 1px terracotta stub sitting *outside* the spine. The outdent is what makes it read as pulled — the mark alone isn't enough, and a mark sitting on the spine just doubles the rule. This is the only place on the page where a line of type steps outside its own column.
- **The pull quote's paper background is structural.** Outdenting past the spine puts the ruled margin *behind* the quote, where the hairline strikes through the first character of every line — that reads as a rendering fault, not as structure. An opaque `--color-paper` block on the quote interrupts the rule for exactly this passage, so the spine steps aside for the one thing that breaks out of the column. It couples the quote to Off the Ledger sitting on the paper band; move the section to another band and this moves with it. Below 900px the outdent is dropped entirely (the column gap is narrower than the outdent, so the quote would reach into the portrait instead of into empty space) and the terracotta mark carries it alone.
- **Label voice:** The labels are deliberately not the generic ones ("Hobbies", "On repeat", "Reading"). They should sound like this person keeping a log, not like a template. Any new row should be named in that same register.
- **Italics are faux here.** IBM Plex Mono ships no italic in the loaded weights, so `<em>` (used for book titles) is browser-synthesized. Checked at render and it holds up at this size — not worth a ~14KB font file for one string. If italics ever spread beyond the odd title, load `ibm-plex-mono/latin-400-italic` rather than letting synthesis carry it.
- **Unfilled values** carry a `.pending` class (italic, Soft Ink) so a placeholder can never be mistaken for real content — this section is all first-person claims, and a plausible-looking fake would be worse here than an obvious gap. Currently unused; keep it for the next row added before its value is known.
- **Voice:** First person, and the only reflective prose on the site outside the hero intro. Three short paragraphs; this section earns its place by being brief.

### Stack Columns
- **Shape:** Five columns, no boxes and no borders. Each column is a mono uppercase label in Terracotta with an index number, a hairline rule directly under the label, and a bulleted list with small square Terracotta markers.
- **Rule:** No container box. Boxing five short, ragged-length lists made the section read as five cramped containers instead of one grouped index — the label's own underline is the only boundary a column needs. Column gap is `2rem 1.75rem`, roughly a third more than the old boxed layout, since the lists now need their own separation rather than borrowing it from a border.
- **Responsive:** 5 columns → 3 at 900px → 2 at 720px.

### Expandable Work Row
- A `<button>` header (not a generic row) with the same idx/main/meta grid as a ledger row, toggling a `.work-detail` panel via `data-expanded`.
- The `+` toggle glyph rotates 45° to become a `×`-like cross on expand. Expanded content includes a bordered 3-column "gist grid" (stats/summary) and `>`-prefixed bullet lists in Terracotta Ink markers.

## Do's and Don'ts

### Do:
- **Do** keep the accent to marks and hovers by default — labels, underlines, index numbers, `::selection`. The two CTA pills and the headline's highlight block are the named exceptions, not a pattern to extend.
- **Do** use mono for anything structural or numeric (nav, index numbers, meta, chips, labels); sans for prose; serif only for the hero headline and its one highlighted word (see the One-Serif Rule) — never for the name.
- **Do** separate content with rule weight (Hairline Rule / Hairline Rule Soft / Terracotta Dim), not shadows or elevation.
- **Do** keep row hover feedback in-plane (tint wash, color shift, small arrow nudge) — nothing lifts off the page except the explicit pill-button exceptions.

### Don't:
- **Don't** add `box-shadow`, `rotate()`, card elevation, or gradients outside the two named exceptions — the Projects bento grid and the Off the Ledger media. Every other section stays flat and square to the page.
- **Don't** carry the Loose Page treatment into another section, or onto type. It works because it's confined to two photographic objects in the one section that isn't about the work — the portrait deck counts as one object, not three; applied twice it stops being an exception and becomes the system.
- **Don't** leave a secondary page off the system. `/resume`, the three résumé viewers and `/pid-steering` all wear the `.viewer` / `.utility` chrome. `pid-steering.html` was the last holdout on raw Tailwind — `rounded-lg` off the radius ramp, `backdrop-blur` on a fixed header, `bg-ink/5` fills, a 56px `rounded-full` floating download button, a flat 12/14/16/18px ramp — and it is the destination of the Projects grid's own anchor tile, so it undid the ledger on a visitor's first click off the homepage. A page that carries the palette and none of the identity is worse than one that looks unrelated: it reads as the same site giving up.
- **Don't** introduce a second saturated accent color; if something needs to "pop," reconsider the layout instead.
- **Don't** add a filled/backgrounded terracotta element beyond the named ones (60/30/10 rule); everywhere else the accent marks, it doesn't fill. The named set is: the two CTA pills (`.spec .cta`, `.nav-cta`), the hero headline's highlight block (`.hero-headline em`), the typed line's caret (`.typeline-caret`), and the skip link (`.skip-link`). The last two are marks-not-surfaces and the skip link is focus-only, which is why they don't count against the ratio — but they are terracotta fills, and this list is the whole set. A sixth is a decision, not a detail.
- **Don't** add a fourth ink band, or bunch the existing three together — see the Three-Band Rule. A new section joins the paper/cream alternation.
- **Don't** restyle components for ink bands. Add the inversion to the existing `.band-ink` block instead; a component that needs bespoke dark styling is a sign the component is wrong, not that dark is hard.
- **Don't** use base Terracotta (#B0442A) on an ink band — it fails contrast at 3.1:1. Terracotta Light is the ink-band accent.
- **Don't** give `.section` a top-only padding again; bands need symmetric `padding-block` or content collides with the next band's edge.
- **Don't** round corners by default; the pills and album covers are the named exceptions (see Shapes), not a precedent.
