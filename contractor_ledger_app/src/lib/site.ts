export const INDEXABLE_ROUTES = [
  '/',
  '/calculators/job-pricing/',
  '/calculators/labor-cost/',
  '/calculators/profit-margin/',
  '/calculators/break-even/',
  '/calculators/material-markup/',
  '/calculators/project-estimate/',
  '/methodology/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
] as const;

const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createCanonicalUrl(site: URL | undefined, canonicalPath: string): string | undefined {
  if (!site || !canonicalPath.startsWith('/') || canonicalPath.startsWith('//') || /[?#]/.test(canonicalPath)) {
    return undefined;
  }

  const normalizedPath = canonicalPath === '/' ? '/' : `${canonicalPath.replace(/\/+$/, '')}/`;
  const canonical = new URL(normalizedPath, `${site.origin}/`);
  return canonical.origin === site.origin ? canonical.toString() : undefined;
}

export function createBreadcrumbJsonLd(site: URL | undefined, canonicalPath: string, pageName: string) {
  const pageUrl = createCanonicalUrl(site, canonicalPath);
  if (!site || !pageUrl || !pageName.trim()) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: new URL('/', `${site.origin}/`).toString(),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Calculators',
        item: new URL('/#core-calculators', `${site.origin}/`).toString(),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: pageName.trim(),
        item: pageUrl,
      },
    ],
  };
}

export function createSitemapXml(site: URL | undefined): string {
  const urls = site
    ? INDEXABLE_ROUTES.map(route => `  <url>\n    <loc>${escapeXml(new URL(route, `${site.origin}/`).toString())}</loc>\n  </url>`).join('\n')
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NAMESPACE}">\n${urls}\n</urlset>`;
}

export function createRobotsTxt(site: URL | undefined): string {
  const lines = ['User-agent: *', 'Allow: /'];
  if (site) lines.push('', `Sitemap: ${new URL('/sitemap.xml', `${site.origin}/`).toString()}`);
  return `${lines.join('\n')}\n`;
}

export function createBrandJsonLd(site: URL | undefined) {
  if (!site) return undefined;

  const origin = site.origin;
  const organizationId = `${origin}/#organization`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'Contractor Ledger',
        url: `${origin}/`,
        logo: new URL('/contractor-ledger-growth-logo.png', `${origin}/`).toString(),
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: `${origin}/`,
        name: 'Contractor Ledger',
        publisher: { '@id': organizationId },
      },
    ],
  };
}

export function normalizeContactEmail(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const email = value.trim();
  if (!email) return undefined;

  const isValid = email.length <= 254 && /^[^\s@]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(email);
  if (!isValid) {
    throw new Error('PUBLIC_CONTACT_EMAIL must be a valid public email address.');
  }

  return email;
}
