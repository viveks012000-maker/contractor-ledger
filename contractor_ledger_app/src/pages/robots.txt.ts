import type { APIRoute } from 'astro';
import { createRobotsTxt } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  return new Response(createRobotsTxt(site), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
