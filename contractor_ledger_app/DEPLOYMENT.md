# Static release configuration

Contractor Ledger is built as a static Astro site. A static host can publish the generated `dist/` directory.

## Build

Run `npm ci`, then `npm run build`. The production output is written to `dist/`.

## Production values

Set these as build-time environment variables in the static host:

- `PUBLIC_SITE_URL`: defaults to the permanent production origin, `https://felnixa.com` (origin only: no path, query, or fragment). Astro uses it to generate canonical URLs, the sitemap, and the absolute sitemap entry in `robots.txt`.
- `PUBLIC_CONTACT_EMAIL`: the public support address, `g2652829@gmail.com`. The Contact page renders a `mailto:` link; it does not submit or store web-form messages.

If `PUBLIC_CONTACT_EMAIL` is unset, the Contact page explains that email contact is not configured. The Cloudflare Pages production environment must set both values above and rebuild the site after the domain migration is ready.

These settings affect generated files and must be present when the production build runs. No deployment or DNS changes are performed by this repository.
