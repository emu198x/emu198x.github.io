// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { remarkRewriteMarkdownLinks } from './src/lib/remark-rewrite-md-links.mjs';

export default defineConfig({
  site: 'https://emu198x.github.io',
  integrations: [mdx(), sitemap()],
  redirects: {
    '/systems/nintendo-snes': '/systems/nintendo-snes-ntsc/',
    '/systems/commodore-pet': '/systems/commodore-pet-2001n-32k/',
    '/systems/commodore-c64': '/systems/commodore-c64-pal-breadbin/',
    '/systems/commodore-c128': '/systems/commodore-c128-pal/',
    '/systems/atari-st': '/systems/atari-520st-pal/',
    '/systems/amstrad-cpc': '/systems/amstrad-cpc464/',
    '/systems/nintendo-nes': '/systems/nintendo-nes-ntsc/',
    '/systems/sega-mega-drive': '/systems/sega-genesis/',
    '/docs/status/current-system-usability': '/accuracy/',
    '/systems/sord-m5': '/systems/sord-m5-ntsc/',
    '/systems/commodore-vic-20': '/systems/commodore-vic-20-ntsc/',
    '/systems/spectravideo-svi-328': '/systems/spectravideo-svi-328-ntsc/',
    '/systems/coleco-colecovision': '/systems/coleco-colecovision-ntsc/',
    '/systems/microsoft-msx1': '/systems/',
    '/systems/microsoft-msx2': '/systems/',
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkRewriteMarkdownLinks],
    }),
    syntaxHighlight: 'shiki',
    shikiConfig: {
      // github-dark sets comments at #6a737d on #24292e — 3.05:1, which fails
      // AA and makes the commentary in every listing the least readable part
      // of it. github-dark-default is the same family at 6.15:1.
      theme: 'github-dark-default',
      wrap: true,
    },
  },
});
