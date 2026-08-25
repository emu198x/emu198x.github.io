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

export function evidencePath(sourceRoot) {
  return join(sourceRoot, 'docs', 'status', 'current-system-usability.md');
}

function extractUrl(cell) {
  // Extract URL from markdown link: everything between last ]( and final )
  const lastOpenIdx = cell.lastIndexOf('](');
  if (lastOpenIdx === -1) return null;
  const urlStart = lastOpenIdx + 2;
  const urlEnd = cell.lastIndexOf(')');
  if (urlEnd <= urlStart) return null;
  return cell.slice(urlStart, urlEnd);
}

function extractMachineId(cell) {
  // Extract content between backticks
  const start = cell.indexOf('`');
  const end = cell.lastIndexOf('`');
  if (start === -1 || end === -1 || start >= end) return null;
  return cell.slice(start + 1, end);
}

export function readEvidence(sourceRoot) {
  const path = evidencePath(sourceRoot);

  if (!existsSync(path)) {
    throw new Error(
      `evidence: no current-system-usability.md at ${path}. ` +
        'Set EMU198X_SOURCE_ROOT to a checkout of emu198x/emu198x.',
    );
  }

  const content = readFileSync(path, 'utf8');
  const lines = content.split('\n');
  const evidence = new Map();

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const rawLine = lines[lineNum];
    // Remove CRLF and trim
    const line = rawLine.replace(/\r$/, '').trim();

    // Skip non-table lines (don't start with |)
    if (!line.startsWith('|')) continue;

    // Skip the header row (contains "Machine" and other column names)
    if (line.includes('Machine') && line.includes('Issues')) continue;

    // Skip the separator row (|---|---|...)
    if (line.match(/^\|\s*[-:]+(\s*\|\s*[-:]+)*\s*\|$/)) continue;

    // This is a data row - it must parse or we throw
    const cells = line.split('|').slice(1, -1).map(c => c.trim());

    if (cells.length !== 6) {
      throw new Error(`evidence: malformed row at line ${lineNum + 1}: expected 6 cells, got ${cells.length}`);
    }

    // Extract machine ID
    const machineId = extractMachineId(cells[0]);
    if (!machineId) {
      throw new Error(`evidence: line ${lineNum + 1}: cannot extract machine ID from cell "${cells[0]}"`);
    }

    // Extract counts
    const ownCrates = Number(cells[2]);
    const sharedCrates = Number(cells[3]);

    if (!Number.isInteger(ownCrates) || !Number.isInteger(sharedCrates)) {
      throw new Error(`evidence: ${machineId} has non-numeric crate counts (${cells[2]}, ${cells[3]})`);
    }

    // Extract URLs
    const issuesUrl = extractUrl(cells[4]);
    if (!issuesUrl) {
      throw new Error(`evidence: ${machineId}: cannot extract issues URL from "${cells[4]}"`);
    }

    const milestoneUrl = extractUrl(cells[5]);
    if (!milestoneUrl) {
      throw new Error(`evidence: ${machineId}: cannot extract milestone URL from "${cells[5]}"`);
    }

    evidence.set(machineId, { ownCrates, sharedCrates, issuesUrl, milestoneUrl });
  }

  if (evidence.size === 0) {
    throw new Error(`evidence: ${path} has no evidence table`);
  }

  return evidence;
}
