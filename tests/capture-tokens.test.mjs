import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveToken, missingInputs, replaceValues } from '../scripts/capture-boot-screenshots.mjs';

test('{source} resolves to the flagship root', () => {
  const arg = resolveToken('{source}/test-data/sega/synthetic-cart/game-gear.gg', {}, '/out.png', null, '/src');
  assert.equal(arg, '/src/test-data/sega/synthetic-cart/game-gear.gg');
});

test('{output} still resolves', () => {
  assert.equal(resolveToken('{output}', {}, '/out.png', null, '/src'), '/out.png');
});

test('a required {source} file that is absent is reported', () => {
  const missing = missingInputs({ requiredFiles: ['{source}/nope.gg'] }, '/src');
  assert.equal(missing.length, 1);
  assert.match(missing[0], /nope\.gg/);
});

// A negative-only test can't tell "{source} resolved and the file is still
// missing" apart from "{source} never resolved at all" — both leave the raw
// literal and the resolved path equally absent from disk. This positive
// case only passes if the replaceAll('{source}', sourceRoot) actually ran:
// the file exists solely at the *resolved* path, under a throwaway source
// root, not depending on anything in the real flagship checkout.
test('a required {source} file that exists once resolved is not reported missing', () => {
  const root = mkdtempSync(join(tmpdir(), 'capture-tokens-'));
  try {
    mkdirSync(join(root, 'test-data', 'sega'), { recursive: true });
    writeFileSync(join(root, 'test-data', 'sega', 'game-gear.gg'), '');

    const missing = missingInputs(
      { requiredFiles: ['{source}/test-data/sega/game-gear.gg'] },
      root,
    );
    assert.deepEqual(missing, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('replaceValues substitutes {source} everywhere it substitutes {output}', () => {
  const step = {
    kind: 'load',
    path: '{source}/test-data/spectrum/game.tap',
    args: ['{output}', '{source}/roms/rom.bin'],
  };
  assert.deepEqual(replaceValues(step, '/out.png', '/src'), {
    kind: 'load',
    path: '/src/test-data/spectrum/game.tap',
    args: ['/out.png', '/src/roms/rom.bin'],
  });
});
