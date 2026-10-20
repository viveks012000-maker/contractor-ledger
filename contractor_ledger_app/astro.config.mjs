import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: process.env.PUBLIC_SITE_URL || undefined,
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
