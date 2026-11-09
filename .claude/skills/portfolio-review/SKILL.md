---
name: portfolio-review
description: Review the weekly portfolio update PR (manager/weekly-*). Use when the user says "review portfolio update", "/portfolio-review", "approve the portfolio PR", "include repo <name>", "ignore repo <name>", or asks to check or merge the weekly portfolio changes.
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
---

# Portfolio review

Walks the user through the weekly portfolio PR: show changes, take feedback, push fixes to the same PR, record repo decisions, and merge only on explicit approval.

## Output rules (always)

- Lead with the action: what the user should do next.
- Short sentences. Numbered steps. At most 5 bullets per list; then `+N more`.
- Give a time estimate when asking for review: `~5 min review`.
- No emojis.

## Hard rules

- Never merge without an explicit "approve" (or equivalent) in this conversation, after the confirmation in step 8.
- Never force-push. Never `--admin`. Never push to `main` of the site repo.
- Only `content/site.json` and `index.html` change in the site repo.
- Never change an existing decision in `curation.json` unless the user asks in this conversation.
- Every new fact in copy must come from the README, repo metadata, or the PR's LinkedIn source. If unsure, write less or ask.

## Steps

### 1. Find the open PR

```
gh pr list --state open --json number,title,headRefName,url
```

Keep entries whose `headRefName` starts with `manager/weekly-`.

- **None:** there is no site change waiting. Go to step 2 for pending candidates only.
- **One:** use it.
- **More than one:** list them and ask which one (one question).

### 2. Pending candidates (when there is no PR, or the user asks about candidates)

Clone the state repo to a temp dir and read `curation.json`:

```
STATE=$(mktemp -d)/state && gh repo clone cubeerea/portfolio-manager-state "$STATE" && git -C "$STATE" pull --ff-only
```

Read `repos` where `status` is `pending`. Show up to 5, `+N more` after that, as `repo: one-line summary` (use `snapshot.<repo>.description`). Ask: "Reply `include <repo>` or `ignore <repo>`." Handle each reply as in step 5 and record it as in step 7. If there is no PR and no pending candidates, say so and stop.

### 3. Preflight the local checkout

Run from the site repo root (the `portfolio/` folder):

```
git status --porcelain --untracked-files=no
```

- If output is not empty, stop and ask the user to commit or stash their changes first. Do not continue.
- Save the current branch: `ORIG=$(git branch --show-current)`.
- Check out the PR: `gh pr checkout <N>` then `git pull --ff-only`.
- If `node_modules` is missing, run `npm ci`.

### 4. Show the review

Read the PR body (`gh pr view <N> --json body,url,title`). Show, in this shape:

```
Review this update (~5 min).
1. Open the preview: <preview URL>
2. Read the changes below.
3. Say what to change, or "approve".

Changes (N):
- ...
- +N more

New repos (N), not on the site yet:
- repo: summary
- +N more
```

If `pending` candidates exist in the state repo (step 2), add one line after the list: "N older repo candidates are waiting. Say 'show candidates' to see them."

Get the preview URL from the Vercel deployment for the PR head SHA: `gh api "repos/cubeerea/hank_website/deployments?sha=$(git rev-parse HEAD)"`, then `gh api "repos/cubeerea/hank_website/deployments/<id>/statuses"` and read `environment_url`. If none, use the Vercel comment on the PR (`gh pr view <N> --comments`). If it is still building, say so and give the PR URL.

If the title contains `[needs attention]`, say which gate failed (from the PR body's Needs attention section) before the change list.

### 5. Take feedback and edit

Map plain English to actions:

| User says | Do |
|---|---|
| "shorten X", "change the desc of X" | Edit that tile's `desc` in `content/site.json`. Keep it one sentence, 22 words or fewer. |
| "drop that change" | Revert that change in `content/site.json` (restore the previous value). If it came from LinkedIn, say the role will not come back on its own; the user can add it by hand later. |
| "include repo Y" | Draft a new tile (see "Drafting a tile" below), then record the decision (step 7). |
| "ignore repo Z" / "ignore forever" | Record the decision only (step 7). Do not touch the site. |
| "approve" / "merge" / "ship" | Go to step 8. |

If the request is unclear, ask one question with two options.

**Drafting a tile for "include repo Y":**
- `gh api repos/cubeerea/Y/readme --jq .content | base64 -d` for the README. Also use `gh repo view cubeerea/Y --json description,homepageUrl,name`.
- `id` = repo name, lowercase, letters and dashes. `title` from the README heading or repo name.
- `href` = `https://github.com/cubeerea/Y`, or the homepage if the user wants the live link (then `cue` is `Live`; otherwise `cue` is `GitHub`).
- `external`: true. `tag`: `Personal Project` unless the user says otherwise (existing tags: `Hackathon`, `Research · …`).
- `desc`: one sentence, 22 words or fewer, facts only from the README or metadata.
- `source`: `{ "github": "Y" }`.
- Append to the end of `projects` in `content/site.json`.

### 6. Re-render, build, check, push

After any edit:

```
node scripts/render-content.mjs && node scripts/render-content.mjs --check
npm run build
npm run check:facts
```

If a gate fails, fix the copy that caused it and re-run. If it still fails, tell the user the gate and the first error line, and ask whether to push anyway.

Commit and push to the same branch (no force):

```
git add content/site.json index.html
git commit -m "Review: <one-line summary of the edits>

Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
git push origin HEAD:<branch>
```

If the push is rejected, run `git pull --ff-only` and push again. If that fails, stop and tell the user.

Tell the user the preview rebuilds in about 1 to 2 minutes, and show the same review block as step 4 again.

### 7. Record repo decisions (include or ignore)

Decisions go in the private state repo right away, even before the PR is approved.

1. `STATE=$(mktemp -d)/state && gh repo clone cubeerea/portfolio-manager-state "$STATE" && git -C "$STATE" pull --ff-only`
2. Edit `$STATE/curation.json`. Change only the target repo's entry under `repos`:
   - `status`: `included` or `ignored`
   - `projectId`: the tile `id` (for included repos only)
   - `reason`: the user's words, or a short plain reason
   - `decidedAt`: today's date (`YYYY-MM-DD`)
   - Keep `offeredAt` and `snapshot` unchanged.
   - Do not change any other repo's entry.
   - Write JSON with 2-space indentation and the existing key order.
3. Commit and push:
   ```
   git -C "$STATE" add curation.json
   git -C "$STATE" commit -m "Decision: <repo> <status>

   Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
   git -C "$STATE" push origin main
   ```
   If the push is rejected, run `git -C "$STATE" pull --rebase` once and push again. Never force.
4. Confirm: "Recorded: <repo> is <status>."

If the user asks to change a decision that already exists, tell them the old status and ask once before overwriting.

### 8. Approve and merge (confirm once)

When the user says approve, merge, or ship:

1. Check the PR:
   ```
   gh pr view <N> --json mergeable,title,statusCheckRollup,url
   ```
   - If `mergeable` is `CONFLICTING`, stop and say so.
   - If the title has `[needs attention]`, say which gate failed and ask for explicit "merge anyway".
2. Ask once: "Merge PR #<N> to main? This publishes to the live site. Reply yes to confirm." Wait for the answer. Anything other than a clear yes means do not merge.
3. Merge:
   ```
   gh pr merge <N> --squash --delete-branch
   ```
4. Return the local checkout: `git switch "$ORIG"` (if it was saved in step 3), then `git pull --ff-only`.
5. Tell the user: "Merged. Vercel deploys main to the live site; it takes about 1 to 2 minutes."

### 9. Discard the whole update (only if the user asks)

If the user wants the whole week's update dropped, confirm once: "Close PR #<N> without merging and delete its branch? Nothing goes live." On yes:

```
gh pr close <N> --delete-branch
```

Recorded include and ignore decisions stay. Say so.

## Done

End with one line: what changed, what is still pending, and the next action (for example, "Say approve when ready, ~1 min").
