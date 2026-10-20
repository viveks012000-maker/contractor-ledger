import type { APIRoute } from 'astro';
import { createSitemapXml } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  return new Response(createSitemapXml(site), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
