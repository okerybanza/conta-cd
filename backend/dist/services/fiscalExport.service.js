"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalExportService = void 0;
const database_1 = __importDefault(require("../config/database"));
const tva_service_1 = __importDefault(require("./tva.service"));
const pdf_service_1 = __importDefault(require("./pdf.service"));
class FiscalExportService {
    /**
     * Exporter la déclaration TVA
     */
    async exportVATDeclaration(companyId, period, // Format: "2025-01"
    format) {
        // Générer le rapport TVA
        const [year, month] = period.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const vatReport = await tva_service_1.default.generateVATReport(companyId, {
            startDate,
            endDate,
        });
        // Récupérer les informations de l'entreprise
        const company = await database_1.default.companies.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new Error('Entreprise introuvable');
        }
        if (format === 'pdf') {
            return this.generateVATDeclarationPDF(vatReport, company, period);
        }
        else if (format === 'excel') {
            return this.generateVATDeclarationExcel(vatReport, company, period);
        }
        else if (format === 'xml') {
            return this.generateVATDeclarationXML(vatReport, company, period);
        }
        else {
            throw new Error(`Format ${format} non supporté pour la déclaration TVA`);
        }
    }
    /**
     * Générer la déclaration TVA en PDF
     */
    async generateVATDeclarationPDF(vatReport, company, period) {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      margin: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .company-info {
      margin-bottom: 20px;
    }
    .period {
      font-weight: bold;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .total {
      font-weight: bold;
      text-align: right;
    }
    .summary {
      margin-top: 30px;
      padding: 15px;
      background-color: #f9f9f9;
      border: 1px solid #000;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>DÉCLARATION DE TVA</h1>
  </div>
  
  <div class="company-info">
    <p><strong>Entreprise:</strong> ${company.businessName || company.name}</p>
    <p><strong>NIF:</strong> ${company.nif || 'N/A'}</p>
    <p><strong>RCCM:</strong> ${company.rccm || 'N/A'}</p>
  </div>
  
  <div class="period">
    <p><strong>Période:</strong> ${period}</p>
  </div>
  
  <h2>TVA Collectée</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>N° Document</th>
        <th>Client</th>
        <th>Montant HT</th>
        <th>Taux TVA</th>
        <th>Montant TVA</th>
      </tr>
    </thead>
    <tbody>
      ${vatReport.collectedItems.map((item) => `
        <tr>
          <td>${new Date(item.date).toLocaleDateString('fr-FR')}</td>
          <td>${item.documentNumber}</td>
          <td>${item.customerName || ''}</td>
          <td>${item.amountHt.toFixed(2)}</td>
          <td>${item.taxRate.toFixed(2)}%</td>
          <td>${item.vatAmount.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr class="total">
        <td colspan="5">TOTAL TVA COLLECTÉE</td>
        <td>${vatReport.totalCollected.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
  
  <h2>TVA Déductible</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>N° Document</th>
        <th>Fournisseur</th>
        <th>Montant HT</th>
        <th>Taux TVA</th>
        <th>Montant TVA</th>
      </tr>
    </thead>
    <tbody>
      ${vatReport.deductibleItems.map((item) => `
        <tr>
          <td>${new Date(item.date).toLocaleDateString('fr-FR')}</td>
          <td>${item.documentNumber}</td>
          <td>${item.supplierName || ''}</td>
          <td>${item.amountHt.toFixed(2)}</td>
          <td>${item.taxRate.toFixed(2)}%</td>
          <td>${item.vatAmount.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr class="total">
        <td colspan="5">TOTAL TVA DÉDUCTIBLE</td>
        <td>${vatReport.totalDeductible.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
  
  <div class="summary">
    <h3>RÉSUMÉ</h3>
    <p><strong>TVA Collectée:</strong> ${vatReport.totalCollected.toFixed(2)}</p>
    <p><strong>TVA Déductible:</strong> ${vatReport.totalDeductible.toFixed(2)}</p>
    <p><strong>TVA à Payer:</strong> ${vatReport.vatToPay.toFixed(2)}</p>
  </div>
</body>
</html>
    `;
        return await pdf_service_1.default.generatePDFFromHTML(html);
    }
    /**
     * Générer la déclaration TVA en Excel (CSV)
     */
    generateVATDeclarationExcel(vatReport, company, period) {
        const lines = [];
        // En-tête
        lines.push('DÉCLARATION DE TVA');
        lines.push(`Entreprise: ${company.businessName || company.name}`);
        lines.push(`NIF: ${company.nif || 'N/A'}`);
        lines.push(`Période: ${period}`);
        lines.push('');
        // TVA Collectée
        lines.push('TVA COLLECTÉE');
        lines.push('Date,N° Document,Client,Montant HT,Taux TVA,Montant TVA');
        vatReport.collectedItems.forEach((item) => {
            lines.push(`${new Date(item.date).toLocaleDateString('fr-FR')},${item.documentNumber},"${item.customerName || ''}",${item.amountHt.toFixed(2)},${item.taxRate.toFixed(2)}%,${item.vatAmount.toFixed(2)}`);
        });
        lines.push(`TOTAL,,,,"${vatReport.totalCollected.toFixed(2)}"`);
        lines.push('');
        // TVA Déductible
        lines.push('TVA DÉDUCTIBLE');
        lines.push('Date,N° Document,Fournisseur,Montant HT,Taux TVA,Montant TVA');
        vatReport.deductibleItems.forEach((item) => {
            lines.push(`${new Date(item.date).toLocaleDateString('fr-FR')},${item.documentNumber},"${item.supplierName || ''}",${item.amountHt.toFixed(2)},${item.taxRate.toFixed(2)}%,${item.vatAmount.toFixed(2)}`);
        });
        lines.push(`TOTAL,,,,"${vatReport.totalDeductible.toFixed(2)}"`);
        lines.push('');
        // Résumé
        lines.push('RÉSUMÉ');
        lines.push(`TVA Collectée,${vatReport.totalCollected.toFixed(2)}`);
        lines.push(`TVA Déductible,${vatReport.totalDeductible.toFixed(2)}`);
        lines.push(`TVA à Payer,${vatReport.vatToPay.toFixed(2)}`);
        return lines.join('\n');
    }
    /**
     * Générer la déclaration TVA en XML
     */
    generateVATDeclarationXML(vatReport, company, period) {
        const [year, month] = period.split('-');
        return `<?xml version="1.0" encoding="UTF-8"?>
<vatDeclaration>
  <company>
    <name>${this.escapeXml(company.businessName || company.name)}</name>
    <nif>${company.nif || ''}</nif>
    <rccm>${company.rccm || ''}</rccm>
  </company>
  <period>
    <year>${year}</year>
    <month>${month}</month>
  </period>
  <vatCollected>
    <total>${vatReport.totalCollected.toFixed(2)}</total>
    <items>
      ${vatReport.collectedItems.map((item) => `
      <item>
        <date>${new Date(item.date).toISOString().split('T')[0]}</date>
        <documentNumber>${this.escapeXml(item.documentNumber)}</documentNumber>
        <customerName>${this.escapeXml(item.customerName || '')}</customerName>
        <amountHt>${item.amountHt.toFixed(2)}</amountHt>
        <taxRate>${item.taxRate.toFixed(2)}</taxRate>
        <vatAmount>${item.vatAmount.toFixed(2)}</vatAmount>
      </item>
      `).join('')}
    </items>
  </vatCollected>
  <vatDeductible>
    <total>${vatReport.totalDeductible.toFixed(2)}</total>
    <items>
      ${vatReport.deductibleItems.map((item) => `
      <item>
        <date>${new Date(item.date).toISOString().split('T')[0]}</date>
        <documentNumber>${this.escapeXml(item.documentNumber)}</documentNumber>
        <supplierName>${this.escapeXml(item.supplierName || '')}</supplierName>
        <amountHt>${item.amountHt.toFixed(2)}</amountHt>
        <taxRate>${item.taxRate.toFixed(2)}</taxRate>
        <vatAmount>${item.vatAmount.toFixed(2)}</vatAmount>
      </item>
      `).join('')}
    </items>
  </vatDeductible>
  <summary>
    <vatCollected>${vatReport.totalCollected.toFixed(2)}</vatCollected>
    <vatDeductible>${vatReport.totalDeductible.toFixed(2)}</vatDeductible>
    <vatToPay>${vatReport.vatToPay.toFixed(2)}</vatToPay>
  </summary>
</vatDeclaration>`;
    }
    /**
     * Échapper les caractères XML
     */
    escapeXml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    /**
     * Exporter pour contrôle fiscal
     */
    async exportFiscalControl(companyId, period, format) {
        // Récupérer toutes les données de la période
        const [invoices, expenses, journalEntries] = await Promise.all([
            database_1.default.invoices.findMany({
                where: {
                    companyId,
                    invoiceDate: {
                        gte: period.startDate,
                        lte: period.endDate,
                    },
                    deletedAt: null,
                },
                include: {
                    customer: true,
                },
                orderBy: {
                    invoiceDate: 'asc',
                },
            }),
            database_1.default.expense.findMany({
                where: {
                    companyId,
                    expenseDate: {
                        gte: period.startDate,
                        lte: period.endDate,
                    },
                    deletedAt: null,
                },
                include: {
                    supplier: true,
                },
                orderBy: {
                    expenseDate: 'asc',
                },
            }),
            database_1.default.journal_entries.findMany({
                where: {
                    companyId,
                    entryDate: {
                        gte: period.startDate,
                        lte: period.endDate,
                    },
                },
                include: {
                    lines: {
                        include: {
                            account: true,
                        },
                    },
                },
                orderBy: {
                    entryDate: 'asc',
                },
            }),
        ]);
        // Générer le CSV
        const lines = [];
        // En-tête
        lines.push('EXPORT POUR CONTRÔLE FISCAL');
        lines.push(`Période: ${period.startDate.toISOString().split('T')[0]} - ${period.endDate.toISOString().split('T')[0]}`);
        lines.push('');
        // Factures
        lines.push('FACTURES');
        lines.push('Date,N° Facture,Client,Montant HT,TVA,Montant TTC,Statut');
        invoices.forEach((invoice) => {
            const customerName = invoice.customer.type === 'particulier'
                ? `${invoice.customer.firstName || ''} ${invoice.customer.lastName || ''}`.trim()
                : invoice.customer.businessName || '';
            lines.push(`${invoice.invoiceDate.toISOString().split('T')[0]},${invoice.invoiceNumber},"${customerName}",${Number(invoice.subtotal || 0).toFixed(2)},${Number(invoice.taxAmount || 0).toFixed(2)},${Number(invoice.totalAmount || 0).toFixed(2)},${invoice.status}`);
        });
        lines.push('');
        // Dépenses
        lines.push('DÉPENSES');
        lines.push('Date,N° Dépense,Fournisseur,Montant HT,TVA,Montant TTC,Statut');
        expenses.forEach((expense) => {
            lines.push(`${expense.expenseDate.toISOString().split('T')[0]},${expense.expenseNumber},"${expense.supplier?.name || expense.supplierName || ''}",${Number(expense.amountHt || 0).toFixed(2)},${Number(expense.taxAmount || 0).toFixed(2)},${Number(expense.amountTtc || 0).toFixed(2)},${expense.status}`);
        });
        lines.push('');
        // Écritures comptables
        lines.push('ÉCRITURES COMPTABLES');
        lines.push('Date,N° Écriture,Description,Compte,Débit,Crédit');
        journalEntries.forEach((entry) => {
            entry.lines.forEach((line) => {
                lines.push(`${entry.entryDate.toISOString().split('T')[0]},${entry.entryNumber},"${entry.description}","${line.account.code} - ${line.account.name}",${Number(line.debit).toFixed(2)},${Number(line.credit).toFixed(2)}`);
            });
        });
        return lines.join('\n');
    }
}
exports.FiscalExportService = FiscalExportService;
exports.default = new FiscalExportService();
//# sourceMappingURL=fiscalExport.service.js.map