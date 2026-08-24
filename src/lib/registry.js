/**
 * The machine registry, read from the flagship repo.
 *
 * `docs/status/systems.toml` is the one place the project's four naming
 * vocabularies meet, and every join in it is stated and never inferred —
 * three attempts to infer them by pattern produced wrong answers. The site
 * reads exactly the four fields below and nothing else; that is the contract.
 *
 * Every breach throws. The bug this file exists to prevent was a step that
 * skipped silently and reported success.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'smol-toml';

const FIELDS = ['machine_id', 'crate', 'label', 'milestone'];

export function registryPath(sourceRoot) {
  return join(sourceRoot, 'docs', 'status', 'systems.toml');
}

export function readRegistry(sourceRoot) {
  const path = registryPath(sourceRoot);

  if (!existsSync(path)) {
    throw new Error(
      `registry: no systems.toml at ${path}. ` +
        'Set EMU198X_SOURCE_ROOT to a checkout of emu198x/emu198x.',
    );
  }

  let parsed;
  try {
    parsed = parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`registry: ${path} did not parse as TOML: ${err.message}`);
  }

  const entries = parsed.system;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`registry: ${path} has no [[system]] entries`);
  }

  const seen = new Set();
  const machines = entries.map((entry, index) => {
    for (const field of FIELDS) {
      if (typeof entry[field] !== 'string' || entry[field].length === 0) {
        const name = entry.machine_id ?? `entry ${index}`;
        throw new Error(`registry: ${name} is missing ${field}`);
      }
    }
    if (seen.has(entry.machine_id)) {
      throw new Error(`registry: duplicate machine_id ${entry.machine_id}`);
    }
    seen.add(entry.machine_id);
    return {
      machineId: entry.machine_id,
      crate: entry.crate,
      label: entry.label,
      milestone: entry.milestone,
    };
  });

  return machines.sort((a, b) => a.machineId.localeCompare(b.machineId));
}
