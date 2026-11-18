import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  diffRepos, fetchRepos, fetchReadme, normalizeRepo, parseLinkHeader, README_MAX,
} from './scan.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, 'fixtures', f), 'utf8'));
const NOW = '2026-11-09T12:00:00Z';

const clone = (x) => structuredClone(x);
const rawRepos = () => load('repos.raw.json');
const repos = (raw = rawRepos()) => raw.map(normalizeRepo);
const curation = () => load('curation.json');
const site = () => load('site.json');
const run = (over = {}) => diffRepos({ repos: repos(), curation: curation(), site: site(), now: NOW, ...over });

function withStubFetch(handler, fn) {
  const real = globalThis.fetch;
  globalThis.fetch = handler;
  return Promise.resolve().then(fn).finally(() => { globalThis.fetch = real; });
}

function mutateRaw(name, patch) {
  const raw = rawRepos();
  Object.assign(raw.find((r) => r.name === name), patch);
  return raw;
}

test('forks and private repos are excluded from fetchRepos', async () => {
  const page = rawRepos();
  await withStubFetch(async () => new Response(JSON.stringify(page), { status: 200 }), async () => {
    const out = await fetchRepos('cubeerea', { token: 't' });
    const names = out.map((r) => r.name);
    assert.ok(!names.includes('zeta-fork'));
    assert.ok(!names.includes('eta-secret'));
    assert.equal(out.length, 6);
  });
});

test('forks and private repos never reach the diff', () => {
  const r = run();
  const all = [...r.newCandidates, ...r.pending, ...r.updates.map((u) => u.repo)].map((x) => x.name ?? x);
  assert.ok(!all.includes('zeta-fork'));
  assert.ok(!all.includes('eta-secret'));
  assert.ok(!(r.nextCuration.repos['eta-secret']));
});

test('pagination follows Link rel="next" across pages', async () => {
  const calls = [];
  const pages = [rawRepos().slice(0, 4), rawRepos().slice(4)];
  const handler = async (url) => {
    calls.push(url);
    const i = calls.length - 1;
    const headers = i === 0 ? { link: '<https://api.github.com/users/cubeerea/repos?page=2>; rel="next", <https://api.github.com/users/cubeerea/repos?page=2>; rel="last"' } : {};
    return new Response(JSON.stringify(pages[i]), { status: 200, headers });
  };
  await withStubFetch(handler, async () => {
    const out = await fetchRepos('cubeerea', { token: '' });
    assert.equal(calls.length, 2);
    assert.equal(calls[1], 'https://api.github.com/users/cubeerea/repos?page=2');
    assert.equal(out.length, 6);
  });
});

test('GitHub errors surface with status', async () => {
  await withStubFetch(async () => new Response('nope', { status: 403 }), async () => {
    await assert.rejects(fetchRepos('cubeerea', { token: '' }), (e) => e.status === 403);
  });
});

test('parseLinkHeader handles multi-rel and missing headers', () => {
  const l = parseLinkHeader('<https://a/?page=2>; rel="next", <https://a/?page=5>; rel="last"');
  assert.equal(l.next, 'https://a/?page=2');
  assert.equal(l.last, 'https://a/?page=5');
  assert.deepEqual(parseLinkHeader(null), {});
  assert.equal(parseLinkHeader('<https://a/?page=1>; rel="prev"').next, undefined);
});

test('fetchReadme decodes base64 and truncates to 6000 chars', async () => {
  const body = 'x'.repeat(9000);
  const content = Buffer.from(body).toString('base64');
  await withStubFetch(async () => new Response(JSON.stringify({ encoding: 'base64', content }), { status: 200 }), async () => {
    const text = await fetchReadme('cubeerea', 'alpha-tool', { token: '' });
    assert.equal(text.length, README_MAX);
  });
  const small = Buffer.from('# Hello\n\nFixture readme body.\n').toString('base64');
  await withStubFetch(async () => new Response(JSON.stringify({ encoding: 'base64', content: small }), { status: 200 }), async () => {
    assert.equal(await fetchReadme('cubeerea', 'alpha-tool', { token: '' }), '# Hello\n\nFixture readme body.\n');
  });
  await withStubFetch(async () => new Response('{}', { status: 404 }), async () => {
    assert.equal(await fetchReadme('cubeerea', 'alpha-tool', { token: '' }), null);
  });
});

test('new repo becomes a pending candidate with offeredAt = today', () => {
  const r = run();
  const names = r.newCandidates.map((c) => c.name).sort();
  assert.deepEqual(names, ['epsilon-profile', 'theta-new']);
  assert.deepEqual(r.nextCuration.repos['theta-new'], { status: 'pending', offeredAt: '2026-11-09' });
  assert.deepEqual(r.newPending, {
    'epsilon-profile': { status: 'pending', offeredAt: '2026-11-09' },
    'theta-new': { status: 'pending', offeredAt: '2026-11-09' },
  });
});

test('a candidate offered last week is pending on the next scan, not new', () => {
  const first = run();
  const second = diffRepos({ repos: repos(), curation: first.nextCuration, site: site(), now: '2026-11-16T12:00:00Z' });
  assert.ok(!second.newCandidates.some((c) => c.name === 'theta-new'));
  const pend = second.pending.find((p) => p.name === 'theta-new');
  assert.ok(pend);
  assert.equal(pend.decision.offeredAt, '2026-11-09');
  assert.deepEqual(second.newPending, {});
});

test('ignored repos never surface, even when they change', () => {
  const raw = mutateRaw('delta-site', { description: 'changed', pushedAt: '2026-11-08T00:00:00Z', stargazers_count: 99 });
  const cur = curation();
  const r = run({ repos: repos(raw), curation: cur });
  const surfaced = [
    ...r.newCandidates.map((x) => x.name), ...r.pending.map((x) => x.name),
    ...r.updates.map((x) => x.repo), ...r.includedMissingTile.map((x) => x.repo),
  ];
  assert.ok(!surfaced.includes('delta-site'));
  assert.ok(!surfaced.includes('gamma-lab'));
  assert.equal(r.ignoredCount, 2);
  assert.deepEqual(r.nextCuration.repos['delta-site'], cur.repos['delta-site']);
});

test('included repo description change is an update', () => {
  const raw = mutateRaw('alpha-tool', { description: 'A better CLI' });
  const r = run({ repos: repos(raw) });
  const u = r.updates.find((x) => x.repo === 'alpha-tool');
  assert.ok(u);
  assert.equal(u.projectId, 'alpha');
  assert.deepEqual(u.changes.description, { from: 'A CLI for alphas', to: 'A better CLI' });
  assert.deepEqual(u.flags, []);
});

test('star +3 is not an update; +12 is traction', () => {
  const cur = curation();
  cur.snapshot['alpha-tool'].stars = 3;
  const plus3 = run({ repos: repos(mutateRaw('alpha-tool', { stargazers_count: 6 })), curation: clone(cur) });
  assert.ok(!plus3.updates.some((u) => u.repo === 'alpha-tool'));

  const plus12 = run({ repos: repos(mutateRaw('alpha-tool', { stargazers_count: 15 })), curation: clone(cur) });
  const u = plus12.updates.find((x) => x.repo === 'alpha-tool');
  assert.ok(u, 'traction update present');
  assert.deepEqual(u.flags, ['traction']);
  assert.deepEqual(u.changes.stars, { from: 3, to: 15 });
});

test('pushedAt change on an included repo is flagged activity', () => {
  const r = run({ repos: repos(mutateRaw('alpha-tool', { pushed_at: '2026-11-07T00:00:00Z' })) });
  const u = r.updates.find((x) => x.repo === 'alpha-tool');
  assert.deepEqual(u.flags, ['activity']);
  assert.deepEqual(u.changes.pushedAt, { from: '2026-10-01T10:00:00Z', to: '2026-11-07T00:00:00Z' });
});

test('included repo with no tile is includedMissingTile', () => {
  const s = site();
  s.projects = s.projects.filter((p) => p.id !== 'alpha');
  const r = run({ site: s });
  assert.deepEqual(r.includedMissingTile, [{ repo: 'alpha-tool', projectId: 'alpha' }]);
});

test('tile whose repo vanished is tilesMissingRepo; static tiles are ignored', () => {
  const r = run();
  assert.deepEqual(r.tilesMissingRepo, [{ projectId: 'old', title: 'Old Thing', github: 'old-thing' }]);
});

test('first run (empty snapshot) reports no included changes', () => {
  const cur = curation();
  cur.snapshot = {};
  const r = run({ repos: repos(mutateRaw('beta-notes', { description: 'changed', stargazers_count: 500 })), curation: cur });
  assert.deepEqual(r.updates, []);
  assert.ok(r.nextSnapshot['beta-notes'], 'snapshot is seeded for the next run');
});

test('decisions are never overwritten or dropped', () => {
  const cur = curation();
  cur.repos['pending-proj'] = { status: 'pending', offeredAt: '2026-10-25' };
  const before = clone(cur.repos);
  const raw = mutateRaw('beta-notes', { description: 'x' });
  const r = run({ repos: repos(raw), curation: cur });
  for (const [name, entry] of Object.entries(before)) {
    assert.deepEqual(r.nextCuration.repos[name], entry, `entry ${name} preserved`);
  }
});

test('diffRepos is pure: inputs unchanged, same output for same inputs, no clock', () => {
  const cur = curation();
  const s = site();
  const rp = repos();
  const snapCur = clone(cur), snapSite = clone(s), snapRp = clone(rp);
  const a = diffRepos({ repos: rp, curation: cur, site: s, now: NOW });
  const b = diffRepos({ repos: rp, curation: cur, site: s, now: NOW });
  assert.deepEqual(cur, snapCur);
  assert.deepEqual(s, snapSite);
  assert.deepEqual(rp, snapRp);
  assert.deepEqual(a, b);
  assert.throws(() => diffRepos({ repos: rp, curation: cur, site: s }), TypeError);
});
