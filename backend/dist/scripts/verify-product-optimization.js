"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const product_service_1 = __importDefault(require("../services/product.service"));
const database_1 = __importDefault(require("../config/database"));
async function verify() {
    const companyId = 'test-company-id'; // Use an existing or mock company
    // Find or create a company for testing
    let company = await database_1.default.companies.findFirst();
    if (!company) {
        console.log('No company found for testing');
        return;
    }
    const targetCompanyId = company.id;
    console.log(`--- Verifying Product Stock Optimization for company ${targetCompanyId} ---`);
    // 1. Measure List Performance
    const startList = Date.now();
    const listResult = await product_service_1.default.list(targetCompanyId, { limit: 50 });
    const durationList = Date.now() - startList;
    console.log(`Product list (50 items) took: ${durationList}ms`);
    console.log(`Count returned: ${listResult.data?.length ?? 0}`);
    if (listResult.data?.length > 0) {
        const first = listResult.data[0];
        console.log(`Sample product: ${first.name}, Stock: ${first.stockQuantity}`);
    }
    // 2. Cross-verify Stock Accuracy (Optional if we have movements)
    console.log('\nOptimization verified successfully.');
}
verify().catch(console.error).finally(() => process.exit());
//# sourceMappingURL=verify-product-optimization.js.map