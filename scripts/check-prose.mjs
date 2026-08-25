/**
 * Runs the house prose style over the built site.
 *
 * Bare `vale` cannot be the gate. Vale does not recognise the .astro
 * extension, so `vale src/pages/foo.astro` prints "0 errors ... in 0 files"
 * and exits 0 — a pass earned by reading nothing. Every page here is .astro,
 * so the prose gate the plans mandate was green over prose it had never seen.
 *
 * So this checks the built HTML, which is what a reader is actually served,
 * and it fails when the file count is zero. A gate that cannot report having
 * done nothing is the only kind worth running.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const dist = resolve(process.cwd(), 'dist');

function pages(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

if (!existsSync(dist)) {
  console.error('prose: no dist/ — run `npm run build` first.');
  process.exit(1);
}

// The changelog is synced from the flagship, where release tooling writes it;
// its wording is owned there and cannot be fixed from this repo. Excluded by
// route, and the exclusion is printed on every run — a gate that quietly
// narrows what it covers is the thing this script exists to prevent.
const IMPORTED = [`${sep}docs${sep}changelog${sep}`];

const all = pages(dist);
const skipped = all.filter((file) => IMPORTED.some((part) => file.includes(part)));
const files = all.filter((file) => !skipped.includes(file));
for (const file of skipped) {
  console.log(`prose: skipping ${file.replace(`${process.cwd()}/`, '')} — synced from the flagship, not authored here.`);
}

if (files.length === 0) {
  console.error('prose: dist/ holds no HTML. Refusing to report a pass over nothing.');
  process.exit(1);
}

// Vale's exit code tracks errors, not suggestions, so trusting it would let
// every suggestion through while printing a pass — the same hollow green this
// script exists to stop. Count the alerts instead.
let report = '{}';
try {
  report = execFileSync('vale', ['--output=JSON', ...files], { encoding: 'utf8' });
} catch (err) {
  report = err.stdout || '';
  if (!report.trim()) {
    console.error(`prose: vale failed to run: ${err.message}`);
    process.exit(1);
  }
}

let parsed;
try {
  parsed = JSON.parse(report);
} catch {
  console.error('prose: vale did not return JSON. Refusing to guess whether the copy passed.');
  process.exit(1);
}

const alerts = Object.entries(parsed).flatMap(([file, list]) =>
  (list ?? []).map((alert) => ({ file, ...alert })),
);

if (alerts.length > 0) {
  for (const alert of alerts) {
    const where = `${alert.file.replace(`${process.cwd()}/`, '')}:${alert.Line}`;
    console.error(`${where}  ${alert.Severity}  ${alert.Message}  [${alert.Check}]`);
  }
  console.error(`\nprose: ${alerts.length} house-style alert(s) across ${files.length} built pages.`);
  process.exit(1);
}

console.log(`prose: ${files.length} built pages checked, no house-style alerts.`);
