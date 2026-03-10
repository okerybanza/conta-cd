import { test, expect } from '@playwright/test';

test.describe('Smoke Test: Authentication', () => {
    test('Login page should load and show critical elements', async ({ page }) => {
        await page.goto('/login');

        // Check for logo or title
        await expect(page).toHaveTitle(/Conta/);

        // Check for email and password inputs
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();

        // Check for submit button
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('Form validation should work', async ({ page }) => {
        await page.goto('/login');

        // Click submit without filling anything
        await page.click('button[type="submit"]');

        // Should show validation errors
        await expect(page.locator('text=Email requis')).toBeVisible();
        await expect(page.locator('text=Mot de passe requis')).toBeVisible();
    });
});
