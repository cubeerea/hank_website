# Content schema (shared contract)

`content/site.json` is the single source for the data-driven sections of `index.html`.
`scripts/render-content.mjs` rewrites the regions between marker comments in `index.html`:

```
<!-- content:projects -->   ...generated...   <!-- /content:projects -->
<!-- content:writing -->    ...generated...   <!-- /content:writing -->
<!-- content:stack -->      ...generated...   <!-- /content:stack -->
<!-- content:experience --> ...generated...   <!-- /content:experience -->
```

`node scripts/render-content.mjs` writes them; `--check` exits 1 if `index.html` is out of sync.
The generated HTML is committed, so the site stays fully static and `check:facts` keeps reading `index.html`.

String fields marked **html** may contain trusted inline HTML (`<strong>`, `&amp;`, `<em>`). Everything else is plain text and is escaped by the renderer.
Display numbers (`01`, `02`, …) are derived from array order, never stored.

```jsonc
{
  "projects": [
    {
      "id": "zet",                 // stable id; also the CSS suffix -> class "bento-zet" (grid-area for the first 6)
      "title": "Zettel AI",
      "href": "https://github.com/cubeerea/zettel-ai",   // optional; omit => tile is static (no link)
      "external": true,            // true => target=_blank rel=noopener noreferrer
      "desc": "html",
      "spec": [ { "term": "Model", "detail": "html" } ], // optional, only the anchor tile uses it today
      "tag": "Personal Project",
      "cue": "GitHub",             // optional footer cue text; renderer appends "&nbsp;↗" if external, "&nbsp;→" if not
      "static": false,             // optional; true adds class "bento-static"
      "source": { "github": "zettel-ai" }  // optional; repo name under cubeerea — how the manager matches repos to tiles
    }
  ],
  "writing": [
    { "title": "text", "href": "https://…", "external": true, "desc": "html", "cue": "Read" }  // external => target=_blank + ↗
  ],
  "stack": [
    { "label": "Languages", "items": [ { "name": "TypeScript", "note": "JS" } ] }   // note optional
  ],
  "experience": {
    "items": [
      {
        "id": "work-1",            // aria-controls target
        "title": "Research Assistant",
        "org": "Yuzhou Chen's Lab",
        "dates": "Jun 2025 – Mar 2026",
        "focus": "LLMs, Graph Unlearning",     // desc line = "{dates} · {org} · {focus}"
        "ariaLabel": "Research Assistant, Yuzhou Chen's Lab",
        "meta": { "stack": "Research", "win": "4x inference speedup" },
        "gist": [ { "label": "The Gist", "html": "html" } ],
        "blocks": [ { "heading": "Context", "paragraphs": ["html"], "items": ["html"] } ]  // paragraphs/items optional
      }
    ],
    "footnote": "html"             // optional, the line under the ledger
  }
}
```

## Manager-side files (private repo `cubeerea/portfolio-manager-state`, never in this public repo)

`curation.json`:
```jsonc
{
  "owner": "cubeerea",
  "repos": { "<repo-name>": { "status": "included|ignored|pending", "projectId": "zet", "reason": "…", "decidedAt": "YYYY-MM-DD", "offeredAt": "YYYY-MM-DD" } },
  "snapshot": { "<repo-name>": { "description": "", "homepage": "", "stars": 0, "pushedAt": "ISO", "topics": [], "archived": false, "language": "" } },
  "lastScanAt": "ISO|null"
}
```
`linkedin/inbox/*.pdf` (optional drop), `linkedin/last.json` (last parsed profile), `runs/<date>.json` (weekly report).
