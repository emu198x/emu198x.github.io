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

// One definition of "captured", asked in one place.
//
// Captured means THE BOOT CAPTURE HAS AN IMAGE. Not any capture: a game
// screenshot is not evidence that a machine boots, so counting any capture
// would let a software screenshot mask a machine that never booted. And not
// captures[0]: a positional pick answers by array order, which is not a fact
// about the machine at all.
//
// The rule lived in three places — this helper, the systems page, the accuracy
// page — and they agreed only because every machine currently has exactly one
// capture, of kind boot. The first software capture would have split them.
export function bootCapture(entry) {
  return entry.captures.find((capture) => capture.kind === 'boot') ?? null;
}

// A record gated on local media is a real and honest state, but it is not a
// capture: hasImage, computed once at the model layer, is the measurement.
export function isCaptured(entry) {
  return bootCapture(entry)?.hasImage === true;
}

export function uncaptured(fleet) {
  return fleet.filter((entry) => !isCaptured(entry)).map((entry) => entry.machineId);
}

// The fleet's own count of each support surface, measured from the registry
// rather than typed into a page. The homepage published 6 / 22 / 28 as
// literals; this branch made them wrong, and 28 is the stale total named at
// the top of this file as the number the rebuild exists to remove.
//
// A machine's surface is stated on its boot capture, so it is read through
// bootCapture — a software capture is not a statement about which surface the
// machine ships on. A machine with no boot capture is counted under a null
// group rather than dropped: a machine that is in the registry and missing
// from every total is exactly the silent gap this site is built against.
export function countByGroup(fleet) {
  const counts = new Map();
  for (const entry of fleet) {
    const group = bootCapture(entry)?.group ?? null;
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  return counts;
}
