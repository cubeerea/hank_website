# SEO Optimization Plan — hanksha.dev

The goal is to maximize organic search visibility and link-sharing quality for the portfolio site. The site already has a solid OG/Twitter card foundation. This plan fills the remaining gaps: a richer `<head>`, structured data for Google's rich results, semantic HTML reinforcement, a sitemap, and a `robots.txt`.

---

## Proposed Changes

### `index.html` — `<head>` Overhaul

| # | What | Why |
|---|------|-----|
| 1 | **`<title>` → keyword-rich** | `"Hank Sha"` alone gives Google nothing to rank. Change to `"Hank Sha \| AI & ML Engineer — Applied ML, Mechanistic Interpretability"`. Stays ≤ 60 chars. |
| 2 | **`<meta name="description">` — tighten copy** | Current copy is 156 chars — fine, but passive. Rewrite to be direct and keyword-dense (primary terms: applied ML, AI engineering, mechanistic interpretability, UCSB). Keep ≤ 155 chars. |
| 3 | **Add `<link rel="canonical">`** | Prevents duplicate-content penalties if Vercel serves both `http` and `https` or `www` and non-`www`. Point to `https://hanksha.dev`. |
| 4 | **Add `<meta name="keywords">`** | Minor signal, zero cost. Include: `applied machine learning, AI engineering, mechanistic interpretability, PyTorch, LLMs, UCSB, portfolio`. |
| 5 | **Add `<meta name="author">`** | `content="Hank Sha"` — small trust signal. |
| 6 | **Add `<meta name="robots" content="index, follow">`** | Explicitly tells crawlers to index and follow links (complements the existing `noindex` on resume.html). |
| 7 | **Add `<meta name="theme-color">`** | `content="#0a0f1c"` — used by Chrome/Android to color the browser chrome; subtle branding signal. |
| 8 | **OG completeness — add `og:locale` and `og:site_name`** | `og:locale="en_US"` and `og:site_name="Hank Sha"` are required by some link-preview validators (Slack, Discord). |
| 9 | **Twitter: add `twitter:creator`** | `content="@cubeerea"` — enables richer Twitter cards and author attribution. |
| 10 | **Add `<link rel="preload">` for fonts** | Preloading the two Google Font weights reduces LCP (Largest Contentful Paint), a Core Web Vital. |
| 11 | **Add JSON-LD structured data (Person schema)** | Highest-impact single change. Google uses `schema.org/Person` to display rich knowledge-panel info. Include `name`, `url`, `jobTitle`, `sameAs`, `alumniOf`, `knowsAbout`. |

**Resulting `<head>` after changes:**

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary SEO -->
  <title>Hank Sha | AI &amp; ML Engineer — Applied ML, Mechanistic Interpretability</title>
  <meta name="description"
    content="Hank Sha — UCSB graduating senior building at the intersection of applied ML, AI engineering, and mechanistic interpretability. Internships in biotech AI and HR-tech LLM systems.">
  <meta name="keywords"
    content="applied machine learning, AI engineering, mechanistic interpretability, PyTorch, LLMs, NLP, UCSB, portfolio, Hank Sha">
  <meta name="author" content="Hank Sha">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#0a0f1c">
  <link rel="canonical" href="https://hanksha.dev">

  <!-- Open Graph -->
  <meta property="og:title" content="Hank Sha | AI &amp; ML Engineer">
  <meta property="og:description"
    content="UCSB senior building scalable AI products. Applied ML, mechanistic interpretability, and LLM engineering.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://hanksha.dev">
  <meta property="og:image" content="https://hanksha.dev/assets/og-preview.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="Hank Sha">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Hank Sha | AI &amp; ML Engineer">
  <meta name="twitter:description"
    content="UCSB senior building scalable AI products. Applied ML, mechanistic interpretability, and LLM engineering.">
  <meta name="twitter:image" content="https://hanksha.dev/assets/og-preview.png">
  <meta name="twitter:creator" content="@cubeerea">

  <!-- JSON-LD: Person Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Hank Sha",
    "url": "https://hanksha.dev",
    "jobTitle": "AI & ML Engineer",
    "alumniOf": {
      "@type": "CollegeOrUniversity",
      "name": "University of California, Santa Barbara"
    },
    "knowsAbout": [
      "Applied Machine Learning",
      "LLM Engineering",
      "Mechanistic Interpretability",
      "PyTorch",
      "NLP"
    ],
    "sameAs": [
      "https://github.com/cubeerea",
      "https://www.linkedin.com/in/hank-sha/",
      "https://medium.com/@cubeerea"
    ]
  }
  </script>

  <!-- Fonts (preload critical weights) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@400;600;700&display=swap">
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@400;600;700&display=swap"
    rel="stylesheet">

  <script type="module" src="/src/theme.ts"></script>
</head>
```

---

### `index.html` — Semantic HTML & Body

| # | What | Why |
|---|------|-----|
| 12 | **`<nav>` — add `aria-label="Main navigation"`** | Helps screen readers and is a lightweight accessibility/SEO signal. |
| 13 | **`<nav>` — add `role="navigation"`** | Explicit landmark role; harmless for modern browsers but helps older AT. |
| 14 | **`<h1>` — include full name** | Current `<h1>` is `"I'm Hank."` — Google weighs `<h1>` heavily. Change to `"I'm Hank Sha."` so the full name appears in the most prominent heading. |
| 15 | **Writing section links — add descriptive `aria-label`** | Medium links benefit from explicit `aria-label="[article title] on Medium"` for crawlers that index anchor context. |
| 16 | **Footer `<time>` element — fix `datetime` bake-in** | `${datetime}` is injected by JS at runtime. Google bots that skip JS see a raw template string. Bake the date directly into the HTML so it's always crawler-visible. |

---

### `resume.html` — Meta Cleanup

| # | What | Why |
|---|------|-----|
| 17 | **`<meta name="description">` — expand** | `"Hank Sha - Resume"` is too thin. Change to: `"Download or view Hank Sha's resume — AI & ML engineer, applied ML research, LLM engineering internships."` |
| 18 | **Keep `<meta name="robots" content="noindex">`** | ✅ Already present. The PDF viewer page should stay noindexed to avoid duplicate content vs the main page. |
| 19 | **Add `<link rel="canonical" href="https://hanksha.dev/resume">`** | Defensive; prevents any Vercel preview URL from eclipsing the canonical page. |

---

### New Files

#### `public/sitemap.xml` [NEW]

Tells Google exactly which pages to crawl and provides freshness signals via `<lastmod>`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://hanksha.dev/</loc>
    <lastmod>2026-03-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://hanksha.dev/resume</loc>
    <lastmod>2026-03-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

#### `public/robots.txt` [NEW]

```
User-agent: *
Allow: /
Disallow: /assets/hank_sha_resume.pdf

Sitemap: https://hanksha.dev/sitemap.xml
```

> **Note:** Disallowing the raw PDF prevents it from competing with the `/resume` page in search results, since the embed page is the canonical experience.

---

## Open Questions

- **Twitter handle** — Plan sets `twitter:creator` to `@cubeerea`. Correct handle?
- **`${datetime}` fix** — Bake `March 21, 2026` directly into the HTML, or keep JS injection but add a static fallback in the `datetime` attribute?

---

## Verification Plan

### Tool-based
- **Google Rich Results Test** — validate JSON-LD `Person` schema at `https://hanksha.dev` after deploy
- **Facebook Sharing Debugger** — confirm `og:*` tags render correctly
- **Twitter Card Validator** — confirm `twitter:card` preview renders
- **Google Search Console** — submit `sitemap.xml`; monitor coverage report

### Manual
- `curl https://hanksha.dev | grep -A5 'schema'` — confirm JSON-LD is in raw HTML (no JS required)
- Verify `${datetime}` does NOT appear in raw page source
- Confirm `https://hanksha.dev/robots.txt` is accessible
- Confirm `https://hanksha.dev/sitemap.xml` is accessible
