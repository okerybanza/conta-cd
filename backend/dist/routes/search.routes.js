"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const search_controller_1 = __importDefault(require("../controllers/search.controller"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/v1/search
 * @desc    Recherche globale dans tous les modules
 * @access  Private
 */
router.get('/', auth_middleware_1.authenticate, search_controller_1.default.globalSearch.bind(search_controller_1.default));
exports.default = router;
//# sourceMappingURL=search.routes.js.map