import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../screenshots');
const baseUrl = (process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:4321').replace(/\/$/, '');

fs.mkdirSync(outDir, { recursive: true });

const routes = [
  { name: 'homepage', path: '/' },
  { name: 'job-pricing', path: '/calculators/job-pricing/' },
  { name: 'labor-cost', path: '/calculators/labor-cost/' },
  { name: 'profit-margin', path: '/calculators/profit-margin/' },
  { name: 'break-even', path: '/calculators/break-even/' },
  { name: 'material-markup', path: '/calculators/material-markup/' },
  { name: 'project-estimate', path: '/calculators/project-estimate/' },
  { name: 'methodology', path: '/methodology/' },
  { name: 'about', path: '/about/' },
  { name: 'contact', path: '/contact/' },
  { name: 'privacy', path: '/privacy/' },
  { name: 'terms', path: '/terms/' },
  { name: '404', path: '/non-existent-page/' },
];

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-320', width: 320, height: 568 },
];

async function run() {
  const browser = await chromium.launch();
  const failures = [];
  const homepageMetrics = [];
  let screenshotCount = 0;

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      let currentRoute = '';

      page.on('console', message => {
        const expected404Document = currentRoute === '/non-existent-page/' &&
          message.text().includes('server responded with a status of 404 (Not Found)');
        if (message.type() === 'error' && !expected404Document) {
          failures.push(`[${viewport.name}] console ${page.url()}: ${message.text()}`);
        }
      });
      page.on('pageerror', error => failures.push(`[${viewport.name}] page error ${page.url()}: ${error.message}`));
      page.on('response', response => {
        if (response.status() >= 400 && response.request().resourceType() !== 'document') {
          failures.push(`[${viewport.name}] resource ${response.status()} ${response.url()}`);
        }
      });

      for (const route of routes) {
        currentRoute = route.path;
        const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
        const expectedStatus = route.name === '404' ? 404 : 200;
        if (response?.status() !== expectedStatus) {
          failures.push(`[${viewport.name}] ${route.path}: expected ${expectedStatus}, received ${response?.status() ?? 'no response'}`);
        }

        const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        if (hasHorizontalScroll) failures.push(`[${viewport.name}] horizontal overflow on ${route.path} (${viewport.width}px)`);

        if (route.name === 'homepage') {
          homepageMetrics.push({
            viewport: viewport.name,
            ...await page.evaluate(() => {
              const navigation = performance.getEntriesByType('navigation')[0];
              const sameOriginResources = performance.getEntriesByType('resource').filter(entry =>
                new URL(entry.name).origin === location.origin
              );
              const bytesFor = (extension) => sameOriginResources
                .filter(entry => new URL(entry.name).pathname.endsWith(extension))
                .reduce((total, entry) => total + entry.transferSize, 0);
              return {
                ttfbMs: Math.round(navigation.responseStart),
                domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
                loadEventMs: Math.round(navigation.loadEventEnd),
                sameOriginJsTransferBytes: bytesFor('.js'),
                sameOriginCssTransferBytes: bytesFor('.css'),
              };
            }),
          });
        }

        await page.screenshot({
          path: path.join(outDir, `${route.name}_${viewport.name}.png`),
          fullPage: true,
        });
        screenshotCount += 1;
      }

      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
      currentRoute = '/';
      await page.locator('#open-settings-header-btn').click();
      await page.getByRole('dialog', { name: 'Contractor Cost Settings' }).waitFor({ state: 'visible' });
      await page.screenshot({ path: path.join(outDir, `modal-settings_${viewport.name}.png`) });
      screenshotCount += 1;
      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`Captured ${screenshotCount} screenshots in ${outDir}.`);
  console.log(`Local Chromium homepage navigation samples: ${JSON.stringify(homepageMetrics)}`);
  if (failures.length > 0) {
    console.error(`Visual/release checks found ${failures.length} issue(s):\n${failures.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('All routes loaded with expected statuses, no browser errors, and no horizontal overflow.');
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
