"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDCService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const logger_1 = __importDefault(require("../utils/logger"));
class RDCService {
    // Générer les données QR code pour facture RDC normalisée
    generateQRCodeData(data) {
        // Format standardisé RDC pour QR code
        // Format: NIF|DEF|NUMERO|DATE|MONTANT|DEVISE
        const def = data.def || '';
        const currency = data.currency || 'CDF';
        const date = data.invoiceDate.replace(/-/g, ''); // YYYYMMDD
        const qrData = [
            data.nif,
            def,
            data.invoiceNumber,
            date,
            data.totalTTC.toFixed(2),
            currency,
        ].join('|');
        return qrData;
    }
    // Générer le QR code en base64
    async generateQRCodeBase64(data) {
        try {
            const qrData = this.generateQRCodeData(data);
            const qrCodeBase64 = await qrcode_1.default.toDataURL(qrData, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                width: 200,
                margin: 1,
            });
            return qrCodeBase64;
        }
        catch (error) {
            logger_1.default.error('Error generating QR code', { error, data });
            throw error;
        }
    }
    // Générer le QR code en buffer
    async generateQRCodeBuffer(data) {
        try {
            const qrData = this.generateQRCodeData(data);
            const qrCodeBuffer = await qrcode_1.default.toBuffer(qrData, {
                errorCorrectionLevel: 'M',
                width: 200,
                margin: 1,
            });
            return qrCodeBuffer;
        }
        catch (error) {
            logger_1.default.error('Error generating QR code buffer', { error, data });
            throw error;
        }
    }
    // Valider les données pour facture RDC normalisée
    validateRDCInvoice(company, invoice) {
        const errors = [];
        // Vérifier NIF entreprise
        if (!company.nif) {
            errors.push('NIF de l\'entreprise requis pour facture RDC normalisée');
        }
        // Vérifier que la facture a les champs requis
        if (!invoice.invoiceNumber) {
            errors.push('Numéro de facture requis');
        }
        if (!invoice.invoiceDate) {
            errors.push('Date de facture requise');
        }
        if (!invoice.totalTtc) {
            errors.push('Total TTC requis');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
exports.RDCService = RDCService;
exports.default = new RDCService();
//# sourceMappingURL=rdc.service.js.map