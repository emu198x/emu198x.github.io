/**
 * Per-machine evidence, read from the flagship's generated status page.
 *
 * That page is produced by scripts/status/render_status.py and CI fails on
 * drift, so it is the closest thing to a checked source the site has. It
 * publishes no test counts on purpose: "They would be stale within a day, and
 * a page that is usually wrong trains people to stop reading it."
 *
 * So the facts available are the crate counts and two links. There is no
 * source here for a percentage, which is why the site publishes none.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROW = /^\|\s*`([^`]+)`\s*\|\s*`[^`]+`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*\[[^\]]*\]\(([^)]+)\)\s*\|\s*\[[^\]]*\]\(([^)]+)\)\s*\|$/;

export function evidencePath(sourceRoot) {
  return join(sourceRoot, 'docs', 'status', 'current-system-usability.md');
}

export function readEvidence(sourceRoot) {
  const path = evidencePath(sourceRoot);

  if (!existsSync(path)) {
    throw new Error(
      `evidence: no current-system-usability.md at ${path}. ` +
        'Set EMU198X_SOURCE_ROOT to a checkout of emu198x/emu198x.',
    );
  }

  const evidence = new Map();
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(ROW);
    if (!match) continue;
    const [, machineId, own, shared, issuesUrl, milestoneUrl] = match;
    const ownCrates = Number(own);
    const sharedCrates = Number(shared);
    if (!Number.isInteger(ownCrates) || !Number.isInteger(sharedCrates)) {
      throw new Error(`evidence: ${machineId} has non-numeric crate counts (${own}, ${shared})`);
    }
    evidence.set(machineId, { ownCrates, sharedCrates, issuesUrl, milestoneUrl });
  }

  if (evidence.size === 0) {
    throw new Error(`evidence: ${path} has no evidence table`);
  }

  return evidence;
}
