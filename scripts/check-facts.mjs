#!/usr/bin/env node
/**
 * Cross-document fact check.
 *
 * The homepage and the résumé PDF drifted apart badly enough that they
 * described the same engagement two incompatible ways — an honest negative
 * result on the site, an 83% AUC-ROC model in the PDF. A recruiter reads
 * both in one sitting, one click apart, and concludes one is spun. Multiple
 * role-targeted résumé variants raise the stakes: now two PDFs can disagree
 * with each other as well as with the page.
 *
 * So this reads every résumé variant's text layer plus the homepage's copy,
 * and reports any document stating a value that facts.json marks as
 * conflicting with the canonical one. It does not judge which value is true.
 *
 * Usage: npm run check:facts
 * Exit 0 = every document agrees. Exit 1 = at least one conflict.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Colour only when stdout is a terminal, so piping to a file stays readable.
const ESC = String.fromCharCode(27);
const sgr = (code) => (process.stdout.isTTY ? ESC + '[' + code + 'm' : '');
const RESET = sgr(0);
const RED = sgr(31);
const GREEN = sgr(32);
const DIM = sgr(2);
const BOLD = sgr(1);

/** Strip tags, scripts, styles and comments; collapse whitespace. */
function htmlToText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

async function pdfToText(path) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(readFileSync(path));
  const doc = await pdfjs.getDocument({ data }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    text += content.items.map((it) => it.str).join(' ') + ' ';
  }
  return text.replace(/\s+/g, ' ');
}

/** Variants are declared in TS; read the literals rather than adding a build step. */
function readVariants() {
  const src = readFileSync(join(root, 'src/resume-variants.ts'), 'utf8');
  const out = [];
  const re = /slug:\s*'([^']+)'[\s\S]*?file:\s*'([^']+)'[\s\S]*?available:\s*(true|false)/g;
  let m;
  while ((m = re.exec(src))) {
    out.push({ slug: m[1], file: m[2], available: m[3] === 'true' });
  }
  return out;
}

const facts = JSON.parse(readFileSync(join(root, 'facts.json'), 'utf8'));

const docs = [{ name: 'index.html', text: htmlToText(readFileSync(join(root, 'index.html'), 'utf8')) }];

for (const v of readVariants()) {
  const path = join(root, 'public', v.file);
  if (!existsSync(path)) {
    if (v.available) {
      console.log(`${RED}missing${RESET}  ${v.slug} is marked available but ${v.file} is not on disk`);
      process.exitCode = 1;
    } else {
      console.log(`${DIM}skipped  ${v.slug} (not available yet)${RESET}`);
    }
    continue;
  }
  docs.push({ name: `${v.slug} (${v.file})`, text: await pdfToText(path) });
}

console.log(`\n${BOLD}Checking ${docs.length} document(s) against facts.json${RESET}\n`);

let conflicts = 0;

for (const check of facts.checks) {
  const stating = docs.filter((d) => d.text.includes(check.canonical)).map((d) => d.name);
  const conflicting = [];

  for (const d of docs) {
    // First match only: `conflicts` often lists a narrow value and a broader
    // catch-all for the same fact ("83% AUC-ROC" and "AUC-ROC"), and reporting
    // one document twice for one disagreement just pads the output.
    const hit = check.conflicts.find((bad) => d.text.includes(bad));
    if (!hit) continue;
    // `satisfiedBy` is the escape hatch for a value that only contradicts the
    // canonical one in isolation. A résumé may cite a model's score as long as
    // it also carries the conclusion that the model wasn't fit to ship; the
    // score alone is what misleads.
    if (check.satisfiedBy?.some((ok) => d.text.includes(ok))) continue;
    conflicting.push({ doc: d.name, value: hit });
  }

  if (conflicting.length === 0) {
    const where = stating.length ? stating.join(', ') : `${DIM}stated nowhere${RESET}`;
    console.log(`${GREEN}ok${RESET}       ${check.id} ${DIM}— ${where}${RESET}`);
    continue;
  }

  // An accepted divergence is a decision that was made, not a bug that was
  // ignored. It still prints, with its reason, so the next person can see the
  // documents differ on purpose and why — and can revisit it.
  if (check.accepted) {
    console.log(`${DIM}by design${RESET} ${check.id} — ${check.acceptedReason}`);
    for (const c of conflicting) {
      console.log(`${DIM}          "${c.value}" in: ${c.doc}${RESET}`);
    }
    continue;
  }

  conflicts++;
  console.log(`${RED}CONFLICT${RESET} ${check.id} — ${check.note}`);
  console.log(`         canonical "${check.canonical}" in: ${stating.join(', ') || 'nothing'}`);
  for (const c of conflicting) {
    console.log(`         ${RED}"${c.value}"${RESET} in: ${c.doc}`);
  }
}

console.log('');

if (conflicts) {
  console.log(`${RED}${conflicts} fact(s) disagree across documents.${RESET}`);
  console.log(`Reconcile the documents, then update "canonical" in facts.json if the agreed value changed.\n`);
  process.exitCode = 1;
} else {
  console.log(`${GREEN}Every document agrees.${RESET}\n`);
}
