# LinkedIn PDF parser

Reads a LinkedIn profile saved with **More → Save to PDF**, turns it into a structured profile, and diffs it against the last parsed version and against `content/site.json`. Nothing here touches linkedin.com.

```sh
node manager/linkedin/parse.mjs --pdf <export.pdf> [--prev last.json] [--site content/site.json] \
  [--out report.json] [--write-last last.json]
```

- `--prev`: last parsed profile (the manager's `linkedin/last.json`). Missing file = first run.
- `--site`: `content/site.json`. Omit to skip the site comparison.
- `--write-last`: overwrite with this run's profile (written after the diff).
- Tests: `node --test "manager/linkedin/*.test.mjs"` (Node 22 rejects a bare directory).

Fixture: `fixtures/synthetic-profile.html` is a fictional "Alex Example" page mimicking LinkedIn's layout, printed to `fixtures/synthetic-profile.pdf` with headless Chrome:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --no-pdf-header-footer --print-to-pdf="$PWD/manager/linkedin/fixtures/synthetic-profile.pdf" \
  "file://$PWD/manager/linkedin/fixtures/synthetic-profile.html"
```

**The parser is calibrated against a synthetic PDF; validate against the first real export and adjust.** Things to check first:
- Sidebar/main split is `x < 33%` of page width (`SIDE_RATIO`).
- Grouped roles are detected by an indented title or a "N yrs" line under the company. If LinkedIn does not indent them, expect a warning and a wrong company.
- Continuation lines after a "Issued/Published" line are dropped when they share the same font size.
- Section headings are matched by name (`HEADINGS`), so new LinkedIn heading names need a row there.

Problems land in `profile.warnings` (printed by the CLI); parsing never throws.
