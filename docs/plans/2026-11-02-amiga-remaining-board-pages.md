# Remaining Amiga board pages

Continue #2144's fixed-board mapping after the source owner PR merges. Source
work and immutable/native evidence are recorded in the docs repository's
`plans/2026-11-02-amiga-remaining-board-owners.md`.

1. Read the source registry from the explicit task source path. Replace the
   aggregate Amiga capture in `src/data/boot-screenshots.js` with eight regional
   owner records. Keep RAM, firmware and software claims tied to the actual
   configuration. Copy verified native PNG bytes and retain identity metadata.
   Preserve earlier captures where their hardware/profile still applies.
2. Add the aggregate route's established canonical redirect in `astro.config.mjs`
   and `scripts/expected-routes.txt`. Eight owners replace one registry row:
   expect 104 registry pages and 133 total routes, including the retained redirect.
3. Update `src/lib/browser-player.js` and `BrowserPlayer.astro`: only A500 rev-5
   PAL may embed the pinned 0.44.2 constructor, explicitly labelled A501 RAM/clock.
   Verify that published code and catalogue rather than trusting profile names.
   Other Amiga owners must reject apparent catalogue matches.
4. Add meaningful identity/capture/retirement tests in
   `tests/board-identities.test.mjs`. Keep the published release-manifest gate.
   Run npm tests, build, routes, links, prose and browser accessibility.
5. Create and verify the exact site PR head after source main contains the new
   registry; merge linearly, inspect the deployment, all new live pages, canonical
   redirect and byte identities of every live boot image.
6. Preserve commits/evidence remotely and remove the task worktree, build output,
   npm cache and task-owned browser/server processes. Preserve the primary checkout.

Temporary worktree: `Emu198x/.worktrees/ocs-site`; npm cache:
`/private/tmp/198x-ocs-npm-cache`. No global npm cache ownership is changed.

## Verified before publication

The source owner PR is #2236. Native original-firmware PNGs match the receipts
in docs commit `792d1a9`; A1000 uses original disk/WOM handoff at stock 256 KiB,
rev-5 A500 uses 1.3, rev-6a/A2000CR use 2.04. The two PAL mixed-chip 1.3
failures reproduce on the unchanged original engine and remain #2237.

137 tests and the full build pass: 104 registry pages, 133 routes including
the retained redirect, links/prose and the released-asset manifest. Axe checks
116 content routes in light/dark with no serious/critical defects; the 17
redirects are checked separately. The mechanical design detector reports no
findings. Seven native-only pages fit 390/1280 px in both themes; the same
contexts verify the old aggregate redirect.

The strict embedded-player mobile check fails at 390 px: its Model selector
extends the document to 520 px. The same dimensions reproduce on the existing
published page with player 0.44.2; this is #2238. Keep that failed observation
in the docs evidence rather than hiding it or patching copied bundle files.
The desktop player still explicitly selects and labels A500 PAL+A501. Broader
player packaging/layout work remains separate from this board data change.
