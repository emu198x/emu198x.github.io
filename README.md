# Emu198x Website

Public website and documentation for Emu198x.

The site is built with Astro. Public Markdown is synchronized from the sibling
`emu198x` source repo at build time.

```sh
EMU198X_SOURCE_ROOT=../emu198x npm run build
```

## Browser players

Each system page embeds the shared Emu198x browser player. The player, its
machine catalogue and its build live in the emulator repo's `web-player/`;
change the player there, not here. See its README for what the player does and
how it is checked.

Run `npm run build:player` before the first development or site build. It
builds the player from `EMU198X_SOURCE_ROOT` (default `../emu198x`) into
`public/emulators/`, which is generated and ignored. The build needs that
checkout's Rust toolchain, the `wasm32-unknown-unknown` target and `wasm-pack`.
`npm run dev` and `npm run build` stop with a message if the player is missing.

No firmware file or visitor media is copied into the site. The Pages workflow builds
the player before Astro, so emulator changes must land before the site uses them.
