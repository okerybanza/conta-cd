import QRCode from 'qrcode';
import logger from '../utils/logger';

export interface RDCInvoiceData {
  nif?: string; // NIF de l'entreprise
  def?: string; // DEF de l'entreprise
  invoiceNumber?: string;
  invoiceDate?: string; // Format: YYYY-MM-DD
  totalTTC?: number;
  currency?: string;
}

export class RDCService {
  // Générer les données QR code pour facture RDC normalisée
  generateQRCodeData(data: RDCInvoiceData): string {
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
  async generateQRCodeBase64(data: RDCInvoiceData): Promise<string> {
    try {
      const qrData = this.generateQRCodeData(data);
      const qrCodeBase64 = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 200,
        margin: 1,
      });

      return qrCodeBase64;
    } catch (error) {
      logger.error('Error generating QR code', { error, data });
      throw error;
    }
  }

  // Générer le QR code en buffer
  async generateQRCodeBuffer(data: RDCInvoiceData): Promise<Buffer> {
    try {
      const qrData = this.generateQRCodeData(data);
      const qrCodeBuffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'M',
        width: 200,
        margin: 1,
      });

      return qrCodeBuffer;
    } catch (error) {
      logger.error('Error generating QR code buffer', { error, data });
      throw error;
    }
  }

  // Valider les données pour facture RDC normalisée
  validateRDCInvoice(company: any, invoice: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

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

export default new RDCService();

