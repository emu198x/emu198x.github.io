/**
 * Catches an Astro expression that will render welded to the word beside it.
 *
 * Astro drops the newline before a tag or expression that begins a source
 * line, so `{machineCount}` at the end of one line and `machines` at the start
 * of the next renders as "30machines". The rendered-HTML gate cannot see this:
 * by then the expression is just digits, and "30machines" is indistinguishable
 * from "48K" or "352x296", which are correct and appear all over these pages.
 *
 * In the source it is still distinguishable, because the boundary is a `{}`.
 * The codebase already bridges these by hand with {' '}; this makes that
 * convention a rule rather than a habit.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const roots = ['src/pages', 'src/layouts', 'src/components'];
const BRIDGE = "{' '}";

function astroFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return astroFiles(path);
    return e.name.endsWith('.astro') ? [path] : [];
  });
}

// The frontmatter fence is JavaScript, not markup: its braces are code.
function template(text) {
  const lines = text.split('\n');
  if (lines[0]?.trim() !== '---') return lines.map((line, i) => [i + 1, line]);
  const close = lines.indexOf('---', 1);
  return lines.slice(close + 1).map((line, i) => [close + 2 + i, line]);
}

const failures = [];

for (const dir of roots) {
  for (const file of astroFiles(join(root, dir))) {
    const lines = template(readFileSync(file, 'utf8'));

    // Only flowing text can be glued. A brace inside <style> or <script> is
    // code; one inside a tag is an attribute value; and inside <pre> the
    // newline survives, which is the whole point of <pre>. None of the three
    // renders beside the next line's words. Tracking them removes every false
    // positive — without it this fired thirty times on CSS rules alone, and
    // once more on a shell example inside <pre>.
    let inBlock = false;
    let openTag = false;
    const textLine = [];
    for (const [, raw] of lines) {
      const before = inBlock;
      if (/<(style|script|pre)\b/.test(raw)) inBlock = true;
      const isText = !before && !inBlock && !openTag;
      if (/<\/(style|script|pre)>/.test(raw)) inBlock = false;
      const opens = (raw.match(/</g) ?? []).length;
      const closes = (raw.match(/>/g) ?? []).length;
      if (!inBlock && opens !== closes) openTag = opens > closes;
      textLine.push(isText && !openTag);
    }

    for (let i = 0; i < lines.length; i += 1) {
      if (!textLine[i]) continue;
      const [lineNo, raw] = lines[i];
      const line = raw.trimEnd();
      if (!line.trim() || line.trim() === BRIDGE || line.endsWith(BRIDGE)) continue;

      let next = i + 1;
      while (next < lines.length && !lines[next][1].trim()) next += 1;
      if (next >= lines.length) continue;
      const after = lines[next][1].trim();
      if (after.startsWith(BRIDGE)) continue;

      // An expression closing a line, and a word opening the next.
      if (/\}$/.test(line) && /^[A-Za-z0-9]/.test(after)) {
        failures.push(`${relative(root, file)}:${lineNo} — expression ends the line, "${after.slice(0, 24)}" opens the next`);
      }
      // A word closing a line, and an expression opening the next.
      if (/[A-Za-z0-9]$/.test(line) && /^\{[^/]/.test(after) && after !== BRIDGE) {
        failures.push(`${relative(root, file)}:${lineNo} — word ends the line, an expression opens the next`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Astro expressions that will render glued to their neighbour:');
  for (const f of failures) console.error(`- ${f}`);
  console.error(`\nBridge each with ${BRIDGE}, the convention already used across these files.`);
  process.exit(1);
}
console.log('source spacing: no expression will render glued to its neighbour.');
