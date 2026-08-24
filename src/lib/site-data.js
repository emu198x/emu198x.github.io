/**
 * One load of the flagship's data per build, shared by every page that needs
 * it. Checking the contract once and throwing here means a broken registry
 * stops the build before a single page renders.
 */
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRegistry } from './registry.js';
import { readEvidence } from './evidence.js';
import { buildFleet } from './fleet.js';
import { bootScreenshots, normalizeCaptureTarget } from '../data/boot-screenshots.js';

const siteRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));

export function sourceRoot() {
  return resolve(process.env.EMU198X_SOURCE_ROOT ?? join(siteRoot, '..', 'emu198x'));
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

  // rightsNote is guaranteed by normalizeCaptureTarget's default, but a
  // capture reaching the page without one must fail loudly, not render an
  // empty note silently — see the imagery-rights decision.
  for (const entry of fleet) {
    for (const capture of entry.captures) {
      if (!capture.rightsNote) {
        throw new Error(`site-data: ${entry.machineId} capture ${capture.id} has no rightsNote`);
      }
    }
  }

  cached = { fleet, evidence, sourceRoot: root };
  return cached;
}
