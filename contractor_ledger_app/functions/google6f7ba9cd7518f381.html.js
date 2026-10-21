export function onRequestGet() {
  return new Response('google-site-verification: google6f7ba9cd7518f381.html', {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
