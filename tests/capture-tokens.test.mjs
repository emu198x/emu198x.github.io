import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveToken, missingInputs } from '../scripts/capture-boot-screenshots.mjs';

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
