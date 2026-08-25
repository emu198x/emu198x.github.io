import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const siteRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const distRoot = join(siteRoot, 'dist');
// Astro drops the newline before a tag that begins a source line, so an
// inline tag written at the start of a line renders glued to the word before
// it. This checked <a> only, which meant the same bug in <code> shipped
// unnoticed and was caught by a person looking at a screenshot. Any inline
// tag can be written at the start of a line, so any of them can be glued.
const INLINE = 'a|code|strong|em';
const joinedLinkPattern = new RegExp(
  `[A-Za-z0-9)]<(?:${INLINE})\\b` +
    `|</(?:${INLINE})>[A-Za-z0-9(]` +
    `|</a>,<a\\b|</a><a\\b|(?:and|or)<a\\b`,
  'g',
);
const failures = [];
let pageCount = 0;

function searchableHtml(html) {
  const bodies = [...html.matchAll(/<([a-z0-9-]+)\b(?=[^>]*\bdata-pagefind-body\b)[^>]*>([\s\S]*?)<\/\1>/gi)];
  const scoped = bodies.length > 0 ? bodies.map((match) => match[2]).join(' ') : html;

  return scoped.replace(
    /<([a-z0-9-]+)\b[^>]*\bdata-pagefind-ignore\b[^>]*>[\s\S]*?<\/\1>/gi,
    ''
  );
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      walk(path);
      continue;
    }

    if (!path.endsWith('.html')) continue;

    pageCount++;
    const html = searchableHtml(readFileSync(path, 'utf8'));
    const matches = html.match(joinedLinkPattern);

    if (matches) {
      failures.push({ path, matches: [...new Set(matches)] });
    }
  }
}

if (existsSync(distRoot)) {
  walk(distRoot);
}

// An empty or missing dist/ walks to zero pages and zero failures, which
// looks identical to a clean pass. Reporting clean over nothing measured is
// the same silent-skip defect this whole task exists to remove.
if (pageCount === 0) {
  console.error(`check-rendered-spacing: found no pages under ${distRoot} — run \`npm run build\` first`);
  process.exit(1);
}

if (failures.length > 0) {
  console.error('Rendered HTML has missing whitespace around links:');
  for (const failure of failures) {
    console.error(`- ${failure.path}`);
    for (const match of failure.matches) {
      console.error(`  ${match}`);
    }
  }
  process.exit(1);
}
