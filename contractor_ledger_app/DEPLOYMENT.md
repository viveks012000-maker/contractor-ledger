# Static release configuration

Contractor Ledger is built as a static Astro site. A static host can publish the generated `dist/` directory.

## Build

Run `npm ci`, then `npm run build`. The production output is written to `dist/`.

## Production values

Set these as build-time environment variables in the static host:

- `PUBLIC_SITE_URL`: defaults to the current Cloudflare Pages production origin, `https://contractor-ledger-1nx.pages.dev`. When a custom domain is ready, set this to that HTTPS origin only (no path, query, or fragment). Astro uses it to generate canonical URLs, the sitemap, and the absolute sitemap entry in `robots.txt`.
- `PUBLIC_CONTACT_EMAIL`: an address that has been verified and is monitored. The Contact page renders a `mailto:` link; it does not submit or store web-form messages.

If `PUBLIC_CONTACT_EMAIL` is unset, the Contact page explains that email contact is not configured. A custom-domain migration requires setting `PUBLIC_SITE_URL` to the new origin and rebuilding the site.

These settings affect generated files and must be present when the production build runs. No deployment or DNS changes are performed by this repository.
