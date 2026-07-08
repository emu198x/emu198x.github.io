import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const siteRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const distRoot = join(siteRoot, 'dist');
const joinedLinkPattern = /[A-Za-z0-9)]<a\b|<\/a>[A-Za-z0-9(]|<\/a>,<a\b|<\/a><a\b|(?:and|or)<a\b/g;
const failures = [];

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

    const html = searchableHtml(readFileSync(path, 'utf8'));
    const matches = html.match(joinedLinkPattern);

    if (matches) {
      failures.push({ path, matches: [...new Set(matches)] });
    }
  }
}

walk(distRoot);

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
