// Run with: node --test scripts/
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import {
  ContentError,
  escapeText,
  renderProjects,
  renderWriting,
  renderStack,
  renderExperience,
  experienceDescLine,
  validateContent,
  renderIndex,
  updateIndex,
} from './render-content.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const realData = JSON.parse(readFileSync(join(root, 'content', 'site.json'), 'utf8'));
const realHtml = readFileSync(join(root, 'index.html'), 'utf8');

// Minimal valid data used as a base for edits in the tests below.
function sample() {
  return {
    projects: [
      { id: 'a', title: 'Alpha', desc: 'First <em>desc</em>', tag: 'T', href: 'https://example.com/a', external: true, cue: 'Live' },
      { id: 'b', title: 'Beta', desc: 'Second', tag: 'T' },
    ],
    writing: [{ title: 'Post', href: 'https://example.com/p', external: true, desc: 'd', cue: 'Read' }],
    stack: [{ label: 'ML & Data', items: [{ name: 'NumPy' }, { name: 'Neo4j', note: 'Kùzu' }] }],
    experience: {
      items: [
        {
          id: 'work-1',
          title: 'Role',
          org: 'Org',
          dates: 'Jan 2025 – Feb 2025',
          focus: 'Topic',
          ariaLabel: 'Role, Org',
          meta: { stack: 'Research', win: 'Win' },
          gist: [{ label: 'The Gist', html: 'Gist <strong>bold</strong>' }],
          blocks: [{ heading: 'Context', paragraphs: ['Para &amp; more'], items: [] }],
        },
      ],
      footnote: 'Note <strong>x</strong>',
    },
  };
}

describe('escapeText', () => {
  test('escapes &, <, > and double quotes', () => {
    assert.equal(escapeText('a & b < c > d "e"'), 'a &amp; b &lt; c &gt; d &quot;e&quot;');
  });

  test('ampersand is escaped first, so existing entities are not double-decoded', () => {
    assert.equal(escapeText('&amp;'), '&amp;amp;');
  });

  test('leaves apostrophes and non-ASCII text alone', () => {
    assert.equal(escapeText("Chen's Lab — Kùzu →"), "Chen's Lab — Kùzu →");
  });
});

describe('renderProjects', () => {
  test('numbers tiles 01, 02, ... from array order', () => {
    const html = renderProjects(sample().projects);
    assert.match(html, /bento-idx">01</);
    assert.match(html, /bento-idx">02</);
    assert.ok(html.indexOf('bento-a"') < html.indexOf('bento-b"'));
  });

  test('a 7th project renders as a tile with its own class and number', () => {
    const data = sample();
    for (let i = 0; i < 5; i++) data.projects.push({ id: `extra${i}`, title: `X${i}`, desc: 'd', tag: 'T' });
    const html = renderProjects(data.projects);
    assert.equal((html.match(/<article class="bento-tile /g) || []).length, 7);
    assert.match(html, /<article class="bento-tile bento-extra0">/);
    assert.match(html, /bento-idx">07</);
  });

  test('escapes plain title but inserts html desc raw', () => {
    const data = sample();
    data.projects[0].title = 'A <b>bold</b> title';
    const html = renderProjects(data.projects);
    assert.match(html, /A &lt;b&gt;bold&lt;\/b&gt; title/);
    assert.match(html, /<p class="bento-desc">First <em>desc<\/em><\/p>/);
  });

  test('linked tile gets an anchor; external adds target and rel; cue gets an arrow', () => {
    const html = renderProjects(sample().projects);
    assert.match(html, /<a href="https:\/\/example\.com\/a" target="_blank" rel="noopener noreferrer">Alpha<\/a>/);
    assert.match(html, /bento-cue" aria-hidden="true">Live&nbsp;↗<\/span>/);
  });

  test('internal link has no target and an arrow pointing right', () => {
    const data = sample();
    data.projects[0].external = false;
    data.projects[0].href = '/somewhere';
    data.projects[0].cue = 'Read';
    const html = renderProjects(data.projects);
    assert.match(html, /<a href="\/somewhere">Alpha<\/a>/);
    assert.match(html, /Read&nbsp;→<\/span>/);
  });

  test('tile without href is plain text with no cue; static adds bento-static', () => {
    const data = sample();
    data.projects[1].static = true;
    const html = renderProjects(data.projects);
    assert.match(html, /<article class="bento-tile bento-b bento-static">/);
    assert.match(html, /<h3 class="bento-title">Beta<\/h3>/);
    assert.doesNotMatch(html.split('bento-b bento-static')[1], /bento-cue/);
  });

  test('spec tile emits the documentation comment and the dl; others do not', () => {
    const data = sample();
    data.projects[0].spec = [{ term: 'Model', detail: 'Gemma' }];
    const html = renderProjects(data.projects);
    assert.match(html, /<!-- The 2x2 tile's emphasis mechanism/);
    assert.match(html, /<dl class="bento-spec">\n\s+<div>\n\s+<dt>Model<\/dt>\n\s+<dd>Gemma<\/dd>/);
    assert.equal((html.match(/<!-- The 2x2/g) || []).length, 1);
  });

  test('indent is applied to every non-empty line and not to blank lines', () => {
    const html = renderProjects(sample().projects, '    ');
    for (const line of html.split('\n')) {
      if (line !== '') assert.ok(line.startsWith('    <') || line.startsWith('        '), `bad indent: ${line}`);
    }
    assert.ok(html.split('\n').some((l) => l === ''));
  });
});

describe('renderWriting', () => {
  test('numbers rows and renders external links with rel and arrow', () => {
    const data = sample();
    data.writing.push({ title: 'Second', href: 'https://example.com/2', external: true, desc: 'd', cue: 'Read' });
    const html = renderWriting(data.writing);
    assert.match(html, /row-idx">01</);
    assert.match(html, /row-idx">02</);
    assert.match(html, /<a href="https:\/\/example\.com\/p" target="_blank" rel="noopener noreferrer">Post<\/a>/);
    assert.match(html, /row-cue" aria-hidden="true">Read&nbsp;↗</);
  });
});

describe('renderStack', () => {
  test('numbers columns, escapes labels, wraps notes in parentheses', () => {
    const html = renderStack(sample().stack);
    assert.match(html, /<span class="stack-num">01<\/span>ML &amp; Data<\/h3>/);
    assert.match(html, /<li>Neo4j <span class="stack-note">\(Kùzu\)<\/span><\/li>/);
    assert.match(html, /<li>NumPy<\/li>/);
  });
});

describe('experience', () => {
  test('desc line is "dates · org · focus" and drops focus when absent', () => {
    const item = sample().experience.items[0];
    assert.equal(experienceDescLine(item), 'Jan 2025 – Feb 2025 · Org · Topic');
    assert.equal(experienceDescLine({ ...item, focus: undefined }), 'Jan 2025 – Feb 2025 · Org');
  });

  test('card wires aria-controls to the detail id and keeps the JS hooks', () => {
    const html = renderExperience(sample().experience);
    assert.match(html, /aria-controls="work-1"/);
    assert.match(html, /<div class="work-detail card-content" id="work-1">/);
    assert.match(html, /<article class="row row-work experience-card" data-expanded="false">/);
    assert.match(html, /class="work-header card-header" type="button" aria-expanded="false"/);
    assert.match(html, /aria-label="Role, Org"/);
  });

  test('footnote is rendered when present and omitted when absent', () => {
    const data = sample();
    assert.match(renderExperience(data.experience), /<p class="work-footnote">Note <strong>x<\/strong><\/p>/);
    delete data.experience.footnote;
    assert.doesNotMatch(renderExperience(data.experience), /work-footnote/);
  });

  test('gist html is raw and block paragraphs are raw', () => {
    const html = renderExperience(sample().experience);
    assert.match(html, /<p>Gist <strong>bold<\/strong><\/p>/);
    assert.match(html, /<p>Para &amp; more<\/p>/);
  });
});

describe('validateContent', () => {
  test('the real site.json is valid', () => {
    assert.doesNotThrow(() => validateContent(realData));
  });

  test('a missing required field names its path', () => {
    const data = sample();
    delete data.projects[1].desc;
    assert.throws(() => validateContent(data), (err) => {
      assert.ok(err instanceof ContentError);
      assert.match(err.message, /^projects\[1\]\.desc: /);
      return true;
    });
  });

  test('duplicate project ids are rejected and name both locations', () => {
    const data = sample();
    data.projects[1].id = 'a';
    assert.throws(() => validateContent(data), /projects\[1\]\.id: duplicate id "a" \(first used at projects\[0\]\)/);
  });

  test('project ids must be CSS-safe slugs', () => {
    const data = sample();
    data.projects[0].id = 'Has Space';
    assert.throws(() => validateContent(data), /projects\[0\]\.id: .*CSS class/);
  });

  test('a linked project must have a cue', () => {
    const data = sample();
    delete data.projects[0].cue;
    assert.throws(() => validateContent(data), /projects\[0\]\.cue: required/);
  });

  test('experience gist entries need a label and html', () => {
    const data = sample();
    delete data.experience.items[0].gist[0].html;
    assert.throws(() => validateContent(data), /experience\.items\[0\]\.gist\[0\]\.html: required/);
  });

  test('stack items need a name', () => {
    const data = sample();
    data.stack[0].items[0].name = '';
    assert.throws(() => validateContent(data), /stack\[0\]\.items\[0\]\.name: required/);
  });

  test('wrong top-level shape is reported', () => {
    assert.throws(() => validateContent([]), /\(root\): must be a JSON object/);
  });
});

describe('renderIndex / drift', () => {
  const fixture = (regions) =>
    ['<main>', ...regions.map((n) => `    <div>\n        <!-- content:${n} -->\n        <!-- /content:${n} -->\n    </div>`), '</main>'].join('\n');

  test('the committed index.html is in sync with site.json', () => {
    assert.equal(renderIndex(realHtml, realData), realHtml);
  });

  test('editing text inside a region is detected as drift', () => {
    const drifted = realHtml.replace('Ranks all NBA contracts', 'Ranks every NBA contract');
    assert.notEqual(renderIndex(drifted, realData), drifted);
    assert.deepEqual(updateIndex(drifted, realData).changed, ['projects']);
  });

  test('editing outside the regions is not drift', () => {
    const drifted = realHtml.replace('I write to clarify my own thinking.', 'I write to think.');
    assert.equal(renderIndex(drifted, realData), drifted);
  });

  test('a missing marker is an error that names it', () => {
    assert.throws(() => renderIndex('<p>nothing</p>', realData), /has no <!-- content:projects --> marker/);
  });

  test('a duplicated marker is an error', () => {
    const html = fixture(['projects', 'writing', 'stack', 'experience']) + '\n<!-- content:stack -->';
    assert.throws(() => renderIndex(html, realData), /more than one <!-- content:stack -->/);
  });

  test('regions are filled in place and reflect the data', () => {
    const data = sample();
    const html = fixture(['projects', 'writing', 'stack', 'experience']);
    const out = renderIndex(html, data);
    assert.match(out, /<!-- content:projects -->\n {8}<article class="bento-tile bento-a">/);
    assert.match(out, /bento-tile bento-b">/);
    assert.match(out, /stack-num">01/);
    assert.match(out, /work-footnote/);
  });
});

describe('CLI --check', () => {
  const script = join(here, 'render-content.mjs');

  test('exits 0 on the committed files', () => {
    const r = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  });

  test('exits 1 when index.html has drifted from site.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'render-content-'));
    mkdirSync(join(dir, 'scripts'));
    mkdirSync(join(dir, 'content'));
    copyFileSync(script, join(dir, 'scripts', 'render-content.mjs'));
    copyFileSync(join(root, 'content', 'site.json'), join(dir, 'content', 'site.json'));
    writeFileSync(join(dir, 'index.html'), realHtml.replace('Zettel AI', 'Zettel Pro'));
    const r = spawnSync(process.execPath, [join(dir, 'scripts', 'render-content.mjs'), '--check'], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /out of sync/);
  });

  test('without --check, writes the file back in sync', () => {
    const dir = mkdtempSync(join(tmpdir(), 'render-content-'));
    mkdirSync(join(dir, 'scripts'));
    mkdirSync(join(dir, 'content'));
    copyFileSync(script, join(dir, 'scripts', 'render-content.mjs'));
    copyFileSync(join(root, 'content', 'site.json'), join(dir, 'content', 'site.json'));
    writeFileSync(join(dir, 'index.html'), realHtml.replace('Zettel AI', 'Zettel Pro'));
    const write = spawnSync(process.execPath, [join(dir, 'scripts', 'render-content.mjs')], { encoding: 'utf8' });
    assert.equal(write.status, 0, write.stderr);
    assert.match(write.stdout, /Updated index\.html regions: projects/);
    const check = spawnSync(process.execPath, [join(dir, 'scripts', 'render-content.mjs'), '--check'], { encoding: 'utf8' });
    assert.equal(check.status, 0);
  });

  test('invalid content exits 1 with a readable message', () => {
    const dir = mkdtempSync(join(tmpdir(), 'render-content-'));
    mkdirSync(join(dir, 'scripts'));
    mkdirSync(join(dir, 'content'));
    copyFileSync(script, join(dir, 'scripts', 'render-content.mjs'));
    const bad = sample();
    delete bad.projects[0].tag;
    writeFileSync(join(dir, 'content', 'site.json'), JSON.stringify(bad));
    writeFileSync(join(dir, 'index.html'), realHtml);
    const r = spawnSync(process.execPath, [join(dir, 'scripts', 'render-content.mjs'), '--check'], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /projects\[0\]\.tag: required/);
  });
});
