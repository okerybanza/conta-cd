// Tests d'intégration pour StockMovementService
import {
    prisma,
    createTestCompany,
    createTestUser,
    createTestProduct,
    createTestFiscalPeriod,
    cleanupTestData,
} from '../helpers/test-db';
import stockMovementService from '../../services/stock-movement.service';

describe('StockMovementService - Integration Tests', () => {
    let testCompany: any;
    let testUser: any;
    let testProduct: any;
    let testWarehouse: any;

    beforeAll(async () => {
        testCompany = await createTestCompany();
        testUser = await createTestUser(testCompany.id);
        testProduct = await createTestProduct(testCompany.id);
        await createTestFiscalPeriod(testCompany.id);

        // Créer un entrepôt
        testWarehouse = await prisma.warehouses.create({
            data: {
                id: 'test-w-1',
                company_id: testCompany.id,
                name: 'Main Warehouse',
                is_active: true,
                updated_at: new Date(),
            }
        });

        // Activer module stock et datarissage
        await prisma.companies.update({
            where: { id: testCompany.id },
            data: {
                module_stock_enabled: true,
                datarissage_completed: true,
                stock_allow_negative: false
            }
        });
    });

    afterAll(async () => {
        await prisma.warehouses.deleteMany({ where: { company_id: testCompany.id } });
        await cleanupTestData(testCompany.id);
        await prisma.$disconnect();
    });

    it('should handle full stock lifecycle: IN, Validate, OUT, Validate, Check Stock', async () => {
        // 1. Entrée en stock (IN)
        const mvInId = await stockMovementService.create(testCompany.id, testUser.id, {
            movementType: 'IN',
            items: [{ productId: testProduct.id, quantity: 100, warehouseId: testWarehouse.id }],
            reason: 'Initial stock'
        });

        // Stock doit être 0 car non validé
        let stock = await stockMovementService.calculateStock(testCompany.id, testProduct.id);
        expect(stock).toBe(0);

        // 2. Valider l'entrée
        await stockMovementService.validate(testCompany.id, mvInId, testUser.id);
        stock = await stockMovementService.calculateStock(testCompany.id, testProduct.id);
        expect(stock).toBe(100);

        // 3. Sortie de stock (OUT)
        const mvOutId = await stockMovementService.create(testCompany.id, testUser.id, {
            movementType: 'OUT',
            items: [{ productId: testProduct.id, quantity: 40, warehouseId: testWarehouse.id }],
            reason: 'Sale'
        });

        // Valider la sortie
        await stockMovementService.validate(testCompany.id, mvOutId, testUser.id);
        stock = await stockMovementService.calculateStock(testCompany.id, testProduct.id);
        expect(stock).toBe(60);
    });

    it('should fail if attempting double validation', async () => {
        const mvId = await stockMovementService.create(testCompany.id, testUser.id, {
            movementType: 'IN',
            items: [{ productId: testProduct.id, quantity: 10, warehouseId: testWarehouse.id }]
        });

        await stockMovementService.validate(testCompany.id, mvId, testUser.id);
        await expect(
            stockMovementService.validate(testCompany.id, mvId, testUser.id)
        ).rejects.toThrow(/already validated/);
    });

    it('should reverse a movement and restore stock', async () => {
        const mvId = await stockMovementService.create(testCompany.id, testUser.id, {
            movementType: 'IN',
            items: [{ productId: testProduct.id, quantity: 50, warehouseId: testWarehouse.id }]
        });
        await stockMovementService.validate(testCompany.id, mvId, testUser.id);

        const initialStock = await stockMovementService.calculateStock(testCompany.id, testProduct.id);

        // Inverser
        await stockMovementService.reverse(testCompany.id, mvId, testUser.id, 'Correction');

        const finalStock = await stockMovementService.calculateStock(testCompany.id, testProduct.id);
        expect(finalStock).toBe(initialStock - 50);
    });
});
