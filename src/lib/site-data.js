/**
 * One load of the flagship's data per build, shared by every page that needs
 * it. Checking the contract once and throwing here means a broken registry
 * stops the build before a single page renders.
 */
import { resolve, join } from 'node:path';
import { readRegistry } from './registry.js';
import { readEvidence } from './evidence.js';
import { buildFleet } from './fleet.js';
import { bootScreenshots, normalizeCaptureTarget } from '../data/boot-screenshots.js';

// Astro bundles this module into dist/.prerender/chunks/ at build time, so
// import.meta.url follows the file into the bundle output rather than
// staying at its source location — a location-derived root here would
// resolve relative to the wrong directory once bundled and only happen to
// match while running unbundled (e.g. under the unit tests). process.cwd()
// is the stable anchor: Astro's build and every scripts/ entry point run
// with the working directory at the project root.
export function sourceRoot() {
  return resolve(process.env.EMU198X_SOURCE_ROOT ?? join(process.cwd(), '..', 'emu198x'));
}

// The raw records in boot-screenshots.js are terse: most omit rightsNote,
// kind, and title and expect the normalising accessor to default them (as
// captureTargets() does for the flat capture-catalogue view). Feeding the
// raw records to buildFleet skips that defaulting, so every capture here is
// normalized first — top-level and its nested variants alike — before the
// fleet ever sees it.
function normalizeSystem(system) {
  const capture = normalizeCaptureTarget(system);
  capture.variants = (system.variants ?? []).map((variant) => normalizeCaptureTarget(variant, system));
  return capture;
}

let cached = null;

export function loadSiteData() {
  if (cached) return cached;
  const root = sourceRoot();
  const machines = readRegistry(root);
  const evidence = readEvidence(root);
  const captures = bootScreenshots.map(normalizeSystem);
  const fleet = buildFleet({ machines, captures });

  const missing = fleet.filter((entry) => !evidence.has(entry.machineId));
  if (missing.length > 0) {
    throw new Error(
      `site-data: no evidence row for ${missing.map((m) => m.machineId).join(', ')}`,
    );
  }

  assertRightsNotes(fleet);

  cached = { fleet, evidence, sourceRoot: root };
  return cached;
}

// rightsNote is guaranteed by normalizeCaptureTarget's default whenever a
// capture has an image, but a capture that *has* an image and reaches the
// page without a note must fail loudly, not render an empty note silently
// — see the imagery-rights decision. A capture with no image correctly
// carries no rightsNote (see hasImage in boot-screenshots.js): asserting
// rights over a capture that never ran would be the same kind of false
// claim, just phrased as a note instead of an image.
//
// Variants are checked with their parent, never skipped: they hang off
// capture.variants rather than entry.captures, so a loop over entry.captures
// alone walks past all nineteen of them — and the systems page publishes a
// rights cell for every one. A note blanked to '' slips past the normalizer's
// `?? defaultRightsNote` default untouched, which is how a variant row shipped
// a visible screenshot beside an empty rights claim with the build still green.
export function assertRightsNotes(fleet) {
  for (const entry of fleet) {
    for (const capture of entry.captures) {
      for (const target of [capture, ...(capture.variants ?? [])]) {
        if (target.hasImage && !target.rightsNote) {
          throw new Error(`site-data: ${entry.machineId} capture ${target.id} has no rightsNote`);
        }
      }
    }
  }
}
