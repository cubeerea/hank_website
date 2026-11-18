import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  extractLines, parseProfile, diffProfile, compareToSite, normalizeDate, parseDateRange,
} from "./parse.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const FIXTURE = join(HERE, "fixtures", "synthetic-profile.pdf");

const EXPECTED_EXPERIENCE = [
  {
    company: "Northwind Analytics", title: "Staff Data Engineer", start: "Sep 2025", end: "Present", current: true,
    location: "Lisbon, Portugal · Hybrid",
    description: "Own the event ingestion platform and lead a team of four engineers delivering the customer analytics warehouse.",
  },
  {
    company: "Northwind Analytics", title: "Data Engineer", start: "Mar 2023", end: "Aug 2025", current: false,
    location: "Remote",
    description: "Built the streaming pipeline that replaced the nightly batch jobs and cut data freshness from 24 hours to 15 minutes.",
  },
  {
    company: "Harbor Robotics", title: "Machine Learning Engineer", start: "Jun 2021", end: "Feb 2023", current: false,
    location: "Porto, Portugal · On-site",
    description: "Trained perception models for warehouse robots and shipped the on-device inference runtime.",
  },
];

let fixtureProfile;
async function loadFixture() {
  if (!fixtureProfile) fixtureProfile = parseProfile(await extractLines(FIXTURE));
  return structuredClone(fixtureProfile);
}

describe("date normalization", () => {
  test("full month names, Present, parenthetical duration", () => {
    assert.deepEqual(parseDateRange("September 2025 - Present (1 year)"), { start: "Sep 2025", end: "Present", current: true });
    assert.deepEqual(parseDateRange("June 2025 - March 2026 (10 months)"), { start: "Jun 2025", end: "Mar 2026", current: false });
    assert.deepEqual(parseDateRange("Jun 2025 – Mar 2026"), { start: "Jun 2025", end: "Mar 2026", current: false });
  });
  test("year-only ranges and non-date text", () => {
    assert.deepEqual(parseDateRange("2019 - 2021"), { start: "2019", end: "2021", current: false });
    assert.equal(parseDateRange("Lisbon, Portugal"), null);
    assert.equal(parseDateRange("Worked 2 years at Acme"), null);
  });
  test("normalizeDate", () => {
    assert.equal(normalizeDate("Sept 2024"), "Sep 2024");
    assert.equal(normalizeDate("present"), "Present");
    assert.equal(normalizeDate("2020"), "2020");
  });
});

describe("fixture parse (synthetic LinkedIn PDF, two pages)", () => {
  test("extractLines separates columns and drops page footers", async () => {
    const lines = await extractLines(FIXTURE);
    assert.ok(!lines.some((l) => /^Page \d+ of \d+$/.test(l.text)), "footer lines must be dropped");
    const name = lines.find((l) => l.text === "Alex Example");
    assert.equal(name.column, "main");
    assert.equal(name.fontSize, 24);
    assert.equal(lines.find((l) => l.text === "Contact").column, "side");
    assert.equal(lines.find((l) => l.text === "Harbor Robotics").page, 2);
    assert.ok(lines.find((l) => l.text === "Native or bilingual proficiency"), "wrapped words are merged into one line");
  });

  test("header fields", async () => {
    const p = await loadFixture();
    assert.equal(p.name, "Alex Example");
    assert.equal(p.headline, "Staff Data Engineer | Building reliable data pipelines");
    assert.equal(p.location, "Lisbon, Portugal");
    assert.equal(p.summary, "Data engineer with eight years of experience designing streaming ingestion, warehouse modelling and developer tooling. Enjoys turning messy operational data into dependable products.");
  });

  test("experience: grouped roles keep their company, Present role, and the page-2 role joins page-1 group", async () => {
    const p = await loadFixture();
    assert.deepEqual(p.experience, EXPECTED_EXPERIENCE);
  });

  test("education, skills, sidebar lists", async () => {
    const p = await loadFixture();
    assert.deepEqual(p.education, [
      { school: "Universidade de Lisboa", degree: "Master of Science - MSc, Computer Science", dates: "2019 – 2021" },
      { school: "Example State University", degree: "Bachelor of Science - BS, Information Systems", dates: "2015 – 2019" },
    ]);
    assert.deepEqual(p.skills, ["Python", "Distributed Systems", "Technical Writing"]);
    assert.deepEqual(p.languages, ["English", "Spanish"]);
    assert.deepEqual(p.certifications, ["Certified Kubernetes Administrator", "AWS Certified Developer - Associate"]);
    assert.deepEqual(p.honors, ["Best Internal Platform Talk 2024"]);
    assert.deepEqual(p.publications, []);
    assert.deepEqual(p.warnings, []);
  });
});

describe("diffProfile", () => {
  test("first run: everything is added", async () => {
    const p = await loadFixture();
    const d = diffProfile(null, p);
    assert.equal(d.firstRun, true);
    assert.equal(d.addedRoles.length, 3);
  });

  test("changed end date Present -> Mar 2026", async () => {
    const prev = await loadFixture();
    const next = await loadFixture();
    next.experience[0].end = "Mar 2026";
    next.experience[0].current = false;
    const d = diffProfile(prev, next);
    assert.deepEqual(d.addedRoles, []);
    assert.deepEqual(d.removedRoles, []);
    assert.equal(d.changedRoles.length, 1);
    assert.deepEqual(d.changedRoles[0].role, { company: "Northwind Analytics", title: "Staff Data Engineer" });
    assert.deepEqual(d.changedRoles[0].changes, [
      { field: "end", from: "Present", to: "Mar 2026" },
      { field: "current", from: true, to: false },
    ]);
  });

  test("added role and added skill", async () => {
    const prev = await loadFixture();
    const next = await loadFixture();
    next.experience.push({ company: "Acme Labs", title: "Research Intern", start: "Jan 2020", end: "May 2020", current: false, location: null, description: "" });
    next.skills.push("Rust");
    const d = diffProfile(prev, next);
    assert.equal(d.addedRoles.length, 1);
    assert.equal(d.addedRoles[0].company, "Acme Labs");
    assert.deepEqual(d.addedSkills, ["Rust"]);
    assert.deepEqual(d.removedSkills, []);
    assert.equal(d.headlineChanged, false);
  });

  test("headline change is reported", async () => {
    const prev = await loadFixture();
    const next = await loadFixture();
    next.headline = "Principal Data Engineer";
    const d = diffProfile(prev, next);
    assert.equal(d.headlineChanged, true);
    assert.equal(d.headline.to, "Principal Data Engineer");
  });
});

describe("compareToSite", () => {
  const siteFor = (items) => ({ experience: { items } });

  test("missing roles, date mismatch, site-only items", async () => {
    const p = await loadFixture();
    const site = siteFor([
      { title: "Staff Data Engineer", org: "Northwind Analytics", dates: "Sep 2025 – Present" },
      { title: "Data Engineer", org: "Northwind Analytics, Inc.", dates: "Mar 2023 – Jun 2025" },
      { title: "Research Assistant", org: "Yuzhou Chen's Lab", dates: "Jun 2025 – Mar 2026" },
    ]);
    const r = compareToSite(p, site);
    assert.equal(r.skipped, false);
    assert.equal(r.matched, 2);
    assert.equal(r.missingOnSite.length, 1);
    assert.equal(r.missingOnSite[0].company, "Harbor Robotics");
    assert.equal(r.dateMismatches.length, 1);
    assert.deepEqual(r.dateMismatches[0].diffs, [{ field: "end", site: "Jun 2025", linkedin: "Aug 2025" }]);
    assert.deepEqual(r.extraOnSite, [{ title: "Research Assistant", org: "Yuzhou Chen's Lab", dates: "Jun 2025 – Mar 2026" }]);
  });

  test("matching is case and punctuation insensitive; identical dates produce no mismatch", async () => {
    const p = await loadFixture();
    const site = siteFor([
      { title: "staff data engineer!", org: "NORTHWIND analytics", dates: "Sep 2025 – Present" },
      { title: "Data Engineer", org: "Northwind Analytics", dates: "Mar 2023 – Aug 2025" },
      { title: "Machine Learning Engineer", org: "Harbor Robotics", dates: "Jun 2021 – Feb 2023" },
    ]);
    const r = compareToSite(p, site);
    assert.equal(r.missingOnSite.length, 0);
    assert.equal(r.dateMismatches.length, 0);
    assert.equal(r.extraOnSite.length, 0);
  });

  test("site without experience.items is skipped, not thrown", async () => {
    const p = await loadFixture();
    assert.equal(compareToSite(p, {}).skipped, true);
  });
});

describe("robustness", () => {
  test("empty, null and malformed input never throw", () => {
    for (const input of [[], null, undefined, "nope", [{}, null, { text: 5 }]]) {
      const p = parseProfile(input);
      assert.ok(Array.isArray(p.warnings));
      assert.ok(Array.isArray(p.experience));
    }
  });

  test("unexpected layout returns what it can plus warnings", () => {
    const lines = [
      { text: "Pat Sample", fontSize: 20, column: "main", x: 200, page: 1 },
      { text: "Experience", fontSize: 13, column: "main", x: 200, page: 1 },
      { text: "Some Company", fontSize: 10, column: "main", x: 200, page: 1 },
      { text: "Did various things", fontSize: 10, column: "main", x: 200, page: 1 },
    ];
    const p = parseProfile(lines);
    assert.equal(p.name, "Pat Sample");
    assert.deepEqual(p.experience, []);
    assert.ok(p.warnings.some((w) => /no date lines/.test(w)));
  });

  test("un-indented grouped role warns that its company looks wrong", () => {
    const L = (text, x, fontSize = 10) => ({ text, x, fontSize, column: "main", page: 1 });
    const lines = [
      L("Pat Sample", 200, 20), L("Experience", 200, 13),
      L("Acme Corp", 200), L("Full-time · 3 yrs", 200), L("Engineer", 200), L("June 2020 - May 2022 (2 years)", 200, 9),
      L("Led the migration of the billing platform to a new service mesh.", 200),
      L("Lead Engineer", 200), L("June 2022 - Present (3 years)", 200, 9),
    ];
    const p = parseProfile(lines);
    assert.equal(p.experience.length, 2);
    assert.equal(p.experience[0].company, "Acme Corp");
    // Second title has no indent and no duration line above it, so its "company" is the description line.
    assert.ok(p.warnings.some((w) => /looks like a description/.test(w)));
  });

  test("unknown headings are ignored with a warning", () => {
    const lines = [
      { text: "Pat Sample", fontSize: 20, column: "main", x: 200, page: 1 },
      { text: "Summary", fontSize: 13, column: "main", x: 200, page: 1 },
      { text: "Short summary.", fontSize: 10, column: "main", x: 200, page: 1 },
      { text: "Mystery Section", fontSize: 13, column: "main", x: 200, page: 1 },
      { text: "Hidden text", fontSize: 10, column: "main", x: 200, page: 1 },
    ];
    const p = parseProfile(lines);
    assert.equal(p.summary, "Short summary.");
    assert.ok(p.warnings.some((w) => /Mystery Section/.test(w)));
  });
});

describe("CLI", () => {
  test("writes report and last.json, and diffs against a previous file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "linkedin-test-"));
    try {
      const cli = join(HERE, "parse.mjs");
      const run = promisify(execFile);
      const last = join(dir, "last.json");
      const out1 = join(dir, "report1.json");
      await run(process.execPath, [cli, "--pdf", FIXTURE, "--out", out1, "--write-last", last]);
      const r1 = JSON.parse(await readFile(out1, "utf8"));
      assert.equal(r1.diff.firstRun, true);
      assert.equal(JSON.parse(await readFile(last, "utf8")).name, "Alex Example");

      const { stdout } = await run(process.execPath, [cli, "--pdf", FIXTURE, "--prev", last]);
      assert.match(stdout, /roles \+0 -0 changed 0/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
