/**
 * The release matrix: which archive a reader needs, for which machine, on
 * which target.
 *
 * Nothing here enumerates machines. The machine axis comes from the registry
 * — the same `readRegistry` join that drives /systems/ and the homepage — so
 * a machine added upstream appears on /downloads/ in the next build instead
 * of waiting for someone to remember this file. The page listed six binaries
 * against a release of thirty for exactly that reason.
 *
 * The join from a machine to its archive is `crate`, and only `crate`. Eight
 * of the thirty machine ids differ from their crate name
 * (`sinclair-zx-spectrum` ships as `emu198x-spectrum`), so a name built from
 * `machineId` would 404 on eight of every thirty links. systems.toml exists
 * because inferring that join by pattern produced wrong answers three times.
 *
 * Counted, not estimated: this comment said nine until someone counted. The
 * number is incidental — the join is read per machine and would be right at
 * any count — but a wrong number in a comment about not guessing is a poor
 * advertisement for the rule.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const REPO = 'emu198x/emu198x';

/**
 * The four targets the release builds, in the order the page lists them.
 *
 * Apple silicon leads macOS deliberately. It is the majority Mac in the
 * period this release ships into, and the ordering has to be right in the
 * HTML because it is the ordering a reader gets when no script runs and when
 * the architecture cannot be established — which, on Safari, is always.
 *
 * `os` and `arch` are what the browser-side detection matches on. They are
 * not derived from the target triple at runtime: the triple is a build
 * identifier and reading meaning out of its substrings is the same guess
 * this module refuses to make about crate names.
 */
export const TARGETS = [
  {
    id: 'aarch64-apple-darwin',
    os: 'macos',
    arch: 'arm64',
    osLabel: 'macOS',
    archLabel: 'Apple silicon',
    hint: 'M1 and later',
    ext: 'tar.xz',
  },
  {
    id: 'x86_64-apple-darwin',
    os: 'macos',
    arch: 'x64',
    osLabel: 'macOS',
    archLabel: 'Intel',
    hint: 'Macs before Apple silicon',
    ext: 'tar.xz',
  },
  {
    id: 'x86_64-pc-windows-msvc',
    os: 'windows',
    arch: 'x64',
    osLabel: 'Windows',
    archLabel: 'x86-64',
    hint: '64-bit Windows',
    ext: 'zip',
  },
  {
    id: 'x86_64-unknown-linux-gnu',
    os: 'linux',
    arch: 'x64',
    osLabel: 'Linux',
    archLabel: 'x86-64',
    hint: 'glibc, 64-bit',
    ext: 'tar.xz',
  },
];

const SEMVER = /^\d+\.\d+\.\d+$/;

/**
 * The released version, read from the flagship's own changelog.
 *
 * One source, and it is the source the site already publishes: /docs/changelog/
 * renders this same file, so the version in a download URL and the version at
 * the top of the changelog cannot drift apart. Typing it into this file would
 * make a second place to update, which is how the page came to advertise a
 * release set that no longer matched.
 */
export function readLatestVersion(sourceRoot) {
  const path = join(sourceRoot, 'CHANGELOG.md');

  if (!existsSync(path)) {
    throw new Error(
      `releases: no CHANGELOG.md at ${path}. ` +
        'Set EMU198X_SOURCE_ROOT to a checkout of emu198x/emu198x.',
    );
  }

  const match = readFileSync(path, 'utf8').match(/^##\s*\[(\d+\.\d+\.\d+)\]/m);
  if (!match) {
    throw new Error(
      `releases: ${path} has no "## [x.y.z]" heading, so the released version cannot be read.`,
    );
  }

  return match[1];
}

/** The archive a machine's crate ships as, on one target. */
export function assetName(crate, target) {
  if (typeof crate !== 'string' || crate.length === 0) {
    throw new Error('releases: a machine reached the download matrix with no crate name');
  }
  return `${crate}-${target.id}.${target.ext}`;
}

export function assetUrl(version, name) {
  return `https://github.com/${REPO}/releases/download/v${version}/${name}`;
}

export function releaseUrl(version) {
  return `https://github.com/${REPO}/releases/tag/v${version}`;
}

/**
 * The one checksum file that covers the whole release.
 *
 * Each archive also ships its own `.sha256`, but linking all hundred and
 * twenty of them would double the page's links for a step most readers take
 * once. The aggregate lists every archive in the release, so one link does
 * the same job.
 */
export function checksumsUrl(version) {
  return assetUrl(version, 'sha256.sum');
}

/**
 * Every machine, every target, every URL — the whole matrix, built once and
 * rendered in full. The page never filters this down: browser detection
 * reorders and marks what it finds, and someone fetching a build for another
 * machine still has every archive in front of them.
 */
export function buildMatrix({ machines, version }) {
  if (!SEMVER.test(String(version))) {
    throw new Error(`releases: "${version}" is not a released version number`);
  }
  if (!Array.isArray(machines) || machines.length === 0) {
    throw new Error('releases: the registry handed the download matrix no machines');
  }

  return machines.map((machine) => ({
    ...machine,
    builds: TARGETS.map((target) => {
      const file = assetName(machine.crate, target);
      return { target, file, url: assetUrl(version, file) };
    }),
  }));
}

/** The count the page publishes, measured from the matrix it just built. */
export function archiveCount(matrix) {
  return matrix.reduce((total, machine) => total + machine.builds.length, 0);
}
