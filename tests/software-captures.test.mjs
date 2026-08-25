import { test } from 'node:test';
import assert from 'node:assert/strict';
import { softwareCaptures, normalizeCaptureTarget, captureTargets } from '../src/data/boot-screenshots.js';
import { loadSiteData } from '../src/lib/site-data.js';
import { bootCapture, softwareCapture, isCaptured } from '../src/lib/fleet.js';

// A software capture reproduces somebody else's copyrighted work, so
// capturing-published-software.md requires it to name the work and the dump.
// These tests exist because that rule is only worth anything if the build
// refuses records that fail it — a policy nothing enforces is a policy that
// lasts until the next person adds a record in a hurry.
const valid = () => ({
  id: 'probe',
  machineId: 'commodore-c64',
  kind: 'software',
  name: 'Probe',
  image: '/media/software/commodore-c64.png',
  work: { title: 'Probe', publisher: 'Publisher', year: 1984 },
  dump: { file: 'probe.d64', format: 'D64 disk image' },
  capture: { package: 'emu198x-c64' },
});

test('a complete software record normalizes', () => {
  const target = normalizeCaptureTarget(valid());
  assert.equal(target.kind, 'software');
  assert.equal(target.work.title, 'Probe');
});

for (const field of ['title', 'publisher', 'year']) {
  test(`a software record without work.${field} is refused`, () => {
    const target = valid();
    delete target.work[field];
    assert.throws(() => normalizeCaptureTarget(target), new RegExp(`no work\\.${field}`));
  });
}

for (const field of ['file', 'format']) {
  test(`a software record without dump.${field} is refused`, () => {
    const target = valid();
    delete target.dump[field];
    assert.throws(() => normalizeCaptureTarget(target), new RegExp(`no dump\\.${field}`));
  });
}

// TOSEC writes 19xx where it does not know the year, and that string is the
// one that would otherwise be printed to a reader as a fact.
test('a TOSEC 19xx year is refused rather than published', () => {
  const target = valid();
  target.work.year = '19xx';
  assert.throws(() => normalizeCaptureTarget(target), /non-numeric year/);
});

test('a year given as a string is refused', () => {
  const target = valid();
  target.work.year = '1984';
  assert.throws(() => normalizeCaptureTarget(target), /non-numeric year/);
});

test('the acknowledgement rule does not fire on boot captures', () => {
  const target = valid();
  target.kind = 'boot';
  delete target.work;
  delete target.dump;
  assert.doesNotThrow(() => normalizeCaptureTarget(target));
});

// Every shipped record, not just the synthetic one above.
test('every shipped software capture is acknowledged and has an image', () => {
  const shipped = captureTargets().filter((t) => t.kind === 'software');
  assert.ok(shipped.length > 0, 'no software captures found');
  for (const target of shipped) {
    assert.ok(target.hasImage, `${target.id} has no image file`);
    assert.ok(Number.isInteger(target.work.year), `${target.id} year`);
    assert.match(target.rightsNote, /©/, `${target.id} rights note`);
    assert.match(target.rightsNote, /does not distribute/, `${target.id} distribution line`);
  }
});

// The invariant the whole fleet module is built around: "captured" means the
// machine booted. A game screenshot must never be able to answer that.
test('a software capture does not make an unbooted machine count as captured', () => {
  const entry = {
    machineId: 'probe',
    captures: [normalizeCaptureTarget(valid())],
  };
  assert.equal(bootCapture(entry), null);
  assert.equal(isCaptured(entry), false);
  assert.equal(softwareCapture(entry).work.title, 'Probe');
});

test('every machine with a software capture also has a boot capture', () => {
  const { fleet } = loadSiteData();
  const withSoftware = fleet.filter((entry) => softwareCapture(entry));
  assert.equal(withSoftware.length, softwareCaptures.length);
  for (const entry of withSoftware) {
    assert.ok(bootCapture(entry), `${entry.machineId} has software but no boot capture`);
  }
});
