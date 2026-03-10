import { test, expect } from '@playwright/test';
import { TestDataHelper } from '../helpers/test-data.helper';

/**
 * Flow 3: Product Form Testing
 * Tests product creation form to identify the "Option with value 'Produit' not found" error
 */

test.describe('Flow 3: Product Form', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'test@conta.com');
        await page.fill('input[type="password"]', 'Test1234!');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
    });

    test('Navigate to product form and test all fields', async ({ page }) => {
        // Navigate to products page
        await page.goto('/products');

        // Take screenshot
        await page.screenshot({ path: 'test-results/products-page.png' });

        // Click "New Product" button
        const newProductButton = page.locator('button, a').filter({ hasText: /nouvel article|new product|créer/i });
        await expect(newProductButton.first()).toBeVisible({ timeout: 5000 });
        await newProductButton.first().click();

        // Wait for form
        await page.waitForURL(/\/products\/(new|create)/, { timeout: 5000 });

        // Take screenshot of form
        await page.screenshot({ path: 'test-results/product-form.png' });

        // Fill name
        await page.fill('input[name="name"]', 'Test Product');

        // Fill description
        await page.fill('textarea[name="description"]', 'Test product description');

        // Test Type dropdown - THIS IS WHERE THE ERROR MIGHT OCCUR
        const typeSelect = page.locator('select[name="type"]');
        await expect(typeSelect).toBeVisible();

        // Try selecting "Service" first
        await typeSelect.selectOption('service');
        await page.waitForTimeout(500);

        // Take screenshot
        await page.screenshot({ path: 'test-results/product-form-service.png' });

        // Now try selecting "Produit" - this might cause the console error
        await typeSelect.selectOption('product');
        await page.waitForTimeout(500);

        // Take screenshot
        await page.screenshot({ path: 'test-results/product-form-produit.png' });

        // Fill price
        await page.fill('input[name="unitPrice"]', '100');

        // Fill tax rate
        await page.fill('input[name="taxRate"]', '16');

        // Select currency
        await page.selectOption('select[name="currency"]', 'CDF');

        // Take screenshot before submit
        await page.screenshot({ path: 'test-results/product-form-filled.png' });

        // Try to submit
        const submitButton = page.locator('button[type="submit"]').filter({ hasText: /créer|create|enregistrer/i });
        await expect(submitButton).toBeVisible();
        await expect(submitButton).toBeEnabled();

        await submitButton.click();

        // Wait for result
        await page.waitForTimeout(2000);

        // Take screenshot of result
        await page.screenshot({ path: 'test-results/product-form-result.png' });

        // Log current URL
        console.log('📍 Current URL after submit:', page.url());

        // Check for errors
        const errorMessage = await page.locator('.text-red-700, .text-danger, [class*="error"]').textContent().catch(() => null);
        if (errorMessage) {
            console.log('❌ Error message:', errorMessage);
        }
    });

    test('Test product with stock tracking', async ({ page }) => {
        await page.goto('/products/new');

        // Fill basic info
        await page.fill('input[name="name"]', 'Test Product with Stock');
        await page.selectOption('select[name="type"]', 'product');
        await page.fill('input[name="unitPrice"]', '50');

        // Enable stock tracking
        const trackStockCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /suivre le stock|track stock/i });
        if (await trackStockCheckbox.count() > 0) {
            await trackStockCheckbox.check();
            await page.waitForTimeout(500);

            // Take screenshot with stock fields visible
            await page.screenshot({ path: 'test-results/product-form-with-stock.png' });
        }

        // Try to submit
        await page.locator('button[type="submit"]').click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'test-results/product-form-stock-result.png' });
    });
});
