// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { remarkRewriteMarkdownLinks } from './src/lib/remark-rewrite-md-links.mjs';

export default defineConfig({
  site: 'https://emu198x.github.io',
  integrations: [mdx(), sitemap()],
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
