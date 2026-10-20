import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

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
  { name: '404', path: '/non-existent-page' },
];

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-320', width: 320, height: 568 },
];

async function run() {
  const browser = await chromium.launch();
  const consoleErrors = [];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[${vp.name}] ${page.url()}: ${msg.text()}`);
      }
    });

    for (const r of routes) {
      await page.goto(`http://localhost:4321${r.path}`, { waitUntil: 'networkidle' });
      
      // Check horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      if (hasHorizontalScroll) {
        console.warn(`OVERFLOW DETECTED: ${r.name} at ${vp.name} (${vp.width}px)`);
      }

      const filePath = path.join(outDir, `${r.name}_${vp.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
    }

    // Capture settings modal
    await page.goto('http://localhost:4321/');
    await page.click('#open-settings-header-btn');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, `modal-settings_${vp.name}.png`) });

    await context.close();
  }

  await browser.close();

  console.log(`Screenshots captured in: ${outDir}`);
  if (consoleErrors.length > 0) {
    console.error('Console Errors detected:', consoleErrors);
  } else {
    console.log('Zero browser console errors detected.');
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
