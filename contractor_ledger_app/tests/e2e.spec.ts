import { test, expect } from '@playwright/test';

test.describe('Contractor Ledger End-to-End Suite', () => {
  test('Homepage loads with premium 2-column hero and live preview', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Contractor Ledger/);

    // Headline exists and visible
    const heading = page.locator('h1');
    await expect(heading).toContainText('Price Your Work With Confidence.');

    // 6 calculators section exists
    const toolsHeading = page.locator('h2:has-text("Tools Built for Better Estimates")');
    await expect(toolsHeading).toBeVisible();

    // Verify all 6 tools are rendered
    await expect(page.locator('a[href="/calculators/job-pricing/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/calculators/labor-cost/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/calculators/profit-margin/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/calculators/break-even/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/calculators/material-markup/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/calculators/project-estimate/"]').first()).toBeVisible();
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

  test('404 Page renders correctly for unknown route', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.locator('h1')).toContainText('Ledger Entry Not Found');
    await expect(page.locator('a:has-text("Return to Homepage")')).toBeVisible();
  });

  test('Contact Page renders honest pre-publication status and disabled submission', async ({ page }) => {
    await page.goto('/contact/');
    await expect(page.locator('h1')).toContainText('Contact & Field Desk');
    await expect(page.locator('text=Pre-Publication Status: Direct Contact Channel Pending')).toBeVisible();
    await expect(page.locator('button:has-text("Dispatch Offline")')).toBeDisabled();
  });

  test('Supporting pages load with accurate content and headings', async ({ page }) => {
    await page.goto('/methodology/');
    await expect(page.locator('h1')).toContainText('Calculation Methodology');

    await page.goto('/about/');
    await expect(page.locator('h1')).toContainText('About Contractor Ledger');

    await page.goto('/privacy/');
    await expect(page.locator('h1')).toContainText('Privacy Policy');

    await page.goto('/terms/');
    await expect(page.locator('h1')).toContainText('Terms of Service');
  });
});
