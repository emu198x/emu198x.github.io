# Emu198x Website

Public website and documentation for Emu198x.

The site is built with Astro. The changelog, the system registry and the
usability evidence come from the Emu198x flagship at build time.

```sh
npm ci
npm run build
```

`npm run source` (run first by dev, build and test) chooses that checkout and
records it in `.emu198x-source`: `EMU198X_SOURCE_ROOT` if set, else `../emu198x`
when it is a checkout of emu198x/emu198x (so local docs edits show up), else a
sparse clone of Emu198x main in `_emu198x`, which is what CI uses.

## Browser players

Each system page embeds the shared Emu198x browser player. The player, its
machine catalogue and its build live in the emulator repo's `web-player/`;
change the player there, not here. See its README for what the player does and
how it is checked.

The player is the `@emu198x/player` npm package, pinned exactly in
`package.json` and built once by each Emu198x release (umbrella
`decisions/browser-bundles-ship-as-npm-packages.md`). `npm run bundles`, which
`npm run dev` and `npm run build` run first, copies it into
`public/emulators/`, generated and ignored. No Rust toolchain is needed here.
A new Emu198x release arrives as a Dependabot pull request.

No firmware file or visitor media is copied into the site. The player's
Spectrum module carries the 48K ROM, compiled in by Emu198x's publish job.
