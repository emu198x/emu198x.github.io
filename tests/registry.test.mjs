import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readRegistry } from '../src/lib/registry.js';

function fixture(toml) {
  const root = mkdtempSync(join(tmpdir(), 'reg-'));
  mkdirSync(join(root, 'docs', 'status'), { recursive: true });
  if (toml !== null) {
    writeFileSync(join(root, 'docs', 'status', 'systems.toml'), toml);
  }
  return root;
}

const ONE = `
[[system]]
machine_id = "sinclair-zx-spectrum"
crate = "emu198x-spectrum"
label = "system:spectrum"
milestone = "ZX Spectrum 100%"
`;

test('reads the four contract fields', () => {
  const machines = readRegistry(fixture(ONE));
  assert.equal(machines.length, 1);
  assert.deepEqual(machines[0], {
    machineId: 'sinclair-zx-spectrum',
    crate: 'emu198x-spectrum',
    label: 'system:spectrum',
    milestone: 'ZX Spectrum 100%',
  });
});

test('sorts by machineId', () => {
  const machines = readRegistry(fixture(`${ONE}
[[system]]
machine_id = "acorn-atom"
crate = "emu198x-acorn-atom"
label = "system:atom"
milestone = "Acorn Atom 100%"
`));
  assert.deepEqual(machines.map((m) => m.machineId), ['acorn-atom', 'sinclair-zx-spectrum']);
});

test('a missing file names the path it looked in', () => {
  const root = fixture(null);
  assert.throws(() => readRegistry(root), (err) => err.message.includes('systems.toml'));
});

test('an empty registry fails', () => {
  assert.throws(() => readRegistry(fixture('# nothing here\n')), /no \[\[system\]\] entries/);
});

test('a missing field fails and names the machine', () => {
  assert.throws(
    () => readRegistry(fixture(`
[[system]]
machine_id = "acorn-atom"
crate = "emu198x-acorn-atom"
label = "system:atom"
`)),
    /acorn-atom.*milestone/s,
  );
});

test('an entry with no machine_id fails and names its index', () => {
  assert.throws(
    () => readRegistry(fixture(`
[[system]]
crate = "emu198x-acorn-atom"
label = "system:atom"
milestone = "Acorn Atom 100%"
`)),
    /entry 0.*machine_id/s,
  );
});

test('a duplicate machine_id fails', () => {
  assert.throws(() => readRegistry(fixture(`${ONE}${ONE}`)), /duplicate.*sinclair-zx-spectrum/s);
});
