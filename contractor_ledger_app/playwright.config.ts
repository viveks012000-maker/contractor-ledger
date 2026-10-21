import { defineConfig, devices } from '@playwright/test';
import { createServer } from 'node:net';

process.env.PUBLIC_SITE_URL ||= 'https://felnixa.com';

async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      if (!address || typeof address === 'string') {
        probe.close();
        reject(new Error('Could not determine an available port for the production preview.'));
        return;
      }

      probe.close(error => error ? reject(error) : resolve(address.port));
    });
  });
}

const configuredPreviewPort = Number(process.env.CONTRACTOR_LEDGER_PLAYWRIGHT_PORT);
const previewPort = Number.isInteger(configuredPreviewPort) && configuredPreviewPort > 0 && configuredPreviewPort <= 65535
  ? configuredPreviewPort
  : await findAvailablePort();
process.env.CONTRACTOR_LEDGER_PLAYWRIGHT_PORT = String(previewPort);

const previewUrl = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: previewUrl,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${previewPort}`,
    url: previewUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  projects: [
    {
      name: 'desktop-1440',
      testIgnore: /mobile-webkit\.spec\.ts/,
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'tablet-1024',
      testIgnore: /mobile-webkit\.spec\.ts/,
      use: {
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'mobile-390',
      testIgnore: /mobile-webkit\.spec\.ts/,
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'mobile-320',
      testIgnore: /mobile-webkit\.spec\.ts/,
      use: {
        viewport: { width: 320, height: 568 },
      },
    },
    {
      name: 'ios-webkit-iphone',
      testMatch: /mobile-webkit\.spec\.ts/,
      use: {
        ...devices['iPhone 13'],
      },
    },
    {
      name: 'ios-webkit-ipad',
      testMatch: /mobile-webkit\.spec\.ts/,
      use: {
        ...devices['iPad (gen 7)'],
      },
    },
  ],
});
