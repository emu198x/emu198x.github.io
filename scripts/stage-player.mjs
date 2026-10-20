#!/usr/bin/env node
// Copy the pinned browser player from node_modules into public/emulators/.
//
// The player is @emu198x/player, installed at the exact version in
// package.json and built once by Emu198x from a release (umbrella
// decisions/browser-bundles-ship-as-npm-packages.md), so this site compiles no
// Rust. Runs before dev and build.
import {cpSync, readFileSync, rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const player = path.dirname(require.resolve('@emu198x/player/package.json'));
const out = path.join(site, 'public/emulators');
rmSync(out, {recursive: true, force: true});
cpSync(player, out, {
  recursive: true,
  filter: (source) => !['package.json', 'README.md'].includes(path.relative(player, source)),
});
const build = JSON.parse(readFileSync(path.join(out, 'build.json'), 'utf8'));
// The Spectrum 48K model starts without asking for firmware only if the
// player carries the ROM; a package without it would be a silent regression.
if (!build.bundledSpectrum48kFirmware) {
  throw new Error(`@emu198x/player ${build.version} does not carry the Spectrum 48K ROM`);
}
console.log(`Staged @emu198x/player ${build.version} (${build.revision.slice(0, 9)}).`);
