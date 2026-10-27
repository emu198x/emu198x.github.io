# Count shared family release archives once

The live registry maps C64/C128, Dragon/CoCo and MSX1/MSX2 to shared shipped
crates. The 2026-10-26 flagship decision `each-machine-has-its-own-machine-crate`
allows a family to ship one emulator. The downloads test instead requires a
unique archive per machine, and the archive total counts repeated links.

1. Add a C64/C128 fixture in `tests/releases.test.mjs` proving both machines
   keep all their links while the shared release archives count once. Run red.
2. Count unique files in `src/lib/releases.js`; update the live join invariant
   to require uniqueness per crate/target and permit reuse only for the same
   declared crate. Correct the downloads page's one-binary-per-machine prose.
3. Run all Node tests against the corrected flagship evidence producer, then
   build and inspect the generated downloads count. Push a separate PR and
   require the hosted Pages checks before merging.

The first full build found seven newly registered system pages missing from
`scripts/expected-routes.txt`. Verify all system routes equal registry IDs,
then record those additions without removing any existing routes.
