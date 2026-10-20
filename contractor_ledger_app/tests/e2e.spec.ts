import { test, expect } from '@playwright/test';

test.describe('Contractor Ledger End-to-End Suite', () => {
  test('Homepage presents a contractor-focused hero and live preview', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Contractor Ledger/);

    // Headline exists and visible
    const heading = page.locator('h1');
    await expect(heading).toContainText('Know the cost. Price the work.');

    // 6 calculators section exists
    const toolsHeading = page.locator('h2:has-text("Calculators for everyday estimating")');
    await expect(toolsHeading).toBeVisible();

    // Verify all 6 tools are rendered
    await expect(page.locator('main a[href="/calculators/job-pricing/"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/calculators/labor-cost/"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/calculators/profit-margin/"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/calculators/break-even/"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/calculators/material-markup/"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/calculators/project-estimate/"]').first()).toBeVisible();
  });

  test('Job Pricing Calculator interactive workflow and live calculation', async ({ page }) => {
    await page.goto('/calculators/job-pricing/');
    await expect(page.locator('h1')).toContainText('Job Pricing Calculator');

    // Default sample values: Labor 600, Materials 450, Other 150, Margin 25% -> $1,600.00
    await expect(page.locator('text=$1,600.00').first()).toBeVisible();
    await expect(page.locator('text=$400.00').first()).toBeVisible();

    // Change labor to 1000
    const laborInput = page.locator('#job-labor');
    await laborInput.fill('1000');

    // Total cost = 1000 + 450 + 150 = 1600. With 25% margin -> 1600 / 0.75 = $2,133.33
    await expect(page.locator('text=$2,133.33').first()).toBeVisible();
  });

  test('Labor Cost Calculator loaded hourly rate calculation', async ({ page }) => {
    await page.goto('/calculators/labor-cost/');
    await expect(page.locator('h1')).toContainText('Labor Cost & Burden Calculator');

    // Prompt test case: 1 worker, 10 hrs, $30 wage, 20% burden -> $360.00 total, $36.00/hr
    await expect(page.locator('text=$360.00').first()).toBeVisible();
    await expect(page.locator('text=$36.00').first()).toBeVisible();

    // Add 2 overtime hours
    const otInput = page.locator('#labor-ot-hours');
    await otInput.fill('2');

    // 10*30 = 300 reg + 2*30*1.5 = 90 OT = 390 gross. 390 * 1.2 = $468.00 total
    await expect(page.locator('text=$468.00').first()).toBeVisible();
  });

  test('Profit Margin Calculator Mode A and Mode B', async ({ page }) => {
    await page.goto('/calculators/profit-margin/');
    await expect(page.locator('h1')).toContainText('Profit Margin vs. Markup Calculator');

    // Mode A: Cost $100, Selling Price $125 -> Profit $25, Margin 20%, Markup 25%
    await expect(page.locator('text=$25.00').first()).toBeVisible();
    await expect(page.locator('text=20.0%').first()).toBeVisible();
    await expect(page.locator('text=25.0%').first()).toBeVisible();

    // Switch to Mode B
    await page.click('button:has-text("Mode B: Calculate Required Price")');
    // Default Mode B: Cost $1200, Margin 25% -> Required Price $1600.00
    await expect(page.locator('text=$1,600.00').first()).toBeVisible();
  });

  test('Break-Even Calculator rate computation', async ({ page }) => {
    await page.goto('/calculators/break-even/');
    await expect(page.locator('h1')).toContainText('Break-Even Rate Calculator');

    // Fixed $5000, 100 hrs, $20/hr variable -> $70.00/hr, $7,000.00/mo
    await expect(page.locator('text=$70.00').first()).toBeVisible();
    await expect(page.locator('text=$7,000.00').first()).toBeVisible();
  });

  test('Material Markup Calculator waste and markup calculation', async ({ page }) => {
    await page.goto('/calculators/material-markup/');
    await expect(page.locator('h1')).toContainText('Material Markup & Waste Calculator');

    // Qty 1, Cost $100, Waste 0%, Markup 25% -> $125.00
    await expect(page.locator('text=$125.00').first()).toBeVisible();
    await expect(page.locator('text=20.0%').first()).toBeVisible();
  });

  test('Project Estimate Calculator line items and totals', async ({ page }) => {
    await page.goto('/calculators/project-estimate/');
    await expect(page.locator('h1')).toContainText('Project Estimate & Itemized Bid Ledger');

    // Prompt test case baseline: Direct $6,841.00, OH $820.92, Margin 22% -> $9,822.97
    await expect(page.locator('text=$9,822.97').first()).toBeVisible();
    await expect(page.locator('text=$2,161.05').first()).toBeVisible();
  });

  test('Cost Settings Modal opens, saves, and closes cleanly', async ({ page }) => {
    await page.goto('/');

    // Click Cost Settings in header
    await page.click('#open-settings-header-btn');

    // Modal appears
    await expect(page.locator('#settings-modal-title')).toBeVisible();

    // Close modal
    await page.click('button[aria-label="Close settings"]');
    await expect(page.locator('#settings-modal-title')).not.toBeVisible();
  });

  test('Cost Settings dialog keeps keyboard focus inside, fits the viewport, and restores focus', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('#open-settings-header-btn');
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Contractor Cost Settings' });
    await expect(dialog).toBeVisible();
    const first = page.locator('#settings-close');
    const last = page.getByRole('button', { name: 'Save Defaults' });
    await expect(first).toBeFocused();

    const dialogBox = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(dialogBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(viewport!.height + 1);
    const saveBox = await last.boundingBox();
    expect(saveBox).not.toBeNull();
    expect(saveBox!.y).toBeGreaterThanOrEqual(dialogBox!.y);
    expect(saveBox!.y + saveBox!.height).toBeLessThanOrEqual(dialogBox!.y + dialogBox!.height + 1);

    await page.keyboard.press('Shift+Tab');
    await expect(last).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(first).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('Mobile navigation opens, closes with Escape, and returns focus to its trigger', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'Mobile navigation is replaced by the desktop navigation at 1024px.');
    await page.goto('/');

    const trigger = page.locator('#mobile-menu-toggle');
    const navigation = page.locator('#mobile-navigation');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(navigation).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(navigation).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('Saved shared defaults persist and can be explicitly applied, including zero values', async ({ page }) => {
    await page.goto('/calculators/labor-cost/');
    await expect(page.locator('#labor-wage')).toHaveValue('30');
    await expect(page.locator('#labor-burden')).toHaveValue('20');

    await page.locator('#open-settings-header-btn').click();
    await page.locator('#settings-labor-rate').fill('85');
    await page.locator('#settings-burden').fill('0');
    await page.locator('#settings-overhead').fill('0');
    await page.locator('#settings-margin').fill('0');
    await page.getByRole('button', { name: 'Save Defaults' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Saving defaults alone does not overwrite the current job's entered values.
    await expect(page.locator('#labor-wage')).toHaveValue('30');
    await expect(page.locator('#labor-burden')).toHaveValue('20');
    await page.reload();
    await expect(page.locator('#labor-wage')).toHaveValue('30');
    await page.getByRole('button', { name: 'Apply Shared Settings' }).click();
    await expect(page.locator('#labor-wage')).toHaveValue('85');
    await expect(page.locator('#labor-burden')).toHaveValue('0');

    await page.goto('/calculators/job-pricing/');
    const jobLabor = page.locator('#job-labor');
    const jobMargin = page.locator('#job-margin');
    const jobOverhead = page.locator('#job-overhead-pct');
    const applySharedSettings = page.getByRole('button', { name: 'Apply Shared Settings' });
    // Retry this idempotent action until the calculator's visible state confirms it is interactive.
    await expect.poll(async () => {
      await applySharedSettings.click();
      return jobMargin.inputValue();
    }).toBe('0');
    await page.getByRole('button', { name: 'Reset Example' }).click();
    await expect(jobMargin).toHaveValue('25');
    await jobLabor.fill('777');
    await expect(jobLabor).toHaveValue('777');
    await expect(page.getByText('$1,836.00', { exact: true }).first()).toBeVisible();
    await applySharedSettings.click();
    await expect(jobLabor).toHaveValue('777');
    await expect(jobMargin).toHaveValue('0');
    await expect(jobOverhead).toHaveValue('0');
  });

  test('Very large currency input is rejected visibly instead of producing a zero result', async ({ page }) => {
    await page.goto('/calculators/job-pricing/');
    await page.locator('#job-labor').fill('1e308');
    await expect(page.locator('#job-labor')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a finite value within the supported range.')).toBeVisible();
    await expect(page.getByText('$1,600.00', { exact: true }).first()).toBeVisible();
  });

  test('Scenario comparison accepts target margins above 65 percent up to 99 percent', async ({ page }) => {
    await page.goto('/calculators/job-pricing/');
    const lower = page.locator('#scenario-margin-lower');
    const margin = page.locator('#scenario-margin-target');
    const higher = page.locator('#scenario-margin-higher');
    await expect(margin).toHaveAttribute('max', '99');

    await lower.fill('10');
    await expect(lower).toHaveValue('10');
    await expect(margin).toHaveValue('25');
    await expect(higher).toHaveValue('35');

    await margin.fill('80');
    await expect(margin).toHaveValue('80');
    await expect(lower).toHaveValue('10');
    await expect(higher).toHaveValue('90');

    await higher.fill('95');
    await expect(higher).toHaveValue('95');
    await expect(margin).toHaveValue('80');
    await expect(page.getByText('80.0%', { exact: true }).first()).toBeVisible();
  });

  test('404 Page renders correctly for unknown route', async ({ page }) => {
    const response = await page.goto('/non-existent-page/');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText('Ledger Entry Not Found');
    await expect(page.locator('a:has-text("Return to Homepage")')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });

  test('Contact page uses a configured email link or accurately explains that no address is configured', async ({ page }) => {
    await page.goto('/contact/');
    await expect(page.locator('h1')).toContainText('Contact Contractor Ledger');
    if (process.env.PUBLIC_CONTACT_EMAIL?.trim()) {
      const email = process.env.PUBLIC_CONTACT_EMAIL.trim();
      await expect(page.getByRole('link', { name: `Email ${email}` })).toHaveAttribute('href', `mailto:${email}`);
    } else {
      await expect(page.getByText('A contact address has not been configured for this deployment.')).toBeVisible();
      await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    }
    await expect(page.locator('form')).toHaveCount(0);
  });

  test('Sitemap, robots, and indexable route metadata match the configured public origin', async ({ page, request }) => {
    const publicOrigin = process.env.PUBLIC_SITE_URL?.trim()
      ? new URL(process.env.PUBLIC_SITE_URL.trim()).origin
      : undefined;
    const routes = [
      '/', '/calculators/job-pricing/', '/calculators/labor-cost/',
      '/calculators/profit-margin/', '/calculators/break-even/',
      '/calculators/material-markup/', '/calculators/project-estimate/',
      '/methodology/', '/about/', '/contact/', '/privacy/', '/terms/',
    ];

    const sitemapResponse = await request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    const sitemap = await sitemapResponse.text();
    expect((sitemap.match(/<loc>/g) ?? []).length).toBe(publicOrigin ? routes.length : 0);
    expect(sitemap).not.toContain('/404');

    const robotsResponse = await request.get('/robots.txt');
    expect(robotsResponse.ok()).toBe(true);
    const robots = await robotsResponse.text();
    if (publicOrigin) expect(robots).toContain(`Sitemap: ${publicOrigin}/sitemap.xml`);
    else expect(robots).not.toContain('Sitemap:');

    const schemaRoutes = new Set(['/', ...routes.filter(route => route.startsWith('/calculators/'))]);
    for (const route of routes) {
      await page.goto(route);
      const canonical = page.locator('link[rel="canonical"]');
      if (publicOrigin) await expect(canonical).toHaveAttribute('href', `${publicOrigin}${route}`);
      else await expect(canonical).toHaveCount(0);

      const schema = page.locator('script[type="application/ld+json"]');
      if (schemaRoutes.has(route)) {
        await expect(schema).toHaveCount(1);
        const structuredData = JSON.parse((await schema.textContent()) ?? '{}');
        expect(structuredData['@type']).toBe('WebApplication');
        expect(structuredData.name).toBe('Contractor Ledger');
      } else await expect(schema).toHaveCount(0);
    }
  });

  test('All published pages fit the active viewport without horizontal overflow', async ({ page }) => {
    const routes = [
      '/', '/calculators/job-pricing/', '/calculators/labor-cost/',
      '/calculators/profit-margin/', '/calculators/break-even/',
      '/calculators/material-markup/', '/calculators/project-estimate/',
      '/methodology/', '/about/', '/contact/', '/privacy/', '/terms/', '/non-existent-page',
    ];
    for (const route of routes) {
      await page.goto(route === '/non-existent-page' ? '/non-existent-page/' : route, { waitUntil: 'domcontentloaded' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `${route} overflows at ${page.viewportSize()?.width}px`).toBe(false);
    }
  });

  test('Inactive advertising markers stay hidden and reserve no layout space', async ({ page }) => {
    for (const route of ['/', '/about/', '/methodology/', '/calculators/job-pricing/']) {
      await page.goto(route);
      await expect(page.locator('[data-ad-status="active"]')).toHaveCount(0);
      await expect(page.locator('ins.adsbygoogle, script[src*="adsbygoogle"]')).toHaveCount(0);
      const markers = page.locator('[data-ad-container]');
      for (let index = 0; index < await markers.count(); index += 1) {
        await expect(markers.nth(index)).toHaveAttribute('data-ad-status', 'pending-approval');
        expect(await markers.nth(index).evaluate(element => getComputedStyle(element).display)).toBe('none');
      }
    }
  });

  test('Supporting pages load with accurate content and headings', async ({ page }) => {
    await page.goto('/methodology/');
    await expect(page.locator('h1')).toContainText('Calculation Methods & Assumptions');

    await page.goto('/about/');
    await expect(page.locator('h1')).toContainText('About Contractor Ledger');

    await page.goto('/privacy/');
    await expect(page.locator('h1')).toContainText('Privacy Policy');

    await page.goto('/terms/');
    await expect(page.locator('h1')).toContainText('Terms of Service');
  });
});
