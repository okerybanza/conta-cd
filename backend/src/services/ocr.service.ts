import tesseract from 'node-tesseract-ocr';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';

export interface OCRInvoiceResult {
  rawText: string;
  extracted: {
    invoiceNumber?: string;
    date?: string;
    dueDate?: string;
    supplierName?: string;
    totalAmount?: number;
    taxAmount?: number;
    subtotal?: number;
    currency?: string;
    lines?: Array<{ description: string; amount: number }>;
  };
  confidence: number;
}

export class OCRService {

  private config = {
    lang: 'fra+eng',
    oem: 1,
    psm: 3,
  };

  async extractTextFromImage(imagePath: string): Promise<string> {
    try {
      const text = await tesseract.recognize(imagePath, this.config);
      logger.info('OCR text extracted', { imagePath, length: text.length });
      return text;
    } catch (e: any) {
      logger.error('OCR extraction failed', { imagePath, error: e.message });
      throw e;
    }
  }

  private extractAmount(text: string, patterns: RegExp[]): number | undefined {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/[\s,]/g, '').replace(',', '.'));
        if (!isNaN(amount)) return amount;
      }
    }
    return undefined;
  }

  private extractDate(text: string): string | undefined {
    const patterns = [
      /date\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
      /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return m[1];
    }
    return undefined;
  }

  parseInvoiceText(rawText: string): OCRInvoiceResult['extracted'] {
    const text = rawText;
    const lines = text.split('\n').filter(l => l.trim());

    // Numéro de facture
    const invoiceNumberMatch = text.match(/(?:facture|invoice|n°|no\.?|ref\.?)\s*:?\s*([A-Z0-9\-\/]+)/i);
    const invoiceNumber = invoiceNumberMatch?.[1]?.trim();

    // Dates
    const date = this.extractDate(text);

    // Échéance
    const dueDateMatch = text.match(/(?:échéance|due date|à payer avant)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
    const dueDate = dueDateMatch?.[1];

    // Fournisseur (première ligne non vide)
    const supplierName = lines[0]?.trim();

    // Montants
    const totalAmount = this.extractAmount(text, [
      /(?:total\s*ttc|montant\s*total|total\s*à\s*payer)\s*:?\s*([\d\s,\.]+)/i,
      /(?:total)\s*:?\s*([\d\s,\.]+)/i,
    ]);

    const taxAmount = this.extractAmount(text, [
      /(?:tva|taxe|tax)\s*:?\s*([\d\s,\.]+)/i,
      /(?:tva\s*\d+%?)\s*:?\s*([\d\s,\.]+)/i,
    ]);

    const subtotal = this.extractAmount(text, [
      /(?:sous[\-\s]total|total\s*ht|montant\s*ht)\s*:?\s*([\d\s,\.]+)/i,
    ]);

    // Devise
    const currencyMatch = text.match(/\b(CDF|USD|EUR|FC)\b/i);
    const currency = currencyMatch?.[1]?.toUpperCase();

    return { invoiceNumber, date, dueDate, supplierName, totalAmount, taxAmount, subtotal, currency };
  }

  async processInvoiceImage(imagePath: string): Promise<OCRInvoiceResult> {
    const rawText = await this.extractTextFromImage(imagePath);
    const extracted = this.parseInvoiceText(rawText);
    const confidence = Object.values(extracted).filter(v => v !== undefined).length / 8;

    return { rawText, extracted, confidence: parseFloat((confidence * 100).toFixed(1)) };
  }

  cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {}
  }
}

export default new OCRService();
