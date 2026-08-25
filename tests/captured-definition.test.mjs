import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { buildFleet, bootCapture, isCaptured, uncaptured } from '../src/lib/fleet.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const machines = [
  { machineId: 'acorn-atom', crate: 'c1', label: 'l1', milestone: 'm1' },
  { machineId: 'sega-game-gear', crate: 'c2', label: 'l2', milestone: 'm2' },
];

// "Captured" means the BOOT capture has an image. A game screenshot is not
// evidence that a machine boots, so a software capture must never stand in for
// one — counting any capture would let a software screenshot mask a machine
// that never booted.
//
// This is the shape that used to split the site into two answers: a software
// capture with an image and a boot record without. buildFleet permits it and
// the next planned work (software screenshots from TOSEC) will produce it. The
// systems page counted captures[0] — kind-blind and array-order-dependent —
// the accuracy page looked up kind 'boot', and uncaptured() asked whether any
// capture had an image, so the same fleet was reported three different ways.
const divergent = () => buildFleet({
  machines,
  captures: [
    { id: 'atom-software', machineId: 'acorn-atom', kind: 'software', hasImage: true },
    { id: 'atom-boot', machineId: 'acorn-atom', kind: 'boot', hasImage: false },
    { id: 'gg-boot', machineId: 'sega-game-gear', kind: 'boot', hasImage: true },
  ],
});

test('bootCapture picks the boot record regardless of array order', () => {
  const [atom] = divergent();
  assert.equal(bootCapture(atom).id, 'atom-boot');
});

test('bootCapture returns null for a machine with no boot record', () => {
  const fleet = buildFleet({
    machines,
    captures: [{ id: 'atom-software', machineId: 'acorn-atom', kind: 'software', hasImage: true }],
  });
  assert.equal(bootCapture(fleet[0]), null);
});

test('a software image does not make a machine captured', () => {
  const [atom] = divergent();
  assert.equal(isCaptured(atom), false);
});

test('uncaptured names the machine whose only image is a software capture', () => {
  assert.deepEqual(uncaptured(divergent()), ['acorn-atom']);
});

test('isCaptured and uncaptured give one answer for every entry', () => {
  const fleet = divergent();
  const named = new Set(uncaptured(fleet));
  for (const entry of fleet) {
    assert.equal(named.has(entry.machineId), !isCaptured(entry), entry.machineId);
  }
});

// The three rendering pages must ask the fleet module, not re-derive the rule
// inline. They agreed only by accident — every machine happens to have exactly
// one capture, of kind boot — and the first software capture would have split
// them. Freeze the single source rather than trusting the coincidence.
const CONSUMERS = [
  'src/pages/systems/index.astro',
  'src/pages/accuracy/index.astro',
  'src/pages/systems/[machine].astro',
];

for (const page of CONSUMERS) {
  test(`${page} takes its captured rule from the fleet module`, () => {
    const source = readFileSync(join(ROOT, page), 'utf8');
    assert.match(source, /import \{[^}]*\} from '[^']*fleet\.js'/, 'imports the fleet helpers');
    assert.doesNotMatch(source, /captures\[0\]/, 'no positional capture pick');
    assert.doesNotMatch(source, /captures\.(find|some|filter)\(/, 'no inline capture rule');
    assert.doesNotMatch(source, /kind === 'boot'/, 'no inline kind test');
  });
}
