import { test, expect } from '@playwright/test';

// Configure base URL
test.use({
  baseURL: 'http://localhost:3000',
  timeout: 30000
});

test.describe('One Board E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to home page before each test
    await page.goto('/');
  });

  test('Main page loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/One Board/);

    // Check main elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('text=게시판').first()).toBeVisible();

    // Check statistics cards
    await expect(page.locator('.bg-white.shadow').first()).toBeVisible();
  });

  test('Login functionality works', async ({ page }) => {
    // Navigate to login page
    await page.click('text=로그인');
    await expect(page).toHaveURL(/login/);

    // Fill login form
    await page.fill('input[name="username"], input[placeholder*="아이디"], input[placeholder*="username"], input[id="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[placeholder*="비밀번호"], input[placeholder*="password"], input[id="password"], input[type="password"]', 'admin123');

    // Submit form
    await page.click('button[type="submit"], button:has-text("로그인"), button:has-text("로그인하기")');

    // Wait for navigation after login
    await page.waitForURL(/\/$/, { timeout: 5000 });

    // Verify successful login - check for logout button or user menu
    await expect(page.locator('text=로그아웃').or('text=로그아웃트').or('[href*="logout"]').or('[class*="logout"]').or('button:has-text("로그아웃")').first()).toBeVisible({ timeout: 5000 });
  });

  test('View boards list', async ({ page }) => {
    // Go to main page if not already there
    if (page.url() !== 'http://localhost:3000/') {
      await page.goto('/');
    }

    // Check for boards section
    const boardsSection = page.locator('text=게시판').or('section:has(h2:has-text("게시판"))').or('.board').or('[class*="board"]').first();
    await expect(boardsSection).toBeVisible();

    // Check for specific boards (notice, free)
    const noticeBoard = page.locator('text=공지사항').or('a:has-text("notice")').or('[href*="notice"]').first();
    const freeBoard = page.locator('text=자유게시판').or('a:has-text("free")').or('[href*="free"]').first();

    await expect(noticeBoard.or(freeBoard)).toBeVisible();
  });

  test('View posts in board', async ({ page }) => {
    // Navigate to free board
    await page.goto('/board/free');

    // Check if board page loaded
    await expect(page).toHaveURL(/\/board\/free/);

    // Check for posts list or posts section
    const postsSection = page.locator('text=게시글').or('h1:has-text("게시글"), h2:has-text("게시글"), [class*="post"]').first();
    await expect(postsSection).toBeVisible({ timeout: 5000 });
  });

  test('View post detail', async ({ page }) => {
    // Go to free board first
    await page.goto('/board/free');

    // Click on first post if exists
    const firstPost = page.locator('a[href*="/board/free/"]').first();
    if (await firstPost.isVisible()) {
      await firstPost.click();

      // Check if post detail page loaded
      await expect(page).toHaveURL(/\/board\/free\/\d+/);

      // Check for post content
      await expect(page.locator('h1:has-text("제목"), .post-title, [class*="post"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Navigate to admin dashboard', async ({ page }) => {
    // Try to navigate to admin dashboard
    await page.goto('/admin/dashboard');

    // Check if we're either on admin dashboard or redirected to login
    const currentUrl = page.url();

    if (currentUrl.includes('/login')) {
      // Need to login first
      await page.goto('/login');
      await page.fill('input[name="username"], input[placeholder*="아이디"]', 'admin');
      await page.fill('input[name="password"], input[placeholder*="비밀번호"]', 'admin123');
      await page.click('button[type="submit"]');

      await page.waitForURL(/admin\/dashboard/, { timeout: 5000 });
    }

    // Check admin dashboard elements
    await expect(page.locator('h1, h2').or(page.locator('text=대시보드')).or(page.locator('text=Dashboard')).first()).toBeVisible();

    // Check for statistics cards
    const statsCards = page.locator('.bg-white.shadow, .stat, .card').first();
    await expect(statsCards).toBeVisible();
  });

  test('Admin member management', async ({ page }) => {
    // Go to admin members page
    await page.goto('/admin/members');

    // If redirected to login, login first
    if (page.url().includes('/login')) {
      await page.locator('input[name="username"]').first().fill('admin');
      await page.locator('input[name="password"]').first().fill('admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/admin\/members/, { timeout: 5000 });
    }

    // Check members page elements
    await expect(page.locator('text=회원 관리, text=Members, h1, h2').first()).toBeVisible();

    // Check for member table or list
    const memberTable = page.locator('table, [class*="member"], .member-list').first();
    await expect(memberTable).toBeVisible({ timeout: 5000 });
  });

  test('Admin board management', async ({ page }) => {
    await page.goto('/admin/boards');

    // Login if needed
    if (page.url().includes('/login')) {
      await page.locator('input[name="username"]').first().fill('admin');
      await page.locator('input[name="password"]').first().fill('admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/admin\/boards/, { timeout: 5000 });
    }

    // Check boards management elements
    await expect(page.locator('text=게시판 관리, text=Boards, h1, h2').first()).toBeVisible();
  });

  test('Navigation menu works', async ({ page }) => {
    // Check for navigation/header
    const nav = page.locator('nav, header, [class*="header"], [id="header"]').first();
    await expect(nav).toBeVisible();

    // Check for common navigation links
    const homeLink = page.locator('a[href="/"], text=홈').or('a:has-text("홈")').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('http://localhost:3000/');
    }
  });

  test('Check responsive design', async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
  });

  test('Check for errors in console', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate through main pages
    await page.goto('/');
    await page.goto('/board/free');
    await page.goto('/admin/dashboard');

    // Check for critical errors
    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') ||
      e.includes('ReferenceError') ||
      e.includes('500') ||
      e.includes('Failed')
    );

    // Report non-critical errors if any
    if (errors.length > 0 && criticalErrors.length === 0) {
      console.log('Minor warnings found:', errors.slice(0, 5));
    }

    expect(criticalErrors).toHaveLength(0);
  });
});
