/**
 * Joins the site's captures to the registry's machines.
 *
 * The join is stated on each capture as `machineId`, never inferred from the
 * capture's own id — the site's ids are a fifth naming vocabulary and nine of
 * them differ from the registry's.
 *
 * The registry drives the list, so a machine with no capture still appears. A
 * page built from the captures can only show what it already has, which is how
 * twenty-eight came to look like the whole fleet.
 */
export function buildFleet({ machines, captures }) {
  const byMachine = new Map(machines.map((m) => [m.machineId, { ...m, captures: [] }]));
  const claimed = new Set();

  for (const capture of captures) {
    if (!capture.machineId) {
      throw new Error(`fleet: capture ${capture.id} has no machineId`);
    }
    const entry = byMachine.get(capture.machineId);
    if (!entry) {
      throw new Error(
        `fleet: capture ${capture.id} names machineId ${capture.machineId}, ` +
          'which is not in the registry',
      );
    }
    const key = `${capture.machineId}|${capture.kind}`;
    if (claimed.has(key)) {
      throw new Error(`fleet: ${capture.machineId} has two ${capture.kind} captures claiming it`);
    }
    claimed.add(key);
    entry.captures.push(capture);
  }

  return [...byMachine.values()].sort((a, b) => a.machineId.localeCompare(b.machineId));
}

// "Captured" means an image exists, not that a record does — the same
// definition the systems page uses. A record gated on local media is a real
// and honest state, but it is not a capture, and counting it as one is how a
// page and its own helper end up reporting different totals for one fleet.
export function uncaptured(fleet) {
  return fleet
    .filter((entry) => !entry.captures.some((capture) => capture.hasImage))
    .map((entry) => entry.machineId);
}
