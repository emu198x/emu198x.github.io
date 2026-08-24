/**
 * Walks every built page and confirms every internal href resolves to a
 * page that was actually built.
 *
 * This replaces an earlier check that only scanned dist/index.html — narrow
 * enough that five links to paths that have never existed
 * (/docs/systems/, four /docs/features/*) shipped past it while it reported
 * success. A link checker that only looks at the home page is not a link
 * checker; it is a home-page checker with a misleading name.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const siteRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const distRoot = join(siteRoot, 'dist');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path, out);
    } else if (entry === 'index.html') {
      out.push(path);
    }
  }
  return out;
}

function routeFor(pagePath) {
  const rel = relative(distRoot, pagePath).split(sep).join('/');
  return '/' + rel.replace(/index\.html$/, '');
}

function targetExists(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return true;
  const withoutTrailingSlash = clean.endsWith('/') && clean !== '/' ? clean.slice(0, -1) : clean;
  const asIndex = join(distRoot, withoutTrailingSlash, 'index.html');
  const asFile = join(distRoot, clean);
  return existsSync(asIndex) || existsSync(asFile);
}

const pages = walk(distRoot);

// target -> Set of routes that link to it
const deadTargets = new Map();

for (const pagePath of pages) {
  const html = readFileSync(pagePath, 'utf8');
  const hrefs = [...html.matchAll(/href="(\/[^"#?]*)(?:[#?][^"]*)?"/g)].map((m) => m[1]);

  for (const href of new Set(hrefs)) {
    if (href.startsWith('//')) continue; // protocol-relative external URL
    if (targetExists(href)) continue;

    const linkers = deadTargets.get(href) ?? new Set();
    linkers.add(routeFor(pagePath));
    deadTargets.set(href, linkers);
  }
}

console.log(`check:links scanned ${pages.length} page(s) under dist/`);

if (deadTargets.size > 0) {
  console.error(`\n${deadTargets.size} dead internal link target(s) found:\n`);
  for (const [target, linkers] of deadTargets) {
    console.error(`DEAD ${target}`);
    for (const linker of [...linkers].sort()) {
      console.error(`  <- ${linker}`);
    }
  }
  process.exit(1);
}

console.log('no dead internal links');
