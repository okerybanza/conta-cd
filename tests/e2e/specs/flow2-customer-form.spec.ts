import { test, expect } from '@playwright/test';
import { TestDataHelper } from '../helpers/test-data.helper';

/**
 * Flow 2: Customer Form Testing
 * Tests customer creation form to identify broken buttons and form issues
 */

test.describe('Flow 2: Customer Form', () => {
    test.beforeEach(async ({ page }) => {
        // Login first (assuming we have a test account)
        // If no test account, this will fail and we'll know we need to create one
        await page.goto('/login');

        // Try to login with test credentials
        // You may need to update these credentials
        await page.fill('input[type="email"]', 'test@conta.com');
        await page.fill('input[type="password"]', 'Test1234!');
        await page.click('button[type="submit"]');

        // Wait for dashboard or handle login failure
        await page.waitForURL(/\/(dashboard|customers)/, { timeout: 10000 }).catch(() => {
            console.log('⚠️ Login may have failed - continuing anyway');
        });
    });

    test('Navigate to customer form and test all fields', async ({ page }) => {
        // Navigate to customers page
        await page.goto('/customers');

        // Take screenshot of customers page
        await page.screenshot({ path: 'test-results/customers-page.png' });

        // Click "New Customer" button
        const newCustomerButton = page.locator('button, a').filter({ hasText: /nouveau client|new customer|créer/i });
        await expect(newCustomerButton.first()).toBeVisible({ timeout: 5000 });
        await newCustomerButton.first().click();

        // Wait for form to load
        await page.waitForURL(/\/customers\/(new|create)/, { timeout: 5000 });

        // Take screenshot of form
        await page.screenshot({ path: 'test-results/customer-form.png' });

        // Test Type selection (Particulier/Entreprise)
        const particulierRadio = page.locator('input[type="radio"][value="particulier"]');
        const entrepriseRadio = page.locator('input[type="radio"][value="entreprise"]');

        await expect(particulierRadio).toBeVisible();
        await expect(entrepriseRadio).toBeVisible();

        // Select Particulier
        await particulierRadio.click();

        // Fill required fields for Particulier
        await page.fill('input[name="firstName"]', 'Test');
        await page.fill('input[name="lastName"]', 'Customer');
        await page.fill('input[name="email"]', TestDataHelper.generateEmail('customer'));
        await page.fill('input[name="phone"]', '+243123456789');

        // Take screenshot before submit
        await page.screenshot({ path: 'test-results/customer-form-filled.png' });

        // Try to submit
        const submitButton = page.locator('button[type="submit"]').filter({ hasText: /créer|create|enregistrer/i });
        await expect(submitButton).toBeVisible();
        await expect(submitButton).toBeEnabled();

        await submitButton.click();

        // Wait for either success or error
        await page.waitForTimeout(2000);

        // Take screenshot of result
        await page.screenshot({ path: 'test-results/customer-form-result.png' });

        // Check if we're redirected to customers list (success)
        const currentUrl = page.url();
        console.log('📍 Current URL after submit:', currentUrl);

        // Check for error messages
        const errorMessage = await page.locator('.text-red-700, .text-danger, [class*="error"]').textContent().catch(() => null);
        if (errorMessage) {
            console.log('❌ Error message:', errorMessage);
        }
    });

    test('Test Entreprise customer type', async ({ page }) => {
        await page.goto('/customers/new');

        // Select Entreprise
        await page.locator('input[type="radio"][value="entreprise"]').click();

        // Fill required fields for Entreprise
        await page.fill('input[name="businessName"]', 'Test Company Ltd');
        await page.fill('input[name="contactPerson"]', 'John Doe');
        await page.fill('input[name="email"]', TestDataHelper.generateEmail('company'));

        // Take screenshot
        await page.screenshot({ path: 'test-results/customer-form-entreprise.png' });

        // Try to submit
        await page.locator('button[type="submit"]').click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'test-results/customer-form-entreprise-result.png' });
    });
});
