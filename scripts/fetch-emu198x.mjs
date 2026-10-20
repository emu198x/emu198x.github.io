#!/usr/bin/env node
// Choose the Emu198x checkout this build reads, and record the choice.
//
// The site reads the flagship's docs/ (the system registry, the usability
// evidence) and CHANGELOG.md. This decides where from, once, and writes the
// absolute path to .emu198x-source; site-data.js and the scripts read that
// record rather than each guessing, so they can't disagree about the root.
// With no record they fail loudly; nothing falls back to a path that might
// be the wrong repository.
//
// In order:
//   1. EMU198X_SOURCE_ROOT, when set.
//   2. ../emu198x, the family layout, when it is a checkout of
//      emu198x/emu198x; a local docs edit then shows up in `npm run dev`.
//   3. Otherwise a sparse, shallow clone of Emu198x main into _emu198x
//      (docs/ and CHANGELOG.md only), refreshed on every run. This is what CI
//      uses, so the build needs no checkout step of its own.
import {execFileSync} from 'node:child_process';
import {existsSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const record = path.join(site, '.emu198x-source');
const REPO = 'https://github.com/emu198x/emu198x.git';

const git = (args, cwd) => execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();

function isEmu198x(dir) {
  if (!existsSync(path.join(dir, '.git'))) return false;
  try {
    return /[/:]emu198x\/emu198x(\.git)?$/i.test(git(['remote', 'get-url', 'origin'], dir));
  } catch {
    return false;
  }
}

function sparseClone(dir) {
  if (!existsSync(path.join(dir, '.git'))) {
    git(['clone', '--quiet', '--depth', '1', '--filter=blob:none', '--no-checkout', REPO, dir], site);
    git(['sparse-checkout', 'set', '--no-cone', '/docs/', '/CHANGELOG.md'], dir);
  }
  git(['fetch', '--quiet', '--depth', '1', 'origin', 'main'], dir);
  git(['checkout', '--quiet', '--force', '-B', 'main', 'FETCH_HEAD'], dir);
  return dir;
}

let root;
let how;
if (process.env.EMU198X_SOURCE_ROOT) {
  root = path.resolve(process.env.EMU198X_SOURCE_ROOT);
  how = 'EMU198X_SOURCE_ROOT';
} else if (isEmu198x(path.join(site, '..', 'emu198x'))) {
  root = path.join(site, '..', 'emu198x');
  how = 'the family checkout';
} else {
  root = sparseClone(path.join(site, '_emu198x'));
  how = 'a sparse clone of main';
}

for (const required of ['CHANGELOG.md', 'docs/status/systems.toml']) {
  if (!existsSync(path.join(root, required))) {
    throw new Error(`${root} has no ${required}; it isn't an Emu198x checkout`);
  }
}

writeFileSync(record, root + '\n');
console.log(`Emu198x source: ${root} (${how}, ${git(['rev-parse', '--short', 'HEAD'], root)})`);
