import { test, expect, type Page } from '@playwright/test';

async function waitForInteractiveIslands(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('astro-island[client="load"]'))
      .every(island => !island.hasAttribute('ssr'))
  );
}

async function gotoInteractiveRoute(
  page: Page,
  route: string,
  options?: Parameters<Page['goto']>[1],
): Promise<Awaited<ReturnType<Page['goto']>>> {
  const response = await page.goto(route, options);
  await waitForInteractiveIslands(page);
  return response;
}

async function reloadInteractivePage(page: Page): Promise<void> {
  await page.reload();
  await waitForInteractiveIslands(page);
}
test.describe('Contractor Ledger End-to-End Suite', () => {
  test('Calculator controls stay unavailable until their React island is hydrated', async ({ page }) => {
    let releaseModules: (() => void) | undefined;
    const moduleGate = new Promise<void>(resolve => {
      releaseModules = resolve;
    });
    await page.route('**/_astro/*.js', async route => {
      await moduleGate;
      await route.continue();
    });
    await page.goto('/calculators/job-pricing/', { waitUntil: 'commit' });
    const calculator = page.locator('#job-labor').locator('xpath=ancestor::astro-island[1]');
    await expect(calculator).toHaveAttribute('aria-busy', 'true');
    await expect(calculator).toHaveAttribute('inert', '');
    releaseModules?.();
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('astro-island[client="load"]'))
        .every(island => !island.hasAttribute('ssr'))
    );
    await expect(calculator).not.toHaveAttribute('inert');
    await expect(calculator).not.toHaveAttribute('aria-busy');
    await page.locator('#job-labor').fill('1000');
    await expect(page.getByText('$2,133.33', { exact: true }).first()).toBeVisible();
  });
  test('Homepage explains its contractor audience and makes calculator selection the primary action', async ({ page }) => {
    await gotoInteractiveRoute(page, '/');
    await expect(page).toHaveTitle(/Contractor Ledger/);

    const heroHeading = page.locator('h1');
    await expect(heroHeading).toContainText('Know your costs. Price the job.');
    await expect(heroHeading).toBeInViewport();
    await expect(page.getByText('Free estimating tools for U.S. contractors')).toBeVisible();
    const homePreviewLaborInput = page.locator('.home-hero #job-labor');
    if ((page.viewportSize()?.width ?? 0) < 1024) await expect(homePreviewLaborInput).toBeHidden();
    else await expect(homePreviewLaborInput).toBeVisible();
    const chooseCalculator = page.getByRole('link', { name: 'Choose a Calculator' });
    await expect(chooseCalculator).toHaveAttribute('href', '#core-calculators');
    await expect(chooseCalculator).toBeInViewport();
    await chooseCalculator.click();

    const toolsHeading = page.locator('h2:has-text("Calculators for everyday estimating")');
    await expect(toolsHeading).toBeVisible();
    await expect(page.locator('#core-calculators')).toBeInViewport();

    const calculators = [
      ['/calculators/job-pricing/', 'Job Pricing'],
      ['/calculators/labor-cost/', 'Labor Cost'],
      ['/calculators/profit-margin/', 'Profit Margin'],
      ['/calculators/break-even/', 'Break-Even'],
      ['/calculators/material-markup/', 'Material Markup'],
      ['/calculators/project-estimate/', 'Project Estimate'],
    ] as const;
    for (const [href, title] of calculators) {
      const card = page.locator(`#core-calculators a[href="${href}"]`);
      await expect(card.locator('h3')).toHaveText(title);
      await expect(card.locator('p')).not.toBeEmpty();
      await expect(card.getByText('Open Calculator')).toBeVisible();
    }
    await page.locator('#core-calculators a[href="/calculators/job-pricing/"]').click();
    await expect(page).toHaveURL('/calculators/job-pricing/');
    await expect(page.locator('h1')).toHaveText('Job Pricing Calculator');
    await expect(page.locator('.result-panel').getByText('$1,600.00').first()).toBeVisible();
  });

  test('Job Pricing Calculator interactive workflow and live calculation', async ({ page }) => {
    await gotoInteractiveRoute(page, '/calculators/job-pricing/');
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
    await gotoInteractiveRoute(page, '/calculators/labor-cost/');
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
    await gotoInteractiveRoute(page, '/calculators/profit-margin/');
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

  test('Profit Margin conversion matrix renders correct engine-derived values for every row', async ({ page }) => {
    await gotoInteractiveRoute(page, '/calculators/profit-margin/');

    const matrix = page.getByRole('region', { name: 'Margin to markup conversion matrix' });
    const matrixBounds = await matrix.evaluate(region => ({ client: region.clientWidth, scroll: region.scrollWidth }));
    expect(matrixBounds.scroll).toBeLessThanOrEqual(matrixBounds.client + 1);
    const rows = matrix.locator('tbody tr');
    await expect(rows).toHaveCount(6);
    const actualRows = await Promise.all((await rows.all()).map(async row =>
      (await row.locator('td').allTextContents()).map(text => text.trim()).join(' ')
    ));
    expect(actualRows).toEqual([
      '10.00% 11.11% $1,111.11 $111.11',
      '15.00% 17.65% $1,176.47 $176.47',
      '20.00% 25.00% $1,250.00 $250.00',
      '25.00% 33.33% $1,333.33 $333.33',
      '30.00% 42.86% $1,428.57 $428.57',
      '40.00% 66.67% $1,666.67 $666.67',
    ]);
  });

  test('Financial formula copy uses division and makes percentage conversion explicit', async ({ page }) => {
    const checks = [
      {
        route: '/calculators/profit-margin/',
        expected: [
          'Profit Margin: (Profit ÷ Selling Price) × 100',
          'Markup: (Profit ÷ Total Cost) × 100',
          'Required Price: Cost ÷ (1 − Target Margin % ÷ 100)',
        ],
      },
      {
        route: '/calculators/job-pricing/',
        expected: [
          'Overhead % ÷ 100',
          'Total Estimated Cost ÷ (1 − Target Margin % ÷ 100)',
          'Actual Margin = ($400 ÷ $1,600) × 100 = 25.0%',
          'Markup on Cost = ($400 ÷ $1,200) × 100 = 33.3%',
        ],
      },
      {
        route: '/calculators/material-markup/',
        expected: [
          'Waste Allowance % ÷ 100',
          'Markup % ÷ 100',
          'Resulting Profit Margin (%) = (Markup Amount ÷ Selling Price) × 100',
          'Resulting Profit Margin = ($25.00 ÷ $125.00) × 100 = 20.0%',
        ],
      },
      {
        route: '/calculators/project-estimate/',
        expected: [
          'OH % ÷ 100',
          'Target Margin % ÷ 100',
          '($2,161.05 ÷ $7,661.92) × 100 = 28.2% on total cost',
        ],
      },
      {
        route: '/methodology/',
        expected: [
          'Target Margin % ÷ 100',
          'Actual Gross Margin (%) = (Gross Profit ÷ Selling Price) × 100',
          'Waste Allowance % ÷ 100',
          'Markup % ÷ 100',
        ],
      },
    ];

    for (const check of checks) {
      await gotoInteractiveRoute(page, check.route);
      const mainText = await page.locator('main').innerText();
      for (const formula of check.expected) expect(mainText).toContain(formula);
      expect(mainText).not.toContain('Profit + Selling Price');
      expect(mainText).not.toContain('Profit + Total Cost');
      if (check.route === '/calculators/profit-margin/') {
        await expect(page.getByRole('heading', { name: 'How Margin and Markup Work' })).toHaveCount(1);
        await expect(page.getByText('The Margin vs. Markup Mathematical Law')).toHaveCount(0);
      }
    }
  });

  test('Break-Even Calculator rate computation', async ({ page }) => {
    await gotoInteractiveRoute(page, '/calculators/break-even/');
    await expect(page.locator('h1')).toContainText('Break-Even Rate Calculator');

    // Fixed $5000, 100 hrs, $20/hr variable -> $70.00/hr, $7,000.00/mo
    await expect(page.locator('text=$70.00').first()).toBeVisible();
    await expect(page.locator('text=$7,000.00').first()).toBeVisible();
  });

  test('Material Markup Calculator waste and markup calculation', async ({ page }) => {
    await gotoInteractiveRoute(page, '/calculators/material-markup/');
    await expect(page.locator('h1')).toContainText('Material Markup & Waste Calculator');

    // Qty 1, Cost $100, Waste 0%, Markup 25% -> $125.00
    await expect(page.locator('text=$125.00').first()).toBeVisible();
    await expect(page.locator('text=20.0%').first()).toBeVisible();
  });

  test('Project Estimate Calculator line items and totals', async ({ page }) => {
    await gotoInteractiveRoute(page, '/calculators/project-estimate/');
    await expect(page.locator('h1')).toContainText('Project Estimate & Itemized Bid Ledger');

    // Prompt test case baseline: Direct $6,841.00, OH $820.92, Margin 22% -> $9,822.97
    await expect(page.locator('text=$9,822.97').first()).toBeVisible();
    await expect(page.locator('text=$2,161.05').first()).toBeVisible();
  });

  test('Project Estimate rejects numeric values outside field limits without desynchronizing totals', async ({ page }) => {
    await gotoInteractiveRoute(page, '/calculators/project-estimate/');

    const quantity = page.getByRole('spinbutton', { name: 'Framing & structural rough-in carpentry quantity' });
    const unitCost = page.getByRole('spinbutton', { name: 'Framing & structural rough-in carpentry unit cost' });
    const overhead = page.locator('#estimate-overhead');
    const margin = page.locator('#estimate-margin');

    await quantity.fill('-1');
    await expect(quantity).toHaveValue('44');
    await unitCost.fill('-1');
    await expect(unitCost).toHaveValue('70');
    await overhead.fill('101');
    await expect(overhead).toHaveValue('12');
    await margin.fill('100');
    await expect(margin).toHaveValue('22');

    await expect(page.locator('.result-panel').getByText('$9,822.97').first()).toBeVisible();
  });

  test('Cost Settings Modal opens, saves, and closes cleanly', async ({ page }) => {
    await gotoInteractiveRoute(page, '/');

    // Click Cost Settings in header
    await page.click('#open-settings-header-btn');

    // Modal appears
    await expect(page.locator('#settings-modal-title')).toBeVisible();

    // Close modal
    await page.click('button[aria-label="Close settings"]');
    await expect(page.locator('#settings-modal-title')).not.toBeVisible();
  });

  test('Cost Settings dialog keeps keyboard focus inside, fits the viewport, and restores focus', async ({ page }) => {
    await gotoInteractiveRoute(page, '/');
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
    await gotoInteractiveRoute(page, '/calculators/project-estimate/');

    const trigger = page.locator('#mobile-menu-toggle');
    const navigation = page.locator('#mobile-navigation');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(navigation.locator('a[href^="/calculators/"]')).toHaveCount(6);
    await expect(navigation.getByRole('link', { name: 'Project Estimate' })).toHaveAttribute('aria-current', 'page');
    const lastLink = navigation.getByRole('link', { name: 'Contact' });
    if ((page.viewportSize()?.height ?? 0) < 600) {
      const navigationBounds = await navigation.evaluate(element => ({
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
      }));
      expect(navigationBounds.scrollHeight).toBeGreaterThan(navigationBounds.clientHeight);
      await lastLink.scrollIntoViewIfNeeded();
      await expect(lastLink).toBeInViewport();
      await navigation.evaluate(element => { element.scrollTop = 0; });
    }
    await page.keyboard.press('Tab');
    await expect(navigation.getByRole('link', { name: 'Home' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/');
    await expect(navigation).toBeHidden();

    await gotoInteractiveRoute(page, '/calculators/project-estimate/');
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(navigation).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    await trigger.click();
    await navigation.getByRole('link', { name: 'Material Markup' }).click();
    await expect(page).toHaveURL('/calculators/material-markup/');
    await expect(navigation).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('Saved shared defaults persist and can be explicitly applied, including zero values', async ({ page }) => {
    await gotoInteractiveRoute(page, '/calculators/labor-cost/');
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
    await reloadInteractivePage(page);
    await expect(page.locator('#labor-wage')).toHaveValue('30');
    const applyLaborDefaults = page.getByRole('button', { name: 'Apply Shared Settings' });
    await expect.poll(async () => {
      await applyLaborDefaults.click();
      return page.locator('#labor-wage').inputValue();
    }).toBe('85');
    await expect(page.locator('#labor-burden')).toHaveValue('0');

    await gotoInteractiveRoute(page, '/calculators/job-pricing/');
    const jobLabor = page.locator('#job-labor');
    const jobMargin = page.locator('#job-margin');
    const jobOverhead = page.locator('#job-overhead-pct');
    const applyJobDefaults = page.getByRole('button', { name: 'Apply Shared Settings' });
    // Retry this idempotent action until the calculator's visible state confirms it is interactive.
    await expect.poll(async () => {
      await applyJobDefaults.click();
      return jobMargin.inputValue();
    }).toBe('0');
    await page.getByRole('button', { name: 'Reset Example' }).click();
    await expect(jobMargin).toHaveValue('25');
    await jobLabor.fill('777');
    await expect(jobLabor).toHaveValue('777');
    await expect(page.getByText('$1,836.00', { exact: true }).first()).toBeVisible();
    await applyJobDefaults.click();
    await expect(jobLabor).toHaveValue('777');
    await expect(jobMargin).toHaveValue('0');
    await expect(jobOverhead).toHaveValue('0');
  });

  test('Very large currency input is rejected visibly instead of producing a zero result', async ({ page }) => {
    await gotoInteractiveRoute(page, '/calculators/job-pricing/');
    await page.locator('#job-labor').fill('1e308');
    await expect(page.locator('#job-labor')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a finite value within the supported range.')).toBeVisible();
    await expect(page.getByText('$1,600.00', { exact: true }).first()).toBeVisible();
  });

  test('Large valid job prices stay inside the result panel at every viewport size', async ({ page }) => {
    await gotoInteractiveRoute(page, '/calculators/job-pricing/');
    await page.locator('#job-labor').fill('60098766574743');

    const resultPanel = page.locator('.result-panel').first();
    const sellingPrice = resultPanel.locator('[aria-live="polite"]');
    await expect(sellingPrice).toHaveText('$80,131,688,767,124.00');

    const geometry = await sellingPrice.evaluate(element => {
      const panel = element.closest('.result-panel');
      if (!panel) throw new Error('Result panel not found');
      const textRange = document.createRange();
      textRange.selectNodeContents(element);
      const textRight = Math.max(...Array.from(textRange.getClientRects(), rect => rect.right));
      const panelRect = panel.getBoundingClientRect();
      const style = getComputedStyle(panel);
      const innerRight = panelRect.right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth);
      return { textRight, innerRight };
    });
    expect(geometry.textRight).toBeLessThanOrEqual(geometry.innerRight + 1);

    const panelOverflow = await resultPanel.evaluate(panel => [...panel.querySelectorAll('*')]
      .filter(element => element.scrollWidth > element.clientWidth + 1)
      .map(element => element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) ?? ''));
    expect(panelOverflow).toEqual([]);

    const comparisonOverflow = await page.locator('.scenario-comparison-card').evaluate(card => [...card.querySelectorAll('*')]
      .filter(element => element.scrollWidth > element.clientWidth + 1)
      .map(element => element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) ?? ''));
    expect(comparisonOverflow).toEqual([]);
  });

  test('Scenario comparison accepts target margins above 65 percent up to 99 percent', async ({ page }) => {
    await gotoInteractiveRoute(page, '/calculators/job-pricing/');
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
    const response = await gotoInteractiveRoute(page, '/non-existent-page/');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText('Ledger Entry Not Found');
    await expect(page.locator('a:has-text("Return to Homepage")')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });

  test('Contact page uses a configured email link or accurately explains that no address is configured', async ({ page }) => {
    await gotoInteractiveRoute(page, '/contact/');
    await expect(page.locator('h1')).toContainText('Contact Contractor Ledger');
    if (process.env.PUBLIC_CONTACT_EMAIL?.trim()) {
      const email = process.env.PUBLIC_CONTACT_EMAIL.trim();
      await expect(page.getByRole('link', { name: `Email ${email}` })).toHaveAttribute('href', `mailto:${email}`);
    } else {
      await expect(page.getByText('No contact email is set for this site.')).toBeVisible();
      await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    }
    await expect(page.locator('form')).toHaveCount(0);
  });

  test('Sitemap, robots, and indexable route metadata match the configured public origin', async ({ page, request }) => {
    const publicOrigin = new URL(process.env.PUBLIC_SITE_URL!).origin;
    const routes = [
      '/', '/calculators/job-pricing/', '/calculators/labor-cost/',
      '/calculators/profit-margin/', '/calculators/break-even/',
      '/calculators/material-markup/', '/calculators/project-estimate/',
      '/methodology/', '/about/', '/contact/', '/privacy/', '/terms/',
    ];

    const sitemapResponse = await request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    const sitemap = await sitemapResponse.text();
    expect((sitemap.match(/<loc>/g) ?? []).length).toBe(routes.length);
    expect(sitemap).not.toContain('/404');

    const robotsResponse = await request.get('/robots.txt');
    expect(robotsResponse.ok()).toBe(true);
    const robots = await robotsResponse.text();
    expect(robots).toContain(`Sitemap: ${publicOrigin}/sitemap.xml`);

    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const route of routes) {
      await gotoInteractiveRoute(page, route);
      await expect(page.locator('h1')).toHaveCount(1);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(10);
      expect(titles.has(title), `duplicate title on ${route}: ${title}`).toBe(false);
      titles.add(title);
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.trim().length ?? 0).toBeGreaterThan(50);
      expect(description?.length ?? 0).toBeLessThan(200);
      expect(descriptions.has(description!), `duplicate description on ${route}`).toBe(false);
      descriptions.add(description!);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${publicOrigin}${route}`);

      const schema = page.locator('script[type="application/ld+json"]');
      if (route === '/') {
        await expect(schema).toHaveCount(1);
        const structuredData = JSON.parse((await schema.textContent()) ?? '{}');
        const graph = structuredData['@graph'] as Array<Record<string, unknown>>;
        expect(graph.map(node => node['@type'])).toEqual(['Organization', 'WebSite']);
        expect(graph[0]).toMatchObject({
          name: 'Contractor Ledger',
          url: `${publicOrigin}/`,
          logo: `${publicOrigin}/contractor-ledger-growth-logo.png`,
        });
        expect(graph[1]).toMatchObject({
          name: 'Contractor Ledger',
          url: `${publicOrigin}/`,
          publisher: { '@id': `${publicOrigin}/#organization` },
        });
        const logoResponse = await request.get('/contractor-ledger-growth-logo.png');
        expect(logoResponse.ok(), 'Organization logo should be publicly fetchable').toBe(true);
        expect(logoResponse.headers()['content-type']).toContain('image/png');
      } else if (route.startsWith('/calculators/')) {
        await expect(schema).toHaveCount(1);
        const structuredData = JSON.parse((await schema.textContent()) ?? '{}');
        const labelByRoute: Record<string, string> = {
          '/calculators/job-pricing/': 'Job Pricing',
          '/calculators/labor-cost/': 'Labor Cost',
          '/calculators/profit-margin/': 'Profit Margin',
          '/calculators/break-even/': 'Break-Even',
          '/calculators/material-markup/': 'Material Markup',
          '/calculators/project-estimate/': 'Project Estimate',
        };
        const label = labelByRoute[route];
        expect(structuredData).toMatchObject({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
        });
        expect(structuredData.itemListElement).toEqual([
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${publicOrigin}/` },
          { '@type': 'ListItem', position: 2, name: 'Calculators', item: `${publicOrigin}/#core-calculators` },
          { '@type': 'ListItem', position: 3, name: label, item: `${publicOrigin}${route}` },
        ]);
      } else await expect(schema).toHaveCount(0);

      const faviconLinks = page.locator('link[rel="icon"][type="image/png"]');
      await expect(faviconLinks).toHaveCount(3);
      for (const href of await faviconLinks.evaluateAll(elements => elements.map(element => (element as HTMLLinkElement).href))) {
        const faviconResponse = await request.get(href);
        expect(faviconResponse.ok(), `favicon should load: ${href}`).toBe(true);
        expect(faviconResponse.headers()['content-type']).toContain('image/png');
      }
    }
  });

  test('Calculator pages link to relevant sibling tools with crawlable HTML anchors', async ({ request }) => {
    const relatedLinks: Record<string, string[]> = {
      '/calculators/job-pricing/': ['/calculators/labor-cost/', '/calculators/profit-margin/'],
      '/calculators/labor-cost/': ['/calculators/job-pricing/', '/calculators/project-estimate/'],
      '/calculators/profit-margin/': ['/calculators/job-pricing/', '/calculators/material-markup/'],
      '/calculators/break-even/': ['/calculators/job-pricing/'],
      '/calculators/material-markup/': ['/calculators/project-estimate/'],
      '/calculators/project-estimate/': ['/calculators/job-pricing/', '/calculators/labor-cost/', '/calculators/material-markup/'],
    };

    for (const [route, destinations] of Object.entries(relatedLinks)) {
      const response = await request.get(route);
      expect(response.status(), `${route} should be directly accessible`).toBe(200);
      const html = await response.text();
      for (const destination of destinations) {
        expect(html, `${route} should expose a crawlable link to ${destination}`).toContain(`href="${destination}"`);
      }
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
      await gotoInteractiveRoute(page, route === '/non-existent-page' ? '/non-existent-page/' : route, { waitUntil: 'domcontentloaded' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `${route} overflows at ${page.viewportSize()?.width}px`).toBe(false);
    }
  });

  test('Inactive advertising markers stay hidden and reserve no layout space', async ({ page }) => {
    for (const route of ['/', '/about/', '/methodology/', '/calculators/job-pricing/']) {
      await gotoInteractiveRoute(page, route);
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
    await gotoInteractiveRoute(page, '/methodology/');
    await expect(page.locator('h1')).toContainText('Calculation Methods & Assumptions');

    await gotoInteractiveRoute(page, '/about/');
    await expect(page.locator('h1')).toContainText('About Contractor Ledger');

    await gotoInteractiveRoute(page, '/privacy/');
    await expect(page.locator('h1')).toContainText('Privacy Policy');

    await gotoInteractiveRoute(page, '/terms/');
    await expect(page.locator('h1')).toContainText('Terms of Service');
  });
});
