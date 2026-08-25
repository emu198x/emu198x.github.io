import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TARGETS,
  archiveCount,
  assetName,
  assetUrl,
  buildMatrix,
  checksumsUrl,
  readLatestVersion,
  releaseUrl,
} from '../src/lib/releases.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOWNLOADS = join(ROOT, 'src/pages/downloads/index.astro');

function changelog(text) {
  const root = mkdtempSync(join(tmpdir(), 'rel-'));
  if (text !== null) writeFileSync(join(root, 'CHANGELOG.md'), text);
  return root;
}

const SPECTRUM = {
  machineId: 'sinclair-zx-spectrum',
  crate: 'emu198x-spectrum',
  label: 'system:spectrum',
  milestone: 'ZX Spectrum 100%',
};

const ATOM = {
  machineId: 'acorn-atom',
  crate: 'emu198x-acorn-atom',
  label: 'system:atom',
  milestone: 'Acorn Atom 100%',
};

test('reads the released version from the changelog', () => {
  const root = changelog('# Changelog\n\nBlurb.\n\n## [0.5.0] - 2026-08-19\n\n### Added\n');
  assert.equal(readLatestVersion(root), '0.5.0');
});

test('takes the first version heading, not the newest number', () => {
  // The changelog is newest-first, and a 0.10.0 released after 0.9.0 sorts
  // below it as a string. Position is the fact; comparison is a guess.
  const root = changelog('## [0.10.0] - 2026-09-01\n\n## [0.9.0] - 2026-08-01\n');
  assert.equal(readLatestVersion(root), '0.10.0');
});

test('a missing changelog fails loudly', () => {
  assert.throws(() => readLatestVersion(changelog(null)), /no CHANGELOG\.md/);
});

test('a changelog with no version heading fails loudly', () => {
  assert.throws(() => readLatestVersion(changelog('# Changelog\n\nNothing yet.\n')), /no "## \[x\.y\.z\]"/);
});

test('the four release targets are listed, Apple silicon before Intel', () => {
  assert.deepEqual(
    TARGETS.map((target) => target.id),
    [
      'aarch64-apple-darwin',
      'x86_64-apple-darwin',
      'x86_64-pc-windows-msvc',
      'x86_64-unknown-linux-gnu',
    ],
  );
});

test('Windows ships a zip and the other three ship tar.xz', () => {
  const byId = Object.fromEntries(TARGETS.map((target) => [target.id, target.ext]));
  assert.equal(byId['x86_64-pc-windows-msvc'], 'zip');
  assert.equal(byId['aarch64-apple-darwin'], 'tar.xz');
  assert.equal(byId['x86_64-apple-darwin'], 'tar.xz');
  assert.equal(byId['x86_64-unknown-linux-gnu'], 'tar.xz');
});

test('exactly one target per operating system, except macOS which has two', () => {
  // The whole detection design rests on this shape: one build means detecting
  // the OS resolves it, two means the architecture has to be established or
  // both offered.
  const counts = new Map();
  for (const target of TARGETS) counts.set(target.os, (counts.get(target.os) ?? 0) + 1);
  assert.equal(counts.get('macos'), 2);
  assert.equal(counts.get('windows'), 1);
  assert.equal(counts.get('linux'), 1);
});

test('an asset name is the crate, the target triple and the extension', () => {
  const [appleSilicon, , windows] = TARGETS;
  assert.equal(
    assetName('emu198x-spectrum', appleSilicon),
    'emu198x-spectrum-aarch64-apple-darwin.tar.xz',
  );
  assert.equal(
    assetName('emu198x-spectrum', windows),
    'emu198x-spectrum-x86_64-pc-windows-msvc.zip',
  );
});

test('the asset name is built from the crate, never the machine id', () => {
  // Eight of the thirty machine ids differ from their crate. Building
  // `emu198x-sinclair-zx-spectrum-...` would 404 on every one of them.
  const [appleSilicon] = TARGETS;
  const built = assetName(SPECTRUM.crate, appleSilicon);
  assert.ok(!built.includes(SPECTRUM.machineId));
  assert.ok(built.startsWith(`${SPECTRUM.crate}-`));
});

test('a machine with no crate fails rather than building a broken name', () => {
  assert.throws(() => assetName(undefined, TARGETS[0]), /no crate name/);
  assert.throws(() => assetName('', TARGETS[0]), /no crate name/);
});

test('download URLs carry the version tag', () => {
  assert.equal(
    assetUrl('0.5.0', 'emu198x-c64-x86_64-unknown-linux-gnu.tar.xz'),
    'https://github.com/emu198x/emu198x/releases/download/v0.5.0/emu198x-c64-x86_64-unknown-linux-gnu.tar.xz',
  );
  assert.equal(releaseUrl('0.5.0'), 'https://github.com/emu198x/emu198x/releases/tag/v0.5.0');
});

test('the matrix gives every machine every target', () => {
  const matrix = buildMatrix({ machines: [SPECTRUM, ATOM], version: '0.5.0' });
  assert.equal(matrix.length, 2);
  for (const machine of matrix) {
    assert.equal(machine.builds.length, 4);
    assert.deepEqual(
      machine.builds.map((build) => build.target.id),
      TARGETS.map((target) => target.id),
    );
  }
  assert.equal(archiveCount(matrix), 8);
});

test('the matrix keeps the registry fields it was handed', () => {
  const [spectrum] = buildMatrix({ machines: [SPECTRUM], version: '0.5.0' });
  assert.equal(spectrum.machineId, 'sinclair-zx-spectrum');
  assert.equal(spectrum.crate, 'emu198x-spectrum');
  assert.equal(spectrum.milestone, 'ZX Spectrum 100%');
});

test('one checksum file covers the whole release', () => {
  assert.equal(
    checksumsUrl('0.5.0'),
    'https://github.com/emu198x/emu198x/releases/download/v0.5.0/sha256.sum',
  );
});

test('the matrix keeps the registry order it was handed', () => {
  const matrix = buildMatrix({ machines: [ATOM, SPECTRUM], version: '0.5.0' });
  assert.deepEqual(
    matrix.map((machine) => machine.machineId),
    ['acorn-atom', 'sinclair-zx-spectrum'],
  );
});

test('an unreleased version string fails rather than linking nowhere', () => {
  assert.throws(() => buildMatrix({ machines: [SPECTRUM], version: 'latest' }), /not a released version/);
  assert.throws(() => buildMatrix({ machines: [SPECTRUM], version: 'v0.5.0' }), /not a released version/);
  assert.throws(() => buildMatrix({ machines: [SPECTRUM], version: undefined }), /not a released version/);
});

test('an empty registry fails rather than rendering a page with no downloads', () => {
  assert.throws(() => buildMatrix({ machines: [], version: '0.5.0' }), /no machines/);
});

test('the live registry produces the shape the v0.5.0 release published', async () => {
  // A guard on the whole join at once: thirty machines, four targets, and
  // every generated name matching the shape `gh release view v0.5.0` lists.
  // It reads the flagship checkout the rest of the build already needs.
  const { loadSiteData } = await import('../src/lib/site-data.js');
  const { fleet, sourceRoot } = loadSiteData();
  const matrix = buildMatrix({ machines: fleet, version: readLatestVersion(sourceRoot) });

  assert.equal(archiveCount(matrix), matrix.length * 4);

  const names = new Set();
  for (const machine of matrix) {
    for (const build of machine.builds) {
      assert.match(
        build.file,
        /^emu198x-[a-z0-9-]+-(aarch64-apple-darwin|x86_64-apple-darwin|x86_64-pc-windows-msvc|x86_64-unknown-linux-gnu)\.(tar\.xz|zip)$/,
      );
      assert.ok(!names.has(build.file), `two machines claim ${build.file}`);
      names.add(build.file);
    }
  }
});

// The page this module exists for listed six binaries against a release of
// thirty, because the six were typed into it. These gates fail the moment any
// of that comes back as a literal.
test('the downloads page derives its machines and its version', () => {
  const source = readFileSync(DOWNLOADS, 'utf8');
  assert.match(source, /loadSiteData\(\)/);
  assert.match(source, /buildMatrix/);
  assert.match(source, /readLatestVersion/);
  assert.match(source, /\.builds\.map\(/);
});

test('the downloads page states no version number of its own', () => {
  const source = readFileSync(DOWNLOADS, 'utf8');
  assert.deepEqual(source.match(/\b\d+\.\d+\.\d+\b/g), null);
});

test('the downloads page builds no URL and no archive name by hand', () => {
  const source = readFileSync(DOWNLOADS, 'utf8');
  assert.ok(!source.includes('releases/download/'), 'a download URL is typed into the page');
  assert.ok(!/-(?:aarch64|x86_64)-(?:apple|pc|unknown)-/.test(source), 'an archive name is typed into the page');
});

test('the downloads page has dropped the --no-default-features example', () => {
  // Script and MCP modes compile in regardless of the `ui` feature, so the
  // flag told readers to make a build they did not need.
  assert.ok(!readFileSync(DOWNLOADS, 'utf8').includes('--no-default-features'));
});

test('detection reorders and marks; it never removes an archive', () => {
  // The script may only move list items and unhide a label. A call that takes
  // a node out of the document would break the promise the page makes in its
  // own copy, that every archive stays reachable.
  const source = readFileSync(DOWNLOADS, 'utf8');
  const script = source.slice(source.indexOf('<script>'), source.indexOf('</script>'));
  assert.ok(script.length > 0, 'the page has no detection script');
  for (const forbidden of ['.remove()', 'removeChild', 'display: none', 'setAttribute(\'hidden\'', 'innerHTML']) {
    assert.ok(!script.includes(forbidden), `the detection script uses ${forbidden}`);
  }
});
