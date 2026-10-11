// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Dev-only tools (src/dev): playgrounds and testers served at /dev/<tool> by `npm run dev`. They are only registered
// for the dev server, so a production build never sees them and none of their code ships.
const DEV_TOOLS = { viewports: 'Viewports', fonts: 'Fonts', toggle: 'Toggle', credit: 'Credit', logo: 'Logo', serif: 'Serif' };
const devTools = {
  name: 'dev-tools',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      for (const [path, file] of Object.entries(DEV_TOOLS)) injectRoute({ pattern: `/dev/${path}`, entrypoint: `./src/dev/${file}.astro` });
    }
  }
};

export default defineConfig({
  // the production address: canonical links, the sitemap, social previews and llms.txt are built from it
  site: 'https://giveitasoul.com',
  integrations: [react(), devTools],
  // resvg (social preview images, drawn at build time) is a native module: load it as is, don't bundle it
  vite: { ssr: { external: ['@resvg/resvg-js'] } },
});
