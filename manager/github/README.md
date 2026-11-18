# GitHub scanner (portfolio manager)

`scan.mjs` lists the owner's public, non-fork repos, diffs them against the private curation file, and writes a JSON report for the weekly review. Zero dependencies (Node 22, global `fetch`).

- `fetchRepos(owner, {token})` pages through `/users/{owner}/repos` via the Link header. Token is taken from `GITHUB_TOKEN` or `GH_TOKEN` if set; unauthenticated works but is rate-limited.
- `diffRepos({repos, curation, site, now})` is pure. It returns `newCandidates` (no decision yet), `pending`, `updates` (included repos: metadata, `activity` for a pushedAt change, `traction` for +10 stars since the last scan), `includedMissingTile`, `tilesMissingRepo`, `ignoredCount`, `nextCuration`, and `nextSnapshot`. It never changes an existing decision. With no prior snapshot, nothing is reported as changed.
- `fetchReadme(owner, name)` returns the README as text, truncated to 6000 chars, or null.

CLI:

```sh
GITHUB_TOKEN=... node manager/github/scan.mjs --owner <user> \
  --curation <curation.json> --site content/site.json --out <report.json> [--write-curation]
```

Without `--write-curation` it is a dry run. With it, the curation file is replaced atomically with `nextCuration`. Exit codes: 0 success, 1 usage or local file error, 2 GitHub or network error.

Report shape: `{ generatedAt, owner, summary{...counts}, newCandidates[+readme], pending[], updates[+readme when activity], includedMissingTile[], tilesMissingRepo[], ignoredCount, newPending{} }`.

Tests: `node --test 'manager/github/*.test.mjs'` (Node 22 does not accept a directory argument). Fixtures are synthetic and live in `fixtures/`.
