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

export function createWebApplicationJsonLd(description: string, canonicalUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Contractor Ledger',
    description,
    ...(canonicalUrl ? { url: canonicalUrl } : {}),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web browser',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
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
