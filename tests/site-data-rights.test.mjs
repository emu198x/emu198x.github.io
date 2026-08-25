import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertRightsNotes } from '../src/lib/site-data.js';

// A rights note is a public claim about who owns what is on screen, so a
// capture that has an image and no note must stop the build rather than
// render an empty cell. The guard used to walk only the top-level captures,
// which left every variant row on /systems/ outside it: the reviewer blanked
// one variant's note, the build exited 0, and twelve variant rows shipped a
// visible screenshot beside an empty rights cell. '' is exactly the value
// `?? defaultRightsNote` does not catch, which is why the hole was invisible.
const entryWith = (capture) => [{ machineId: 'sinclair-zx-spectrum', captures: [capture] }];

test('a top-level capture with an image and no rights note fails', () => {
  assert.throws(
    () => assertRightsNotes(entryWith({ id: 'zx-spectrum-48k', hasImage: true, rightsNote: '' })),
    /sinclair-zx-spectrum.*zx-spectrum-48k.*rightsNote/s,
  );
});

test('a variant with an image and no rights note fails too', () => {
  assert.throws(
    () => assertRightsNotes(entryWith({
      id: 'zx-spectrum-48k',
      hasImage: true,
      rightsNote: 'Captured from locally supplied firmware.',
      variants: [{ id: 'zx-spectrum-128k', hasImage: true, rightsNote: '' }],
    })),
    /sinclair-zx-spectrum.*zx-spectrum-128k.*rightsNote/s,
  );
});

test('a variant whose note is missing entirely fails', () => {
  assert.throws(
    () => assertRightsNotes(entryWith({
      id: 'zx-spectrum-48k',
      hasImage: true,
      rightsNote: 'Captured from locally supplied firmware.',
      variants: [{ id: 'zx-spectrum-plus2', hasImage: true }],
    })),
    /zx-spectrum-plus2/,
  );
});

// A capture with no image carries no note on purpose: asserting rights over a
// capture that never ran is the same false claim, phrased as a note.
test('a variant with no image and no rights note is fine', () => {
  assert.doesNotThrow(() => assertRightsNotes(entryWith({
    id: 'sord-m5',
    hasImage: true,
    rightsNote: 'Captured from locally supplied firmware.',
    variants: [{ id: 'sord-m5-eu', hasImage: false, rightsNote: null }],
  })));
});

test('a capture with no variants key at all is fine', () => {
  assert.doesNotThrow(() => assertRightsNotes(entryWith({
    id: 'acorn-atom',
    hasImage: true,
    rightsNote: 'Captured from locally supplied firmware.',
  })));
});
