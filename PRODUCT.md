# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Broad professional audience: hiring managers/recruiters evaluating Hank for Applied AI / Forward-Deployed Engineer roles, plus peers, collaborators, and general professional network encountering his work (research, writing, open-source projects). Not narrowed to recruiters only.

## Product Purpose

Personal portfolio for Hank Sha. Surfaces projects, technical writing, skills, and work/research experience so visitors can evaluate his work and reach out (for hiring, collaboration, or professional interest). Success = a visitor leaves with an accurate read on what he's built and how to contact him.

## Positioning

"Broad by instinct, deep by choice" — range across hackathons, personal projects, and writing, paired with deliberate depth in specific areas (AI safety/interpretability research, from-scratch implementations like autograd). The differentiator is going deep by choice, not just breadth. Hero line is being updated to this phrasing (see Evidence/Brand Commitments below).

## Operating Context

Single-page ledger/index-style site (`index.html`) with sections: Hero, Projects, Writing, Skill Map, Selected Work (expandable experience cards), Contact. Two secondary pages: a résumé viewer (`/resume`) and a standalone research write-up (`/pid-steering`). Built with Vite + TypeScript, vanilla DOM (no framework), Tailwind v4 via `@tailwindcss/vite`.

## Capabilities and Constraints

Static site, no backend. Content (projects, writing links, work history, skills) is hand-authored in `index.html`, not data-driven. Fonts: self-hosted IBM Plex Sans/Mono/Serif plus Geist Sans (hero headline only) via `@fontsource`.

## Brand Commitments

Name: Hank Sha. Current warm-paper/ledger editorial aesthetic (paper `#F6F1E8`, ink `#211A14`, rust accent `#B0442A`, IBM Plex type system, numbered ledger rows) is an intentional, binding visual identity — not a placeholder to redesign away from by default. Hero line is being changed to "Broad by instinct, deep by choice" (replacing "I build things that work, not just things that demo"). Scoped exception: the hero `<h1>` runs in Geist Sans (a grotesk, not IBM Plex) for a dev-tool/Linear-esque inflection — everything else (mono labels, sans body, terracotta accent, ledger rows, the Contact section's serif) stays on the original system.

## Evidence on Hand

Real, verified content only — do not fabricate:
- Projects: Data4Good Hackathon (Devpost), Biotech Intelligence Engine, "Exploring How LLMs Improve Graph Quality Using Topological Signatures" (research, write-up pending), Global PID Steering (research/AI safety, has its own page), NBA Contract Value, Zettel AI, Xeno CLI.
- Writing: four Medium/gopenai articles on AI prompts, autograd internals, AI's effect on skill floors, and transformer foundations.
- Work: Research Assistant, Yuzhou Chen's Lab (Jun 2025 – Mar 2026), LLMs/graph unlearning.
- Education: UC Santa Barbara, Statistics & Data Science.
- Contact/links: GitHub (cubeerea), LinkedIn (hank-sha), Medium (@cubeerea), email (hankssha@gmail.com), résumé page.

## Product Principles

1. Show real, verifiable work — never invent projects, testimonials, or metrics.
2. Depth over polish-for-its-own-sake: the site should read as evidence of substance (research, from-scratch builds), not just a demo reel.
3. Keep contact paths (email, résumé, LinkedIn, GitHub) accurate and always reachable — the site's job is to convert interest into contact.
4. Preserve the existing editorial/ledger identity as the default; treat it as an asset to refine, not a placeholder to discard.

## Accessibility & Inclusion

No product-specific requirement established beyond standard web accessibility practice (semantic HTML, `aria-label`s already present in nav/sections).
