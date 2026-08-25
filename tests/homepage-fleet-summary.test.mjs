import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { buildFleet, countByGroup } from '../src/lib/fleet.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const machines = [
  { machineId: 'acorn-atom', crate: 'c1', label: 'l1', milestone: 'm1' },
  { machineId: 'commodore-c64', crate: 'c2', label: 'l2', milestone: 'm2' },
  { machineId: 'sega-game-gear', crate: 'c3', label: 'l3', milestone: 'm3' },
];

test('counts each machine under its boot capture’s group', () => {
  const counts = countByGroup(buildFleet({
    machines,
    captures: [
      { id: 'atom', machineId: 'acorn-atom', kind: 'boot', group: 'Extended' },
      { id: 'c64', machineId: 'commodore-c64', kind: 'boot', group: 'Primary' },
      { id: 'gg', machineId: 'sega-game-gear', kind: 'boot', group: 'Extended' },
    ],
  }));
  assert.equal(counts.get('Primary'), 1);
  assert.equal(counts.get('Extended'), 2);
});

test('a machine with no boot capture is counted, not dropped', () => {
  const counts = countByGroup(buildFleet({
    machines,
    captures: [{ id: 'c64', machineId: 'commodore-c64', kind: 'boot', group: 'Primary' }],
  }));
  assert.equal(counts.get('Primary'), 1);
  assert.equal(counts.get(null), 2);
});

test('a software capture does not decide the group', () => {
  const counts = countByGroup(buildFleet({
    machines: [machines[0]],
    captures: [
      { id: 'atom-sw', machineId: 'acorn-atom', kind: 'software', group: 'Primary' },
      { id: 'atom', machineId: 'acorn-atom', kind: 'boot', group: 'Extended' },
    ],
  }));
  assert.equal(counts.get('Extended'), 1);
  assert.equal(counts.get('Primary'), undefined);
});

// The homepage published 6 / 22 / 28 as hand-typed literals under a dated
// pill. This branch made them wrong: the fleet is 6 primary, 24 extended, 30
// total, so / and /systems/ would have shipped 28 and 30 in one build — and 28
// is the very figure fleet.js names as the stale number this rebuild exists to
// remove. Numbers a page states about the fleet must be measured from the
// fleet, so no editing pass is needed to keep them true.
test('the homepage states no hand-typed fleet numbers', () => {
  const source = readFileSync(join(ROOT, 'src/pages/index.astro'), 'utf8');
  const literals = [...source.matchAll(/<strong>\s*(\d[\d,]*)\s*<\/strong>/g)].map((m) => m[1]);
  assert.deepEqual(literals, []);
});

test('the homepage reads its summary from the shared site data', () => {
  const source = readFileSync(join(ROOT, 'src/pages/index.astro'), 'utf8');
  assert.match(source, /loadSiteData\(\)/);
  assert.match(source, /countByGroup/);
});
