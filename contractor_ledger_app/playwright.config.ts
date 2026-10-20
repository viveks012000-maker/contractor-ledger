import { defineConfig } from '@playwright/test';
import { createServer } from 'node:net';

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
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    {
      name: 'desktop-1440',
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'tablet-1024',
      use: {
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'mobile-390',
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'mobile-320',
      use: {
        viewport: { width: 320, height: 568 },
      },
    },
  ],
});
