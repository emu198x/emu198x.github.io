import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The flagship's data used to reach the build through EMU198X_SOURCE_ROOT,
// set in the workflow. Set on the build step alone, it left the test step
// without it, falling back to a path that didn't exist on a runner: every
// pull request failed at "Run tests". Moving it to job level fixed that, but
// still made correctness depend on which steps sat in which job.
//
// Now the build chooses its own source: scripts/fetch-emu198x.mjs picks the
// checkout once and records it in .emu198x-source, and every entry point that
// reads flagship data runs it first. These gates hold both halves: no step
// carries its own idea of the root, and no entry point can start without one.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = readFileSync(join(ROOT, '.github/workflows/pages.yml'), 'utf8');
const scripts = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts;

test('the workflow leaves the choice of source to the build', () => {
  assert.doesNotMatch(workflow, /EMU198X_SOURCE_ROOT/, 'pages.yml sets EMU198X_SOURCE_ROOT; the build records its own source');
  assert.doesNotMatch(workflow, /repository:\s*emu198x\/emu198x/, 'pages.yml checks out the flagship; scripts/fetch-emu198x.mjs fetches what the build needs');
});

test('every entry point that reads flagship data records the source first', () => {
  assert.match(scripts.source ?? '', /fetch-emu198x\.mjs/, 'npm run source does not run scripts/fetch-emu198x.mjs');
  for (const entry of ['predev', 'prebuild', 'pretest']) {
    assert.match(scripts[entry] ?? '', /npm run source/, `${entry} does not run npm run source`);
  }
});
