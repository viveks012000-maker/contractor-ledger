import type { APIRoute } from 'astro';

const routes = [
  '',
  'calculators/job-pricing/',
  'calculators/labor-cost/',
  'calculators/profit-margin/',
  'calculators/break-even/',
  'calculators/material-markup/',
  'calculators/project-estimate/',
  'methodology/',
  'about/',
  'contact/',
  'privacy/',
  'terms/',
];

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ? site.toString().replace(/\/$/, '') : 'https://contractorledger.com';

  const urls = routes
    .map(route => {
      const loc = `${baseUrl}/${route}`;
      const priority = route === '' ? '1.0' : route.startsWith('calculators/') ? '0.9' : '0.7';
      const changefreq = route === '' || route.startsWith('calculators/') ? 'weekly' : 'monthly';

      return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
