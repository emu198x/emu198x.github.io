# Keep site evidence tied to concrete boards

The emulator board splits retire aggregate machine IDs, while the site reads
its current registry on each build. Preserve source provenance and the pinned
player package; do not infer a manufacturer from an old generic MSX capture.

1. Reproduce the current site-data failure against the final 64-machine registry.
2. In `src/data/boot-screenshots.js`, retain only board-qualified active capture
   joins. Make regional capture commands explicit; replace the generic MSX
   record with a newly identified Sony HB-F1 capture, leaving the old asset
   unclaimed. Verify the screenshot with the tested original ROM identities.
3. Reconcile system routes and existing browser embeddings with explicit board
   selection. Keep historical family URLs distinct from machine evidence and
   keep the existing pinned player dependency.
4. Update `scripts/expected-routes.txt` from a successful build, then rerun the
   build without update mode. Add a real-registry integration check and reject
   unknown captures as before. Run unit, route, link, browser and prose gates.
5. Commit/push the site change, inspect its CI, merge and remove the task
   worktree and disposable dependency/build caches.

Verification: the original join fails on the retired generic MSX identity. The
updated build joins all 64 registry machines and verifies 41 exact board embeds
from the unchanged player 0.44.2 package, refusing absent variants. The route
list includes all machine pages and the existing-pattern legacy redirects.
The ordinary-English negative control still fails the prose rule; the literal
Game Boy Color registry key and official product name remain unchanged.

The new Sony HB-F1 PNG is a 400-native-frame capture with f1bios.rom SHA-1
`0081ea0d25bc5cd8d70b60ad8cfdc7307812c0fd` and f1ext.rom SHA-1
`b8e30d604d319d511cbfbc61e5d8c38fbb9c5a33`, identified in MAME's HB-F1
catalogue. The capture reaches MSX BASIC 2.0 and Ok. Firmware is not committed.
The old generic MSX image remains unclaimed; it is not evidence for a maker.

CI's Vale 3.17.1 ignores the exact HTML identifier exemption and reproduces two
alerts in the negative-control fixture; current stable 3.25.1 produces only the
ordinary-prose alert. Verify the downloaded binaries against upstream release
SHA-256 digests, then update the existing CI pin and run the full checks with
3.25.1. Keep the negative control unchanged.
