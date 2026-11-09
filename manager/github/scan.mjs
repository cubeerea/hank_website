// Weekly GitHub scanner for the portfolio manager.
// fetchRepos / fetchReadme do I/O; diffRepos is a pure function of its inputs.
import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const API = 'https://api.github.com';
export const STAR_TRACTION_THRESHOLD = 10;
export const README_MAX = 6000;
const UA = 'portfolio-manager-scan';
const SNAPSHOT_FIELDS = ['description', 'homepage', 'archived', 'language'];

export class GitHubError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'GitHubError';
    this.status = status; // null => network failure
  }
}

// Parses an RFC 8288 Link header into { next, last, ... }.
export function parseLinkHeader(header) {
  const links = {};
  if (!header) return links;
  for (const part of header.split(',')) {
    const m = part.match(/<([^>]+)>\s*;(.*)/);
    if (!m) continue;
    const rel = m[2].match(/rel="?([^";]+)"?/);
    if (!rel) continue;
    for (const r of rel[1].trim().split(/\s+/)) links[r] = m[1];
  }
  return links;
}

export function normalizeRepo(r) {
  return {
    name: r.name,
    fork: Boolean(r.fork),
    private: Boolean(r.private),
    archived: Boolean(r.archived),
    description: r.description ?? '',
    homepage: r.homepage ?? '',
    stars: r.stargazers_count ?? 0,
    pushedAt: r.pushed_at ?? null,
    topics: [...(r.topics ?? [])].sort(),
    language: r.language ?? '',
    htmlUrl: r.html_url ?? `https://github.com/${r.full_name ?? r.name}`,
  };
}

function snapshotOf(repo) {
  return {
    description: repo.description,
    homepage: repo.homepage,
    stars: repo.stars,
    pushedAt: repo.pushedAt,
    topics: [...repo.topics],
    archived: repo.archived,
    language: repo.language,
  };
}

function tokenFrom(opts = {}) {
  return opts.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
}

async function apiGet(url, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': UA,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    throw new GitHubError(`network error calling GitHub: ${err.message}`, null);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new GitHubError(`GitHub API ${res.status} for ${url.split('?')[0]}: ${body.slice(0, 200)}`, res.status);
  }
  return res;
}

// Public, non-fork repos owned by `owner`, normalized. Follows Link rel="next".
export async function fetchRepos(owner, opts = {}) {
  const token = tokenFrom(opts);
  let url = `${API}/users/${encodeURIComponent(owner)}/repos?type=owner&per_page=100`;
  const out = [];
  for (let page = 0; url && page < 100; page++) {
    const res = await apiGet(url, token);
    const batch = await res.json();
    if (!Array.isArray(batch)) throw new GitHubError('unexpected non-array repo listing');
    for (const raw of batch) {
      const repo = normalizeRepo(raw);
      if (!repo.fork && !repo.private) out.push(repo);
    }
    url = parseLinkHeader(res.headers.get('link')).next ?? null;
  }
  return out;
}

// Plain-text README (markdown source), truncated to README_MAX chars. null if none.
export async function fetchReadme(owner, name, opts = {}) {
  const url = `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/readme`;
  let res;
  try {
    res = await apiGet(url, tokenFrom(opts));
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
  const body = await res.json();
  if (body.encoding !== 'base64' || typeof body.content !== 'string') return null;
  const text = Buffer.from(body.content, 'base64').toString('utf8');
  return text.length > README_MAX ? text.slice(0, README_MAX) : text;
}

// Compares an included repo against its previous snapshot. No previous snapshot => no change.
function diffIncluded(repo, prev) {
  if (!prev) return null;
  const cur = snapshotOf(repo);
  const changes = {};
  const flags = [];
  for (const f of SNAPSHOT_FIELDS) {
    if ((prev[f] ?? null) !== (cur[f] ?? null)) changes[f] = { from: prev[f] ?? null, to: cur[f] };
  }
  const prevTopics = [...(prev.topics ?? [])].sort();
  if (JSON.stringify(prevTopics) !== JSON.stringify(cur.topics)) {
    changes.topics = { from: prevTopics, to: cur.topics };
  }
  if (prev.pushedAt !== cur.pushedAt) {
    changes.pushedAt = { from: prev.pushedAt ?? null, to: cur.pushedAt };
    flags.push('activity');
  }
  if (typeof prev.stars === 'number' && cur.stars - prev.stars >= STAR_TRACTION_THRESHOLD) {
    changes.stars = { from: prev.stars, to: cur.stars };
    flags.push('traction');
  }
  if (Object.keys(changes).length === 0) return null;
  return { changes, flags };
}

// Pure: no I/O, no clock (pass `now`). Never mutates its inputs.
export function diffRepos({ repos, curation, site, now }) {
  if (!now) throw new TypeError('diffRepos needs `now`; it does not read the clock');
  const nowDate = new Date(now);
  const today = nowDate.toISOString().slice(0, 10);
  const decisions = curation.repos ?? {};
  const prevSnapshot = curation.snapshot ?? {};
  const projects = site?.projects ?? [];
  const tileRepos = new Set(projects.map((p) => p.source?.github).filter(Boolean));

  const pub = new Map();
  for (const r of repos) if (!r.fork && !r.private) pub.set(r.name, r);

  const newCandidates = [];
  const pending = [];
  const updates = [];
  const includedMissingTile = [];
  let ignoredCount = 0;

  const nextSnapshot = structuredClone(prevSnapshot);
  const addedDecisions = {};

  for (const repo of pub.values()) {
    const d = decisions[repo.name];
    const prev = prevSnapshot[repo.name];
    nextSnapshot[repo.name] = snapshotOf(repo);

    if (!d) {
      newCandidates.push({ ...repo, decision: null });
      addedDecisions[repo.name] = { status: 'pending', offeredAt: today };
    } else if (d.status === 'pending') {
      pending.push({ ...repo, decision: structuredClone(d) });
    } else if (d.status === 'ignored') {
      ignoredCount++;
    } else if (d.status === 'included') {
      if (!tileRepos.has(repo.name)) {
        includedMissingTile.push({ repo: repo.name, projectId: d.projectId ?? null });
      }
      const u = diffIncluded(repo, prev);
      if (u) updates.push({ repo: repo.name, projectId: d.projectId ?? null, ...u });
    }
  }

  const tilesMissingRepo = projects
    .filter((p) => p.source?.github && !pub.has(p.source.github))
    .map((p) => ({ projectId: p.id, title: p.title, github: p.source.github }));

  const nextCuration = structuredClone(curation);
  nextCuration.repos = { ...nextCuration.repos, ...addedDecisions };
  nextCuration.snapshot = nextSnapshot;
  nextCuration.lastScanAt = nowDate.toISOString();
  assertNoDecisionLoss(curation, nextCuration);

  return {
    newCandidates,
    pending,
    updates,
    includedMissingTile,
    tilesMissingRepo,
    ignoredCount,
    newPending: addedDecisions,
    nextSnapshot,
    nextCuration,
  };
}

// Belt and braces: every pre-existing curation entry must survive unchanged.
function assertNoDecisionLoss(before, after) {
  for (const [name, entry] of Object.entries(before.repos ?? {})) {
    const kept = after.repos?.[name];
    if (JSON.stringify(kept) !== JSON.stringify(entry)) {
      throw new Error(`refusing to change curation entry for "${name}"`);
    }
  }
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    throw Object.assign(new Error(`cannot read ${label} at ${path}: ${err.message}`), { usage: true });
  }
}

async function writeJsonAtomic(path, value) {
  const tmp = `${path}.tmp-${process.pid}`;
  await writeFile(tmp, JSON.stringify(value, null, 2) + '\n');
  await rename(tmp, path);
}

function parseArgs(argv) {
  const args = { writeCuration: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write-curation') args.writeCuration = true;
    else if (a.startsWith('--') && i + 1 < argv.length) args[a.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = argv[++i];
    else throw Object.assign(new Error(`unknown argument ${a}`), { usage: true });
  }
  for (const k of ['owner', 'curation', 'site', 'out']) {
    if (!args[k]) throw Object.assign(new Error(`missing --${k}`), { usage: true });
  }
  return args;
}

export function summarize(result, total) {
  const activity = result.updates.filter((u) => u.flags.includes('activity')).length;
  const traction = result.updates.filter((u) => u.flags.includes('traction')).length;
  return [
    `public repos scanned: ${total}`,
    `new candidates: ${result.newCandidates.length}`,
    `pending (undecided): ${result.pending.length}`,
    `ignored (hidden): ${result.ignoredCount}`,
    `included updates: ${result.updates.length} (activity ${activity}, traction ${traction})`,
    `included missing tile: ${result.includedMissingTile.length}`,
    `tiles missing repo: ${result.tilesMissingRepo.length}`,
  ].join('\n');
}

async function main(argv) {
  const args = parseArgs(argv);
  const curationPath = resolve(args.curation);
  const sitePath = resolve(args.site);
  const outPath = resolve(args.out);
  const curation = await readJson(curationPath, 'curation');
  const site = await readJson(sitePath, 'site.json');

  const now = new Date();
  const repos = await fetchRepos(args.owner);
  const result = diffRepos({ repos, curation, site, now });

  const withReadme = async (repo) => ({ ...repo, readme: await fetchReadme(args.owner, repo.name) });
  const newCandidates = [];
  for (const c of result.newCandidates) newCandidates.push(await withReadme(c));
  const updates = [];
  for (const u of result.updates) {
    updates.push(u.flags.includes('activity') ? { ...u, readme: await fetchReadme(args.owner, u.repo) } : u);
  }

  const report = {
    generatedAt: now.toISOString(),
    owner: args.owner,
    summary: {
      publicRepos: repos.length,
      newCandidates: newCandidates.length,
      pending: result.pending.length,
      ignored: result.ignoredCount,
      updates: result.updates.length,
      includedMissingTile: result.includedMissingTile.length,
      tilesMissingRepo: result.tilesMissingRepo.length,
    },
    newCandidates,
    pending: result.pending,
    updates,
    includedMissingTile: result.includedMissingTile,
    tilesMissingRepo: result.tilesMissingRepo,
    ignoredCount: result.ignoredCount,
    newPending: result.newPending,
  };
  await writeJsonAtomic(outPath, report);
  if (args.writeCuration) await writeJsonAtomic(curationPath, result.nextCuration);

  console.log(summarize(result, repos.length));
  console.log(`report: ${outPath}`);
  console.log(args.writeCuration ? `curation written: ${curationPath}` : 'curation not written (dry run)');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`scan failed: ${err.message}`);
    // 2 = GitHub or network failure; 1 = usage or local file problem
    process.exitCode = err instanceof GitHubError ? 2 : 1;
  });
}
