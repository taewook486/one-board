import { test, expect, Page } from '@playwright/test';

/**
 * Screenshot capture script for One Board
 * Captures screenshots of all major pages
 */

const PAGES = [
  { name: 'Home', url: '/', description: 'Main homepage' },
  { name: 'Login', url: '/login', description: 'Login page' },
  { name: 'Register', url: '/register', description: 'Registration page' },
  { name: 'Boards List', url: '/', description: 'Boards (scroll to boards section)' },
  { name: 'Free Board', url: '/board/free', description: 'Free board posts list' },
  { name: 'Admin Dashboard', url: '/admin/dashboard', description: 'Admin dashboard', requiresAuth: true },
  { name: 'Admin Members', url: '/admin/members', description: 'Admin member management', requiresAuth: true },
  { name: 'Admin Boards', url: '/admin/boards', description: 'Admin board management', requiresAuth: true },
  { name: 'Admin Skins', url: '/admin/skins', description: 'Admin skin management', requiresAuth: true },
];

const CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

test.describe('Screenshot Capture', () => {
  let page: Page;
  let loggedIn = false;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Login first for admin pages', async () => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');

    // Fill and submit login form
    await page.fill('input[name="username"], input[placeholder*="아이디"]', CREDENTIALS.username);
    await page.fill('input[name="password"], input[placeholder*="비밀번호"]', CREDENTIALS.password);
    await page.click('button[type="submit"], button:has-text("로그인")');

    // Wait for navigation
    await page.waitForURL(/\/$/, { timeout: 10000 });
    loggedIn = true;

    // Take screenshot of logged in state
    await page.screenshot({ path: 'screenshots/01-logged-in.png', fullPage: true });
  });

  for (const pageInfo of PAGES) {
    test(`Screenshot: ${pageInfo.name}`, async () => {
      // Navigate to page
      await page.goto(`http://localhost:3000${pageInfo.url}`);

      // Wait for body to be visible (Next.js FOUC prevention)
      await page.waitForSelector('body', { state: 'visible', timeout: 15000 });

      // Wait for page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Wait a bit for any animations
      await page.waitForTimeout(1000);

      // Take full page screenshot
      await page.screenshot({
        path: `screenshots/02-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true,
      });
    });
  }

  test('Capture responsive screenshots', async () => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:3000/');

      // Wait for body to be visible
      await page.waitForSelector('body', { state: 'visible', timeout: 15000 });

      await page.waitForLoadState('networkidle', { timeout: 10000 });

      await page.screenshot({
        path: `screenshots/responsive-${viewport.name}.png`,
        fullPage: true,
      });
    }
  });

  test('Capture interactive elements', async () => {
    // Hover effects on navigation
    const navLinks = page.locator('nav a, header a, [class*="nav"] a').all();
    for (const link of navLinks.slice(0, 3)) {
      if (await link.isVisible()) {
        await link.hover();
        await page.waitForTimeout(500);
      }
    }

    // Screenshot after hover effects
    await page.screenshot({
      path: 'screenshots/03-navigation-hover.png',
      fullPage: false,
    });
  });

  test('Check for console errors', async () => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`[${msg.text()}]`);
      }
    });

    // Navigate through all main pages
    await page.goto('http://localhost:3000/');
    await page.goto('http://localhost:3000/board/free');
    await page.goto('http://localhost:3000/admin/dashboard');

    // Report errors
    if (errors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✅ No console errors found!');
    }

    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError')).length).toBe(0);
  });
});
