import { describe, expect, it } from 'vitest';
import {
  createCanonicalUrl,
  createRobotsTxt,
  createSitemapXml,
  createWebApplicationJsonLd,
  INDEXABLE_ROUTES,
  normalizeContactEmail,
} from './site';

describe('site publication configuration and SEO output', () => {
  const site = new URL('https://release-test.invalid/');

  it('creates self-referencing canonical URLs only for safe site paths', () => {
    expect(createCanonicalUrl(site, '/calculators/job-pricing/'))
      .toBe('https://release-test.invalid/calculators/job-pricing/');
    expect(createCanonicalUrl(undefined, '/')).toBeUndefined();
    expect(createCanonicalUrl(site, '//other.invalid/page')).toBeUndefined();
    expect(createCanonicalUrl(site, '/page?preview=true')).toBeUndefined();
  });

  it('lists each intended indexable route once and excludes the error page', () => {
    const xml = createSitemapXml(site);
    const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);

    expect(locations).toHaveLength(INDEXABLE_ROUTES.length);
    expect(new Set(locations).size).toBe(locations.length);
    expect(locations).toContain('https://release-test.invalid/');
    expect(locations).toContain('https://release-test.invalid/calculators/project-estimate/');
    expect(locations.some(location => location.includes('/404'))).toBe(false);
    expect(locations.every(location => new URL(location).protocol === 'https:')).toBe(true);
    expect(xml).not.toContain('contractorledger.com');
  });

  it('keeps local builds valid without publishing a guessed sitemap origin', () => {
    const xml = createSitemapXml(undefined);
    expect(xml).toContain('<urlset');
    expect(xml).not.toContain('<loc>');
    expect(createRobotsTxt(undefined)).not.toContain('Sitemap:');
  });

  it('uses an absolute sitemap URL in robots.txt when a site origin is configured', () => {
    expect(createRobotsTxt(site)).toContain('Sitemap: https://release-test.invalid/sitemap.xml');
  });

  it('limits WebApplication JSON-LD to accurate, configured application metadata', () => {
    expect(createWebApplicationJsonLd('Job pricing calculations', createCanonicalUrl(site, '/calculators/job-pricing/')))
      .toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        url: 'https://release-test.invalid/calculators/job-pricing/',
        isAccessibleForFree: true,
      });
  });

  it('accepts a configured contact mailbox without fabricating a default', () => {
    expect(normalizeContactEmail(undefined)).toBeUndefined();
    expect(normalizeContactEmail('  ')).toBeUndefined();
    expect(normalizeContactEmail('support+ledger@example.net')).toBe('support+ledger@example.net');
    expect(() => normalizeContactEmail('not-an-email')).toThrow(/PUBLIC_CONTACT_EMAIL/);
    expect(() => normalizeContactEmail('help@example.net\r\nBcc:someone@example.com')).toThrow(/PUBLIC_CONTACT_EMAIL/);
  });
});
