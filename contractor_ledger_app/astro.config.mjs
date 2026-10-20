import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Keep local production builds aligned with the active Cloudflare Pages origin.
const configuredSiteUrl = process.env.PUBLIC_SITE_URL?.trim() || 'https://contractor-ledger-1nx.pages.dev';
let site;

if (configuredSiteUrl) {
  let parsedSiteUrl;
  try {
    parsedSiteUrl = new URL(configuredSiteUrl);
  } catch {
    throw new Error('PUBLIC_SITE_URL must be a valid HTTPS origin, such as https://www.your-domain.example.');
  }

  if (
    parsedSiteUrl.protocol !== 'https:' ||
    parsedSiteUrl.username ||
    parsedSiteUrl.password ||
    parsedSiteUrl.pathname !== '/' ||
    parsedSiteUrl.search ||
    parsedSiteUrl.hash
  ) {
    throw new Error('PUBLIC_SITE_URL must be an HTTPS origin without credentials, a path, a query, or a fragment.');
  }

  site = parsedSiteUrl.origin;
}

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site,
  trailingSlash: 'always',
  integrations: [
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
