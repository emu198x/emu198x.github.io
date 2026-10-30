# Timex startup diagnostics

The TC2068 and TS2068 images are retained at `public/media/boot/timex-tc2068.png` and `public/media/boot/timex-ts2068.png` for comparison. They show stripes, not a verified BASIC startup screen, so they are excluded from the public boot-evidence catalogue. The strict TS2068 test still matches its existing stripe golden; passing that test does not prove BASIC readiness. Qualification remains [Emu198x #52](https://github.com/emu198x/emu198x/issues/52).

The original records used `emu198x-spectrum` script mode, selected `timex_tc2068` or `timex_ts2068`, ran 300 frames and saved the screenshot. Both recipes declared `timex-ts2068/ts2068.rom` (16 KiB) and `timex-ts2068/exrom.rom` (8 KiB) below the local ROM root. The TC2068 record therefore does not independently identify TC2068 firmware. No firmware is stored in this repository.

Retain the images and these recipes as diagnostics. Restore a public boot claim only after the matching board and identified firmware reach their expected startup screen and accept a short BASIC command with an asserted result. Browser players select the exact `timex_tc2068` and `timex_ts2068` variants and require their firmware uploads; a player entry alone is not boot evidence.
