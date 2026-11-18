# Email templates

Sent from the Gmail connector to the connected account's own address. Plain text, short, action first. Pick one template per outcome. Lists show at most 5 items, then `+N more`.

Time estimate: `~5 min` for site copy only; `~10 min` if there are new repo candidates or a LinkedIn role; `~15 min` if there are 3+ candidates or anything is `[needs attention]`.

---

## Template: pr (update ready)

**Subject:** `Portfolio update ready: {N_CHANGES} changes, {N_CANDIDATES} new repos (~{MINUTES} min)`

```
Do this now (~{MINUTES} min):
1. Open Claude Code in the portfolio folder.
2. Run /portfolio-review
3. In the review, describe changes, or say "approve".

{IF_ATTENTION}
Needs attention: {ATTENTION_LINE}
{END_IF}
{IF_RESUME}
Heads up: this changes your experience. Résumé variants may need updating.
{END_IF}

Changes in this update ({N_CHANGES}):
- {CHANGE_1}
- {CHANGE_2}
- +{N_MORE} more

New repos, not on the site yet ({N_CANDIDATES}). In the review, say "include <repo>" or "ignore <repo>":
- {repo}: {one-line summary}
- +{N_MORE} more

PR: {PR_URL}
Preview: {PREVIEW_URL}
```

---

## Template: held (last week's PR is still open)

**Subject:** `Portfolio update waiting: last week's PR is still open`

```
Do this now (~5 min):
1. Open Claude Code in the portfolio folder.
2. Run /portfolio-review, then approve, or give feedback on the open PR.

This week's site changes were held, so nothing new is pending on the site. They will be drafted again next week.

Open PR: {OPEN_PR_URL}

{IF_CANDIDATES}New repos, not on the site yet ({N_CANDIDATES}). In the review, say "include <repo>" or "ignore <repo>":
- {repo}: {one-line summary}
- +{N_MORE} more
{END_IF}
```

---

## Template: candidates-only (no site change)

**Subject:** `Portfolio: {N_CANDIDATES} new repos to include or ignore (~{MINUTES} min)`

```
Do this now (~{MINUTES} min):
1. Open Claude Code in the portfolio folder.
2. Run /portfolio-review, then say "include <repo>" or "ignore <repo>" for each.

No site changes this week.

New repos ({N_CANDIDATES}):
- {repo}: {one-line summary}
- +{N_MORE} more
```

---

## Template: failed (routine could not finish)

**Subject:** `Portfolio routine failed at {FAILED_STEP}`

```
Nothing was merged or published.

Do this now (~2 min):
1. Open Claude Code in the portfolio folder and say "check the portfolio routine".
2. If it is still failing, check the routine run log in claude.ai (scheduled agents).

Failed step: {FAILED_STEP}
Run record: runs/{DATE}.json in portfolio-manager-state
```

---

## Filled example (template: pr)

Example only. Dates, repo names and URLs are illustrative.

**Subject:** `Portfolio update ready: 2 changes, 2 new repos (~10 min)`

```
Do this now (~10 min):
1. Open Claude Code in the portfolio folder.
2. Run /portfolio-review
3. In the review, describe changes, or say "approve".

Changes in this update (2):
- Zettel AI: shorter description from the current README
- Xeno CLI: description now matches the repo's one-line summary

New repos, not on the site yet (2). In the review, say "include <repo>" or "ignore <repo>":
- sample-graph-tool: Command-line tool that builds a graph from a folder of notes.
- lab-notes: Personal notes on reading ML papers, with one page per paper.

PR: https://github.com/cubeerea/hank_website/pull/42
Preview: https://example-preview.vercel.app
```
