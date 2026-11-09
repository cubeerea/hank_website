# Portfolio manager

A weekly routine checks GitHub (and optionally a LinkedIn PDF) for changes, drafts site updates as a PR, and emails you. You review in Claude Code with `/portfolio-review`. Nothing goes live until you approve.

## Weekly flow

```
 SUNDAY (cloud routine, unattended)                 YOU (during the week)
 ──────────────────────────────────                 ─────────────────────
 scan GitHub repos  ──────┐
 read LinkedIn PDF (opt.) ├─► draft edits ─► PR "Portfolio update – week of …"
 validate: render, build, │                    + Vercel preview link
           check:facts    │
                          └─► email  ──────► run /portfolio-review in Claude Code
                                              feedback   → pushed to same PR
                                              include/ignore → private state repo
                                              approve    → merge → live site
 quiet week: state snapshot only, no PR, no email
```

## Files

| Path | What it is |
|---|---|
| `manager/ROUTINE.md` | The prompt the cloud routine runs, plus scenario checks |
| `manager/email-template.md` | Email subjects and bodies for each outcome |
| `manager/github/scan.mjs` | Scans `cubeerea` repos against curation (dry run without `--write-curation`) |
| `manager/linkedin/parse.mjs` | Diffs a LinkedIn PDF against the last profile |
| `.claude/skills/portfolio-review/SKILL.md` | The `/portfolio-review` skill |
| `content/site.json` | Source for the projects, writing, stack and experience sections |
| `scripts/render-content.mjs` | Writes `index.html` from `content/site.json` (`--check` verifies sync) |
| `content/SCHEMA.md` | Shape of `site.json` and of the private curation files |

Private state lives in the repo `cubeerea/portfolio-manager-state`, not here:

```
curation.json          decisions (included / ignored / pending) and repo snapshots
linkedin/inbox/        drop a PDF here (optional)
linkedin/processed/    PDFs after the routine reads them
linkedin/last.json     last parsed LinkedIn profile
runs/<date>.json       one report per week
```

## Drop a LinkedIn PDF (optional)

Only do this when your LinkedIn profile changed (new role, new title or dates).

1. Export your profile to PDF from LinkedIn in your browser (your own account, your own download).
2. On GitHub, open `cubeerea/portfolio-manager-state`.
3. Go to `linkedin/inbox`, click **Add file**, then **Upload files**.
4. Drop the PDF, then commit to `main`.

The next Sunday run reads it, drafts any new roles, and moves the file to `linkedin/processed/`. The routine never visits linkedin.com.

## Run the scan locally (dry run)

Needs GitHub auth (`gh auth status` should succeed) and the state repo cloned next to this folder.

From the portfolio folder (the repo root):

```
node manager/github/scan.mjs --owner cubeerea \
  --curation ../portfolio-manager-state/curation.json \
  --site content/site.json \
  --out "$TMPDIR/scan.json"
```

Leave out `--write-curation` so the state repo is not changed. Read that file to see what the routine would offer.


## Review and approve

Open Claude Code in this folder and run `/portfolio-review` (about 5 to 10 min). It shows the change list and the preview link, and takes plain-English feedback such as "shorten the Zettel desc", "include repo xyz", or "ignore repo abc forever". Say "approve" to merge.

## Pause the routine

Open the scheduled agents list with `/schedule` in Claude Code, select the portfolio routine, and disable it. Enable it the same way to resume. Pausing does not change the site; anything already merged stays live.
