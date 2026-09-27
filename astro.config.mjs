// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  // the production address: canonical links, the sitemap, social previews and llms.txt are built from it
  site: 'https://giveitasoul.com',
  integrations: [react()],
  // resvg (social preview images, drawn at build time) is a native module: load it as is, don't bundle it
  vite: { ssr: { external: ['@resvg/resvg-js'] } },
});
