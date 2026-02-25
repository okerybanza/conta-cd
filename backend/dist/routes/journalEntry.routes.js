"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const journalEntry_controller_1 = __importDefault(require("../controllers/journalEntry.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const idempotency_middleware_1 = require("../middleware/idempotency.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Toutes les routes nécessitent la fonctionnalité "accounting"
router.use((0, feature_middleware_1.requireFeature)('accounting'));
router.post('/', idempotency_middleware_1.idempotencyMiddleware, journalEntry_controller_1.default.create.bind(journalEntry_controller_1.default));
router.get('/', journalEntry_controller_1.default.list.bind(journalEntry_controller_1.default));
router.get('/:id', journalEntry_controller_1.default.getById.bind(journalEntry_controller_1.default));
router.put('/:id', journalEntry_controller_1.default.update.bind(journalEntry_controller_1.default));
router.post('/:id/post', journalEntry_controller_1.default.post.bind(journalEntry_controller_1.default));
router.post('/:id/reverse', journalEntry_controller_1.default.reverse.bind(journalEntry_controller_1.default)); // SPRINT 1 - TASK 1.3
router.delete('/:id', journalEntry_controller_1.default.delete.bind(journalEntry_controller_1.default));
exports.default = router;
//# sourceMappingURL=journalEntry.routes.js.map