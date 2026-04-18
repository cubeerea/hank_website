# Portfolio Update — Implementation Plan

## Overview

Six targeted changes to improve positioning, legibility, and clarity across the portfolio.

---

## 1. Headline / About Tagline

**Location:** `index.html:135` — `about-tagline` paragraph

**Current:**
> AI enthusiast interested in AI systems and mechanistic interpretability.

**New:**
> AI engineer building production LLM systems at the intersection of technical depth and customer impact.

**Notes:**
- "Enthusiast" undersells; "engineer" + "production" signals readiness
- Keep the single sentence, same visual treatment (`font-display text-xl font-bold`)

---

## 2. CTA Banner Near the Top

**Location:** After the status indicator / before CTA buttons (`index.html:118–132`)

**What to add:** A styled inline notice above the "View Resume / Contact" buttons:

```html
<div class="inline-flex items-center gap-2 text-sm text-slate-text mb-6 px-3 py-1.5 rounded-full border border-border bg-white/[0.03]">
  <span class="status-dot"></span>
  <span>Currently seeking <strong class="text-white font-medium">Applied AI / FDE roles</strong> for Summer 2026.</span>
  <a href="#contact" class="text-cyan hover:underline underline-offset-2 transition-colors duration-200 font-medium no-underline">Reach out →</a>
</div>
```

**Notes:**
- Replace or consolidate with the existing "Available for roles" status indicator (lines 118–121) — no need for two separate availability signals
- The `status-dot` stays; the text becomes the full CTA sentence

---

## 3. Chrome Extension — Flesh Out with Outcomes

**Location:** `index.html:269–279` — AI Job Applier bento cell

**Current description:**
> A browser extension that autonomously scrapes job descriptions and auto-fills application forms across ATS platforms.

**New description (concise, outcome-forward):**
> Built a Chrome extension that scrapes job descriptions and auto-fills application forms across major ATS platforms (Greenhouse, Lever, Workday). Reduced per-application time from ~20 min to under 3 min. Handles dynamic DOM injection, content-script messaging, and multi-step form traversal.

**Notes:**
- Three sentences: what it does, the outcome, the technical surface
- Keep the `Personal Project` badge; no new tags needed

---

## 4. Reframe Venture Scout — Gist + Action

**Location:** `index.html:451–515` — Venture Scout expanded card

### 4a. Gist grid updates

| Cell | Current | New |
|------|---------|-----|
| The Gist | "Developed a commercial lens for evaluating AI and deep-tech startups at pre-seed and seed stages." | "Evaluated AI and deep-tech startups, communicated directly with founders, and synthesized findings into concise investment memos for partners." |
| Key Win | "Built strong technical communication and sourcing skills..." | "Developed customer-facing technical communication — distilling complex startup pitches into clear, decision-ready summaries." |
| Skills | "Startup Evaluation, Market Research, Professional Outreach." | "Startup Evaluation, Founder Outreach, Technical Synthesis, Investment Memos." |

### 4b. Context — tighten

Remove the line: *"I did not make or influence investment decisions."*  
Replace with neutral framing: *"Focused on sourcing, light evaluation, and partner-facing communication at pre-seed and seed stage."*

### 4c. Action — reorder for strength

Restructure action paragraphs to lead with the most transferable skill:

1. **Technical synthesis & communication** (currently buried as "Internal coordination"): Synthesized startup findings into concise memos for partners. Translated technical capabilities into commercial viability narratives — a skill directly applicable to customer-facing engineering roles.
2. **Evaluation & research**: Evaluated AI and deep-tech startups across value proposition, market size, team, and traction. Reviewed pitch decks with a critical early-stage lens.
3. **Sourcing & outreach**: Sourced startups through university channels and founder communities. Ran high-volume cold outreach; developed persistence and professional communication under rejection.

### 4d. Lessons — remove self-undermining lines

Remove:
> - "Cold outreach is a learned skill. I started uncomfortable with it..."
> - "This role pushed me outside my comfort zone socially..."

Keep the two strongest lessons:
> - Communication is foundational. Clarity, tone, and responsiveness matter more than I expected.
> - Early-stage evaluation is different. At pre-seed, there's little data; the work is identifying potential under uncertainty.

Add one relevant-to-FDE lesson:
> - Distilling complex technical signals into clear, actionable language is a skill — one that transfers directly to customer-facing engineering.

---

## 5. Skill Map — Group by Context

**Location:** `index.html:156–193` — `#skills` section

**Current design:** Animated tech globe, all icons equal weight, no grouping.

**New design:** Replace the globe with a three-column grouped layout (keep the `Skill Map` heading). Each group has a small label and a flex-wrapped list of tech chips.

### Groups

| Group | Technologies |
|-------|-------------|
| **Production Systems** | Python, TypeScript, Node.js, Docker, PostgreSQL, MongoDB, Git, Vercel, n8n |
| **ML / Research** | PyTorch, HuggingFace, LangChain, Scikit-learn, Claude Code |
| **Data + Analysis** | R, Python (shared), Scikit-learn (shared), XGBoost (add — used at biotech) |

### Implementation

- Remove `<div id="tech-globe">` and all `.tech-icon` divs
- Remove globe JS (check `src/main.ts` for globe animation — remove or guard with a flag)
- Add a simple grid:

```html
<div class="skills-grid grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
  <div class="skill-group">
    <h3 class="text-xs uppercase tracking-[0.1em] text-slate-dim mb-3 font-display font-semibold">Production Systems</h3>
    <div class="flex flex-wrap gap-2">
      <!-- skill chips -->
    </div>
  </div>
  <!-- repeat for ML/Research, Data + Analysis -->
</div>
```

Each chip: `<span class="text-xs px-2 py-1 rounded-md border border-border text-slate-text bg-white/[0.03]">Python</span>`

**Notes:**
- Simpler and scannable — hiring managers skim, not read
- Verify globe-related CSS/JS in `src/main.ts` and `src/theme.ts` before removing markup — delete dead code after confirming no other references

---

## 6. Building/Learning in Public — Add Two Articles

**Location:** `index.html:206–227` — `timeline-list` inside `#writing`

**Add after the existing two articles:**

```html
<li class="timeline-item">
  <a href="#" class="writing-link font-medium text-white"
     aria-label="AI Didn't Raise the Bar. It Removed the Ladder. on Medium">
    AI Didn't Raise the Bar. It Removed the Ladder.
  </a>
  <span class="block text-slate-dim text-sm mt-0.5">On how AI shifts skill floor expectations, not just ceilings.</span>
</li>
<li class="timeline-item">
  <a href="#" class="writing-link font-medium text-white"
     aria-label="Attention Isn't All You Need: The Essential Foundations of Transformers on Medium">
    Attention Isn't All You Need: The Essential Foundations of Transformers
  </a>
  <span class="block text-slate-dim text-sm mt-0.5">Breaking down what actually makes transformers work beyond self-attention.</span>
</li>
```

**Notes:**
- Use `href="#"` as placeholder — replace with real Medium URLs when articles are published/linked
- Subtitles are suggestions; adjust to match what you actually wrote
- Order: add these after the existing two entries (before the "More on Medium" link)

---

## Execution Order

1. **Headline** — one-liner swap, lowest risk
2. **CTA banner** — replaces existing status indicator, small structural change
3. **Chrome extension description** — copy update only
4. **Venture Scout reframe** — copy-heavy, touch Gist + Action + Lessons
5. **Writing articles** — add two `<li>` entries
6. **Skills grouping** — most structural change; audit JS/CSS first, then replace HTML, then clean up dead code

---

## Files to Touch

| File | Changes |
|------|---------|
| `index.html` | All 6 items above |
| `src/main.ts` | Remove globe animation code (item 5) |
| `src/theme.ts` | Potentially remove globe-related CSS variables / setup (item 5) |
