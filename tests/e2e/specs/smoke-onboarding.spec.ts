import { test, expect } from '@playwright/test';

test.describe('Smoke Test: Onboarding', () => {
    test('Registration page should load and show critical elements', async ({ page }) => {
        await page.goto('/register');

        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(page.locator('input[name="firstName"]')).toBeVisible();
        await expect(page.locator('input[name="lastName"]')).toBeVisible();
        await expect(page.locator('input[name="companyName"]')).toBeVisible();

        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('Redirect to login should work', async ({ page }) => {
        await page.goto('/register');
        await page.click('text=Déjà un compte ?');
        await expect(page).toHaveURL(/\/login/);
    });
});
