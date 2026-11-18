#!/usr/bin/env node
/**
 * Renders the data-driven sections of index.html from content/site.json.
 *
 * Each region is the text between `<!-- content:NAME -->` and
 * `<!-- /content:NAME -->`. Everything outside those markers is hand-authored
 * and left alone. The contract for the JSON is content/SCHEMA.md.
 *
 * Usage:
 *   node scripts/render-content.mjs          write index.html, report changed regions
 *   node scripts/render-content.mjs --check  exit 1 if index.html is out of sync
 *
 * Zero dependencies. The render functions are exported so they can be tested.
 */

import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_PATH = join(ROOT, 'content', 'site.json');
const INDEX_PATH = join(ROOT, 'index.html');

export const REGION_NAMES = ['projects', 'writing', 'stack', 'experience'];

export class ContentError extends Error {}

// ---------------------------------------------------------------------------
// Escaping and small helpers
// ---------------------------------------------------------------------------

/** Escape a plain-text value for use in element text or a double-quoted attribute. */
export function escapeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const pad = (n) => String(n).padStart(2, '0');

/** Prefix every non-empty line with `indent`. Blank lines stay blank. */
function indentLines(lines, indent) {
  return lines.map((line) => (line === '' ? '' : indent + line)).join('\n');
}

/** Blank-line-separated blocks, each block being an array of relative lines. */
function joinBlocks(blocks, indent) {
  return blocks.map((lines) => indentLines(lines, indent)).join('\n\n');
}

const arrowFor = (external) => (external ? '&nbsp;↗' : '&nbsp;→');
const linkAttrs = (external) => (external ? ' target="_blank" rel="noopener noreferrer"' : '');

// The comment that documents the Global PID Steering spec table. It lives in
// the renderer, not the JSON: it is a note to whoever edits the numbers, and it
// is emitted above the <dl> of whichever tile carries a `spec`.
const SPEC_COMMENT = [
  "<!-- The 2x2 tile's emphasis mechanism is area, so the area has to",
  '     carry something. Every value here is lifted from the paper\'s',
  '     own abstract — including the caveat, which is the row that',
  '     makes the other three trustworthy. Verify against',
  '     /assets/global-pid-steering.pdf before editing any number.',
  '     An img with class "bento-art" above the dl takes the room',
  '     instead, and the rows fall underneath it. -->',
];

// ---------------------------------------------------------------------------
// Renderers. Each returns the region body, with every line prefixed by
// `indent`, and no trailing newline. Plain-text fields are escaped; fields
// documented as html in SCHEMA.md are inserted as-is.
// ---------------------------------------------------------------------------

export function renderProjects(projects, indent = '') {
  return joinBlocks(
    projects.map((p, n) => {
      const classes = ['bento-tile', `bento-${p.id}`];
      if (p.static) classes.push('bento-static');

      const title = p.href
        ? `<a href="${escapeText(p.href)}"${linkAttrs(p.external)}>${escapeText(p.title)}</a>`
        : escapeText(p.title);

      const lines = [
        `<article class="${classes.join(' ')}">`,
        `    <span class="bento-idx">${pad(n + 1)}</span>`,
        `    <h3 class="bento-title">${title}</h3>`,
        `    <p class="bento-desc">${p.desc}</p>`,
      ];

      if (p.spec) {
        lines.push(...SPEC_COMMENT.map((l) => '    ' + l));
        lines.push('    <dl class="bento-spec">');
        for (const row of p.spec) {
          lines.push('        <div>');
          lines.push(`            <dt>${escapeText(row.term)}</dt>`);
          lines.push(`            <dd>${row.detail}</dd>`);
          lines.push('        </div>');
        }
        lines.push('    </dl>');
      }

      lines.push('    <div class="bento-foot">');
      lines.push(`        <span class="bento-tag">${escapeText(p.tag)}</span>`);
      if (p.cue) {
        lines.push(
          `        <span class="bento-cue" aria-hidden="true">${escapeText(p.cue)}${arrowFor(p.external)}</span>`,
        );
      }
      lines.push('    </div>');
      lines.push('</article>');
      return lines;
    }),
    indent,
  );
}

export function renderWriting(writing, indent = '') {
  return joinBlocks(
    writing.map((w, n) => {
      const title = `<a href="${escapeText(w.href)}"${linkAttrs(w.external)}>${escapeText(w.title)}</a>`;
      return [
        '<article class="row">',
        `    <div class="row-idx">${pad(n + 1)}</div>`,
        '    <div class="row-main">',
        `        <h3 class="row-title">${title}</h3>`,
        `        <p class="row-desc">${w.desc}</p>`,
        '    </div>',
        '    <div class="row-meta">',
        `        <span class="row-links"><span class="row-cue" aria-hidden="true">${escapeText(w.cue)}${arrowFor(w.external)}</span></span>`,
        '    </div>',
        '    <div class="row-arrow" aria-hidden="true">→</div>',
        '</article>',
      ];
    }),
    indent,
  );
}

export function renderStack(stack, indent = '') {
  // Columns are not blank-line separated, matching the hand-written original.
  return indentLines(
    stack.flatMap((col, n) => {
      const lines = [
        '<div class="stack-col">',
        `    <h3 class="stack-label"><span class="stack-num">${pad(n + 1)}</span>${escapeText(col.label)}</h3>`,
        '    <ul class="stack-list">',
      ];
      for (const item of col.items) {
        const note = item.note ? ` <span class="stack-note">(${escapeText(item.note)})</span>` : '';
        lines.push(`        <li>${escapeText(item.name)}${note}</li>`);
      }
      lines.push('    </ul>');
      lines.push('</div>');
      return lines;
    }),
    indent,
  );
}

/** Desc line under each experience title: "{dates} · {org} · {focus}", focus optional. */
export function experienceDescLine(item) {
  return [item.dates, item.org, item.focus].filter(Boolean).join(' · ');
}

function renderExperienceCard(item, n) {
  const lines = [
    '<article class="row row-work experience-card" data-expanded="false">',
    '    <h3 class="work-heading">',
    `        <button class="work-header card-header" type="button" aria-expanded="false"`,
    `            aria-controls="${escapeText(item.id)}" aria-label="${escapeText(item.ariaLabel)}">`,
    `            <div class="row-idx">${pad(n + 1)}</div>`,
    '            <div class="row-main">',
    `                <span class="row-title">${escapeText(item.title)}</span>`,
    `                <p class="row-desc">${escapeText(experienceDescLine(item))}</p>`,
    '                <span class="work-toggle"><span class="sym" aria-hidden="true">+</span> Details</span>',
    '            </div>',
    '            <div class="row-meta">',
    `                <span class="stack">${escapeText(item.meta.stack)}</span>`,
    `                <span class="win">${escapeText(item.meta.win)}</span>`,
    '            </div>',
    '        </button>',
    '    </h3>',
    `    <div class="work-detail card-content" id="${escapeText(item.id)}">`,
    '        <div class="gist-grid">',
  ];
  for (const g of item.gist) {
    lines.push('            <div>');
    lines.push(`                <p class="gist-label">${escapeText(g.label)}</p>`);
    lines.push(`                <p>${g.html}</p>`);
    lines.push('            </div>');
  }
  lines.push('        </div>');
  for (const block of item.blocks) {
    lines.push('        <div class="work-block">');
    lines.push(`            <h4>${escapeText(block.heading)}</h4>`);
    for (const p of block.paragraphs ?? []) lines.push(`            <p>${p}</p>`);
    if (block.items?.length) {
      lines.push('            <ul class="work-list">');
      for (const li of block.items) lines.push(`                <li>${li}</li>`);
      lines.push('            </ul>');
    }
    lines.push('        </div>');
  }
  lines.push('    </div>');
  lines.push('</article>');
  return lines;
}

/**
 * The experience region is the ledger wrapper plus the footnote beneath it.
 * The footnote is a sibling of the ledger, not a child, so the region has to
 * include the wrapper to keep it in one marker pair.
 */
export function renderExperience(experience, indent = '') {
  const cards = experience.items.map((item, n) => renderExperienceCard(item, n));
  const lines = ['<div class="ledger">'];
  cards.forEach((card, n) => {
    if (n > 0) lines.push('');
    lines.push(...card.map((l) => '    ' + l));
  });
  lines.push('</div>');
  if (experience.footnote) {
    lines.push(`<p class="work-footnote">${experience.footnote}</p>`);
  }
  return indentLines(lines, indent);
}

// ---------------------------------------------------------------------------
// Validation. Errors name the field path, e.g. "projects[2].desc".
// ---------------------------------------------------------------------------

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function fail(path, message) {
  throw new ContentError(`${path}: ${message}`);
}

function reqString(obj, key, path) {
  const v = obj[key];
  if (typeof v !== 'string' || v.trim() === '') fail(`${path}.${key}`, 'required, non-empty string');
  return v;
}

function optString(obj, key, path) {
  const v = obj[key];
  if (v !== undefined && typeof v !== 'string') fail(`${path}.${key}`, 'must be a string when present');
  return v;
}

function optBool(obj, key, path) {
  const v = obj[key];
  if (v !== undefined && typeof v !== 'boolean') fail(`${path}.${key}`, 'must be true or false when present');
}

function reqArray(obj, key, path) {
  const v = obj[key];
  if (!Array.isArray(v)) fail(`${path}.${key}`, 'required array');
  return v;
}

function reqObject(obj, key, path) {
  const v = obj[key];
  if (!isObject(v)) fail(`${path}.${key}`, 'required object');
  return v;
}

function validateProject(p, path) {
  if (!isObject(p)) fail(path, 'must be an object');
  const id = reqString(p, 'id', path);
  if (!SLUG.test(id)) fail(`${path}.id`, `"${id}" must be lowercase letters, digits and hyphens (it becomes a CSS class)`);
  reqString(p, 'title', path);
  reqString(p, 'desc', path);
  reqString(p, 'tag', path);
  optString(p, 'href', path);
  optString(p, 'cue', path);
  optBool(p, 'external', path);
  optBool(p, 'static', path);
  if (p.href !== undefined) {
    if (p.href.trim() === '') fail(`${path}.href`, 'must not be empty when present');
    reqString(p, 'cue', path);
  }
  if (p.spec !== undefined) {
    if (!Array.isArray(p.spec)) fail(`${path}.spec`, 'must be an array when present');
    p.spec.forEach((row, i) => {
      if (!isObject(row)) fail(`${path}.spec[${i}]`, 'must be an object');
      reqString(row, 'term', `${path}.spec[${i}]`);
      reqString(row, 'detail', `${path}.spec[${i}]`);
    });
  }
  if (p.source !== undefined) {
    if (!isObject(p.source)) fail(`${path}.source`, 'must be an object when present');
    optString(p.source, 'github', `${path}.source`);
  }
}

function validateWriting(w, path) {
  if (!isObject(w)) fail(path, 'must be an object');
  reqString(w, 'title', path);
  reqString(w, 'href', path);
  reqString(w, 'desc', path);
  reqString(w, 'cue', path);
  optBool(w, 'external', path);
}

function validateStack(col, path) {
  if (!isObject(col)) fail(path, 'must be an object');
  reqString(col, 'label', path);
  const items = reqArray(col, 'items', path);
  items.forEach((item, i) => {
    const ip = `${path}.items[${i}]`;
    if (!isObject(item)) fail(ip, 'must be an object');
    reqString(item, 'name', ip);
    optString(item, 'note', ip);
  });
}

function validateExperienceItem(item, path) {
  if (!isObject(item)) fail(path, 'must be an object');
  const id = reqString(item, 'id', path);
  if (!SLUG.test(id)) fail(`${path}.id`, `"${id}" must be lowercase letters, digits and hyphens`);
  reqString(item, 'title', path);
  reqString(item, 'org', path);
  reqString(item, 'dates', path);
  optString(item, 'focus', path);
  reqString(item, 'ariaLabel', path);
  const meta = reqObject(item, 'meta', path);
  reqString(meta, 'stack', `${path}.meta`);
  reqString(meta, 'win', `${path}.meta`);
  const gist = reqArray(item, 'gist', path);
  gist.forEach((g, i) => {
    const gp = `${path}.gist[${i}]`;
    if (!isObject(g)) fail(gp, 'must be an object');
    reqString(g, 'label', gp);
    reqString(g, 'html', gp);
  });
  const blocks = reqArray(item, 'blocks', path);
  blocks.forEach((b, i) => {
    const bp = `${path}.blocks[${i}]`;
    if (!isObject(b)) fail(bp, 'must be an object');
    reqString(b, 'heading', bp);
    for (const key of ['paragraphs', 'items']) {
      if (b[key] === undefined) continue;
      if (!Array.isArray(b[key]) || b[key].some((s) => typeof s !== 'string')) {
        fail(`${bp}.${key}`, 'must be an array of strings when present');
      }
    }
  });
}

/** Throws ContentError on the first problem. Returns the data when valid. */
export function validateContent(data) {
  if (!isObject(data)) fail('(root)', 'must be a JSON object');

  const projects = reqArray(data, 'projects', '(root)');
  const seen = new Map();
  projects.forEach((p, i) => {
    const path = `projects[${i}]`;
    validateProject(p, path);
    if (seen.has(p.id)) fail(`${path}.id`, `duplicate id "${p.id}" (first used at ${seen.get(p.id)})`);
    seen.set(p.id, path);
  });

  reqArray(data, 'writing', '(root)').forEach((w, i) => validateWriting(w, `writing[${i}]`));
  reqArray(data, 'stack', '(root)').forEach((c, i) => validateStack(c, `stack[${i}]`));

  const experience = reqObject(data, 'experience', '(root)');
  const items = reqArray(experience, 'items', 'experience');
  const ids = new Map();
  items.forEach((item, i) => {
    const path = `experience.items[${i}]`;
    validateExperienceItem(item, path);
    if (ids.has(item.id)) fail(`${path}.id`, `duplicate id "${item.id}" (first used at ${ids.get(item.id)})`);
    ids.set(item.id, path);
  });
  optString(experience, 'footnote', 'experience');

  return data;
}

// ---------------------------------------------------------------------------
// Splicing into index.html
// ---------------------------------------------------------------------------

const RENDERERS = {
  projects: (d, indent) => renderProjects(d.projects, indent),
  writing: (d, indent) => renderWriting(d.writing, indent),
  stack: (d, indent) => renderStack(d.stack, indent),
  experience: (d, indent) => renderExperience(d.experience, indent),
};

function onlyOccurrence(html, needle, name) {
  const first = html.indexOf(needle);
  if (first === -1) throw new ContentError(`index.html has no ${needle} marker`);
  if (html.indexOf(needle, first + 1) !== -1) {
    throw new ContentError(`index.html has more than one ${needle} marker (region "${name}")`);
  }
  return first;
}

/**
 * Replace every region in `html`. Returns the new html and the names of the
 * regions whose text changed. Each marker must sit on its own line; the
 * indentation of the opening marker is reused for the generated body.
 */
export function updateIndex(html, data) {
  let out = html;
  const changed = [];

  for (const name of REGION_NAMES) {
    const open = `<!-- content:${name} -->`;
    const close = `<!-- /content:${name} -->`;
    const o = onlyOccurrence(out, open, name);
    const c = onlyOccurrence(out, close, name);
    if (c < o) throw new ContentError(`index.html: ${close} comes before ${open}`);

    const lineStart = out.lastIndexOf('\n', o) + 1;
    const indent = out.slice(lineStart, o);
    if (!/^[ \t]*$/.test(indent)) throw new ContentError(`index.html: ${open} must start its own line`);
    const closeLineStart = out.lastIndexOf('\n', c) + 1;
    if (!/^[ \t]*$/.test(out.slice(closeLineStart, c))) {
      throw new ContentError(`index.html: ${close} must start its own line`);
    }

    const closeEnd = c + close.length;
    const body = RENDERERS[name](data, indent);
    const block = [indent + open, ...(body ? [body] : []), indent + close].join('\n');

    if (out.slice(lineStart, closeEnd) !== block) changed.push(name);
    out = out.slice(0, lineStart) + block + out.slice(closeEnd);
  }

  return { html: out, changed };
}

/** Pure convenience wrapper: the html with every region regenerated. */
export function renderIndex(html, data) {
  return updateIndex(html, data).html;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function loadContent() {
  let raw;
  try {
    raw = readFileSync(CONTENT_PATH, 'utf8');
  } catch (err) {
    throw new ContentError(`cannot read content/site.json: ${err.message}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new ContentError(`content/site.json is not valid JSON: ${err.message}`);
  }
  return validateContent(data);
}

function main(argv) {
  const check = argv.includes('--check');
  const data = loadContent();
  const before = readFileSync(INDEX_PATH, 'utf8');
  const { html: after, changed } = updateIndex(before, data);

  if (check) {
    if (after !== before) {
      const names = changed.join(', ');
      console.error(
        `index.html is out of sync with content/site.json (regions: ${names}).\n` +
          'Run: node scripts/render-content.mjs',
      );
      return 1;
    }
    console.log('index.html is in sync with content/site.json');
    return 0;
  }

  if (after === before) {
    console.log('index.html already matches content/site.json; nothing changed');
    return 0;
  }
  writeFileSync(INDEX_PATH, after);
  console.log(`Updated index.html regions: ${changed.join(', ')}`);
  return 0;
}

// realpath on both sides: on macOS /var is a symlink to /private/var, and Node
// reports the module URL resolved.
const isMain =
  process.argv[1] !== undefined && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (isMain) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    if (err instanceof ContentError) {
      console.error(`render-content: ${err.message}`);
      process.exitCode = 1;
    } else {
      throw err;
    }
  }
}
