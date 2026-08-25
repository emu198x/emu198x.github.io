import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCaptureTarget, captureTargets } from '../src/data/boot-screenshots.js';

const record = (overrides = {}) => ({
  id: 'probe',
  machineId: 'probe-machine',
  name: 'Probe',
  caption: 'A probe.',
  image: '/media/boot/acorn-atom.png',
  capture: { package: 'emu198x-probe' },
  ...overrides,
});

// hasImage is the site's only measurement that a capture actually ran. Every
// <img>, every count and every rights note hangs off it, so what it accepts is
// what the site is willing to claim.
test('a record whose image file exists is captured', () => {
  assert.equal(normalizeCaptureTarget(record()).hasImage, true);
});

test('a record whose image file is absent is not captured', () => {
  const target = normalizeCaptureTarget(record({ image: '/media/boot/no-such-capture.png' }));
  assert.equal(target.hasImage, false);
  assert.equal(target.rightsNote, null);
  assert.equal(target.provenance.rightsNote, null);
});

test('a capture with an image and no note gets the default rights note', () => {
  const target = normalizeCaptureTarget(record());
  assert.match(target.rightsNote, /Emu198x does not distribute ROMs/);
  assert.equal(target.provenance.rightsNote, target.rightsNote);
});

test('an explicit rights note is kept as written', () => {
  const note = 'Captured from a synthetic cartridge built from source in this project.';
  assert.equal(normalizeCaptureTarget(record({ rightsNote: note })).rightsNote, note);
});

// An image path that is empty, blank, or points outside public/ cannot name a
// published capture, and each one used to answer "captured" anyway: '' made
// existsSync test public/ itself, so hasImage came back true, a rights note was
// printed over a capture that never ran, and <img src=""> resolved to the page
// itself. '/../README.md' escaped public/ and did the same. '   ' was false
// only because no file happened to be called that. A path this broken is a
// mistake in the record, not a capture state — fail loudly at the model layer.
test('an empty image path fails rather than reporting a capture', () => {
  assert.throws(() => normalizeCaptureTarget(record({ image: '' })), /probe.*image/s);
});

test('a whitespace image path fails rather than happening to be false', () => {
  assert.throws(() => normalizeCaptureTarget(record({ image: '   ' })), /probe.*image/s);
});

test('a missing image path fails', () => {
  const { image, ...withoutImage } = record();
  assert.throws(() => normalizeCaptureTarget(withoutImage), /probe.*image/s);
});

test('an image path that escapes public/ fails', () => {
  assert.throws(() => normalizeCaptureTarget(record({ image: '/../README.md' })), /probe.*public/s);
});

test('an image path that climbs back inside public/ is fine', () => {
  assert.equal(
    normalizeCaptureTarget(record({ image: '/media/boot/../boot/acorn-atom.png' })).hasImage,
    true,
  );
});

// The Atari 5200 shipped a note saying "No third-party software is involved"
// over arguments that fed it Atari's own copyrighted BIOS. A human caught that
// by reading it. This is the mechanical version: a capture that touches local
// firmware, ROMs or media — the romRoot prefix, a {media} token, or a mediaEnv
// gate — cannot claim nothing third-party is involved.
const SYNTHETIC_CLAIM = 'No third-party software is involved';
const LOCAL_MEDIA = [/~\/\.emu198x\/roms/, /\{media\}/];

const touchesLocalMedia = (target) => {
  if (target.capture.mediaEnv) return true;
  const stated = JSON.stringify([target.capture.args ?? [], target.capture.requiredFiles ?? []]);
  return LOCAL_MEDIA.some((pattern) => pattern.test(stated));
};

test('no capture fed local firmware or media claims to involve no third-party software', () => {
  const violations = captureTargets()
    .filter((target) => touchesLocalMedia(target))
    .filter((target) => (target.rightsNote ?? '').includes(SYNTHETIC_CLAIM))
    .map((target) => target.id);
  assert.deepEqual(violations, []);
});

test('the synthetic-cartridge note is in use, so the check above is measuring something', () => {
  const synthetic = captureTargets().filter((t) => (t.rightsNote ?? '').includes(SYNTHETIC_CLAIM));
  assert.ok(synthetic.length > 0, 'expected at least one synthetic-cartridge capture');
  for (const target of synthetic) {
    assert.equal(touchesLocalMedia(target), false, target.id);
  }
});
