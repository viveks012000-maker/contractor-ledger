import { expect, test } from '@playwright/test';

const publicOrigin = new URL(process.env.PUBLIC_SITE_URL || 'https://contractor-ledger-1nx.pages.dev').origin;

const calculatorRoutes = [
  ['/calculators/job-pricing/', 'Job Pricing Calculator'],
  ['/calculators/labor-cost/', 'Labor Cost & Burden Calculator'],
  ['/calculators/profit-margin/', 'Profit Margin vs. Markup Calculator'],
  ['/calculators/break-even/', 'Break-Even Rate Calculator'],
  ['/calculators/material-markup/', 'Material Markup & Waste Calculator'],
  ['/calculators/project-estimate/', 'Project Estimate & Itemized Bid Ledger'],
] as const;

async function waitForInteractiveIsland(page: import('@playwright/test').Page, selector: string) {
  const island = page.locator(selector).locator('xpath=ancestor::astro-island[1]');
  if (await island.count()) await expect(island).not.toHaveAttribute('inert', '');
}

test.describe('iOS-style WebKit coverage', () => {
  test('all six calculator landing pages render and fit in portrait and landscape', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    for (const [route, heading] of calculatorRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toContainText(heading);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${publicOrigin}${route}`);
      if (route === '/calculators/profit-margin/') {
        await expect(page.locator('main')).toContainText('Margin to Markup Conversion Matrix');
      } else {
        await expect(page.locator('main')).toContainText('Worked Example');
      }

      const portrait = page.viewportSize();
      expect(portrait).not.toBeNull();
      const portraitOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(portraitOverflow, `${route} overflows in portrait`).toBe(false);

      await page.setViewportSize({ width: portrait!.height, height: portrait!.width });
      const landscapeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(landscapeOverflow, `${route} overflows in landscape`).toBe(false);
      await page.setViewportSize(portrait!);
    }

    expect(pageErrors).toEqual([]);
  });

  test('decimal numeric inputs accept touch editing and update each calculator result', async ({ page }) => {
    await page.goto('/calculators/job-pricing/');
    const jobLabor = page.locator('#job-labor');
    await waitForInteractiveIsland(page, '#job-labor');
    await expect(jobLabor).toHaveAttribute('inputmode', 'decimal');
    await jobLabor.tap();
    await jobLabor.fill('1000.25');
    await expect(page.locator('.result-panel').getByText('$2,133.67').first()).toBeVisible();

    await page.goto('/calculators/labor-cost/');
    const overtime = page.locator('#labor-ot-hours');
    await waitForInteractiveIsland(page, '#labor-ot-hours');
    await expect(overtime).toHaveAttribute('inputmode', 'decimal');
    await overtime.tap();
    await overtime.fill('2');
    await expect(page.locator('.result-panel').getByText('$468.00').first()).toBeVisible();

    await page.goto('/calculators/profit-margin/');
    await waitForInteractiveIsland(page, '#mode-b-margin');
    await page.getByRole('button', { name: 'Mode B: Calculate Required Price' }).tap();
    const margin = page.locator('#mode-b-margin');
    await expect(margin).toHaveAttribute('inputmode', 'decimal');
    await margin.tap();
    await margin.fill('30');
    await expect(page.locator('.result-panel').getByText('$1,714.29').first()).toBeVisible();

    await page.goto('/calculators/break-even/');
    const billableHours = page.locator('#break-even-hours');
    await waitForInteractiveIsland(page, '#break-even-hours');
    await expect(billableHours).toHaveAttribute('inputmode', 'numeric');
    await billableHours.tap();
    await billableHours.fill('50');
    await expect(page.locator('.result-panel').getByText('$120.00').first()).toBeVisible();
    await expect(page.locator('.result-panel').getByText('$6,000.00').first()).toBeVisible();

    await page.goto('/calculators/material-markup/');
    const waste = page.locator('#mat-waste');
    await waitForInteractiveIsland(page, '#mat-waste');
    await expect(waste).toHaveAttribute('inputmode', 'decimal');
    await waste.tap();
    await waste.fill('10');
    await expect(page.locator('.result-panel').getByText('$137.50').first()).toBeVisible();

    await page.goto('/calculators/project-estimate/');
    const quantity = page.getByRole('spinbutton', { name: 'Framing & structural rough-in carpentry quantity' });
    await waitForInteractiveIsland(page, 'input[aria-label="Framing & structural rough-in carpentry quantity"]');
    await expect(quantity).toHaveAttribute('inputmode', 'decimal');
    await quantity.tap();
    await quantity.fill('45');
    await expect(page.locator('.result-panel').getByText('$9,923.49').first()).toBeVisible();
  });

  test('mobile navigation and shared settings remain touch-accessible', async ({ page }) => {
    await page.goto('/calculators/job-pricing/');
    const menuButton = page.locator('#mobile-menu-toggle');
    const mobileNavigation = page.locator('#mobile-navigation');
    await menuButton.tap();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(mobileNavigation).toBeVisible();
    await mobileNavigation.getByRole('link', { name: 'Material Markup' }).tap();
    await expect(page).toHaveURL('/calculators/material-markup/');
    await expect(mobileNavigation).toBeHidden();

    await page.locator('#open-settings-header-btn').tap();
    await expect(page.getByRole('dialog', { name: 'Contractor Cost Settings' })).toBeVisible();
    await page.locator('#settings-close').tap();
    await expect(page.getByRole('dialog', { name: 'Contractor Cost Settings' })).toBeHidden();

    const storageWorks = await page.evaluate(() => {
      const key = '__webkit_storage_check__';
      try {
        localStorage.setItem(key, 'ok');
        const value = localStorage.getItem(key);
        localStorage.removeItem(key);
        return value === 'ok';
      } catch {
        return false;
      }
    });
    expect(storageWorks).toBe(true);
  });
});
