import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFleet, uncaptured } from '../src/lib/fleet.js';

const machines = [
  { machineId: 'acorn-atom', crate: 'c1', label: 'l1', milestone: 'm1' },
  { machineId: 'sega-game-gear', crate: 'c2', label: 'l2', milestone: 'm2' },
];

test('attaches captures to their stated machine', () => {
  const fleet = buildFleet({
    machines,
    captures: [{ id: 'acorn-atom', machineId: 'acorn-atom', kind: 'boot' }],
  });
  assert.equal(fleet.length, 2);
  assert.equal(fleet[0].captures.length, 1);
  assert.equal(fleet[0].captures[0].id, 'acorn-atom');
});

test('keeps machines with no capture, in place', () => {
  const fleet = buildFleet({ machines, captures: [] });
  assert.deepEqual(fleet.map((e) => e.machineId), ['acorn-atom', 'sega-game-gear']);
  assert.deepEqual(fleet.map((e) => e.captures.length), [0, 0]);
});

test('an unknown machineId fails and names the capture', () => {
  assert.throws(
    () => buildFleet({ machines, captures: [{ id: 'zx-spectrum', machineId: 'nope', kind: 'boot' }] }),
    /zx-spectrum.*nope/s,
  );
});

test('a capture with no machineId fails', () => {
  assert.throws(
    () => buildFleet({ machines, captures: [{ id: 'zx-spectrum', kind: 'boot' }] }),
    /zx-spectrum.*machineId/s,
  );
});

test('two captures of one kind claiming one machine fails', () => {
  assert.throws(
    () => buildFleet({
      machines,
      captures: [
        { id: 'a', machineId: 'acorn-atom', kind: 'boot' },
        { id: 'b', machineId: 'acorn-atom', kind: 'boot' },
      ],
    }),
    /acorn-atom.*boot/s,
  );
});

test('two captures of different kinds on one machine are fine', () => {
  const fleet = buildFleet({
    machines,
    captures: [
      { id: 'a', machineId: 'acorn-atom', kind: 'boot' },
      { id: 'b', machineId: 'acorn-atom', kind: 'software' },
    ],
  });
  assert.equal(fleet[0].captures.length, 2);
});

// uncaptured() and the systems page must agree on what "captured" means.
// They did not: the page asks whether an image exists, the helper only asked
// whether a record exists, so a machine gated on local media counted as
// captured here and as uncaptured there. Two definitions in one codebase is
// how a page and its own helper come to report different numbers.
test('uncaptured counts a record with no image as uncaptured', () => {
  const fleet = buildFleet({
    machines,
    captures: [
      { id: 'acorn-atom', machineId: 'acorn-atom', kind: 'boot', hasImage: true },
      { id: 'sega-game-gear', machineId: 'sega-game-gear', kind: 'boot', hasImage: false },
    ],
  });
  assert.deepEqual(uncaptured(fleet), ['sega-game-gear']);
});

test('uncaptured still counts a machine with no record at all', () => {
  const fleet = buildFleet({ machines, captures: [] });
  assert.deepEqual(uncaptured(fleet), ['acorn-atom', 'sega-game-gear']);
});
