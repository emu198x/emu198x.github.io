import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// site-data.js's sourceRoot() must read the recorded source relative to
// process.cwd(), not to the module's own file location. Astro bundles the
// module into dist/.prerender/chunks/ at build time, so a location-derived
// lookup would resolve relative to the bundle's directory instead of the
// project. Importing the module from its source path can't observe that, so
// the resolution runs from a genuinely different cwd.
const moduleUrl = new URL('../src/lib/site-data.js', import.meta.url).href;

function sourceRootFrom(cwd) {
  return spawnSync(
    process.execPath,
    ['-e', `import('${moduleUrl}').then((m) => { process.stdout.write(m.sourceRoot()); });`],
    { cwd, encoding: 'utf8', env: { ...process.env, EMU198X_SOURCE_ROOT: undefined } },
  );
}

test('sourceRoot() reads the record in process.cwd(), not beside the module', () => {
  // process.cwd() in the child is the realpath (macOS's /tmp is a symlink).
  const otherCwd = realpathSync(mkdtempSync(join(tmpdir(), 'site-data-cwd-')));
  const recorded = join(otherCwd, 'somewhere', 'emu198x');
  writeFileSync(join(otherCwd, '.emu198x-source'), recorded + '\n');

  const result = sourceRootFrom(otherCwd);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, recorded);
});

test('sourceRoot() fails loudly when no source is recorded', () => {
  // No fallback path: a guess could read the wrong repository.
  const emptyCwd = realpathSync(mkdtempSync(join(tmpdir(), 'site-data-empty-')));
  const result = sourceRootFrom(emptyCwd);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /npm run source/);
});
