"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cron_controller_1 = __importDefault(require("../controllers/cron.controller"));
const router = (0, express_1.Router)();
// Route pour expirer les essais et abonnements terminés
router.post('/expire-subscriptions', cron_controller_1.default.expireSubscriptions.bind(cron_controller_1.default));
exports.default = router;
//# sourceMappingURL=cron.routes.js.map