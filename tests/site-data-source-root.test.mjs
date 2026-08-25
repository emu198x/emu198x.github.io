import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// site-data.js's sourceRoot() fallback must resolve relative to
// process.cwd(), not to the module's own file location. Astro bundles the
// module into dist/.prerender/chunks/ at build time, so a location-derived
// root (import.meta.url) would resolve relative to the bundle's directory
// instead of the project — and importing the module directly, from its
// source path, can never observe that: the source path *is* the project
// root's sibling, so a location-derived resolution would pass this test by
// accident. Running the resolution from a genuinely different cwd is the
// only way to tell the two implementations apart.
const moduleUrl = new URL('../src/lib/site-data.js', import.meta.url).href;

test('sourceRoot() fallback resolves from process.cwd(), not module location', () => {
  // process.cwd() inside the child returns the realpath (macOS's /tmp is a
  // symlink to /private/tmp), so the expectation must be computed from the
  // same realpath or the comparison fails on an irrelevant symlink mismatch.
  const otherCwd = realpathSync(mkdtempSync(join(tmpdir(), 'site-data-cwd-')));
  const expected = resolve(otherCwd, '..', 'emu198x');

  const result = spawnSync(
    process.execPath,
    ['-e', `import('${moduleUrl}').then((m) => { process.stdout.write(m.sourceRoot()); });`],
    {
      cwd: otherCwd,
      encoding: 'utf8',
      env: { ...process.env, EMU198X_SOURCE_ROOT: undefined },
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, expected);
});
