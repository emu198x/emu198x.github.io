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
import { bootScreenshots } from '../data/boot-screenshots.js';

const siteRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));

export function sourceRoot() {
  return resolve(process.env.EMU198X_SOURCE_ROOT ?? join(siteRoot, '..', 'emu198x'));
}

let cached = null;

export function loadSiteData() {
  if (cached) return cached;
  const root = sourceRoot();
  const machines = readRegistry(root);
  const evidence = readEvidence(root);
  const fleet = buildFleet({ machines, captures: bootScreenshots });

  const missing = fleet.filter((entry) => !evidence.has(entry.machineId));
  if (missing.length > 0) {
    throw new Error(
      `site-data: no evidence row for ${missing.map((m) => m.machineId).join(', ')}`,
    );
  }

  cached = { fleet, evidence, sourceRoot: root };
  return cached;
}
