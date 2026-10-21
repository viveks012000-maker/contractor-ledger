export function onRequestGet() {
  return new Response('google-site-verification: googled83f8fb98f4d4f5d.html', {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
