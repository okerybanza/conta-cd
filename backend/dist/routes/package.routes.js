"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const package_controller_1 = __importDefault(require("../controllers/package.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Routes publiques pour voir les packages
router.get('/', package_controller_1.default.list.bind(package_controller_1.default));
router.get('/:id', package_controller_1.default.getById.bind(package_controller_1.default));
router.get('/code/:code', package_controller_1.default.getByCode.bind(package_controller_1.default));
// Routes protégées pour la gestion des packages (admin uniquement)
router.post('/', auth_middleware_1.authenticate, package_controller_1.default.create.bind(package_controller_1.default));
router.put('/:id', auth_middleware_1.authenticate, package_controller_1.default.update.bind(package_controller_1.default));
router.delete('/:id', auth_middleware_1.authenticate, package_controller_1.default.delete.bind(package_controller_1.default));
router.get('/:id/subscriptions-count', auth_middleware_1.authenticate, package_controller_1.default.getSubscriptionsCount.bind(package_controller_1.default));
exports.default = router;
//# sourceMappingURL=package.routes.js.map