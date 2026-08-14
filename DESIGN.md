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

This is a researcher's logbook rendered as a website: numbered entries, terse monospace labels, hairline rules standing in for ruled paper, and a single terracotta ink used sparingly for annotation — never for decoration. Nothing on the page exists to look nice; every mark (an index number, a section rule, an uppercase mono label) carries information about what it's attached to. The system is flat by construction: no shadows, no gradients, no rounded cards. Depth comes from ink weight and rule contrast, not elevation.

The palette stays warm and paper-like throughout (`#F6F1E8` background, near-black warm ink for text), so the terracotta accent (`#B0442A`) reads as a rubber-stamp or red-pen mark against the page rather than a "brand color" wash. Confirmed rejection: no drop shadows, no card elevation, no saturated multi-color palette — the identity is monochrome-plus-one-accent, and that restraint is load-bearing, not a placeholder.

**Key Characteristics:**
- Ledger rows: numbered, hairline-ruled, terracotta-on-hover
- Warm paper background with near-black ink text (never pure black/white)
- Serif display type for the name/hero only; monospace for every structural/label element; sans for body prose
- Zero elevation — flat surfaces, ruled dividers instead of shadows
- Terracotta used at low frequency and small scale: labels, hover states, one italic word in the hero

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
- **Deep Ink** (#211A14): Primary text, headings, active nav state, `<strong>`/`<b>` emphasis. Never pure black. Also the background of the Project Spotlight (see Components) — the one section on the page that inverts to dark; everywhere else it's text, never a fill.
- **Mid Ink** (#5A4C40): Secondary text — descriptions, body copy in the ledger, footnotes.
- **Soft Ink** (#77675A): Tertiary text — index numbers, inactive nav links, timestamps/meta.
- **Paper Dim** (rgba(246, 241, 232, 0.72)): Warm Paper at reduced opacity, used only inside the dark Spotlight as its secondary/body text color — the dark-mode equivalent of Mid Ink.
- **Hairline Rule** (rgba(33, 26, 20, 0.14)): Standard row and section dividers.
- **Hairline Rule Soft** (rgba(33, 26, 20, 0.085)): Interior dividers between rows within the same list, one step quieter than Hairline Rule.

### Named Rules
**The One Accent Rule.** Terracotta Ink is the only saturated color anywhere in the system. If a design needs a second "pop" color, that is a sign to reconsider the design, not add a token.

**The 60/30/10 Rule.** Warm Paper is the ~60% field (background, dominant everywhere). The ink family (Deep/Mid/Soft) is the ~30% — body copy, structure, hierarchy. Terracotta Ink is the ~10% — and that 10% is allowed to be *seen*, not just implied: eyebrow labels, hovers, underlines, the headline's inverted highlight block, and **two filled CTA pills — the primary CTA pill** (`.spec .cta`, "Get in touch →") **and the nav's Résumé button** (`.nav-cta`). Both are solid terracotta fill, paper-colored text — the same primary-action stamp, used in the two places a visitor actually needs to act (get in touch, get the résumé). These are named exceptions, not an open precedent: they're capped at two, both are primary actions (not decoration/badges), and a third filled element anywhere else would push past what "10%" means. If boldness is needed elsewhere, reach for type scale/weight, icon presence, or the one dark Spotlight section before reaching for another fill.

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

Single centered column, `max-width: 68rem`, consistent `clamp()` inline padding (`1.15rem` mobile → `3rem` desktop) shared by nav, hero, and every section — nothing breaks out to full width. Vertical rhythm is generous and driven by `clamp()` (e.g. section top padding `3rem → 4.75rem`), so spacing compresses gracefully on small screens without a separate mobile spacing scale.

Content is structured as **ledger rows**, not cards or a grid of tiles: each row is `grid-template-areas: "idx main meta arrow"` (index number · title+description · right-aligned meta · trailing arrow), full-bleed hairline dividers between rows. Below 720px, rows collapse to two lines (`"idx meta" / "main main"`), the trailing arrow disappears, and meta right-alignment becomes left-alignment — the ledger stays a ledger, it doesn't become a card stack.

Nav is sticky, fixed 3.25rem tall at every breakpoint, transparent-to-hairline border on scroll (`.is-stuck`). No hamburger menu — the nav-list stays inline and just tightens tracking/gaps on mobile; the wordmark drops out below 720px to make room.

## Elevation & Depth

Flat, deliberately. There is no `box-shadow` anywhere in the system except the loading spinner's rotation (not a shadow). Depth and separation are conveyed entirely through **rule weight** (Hairline Rule vs. Hairline Rule Soft vs. Terracotta Dim) and **ink contrast**, the way a printed ledger uses line weight instead of drop shadows to separate sections.

### Named Rules
**The Flat-By-Default Rule.** No element ever lifts, floats, or casts a shadow. A row's only "hover elevation" is the terracotta tint wash and a 4px arrow nudge — both in-plane, nothing leaves the surface.

## Motion

Powered by [Motion](https://motion.dev) (`src/main.ts`), used sparingly and only where it communicates something real — never decoration for its own sake.

- **Hero entrance**: headline, intro paragraph, and spec table fade/rise in on load, staggered ~90ms apart (`initHeroEntrance`).
- **Scroll reveal**: ledger rows and stack columns fade/rise in, staggered ~60ms apart, the first time their section crosses 10% into the viewport (`initScrollReveal`). Sections are visible-by-default in CSS — JS only hides a row the instant before it schedules that row's reveal, so a JS failure never leaves content invisible.
- **Magnetic CTAs**: the two hero pill buttons (`.spec .cta`) nudge up to 6px toward the cursor on `pointermove`, spring back on `pointerleave`. Fine-pointer devices only (`(pointer: fine)`) — never on touch.

### Named Rules
**The Purposeful Motion Rule.** Every animation maps to something real: reading progress, entrance order, cursor proximity. If a motion effect doesn't encode information the user can read, cut it — the "Flat-By-Default" system does not become an invitation for gratuitous motion just because a library is available.

**Reduced Motion Is Off, Not Slow.** `prefersReducedMotion()` is checked before hero entrance, scroll reveal, and magnetic buttons ever hide or bind anything — reduced-motion visitors get the finished, static layout, not a faster version of the same animation.

## Shapes

Sharp corners everywhere except one deliberate exception: the small pill-shaped `.contact-link` icon buttons on the résumé/paper-viewer utility pages (`border-radius: 9999px`), which read as stamped tokens rather than page furniture. Every other surface — rows, chips, the gist grid, inputs — is square-cornered with a 1px hairline border where a boundary is needed at all. No clipping, no overflow masking beyond ordinary text truncation.

## Components

### Ledger Row (signature component)
The core structural unit of the whole site — Projects, Writing, Skills, and Work all render as ledger rows, not distinct card components.
- **Shape:** No radius; full-bleed hairline bottom border (`Hairline Rule Soft`), last row in a list gets the stronger `Hairline Rule`.
- **Layout:** `idx / main / meta / arrow` grid; index number in Soft Ink mono, title in Deep Ink sans (500), description in Mid Ink sans, meta right-aligned mono in Soft Ink, trailing `→` in a faint ink tint.
- **Hover:** Background washes to Terracotta Tint; title and arrow shift to Terracotta Ink; arrow nudges 4px right. A `.row-static` variant (no link) explicitly suppresses this — hovering it does nothing, signaling non-interactivity.

### Navigation
- Sticky, mono labels in Soft Ink; hover/active state shifts to Terracotta Ink (hover) or Deep Ink with a Terracotta Ink underline (active, current section via scroll-spy).
- Mobile: wordmark hides, gaps and tracking tighten, no overlay/hamburger — the same inline list just gets denser.

### Chips
- **Style:** No fill, 1px Hairline Rule border, mono text in Mid Ink, small uppercase-free label. Used for the Skill Map's grouped tool lists.

### Social Icon Link
- **Shape:** A 14–15px monoline SVG (stroke `currentColor`, stroke-width 1.75, matching the glyph language already established on the résumé/paper-viewer utility pages) inline before the text label, `0.4–0.55rem` gap.
- **Where:** The Contact section's ledger rows (GitHub, LinkedIn, Medium-as-pen, Email, Résumé-as-document) — the hero used to duplicate this list in an "Index" row; that row was removed since the Contact section is the single source of truth for socials and the hero's CTA pill already routes there.
- **State:** Icon defaults to a slightly dimmed ink tone (Soft Ink / 0.75 opacity) and sharpens to full Terracotta Ink together with its label on hover/row-hover — the icon never carries color on its own, it rides the existing link/row hover state.

### Primary CTA Pill (one of the two filled exceptions)
- **Shape:** Fully rounded, solid Terracotta Ink background, Warm Paper text.
- **Hover:** Background shifts to Deep Ink, lifts 1px — the fill stays solid, it just darkens rather than washing out.
- **Instances:** The hero's "Get in touch →" (`.spec .cta`, in the Contact spec row) and the nav's "Résumé ↗" (`.nav-cta`, last item in `.nav-list`, smaller/denser to fit the nav's fixed height). Same visual language, two contexts.
- **Rule:** Capped at these two (see the 60/30/10 rule above). Don't reuse this fill for a third button or a badge.

### Project Spotlight (the one dark section)
- **Shape:** Full-bleed `100vw` breakout (ignores every other section's `max-width` container), Deep Ink background, Warm Paper / Paper Dim text. Lives at the top of Projects, ahead of the regular ledger rows, spotlighting the one project with real live usage rather than a numbered row.
- **Content:** A Terracotta-colored mono eyebrow ("Flagship · Live"), a bold title, one description line reusing the same copy that would otherwise sit in a ledger row's `.row-desc`, and a link. The whole block is one click target (same `::after` overlay trick as `.row-title a`).
- **Rule:** This is the single sanctioned departure from Warm Paper anywhere on the site. It exists to break the page's monotone rhythm once, deliberately — a second dark section would turn a signature moment into a pattern and undercut it.

### Contact Pill Button
- **Shape:** Fully rounded (`9999px`), 1px Hairline Rule border, min 44px touch target.
- **Hover:** Border shifts to Terracotta Dim, text to Terracotta Ink, lifts 2px on the Y axis — the one component in the system allowed a translate-on-hover, since it's an explicit action button rather than a content row.

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
- **Don't** add `box-shadow`, card elevation, or gradients anywhere — the Flat-By-Default Rule has no exceptions.
- **Don't** introduce a second saturated accent color; if something needs to "pop," reconsider the layout instead.
- **Don't** add a third filled/backgrounded terracotta element beyond the two named CTA pills (60/30/10 rule); everywhere else the accent marks, it doesn't fill.
- **Don't** add a second dark/inverted section — the Project Spotlight is capped at one by design (see Components).
- **Don't** round corners by default; the CTA pill and contact-link icon buttons are the named exceptions, not a precedent.
