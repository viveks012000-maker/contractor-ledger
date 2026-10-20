# Static release configuration

Contractor Ledger is built as a static Astro site. A static host can publish the generated `dist/` directory.

## Build

Run `npm ci`, then `npm run build`. The production output is written to `dist/`.

## Required production values

Set these as build-time environment variables in the static host:

- `PUBLIC_SITE_URL`: the final HTTPS origin, such as `https://www.example.com`, without a path. Astro uses it to generate canonical URLs, the sitemap, and the absolute sitemap entry in `robots.txt`.
- `PUBLIC_CONTACT_EMAIL`: an address that has been verified and is monitored. The Contact page renders a `mailto:` link; it does not submit or store web-form messages.

The build intentionally does not guess a public domain or contact address. If `PUBLIC_SITE_URL` is unset, the pages omit canonical URLs and the sitemap has no page entries. If `PUBLIC_CONTACT_EMAIL` is unset, the Contact page explains that email contact is not configured.

These settings affect generated files and must be present when the production build runs. No deployment or DNS changes are performed by this repository.
