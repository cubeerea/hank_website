// LinkedIn "Save to PDF" -> structured profile -> diff / site comparison.
// Node 22 ESM. Parsing is calibrated against a SYNTHETIC fixture; validate against the first real export.
// Usage: node manager/linkedin/parse.mjs --pdf <file> [--prev last.json] [--site content/site.json]
//                                         [--out report.json] [--write-last last.json]

import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { pathToFileURL } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const SIDE_RATIO = 0.33;     // items left of this fraction of page width are the sidebar column
const SAME_LINE_TOL = 2.5;   // pt; items whose tops differ less than this share a baseline
const WORD_GAP = 1.2;        // pt; horizontal gap that counts as a word space
const INDENT_TOL = 4;        // pt; a role title this far right of the section's left edge is a grouped sub-role
const META_RE = /\b(Issued|Expires|Published|Credential ID|proficiency)\b/i;
const FOOTER_RE = /^Page \d+ of \d+$/i;

const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const ONE = `(?:${MONTH}\\s+)?\\d{4}`;
const RANGE_RE = new RegExp(`^(${ONE})\\s*[-–—]\\s*(${ONE}|Present|Current)\\s*(?:\\([^)]*\\))?$`, "i");
const DURATION_RE = /\b\d+\s*(?:yrs?|years?|mos?|months?)\b/i;

const HEADINGS = [
  [/^summary$|^about$/i, "summary"],
  [/^experience$/i, "experience"],
  [/^education$/i, "education"],
  [/^top skills$|^skills$/i, "skills"],
  [/^languages?$/i, "languages"],
  [/^(licenses?\s*(&|and)\s*)?certifications?$|^licenses?$/i, "certifications"],
  [/^honors?\s*[-&]?\s*(and\s+)?awards?$/i, "honors"],
  [/^publications?$/i, "publications"],
  [/^contact( info)?$/i, "contact"],
  // Known LinkedIn sections we do not model: consume them so their lines do not leak into the previous section.
  [/^(volunteer(ing)?( experience)?|projects?|courses?|recommendations?|organizations?|patents?|test scores?|activities|interests|causes)$/i, "ignored"],
];

const norm = (s) =>
  String(s ?? "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

/** "June 2025" -> "Jun 2025", "Present" -> "Present", "2019" -> "2019". Unknown input -> trimmed string. */
export function normalizeDate(s) {
  const t = String(s ?? "").trim().replace(/\s+/g, " ");
  if (/^(present|current)$/i.test(t)) return "Present";
  const m = t.match(/^(?:([A-Za-z]+)\.?\s+)?(\d{4})$/);
  if (!m) return t;
  return m[1] ? `${cap(m[1].slice(0, 3))} ${m[2]}` : m[2];
}

/** "September 2025 - Present (1 year)" -> {start:"Sep 2025", end:"Present", current:true}; null if not a range. */
export function parseDateRange(text) {
  const m = String(text ?? "").trim().match(RANGE_RE);
  if (!m) return null;
  const start = normalizeDate(m[1]);
  const end = normalizeDate(m[2]);
  return { start, end, current: end === "Present" };
}

function looksLikeLocation(text) {
  const t = String(text ?? "").trim();
  if (!t || t.length > 70 || /[|]|\sat\s/.test(t) || /[.!?]$/.test(t)) return false;
  return /,\s*\S/.test(t) || /\b(area|metropolitan|region|county|remote|hybrid|on-?site)\b/i.test(t);
}

const isDuration = (t) => t.length <= 60 && !/[.!?]$/.test(t) && DURATION_RE.test(t) && !parseDateRange(t);

function headingKey(text) {
  for (const [re, key] of HEADINGS) if (re.test(text)) return key;
  return null;
}

function sanitize(lines, warnings) {
  if (!Array.isArray(lines)) {
    warnings.push("extractLines output was not an array; nothing parsed");
    return [];
  }
  return lines
    .filter((l) => l && typeof l.text === "string" && l.text.trim())
    .map((l) => ({
      text: l.text.trim(),
      x: Number(l.x) || 0,
      y: Number(l.y) || 0,
      page: Number(l.page) || 1,
      fontSize: Number(l.fontSize) || 0,
      column: l.column === "side" ? "side" : "main",
    }));
}

/** Split one column's lines into intro (before first heading) and named sections. Sections span pages. */
function segment(lines, warnings, label) {
  const intro = [];
  const sections = {};
  let current = null; // null = intro
  for (const line of lines) {
    const key = headingKey(line.text);
    if (key) {
      if (key === "ignored") { current = "_ignored"; continue; }
      current = key;
      sections[key] ??= [];
      continue;
    }
    // Unknown but heading-like (large, short, letters only) after the first heading: treat as an unmodelled section.
    if (current !== null && line.fontSize >= 12 && line.text.length <= 40 && /^[A-Za-z][A-Za-z &-]+$/.test(line.text)) {
      warnings.push(`${label}: unrecognised heading "${line.text}" (ignored)`);
      current = "_ignored";
      continue;
    }
    if (current === null) intro.push(line);
    else if (current !== "_ignored") (sections[current] ??= []).push(line);
  }
  return { intro, sections };
}

/** Certifications / honors / publications: name line(s) followed by optional issuer and "Issued ..." lines. */
function parseEntries(lines) {
  // Drop wrapped continuation of a meta line (same font size as the meta line, e.g. "2024" after "... Issued Mar").
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    const prev = lines[i - 1];
    const isCont = prev && META_RE.test(prev.text) && !META_RE.test(lines[i].text) &&
      Math.abs(lines[i].fontSize - prev.fontSize) < 0.05;
    if (!isCont) kept.push(lines[i]);
  }
  const names = [];
  let buffer = [];
  for (const line of kept) {
    if (!META_RE.test(line.text)) { buffer.push(line.text); continue; }
    if (buffer.length) {
      // "Linux Foundation · Issued ..." means the issuer is inline, so the whole buffer is the name.
      const inlineIssuer = /·/.test(line.text) && !/^(issued|expires|published)/i.test(line.text);
      const name = !inlineIssuer && buffer.length > 1 ? buffer.slice(0, -1) : buffer;
      names.push(name.join(" ").replace(/\s*·\s*$/, "").trim());
    }
    buffer = [];
  }
  for (const b of buffer) names.push(b);
  return unique(names);
}

function unique(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const k = norm(v);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

function simpleList(lines) {
  return unique(lines.filter((l) => !META_RE.test(l.text)).map((l) => l.text));
}

function parseExperience(lines, warnings) {
  if (!lines.length) return [];
  const dateIdx = [];
  lines.forEach((l, i) => { if (parseDateRange(l.text)) dateIdx.push(i); });
  if (!dateIdx.length) {
    warnings.push("Experience: no date lines found; no roles parsed");
    return [];
  }
  const baseX = Math.min(...lines.map((l) => l.x));
  const blocks = [];
  let currentCompany = null;
  for (const d of dateIdx) {
    const t = d - 1;
    if (t < 0 || parseDateRange(lines[t].text)) {
      warnings.push(`Experience: date line without a title above it: "${lines[d].text}"`);
      continue;
    }
    const titleLine = lines[t];
    const prev = lines[t - 1];
    let company, startIdx, newGroup;
    if (prev && isDuration(prev.text) && t - 2 >= 0) {
      // Grouped company header: "Company" / "Full-time · 4 yrs" / role(s)
      company = lines[t - 2].text; startIdx = t - 2; newGroup = true;
    } else if (titleLine.x - baseX > INDENT_TOL && currentCompany) {
      // Indented title under the current company: another role in the same group (may be on a later page)
      company = currentCompany; startIdx = t; newGroup = false;
    } else if (prev && !parseDateRange(prev.text)) {
      company = prev.text; startIdx = t - 1; newGroup = true;
    } else {
      company = currentCompany; startIdx = t; newGroup = false;
      if (!company) warnings.push(`Experience: could not find company for "${titleLine.text}"`);
    }
    // A description line mistaken for a company name is the usual failure when grouped roles are not indented.
    if (company && (company.length > 60 || /[.!?]$/.test(company))) {
      warnings.push(`Experience: "${company}" looks like a description, not a company; check grouping for "${titleLine.text}"`);
    }
    if (newGroup) currentCompany = company;
    blocks.push({ d, title: titleLine.text, company: company ?? null, startIdx: Math.max(0, startIdx) });
  }
  return blocks.map((b, i) => {
    const range = parseDateRange(lines[b.d].text);
    const end = i + 1 < blocks.length ? Math.max(b.d + 1, blocks[i + 1].startIdx) : lines.length;
    let body = lines.slice(b.d + 1, end).map((l) => l.text);
    let location = null;
    if (body.length && looksLikeLocation(body[0])) location = body.shift();
    return {
      company: b.company,
      title: b.title,
      start: range.start,
      end: range.end,
      current: range.current,
      location,
      description: body.join(" ").trim(),
    };
  });
}

function parseEducation(lines, warnings) {
  const out = [];
  lines.forEach((l, d) => {
    const range = parseDateRange(l.text);
    if (!range) return;
    const degree = lines[d - 1] && !parseDateRange(lines[d - 1].text) ? lines[d - 1].text : null;
    const school = lines[d - 2] && !parseDateRange(lines[d - 2].text) ? lines[d - 2].text : null;
    if (!school) warnings.push(`Education: no school line above "${l.text}"`);
    out.push({
      school,
      degree,
      dates: range.end && range.end !== range.start ? `${range.start} – ${range.end}` : range.start,
    });
  });
  if (lines.length && !out.length) warnings.push("Education: no date lines found; no entries parsed");
  return out;
}

/**
 * PURE. Lines from extractLines() -> profile. Never throws; anything it cannot place goes to warnings.
 */
export function parseProfile(lines) {
  const warnings = [];
  const all = sanitize(lines, warnings);
  const side = segment(all.filter((l) => l.column === "side"), warnings, "sidebar");
  const main = segment(all.filter((l) => l.column === "main"), warnings, "main");
  const profile = {
    name: null, headline: null, location: null, summary: "",
    experience: [], education: [], skills: [], certifications: [], languages: [], honors: [], publications: [],
    warnings,
  };
  try {
    const intro = main.intro;
    if (!intro.length) {
      warnings.push("No header text before the first section (name/headline missing)");
    } else {
      // Name = the largest text in the intro block (LinkedIn uses a large font for the name).
      let nameIdx = 0;
      intro.forEach((l, i) => { if (l.fontSize > intro[nameIdx].fontSize) nameIdx = i; });
      profile.name = intro[nameIdx].text;
      const rest = intro.slice(nameIdx + 1).map((l) => l.text);
      if (rest.length && looksLikeLocation(rest[rest.length - 1])) profile.location = rest.pop();
      profile.headline = rest.length ? rest.join(" ") : null;
      if (nameIdx > 0) warnings.push(`Unexpected text above name: "${intro.slice(0, nameIdx).map((l) => l.text).join(" | ")}"`);
    }
  } catch (e) { warnings.push(`header parse failed: ${e.message}`); }

  const guard = (label, fn, fallback) => {
    try { return fn(); } catch (e) { warnings.push(`${label} parse failed: ${e.message}`); return fallback; }
  };
  profile.summary = guard("summary", () => (main.sections.summary ?? []).map((l) => l.text).join(" "), "");
  profile.experience = guard("experience", () => parseExperience(main.sections.experience ?? [], warnings), []);
  profile.education = guard("education", () => parseEducation(main.sections.education ?? [], warnings), []);
  const sideSkills = side.sections.skills ?? [];
  profile.skills = guard("skills", () => unique([...simpleList(sideSkills), ...simpleList(main.sections.skills ?? [])]), []);
  profile.languages = guard("languages", () => simpleList(side.sections.languages ?? []), []);
  profile.certifications = guard("certifications", () => parseEntries([...(side.sections.certifications ?? []), ...(main.sections.certifications ?? [])]), []);
  profile.honors = guard("honors", () => parseEntries(side.sections.honors ?? []), []);
  profile.publications = guard("publications", () => parseEntries(side.sections.publications ?? []), []);

  if (!profile.experience.length && all.length) warnings.push("No experience roles parsed");
  return profile;
}

/**
 * Reads a LinkedIn "Save to PDF" file. Returns [{text, x, y, page, fontSize, column}] in reading order.
 * column is 'side' (left sidebar) or 'main', decided by x position against SIDE_RATIO.
 */
export async function extractLines(pdfPath) {
  const data = new Uint8Array(await readFile(pdfPath));
  const doc = await getDocument({ data, verbosity: 0, isEvalSupported: false }).promise;
  const raw = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const vp = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      for (const it of tc.items) {
        if (typeof it.str !== "string" || !it.str.trim()) continue;
        const [, , c, d, e, f] = it.transform;
        raw.push({
          str: it.str,
          x: e,
          top: vp.height - f,
          w: it.width || 0,
          fs: Math.round(Math.hypot(c, d) * 100) / 100,
          page: p,
          column: e < vp.width * SIDE_RATIO ? "side" : "main",
        });
      }
    }
  } finally {
    await doc.destroy();
  }

  raw.sort((a, b) => a.page - b.page || a.column.localeCompare(b.column) || a.top - b.top || a.x - b.x);
  const groups = [];
  for (const it of raw) {
    const g = groups[groups.length - 1];
    if (g && g.page === it.page && g.column === it.column && Math.abs(it.top - g.top) <= SAME_LINE_TOL) g.items.push(it);
    else groups.push({ page: it.page, column: it.column, top: it.top, items: [it] });
  }

  const lines = [];
  for (const g of groups) {
    g.items.sort((a, b) => a.x - b.x);
    let text = "";
    let prevEnd = null;
    for (const it of g.items) {
      if (prevEnd !== null && it.x - prevEnd > WORD_GAP) text += " ";
      text += it.str;
      prevEnd = it.x + it.w;
    }
    text = text.replace(/\s+/g, " ").trim();
    if (!text || FOOTER_RE.test(text)) continue;
    lines.push({
      text,
      x: Math.round(Math.min(...g.items.map((i) => i.x)) * 10) / 10,
      y: Math.round(g.top * 10) / 10,
      page: g.page,
      fontSize: Math.max(...g.items.map((i) => i.fs)),
      column: g.column,
    });
  }
  return lines;
}

const EMPTY_PROFILE = { name: null, headline: null, location: null, summary: "", experience: [], education: [], skills: [], certifications: [], languages: [], honors: [], publications: [] };

const roleKey = (r) => `${norm(r.company)}|${norm(r.title)}`;
const setDiff = (a, b) => { const bs = new Set(b.map(norm)); return a.filter((x) => !bs.has(norm(x))); };

/** PURE. Compares two parsed profiles. prev may be null (first run: everything is "added"). */
export function diffProfile(prev, next) {
  const firstRun = prev == null;
  const p = prev ?? EMPTY_PROFILE;
  const n = next ?? EMPTY_PROFILE;
  const prevRoles = new Map(p.experience.map((r) => [roleKey(r), r]));
  const nextRoles = new Map(n.experience.map((r) => [roleKey(r), r]));
  const addedRoles = [...nextRoles].filter(([k]) => !prevRoles.has(k)).map(([, r]) => r);
  const removedRoles = [...prevRoles].filter(([k]) => !nextRoles.has(k)).map(([, r]) => r);
  const changedRoles = [];
  for (const [k, after] of nextRoles) {
    const before = prevRoles.get(k);
    if (!before) continue;
    const changes = [];
    for (const field of ["start", "end", "current", "location", "description"]) {
      if (norm(String(before[field])) !== norm(String(after[field]))) changes.push({ field, from: before[field], to: after[field] });
    }
    if (changes.length) changedRoles.push({ role: { company: after.company, title: after.title }, changes });
  }
  const eduKey = (e) => `${norm(e.school)}|${norm(e.degree)}`;
  const prevEdu = new Set(p.education.map(eduKey));
  const nextEdu = new Set(n.education.map(eduKey));
  return {
    firstRun,
    addedRoles,
    removedRoles,
    changedRoles,
    addedSkills: setDiff(n.skills, p.skills),
    removedSkills: setDiff(p.skills, n.skills),
    addedCertifications: setDiff(n.certifications, p.certifications),
    removedCertifications: setDiff(p.certifications, n.certifications),
    addedHonors: setDiff(n.honors, p.honors),
    removedHonors: setDiff(p.honors, n.honors),
    addedLanguages: setDiff(n.languages, p.languages),
    removedLanguages: setDiff(p.languages, n.languages),
    addedEducation: n.education.filter((e) => !prevEdu.has(eduKey(e))),
    removedEducation: p.education.filter((e) => !nextEdu.has(eduKey(e))),
    headlineChanged: norm(p.headline) !== norm(n.headline),
    headline: { from: p.headline, to: n.headline },
    locationChanged: norm(p.location) !== norm(n.location),
    summaryChanged: norm(p.summary) !== norm(n.summary),
  };
}

function orgMatches(a, b) {
  const x = norm(a), y = norm(b);
  return !!x && !!y && (x.includes(y) || y.includes(x));
}
function titleMatches(a, b) {
  const x = norm(a), y = norm(b);
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
}
function parseSiteDates(s) {
  const parts = String(s ?? "").split(/\s*[–—-]\s*/).filter(Boolean);
  return { start: normalizeDate(parts[0]), end: parts[1] ? normalizeDate(parts[1]) : null };
}

/** PURE. LinkedIn roles vs content/site.json experience.items. */
export function compareToSite(profile, site) {
  const warnings = [];
  const items = site?.experience?.items;
  if (!Array.isArray(items)) {
    return { skipped: true, reason: "site has no experience.items", missingOnSite: [], extraOnSite: [], dateMismatches: [], matched: 0, warnings };
  }
  const used = new Set();
  const missingOnSite = [];
  const dateMismatches = [];
  let matched = 0;
  for (const role of profile.experience ?? []) {
    const idx = items.findIndex((it, i) => !used.has(i) && orgMatches(it.org, role.company) && titleMatches(it.title, role.title));
    if (idx === -1) { missingOnSite.push(role); continue; }
    used.add(idx);
    matched++;
    const sd = parseSiteDates(items[idx].dates);
    const diffs = [];
    if (sd.start && role.start && norm(sd.start) !== norm(role.start)) diffs.push({ field: "start", site: sd.start, linkedin: role.start });
    if (sd.end && role.end && norm(sd.end) !== norm(role.end)) diffs.push({ field: "end", site: sd.end, linkedin: role.end });
    if (diffs.length) dateMismatches.push({ title: items[idx].title, org: items[idx].org, siteDates: items[idx].dates, linkedinDates: `${role.start} – ${role.end}`, diffs });
  }
  const extraOnSite = items.filter((_, i) => !used.has(i)).map((it) => ({ title: it.title, org: it.org, dates: it.dates }));
  return { skipped: false, missingOnSite, extraOnSite, dateMismatches, matched, warnings };
}

export function summarize({ profile, diff, siteReport }) {
  const lines = [];
  lines.push(`Profile: ${profile.name ?? "(no name)"}${profile.headline ? " - " + profile.headline : ""}`);
  lines.push(`  experience ${profile.experience.length}, education ${profile.education.length}, skills ${profile.skills.length}, certifications ${profile.certifications.length}, languages ${profile.languages.length}`);
  if (diff) {
    lines.push(diff.firstRun ? "Diff: no previous profile (first run)" : "Diff vs previous:");
    if (!diff.firstRun) {
      lines.push(`  roles +${diff.addedRoles.length} -${diff.removedRoles.length} changed ${diff.changedRoles.length}`);
      lines.push(`  skills +${diff.addedSkills.length} -${diff.removedSkills.length}; certifications +${diff.addedCertifications.length}; headline ${diff.headlineChanged ? "CHANGED" : "unchanged"}`);
    }
  }
  if (siteReport) {
    if (siteReport.skipped) lines.push(`Site: skipped (${siteReport.reason})`);
    else lines.push(`Site: ${siteReport.matched} matched, ${siteReport.missingOnSite.length} LinkedIn roles missing on site, ${siteReport.dateMismatches.length} date mismatches, ${siteReport.extraOnSite.length} site-only items`);
  }
  if (profile.warnings.length) {
    lines.push(`Warnings (${profile.warnings.length}):`);
    for (const w of profile.warnings) lines.push(`  - ${w}`);
  }
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    args[argv[i].slice(2)] = argv[i + 1];
    i++;
  }
  return args;
}

async function readJsonOptional(path, label) {
  if (!path) return null;
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw new Error(`${label}: ${e.message}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.pdf) {
    console.error("usage: node manager/linkedin/parse.mjs --pdf <file> [--prev last.json] [--site content/site.json] [--out report.json] [--write-last last.json]");
    process.exit(2);
  }
  const lines = await extractLines(args.pdf);
  const profile = parseProfile(lines);
  const prev = await readJsonOptional(args.prev, "--prev");
  const site = await readJsonOptional(args.site, "--site");
  const diff = diffProfile(prev, profile);
  const siteReport = site ? compareToSite(profile, site) : null;
  const report = { generatedAt: new Date().toISOString(), source: basename(args.pdf), profile, diff, site: siteReport };
  if (args.out) await writeFile(args.out, JSON.stringify(report, null, 2) + "\n");
  if (args["write-last"]) {
    const { warnings, ...clean } = profile;
    await writeFile(args["write-last"], JSON.stringify(clean, null, 2) + "\n");
  }
  console.log(summarize({ profile, diff, siteReport }));
  if (args.out) console.log(`Report written to ${args.out}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
