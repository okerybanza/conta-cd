"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const creditNote_controller_1 = __importDefault(require("../controllers/creditNote.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_middleware_1.authenticate);
// Routes CRUD
router.get('/', creditNote_controller_1.default.list.bind(creditNote_controller_1.default));
router.get('/:id', creditNote_controller_1.default.getById.bind(creditNote_controller_1.default));
router.post('/', creditNote_controller_1.default.create.bind(creditNote_controller_1.default));
router.put('/:id', creditNote_controller_1.default.update.bind(creditNote_controller_1.default));
router.delete('/:id', creditNote_controller_1.default.delete.bind(creditNote_controller_1.default));
// Route spéciale : appliquer un avoir
router.post('/:id/apply', creditNote_controller_1.default.apply.bind(creditNote_controller_1.default));
exports.default = router;
//# sourceMappingURL=creditNote.routes.js.map