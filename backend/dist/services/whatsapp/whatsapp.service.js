"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const logger_1 = __importDefault(require("../../utils/logger"));
class WhatsAppService {
    isServiceConfigured() {
        return !!process.env.WHATSAPP_API_KEY;
    }
    async sendText(options) {
        logger_1.default.info('WhatsApp sendText (mock for tests)', { to: options.to });
        return { ok: true, providerMessageId: 'mock-id' };
    }
}
exports.WhatsAppService = WhatsAppService;
exports.default = new WhatsAppService();
//# sourceMappingURL=whatsapp.service.js.map