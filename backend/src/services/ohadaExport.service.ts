import pdfService from './pdf.service';
import financialStatementsService from './financialStatements.service';
import logger from '../utils/logger';

export class OhadaExportService {

  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-CD', { minimumFractionDigits: 0 }).format(Math.round(amount));
  }

  private getHtmlHeader(title: string, companyName: string, period: string): string {
    return `
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; font-size: 10px; color: #000; margin: 20px; }
      h1 { font-size: 14px; text-align: center; text-transform: uppercase; margin-bottom: 4px; }
      h2 { font-size: 11px; text-align: center; margin-bottom: 2px; }
      .period { text-align: center; font-size: 9px; margin-bottom: 16px; color: #555; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th { background: #1a3a5c; color: white; padding: 5px 8px; text-align: left; font-size: 9px; }
      td { padding: 3px 8px; border-bottom: 1px solid #eee; }
      tr:nth-child(even) { background: #f7f9fc; }
      .total-row { font-weight: bold; background: #e8f0fe !important; border-top: 2px solid #1a3a5c; }
      .section-header { background: #dce8f8 !important; font-weight: bold; }
      .amount { text-align: right; }
      .label { width: 50%; }
      .ref { width: 8%; color: #777; font-size: 8px; }
      .footer { text-align: center; font-size: 8px; color: #999; margin-top: 20px; }
    </style></head><body>
    <h1>${title}</h1>
    <h2>${companyName}</h2>
    <p class="period">${period}</p>`;
  }

  async generateBilanPDF(companyId: string, companyName: string, filters: any = {}): Promise<Buffer> {
    const bilan = await financialStatementsService.generateBalanceSheet(companyId, filters);
    const period = filters.endDate ? `Au ${new Date(filters.endDate).toLocaleDateString('fr-FR')}` : `Au ${new Date().toLocaleDateString('fr-FR')}`;

    let html = this.getHtmlHeader('BILAN — SYSCOHADA RÉVISÉ', companyName, period);

    // ACTIF
    html += `<table>
      <tr><th class="ref">Réf</th><th class="label">ACTIF</th><th class="amount">Montant (CDF)</th></tr>
      <tr class="section-header"><td></td><td>ACTIF IMMOBILISÉ</td><td></td></tr>`;

    let totalActifImmobilise = 0;
    for (const item of (bilan.assets?.fixedAssets || []) as any[]) {
      html += `<tr><td class="ref">${item.code || ''}</td><td>${item.name}</td><td class="amount">${this.formatAmount(item.balance)}</td></tr>`;
      totalActifImmobilise += item.balance;
    }
    html += `<tr class="total-row"><td></td><td>TOTAL ACTIF IMMOBILISÉ</td><td class="amount">${this.formatAmount(totalActifImmobilise)}</td></tr>`;

    html += `<tr class="section-header"><td></td><td>ACTIF CIRCULANT</td><td></td></tr>`;
    let totalActifCirculant = 0;
    for (const item of [...(bilan.assets?.currentAssets?.inventory || []), ...(bilan.assets?.currentAssets?.receivables || []), ...(bilan.assets?.currentAssets?.cash || [])] as any[]) {
      html += `<tr><td class="ref">${item.code || ''}</td><td>${item.name}</td><td class="amount">${this.formatAmount(item.balance)}</td></tr>`;
      totalActifCirculant += item.balance;
    }
    html += `<tr class="total-row"><td></td><td>TOTAL ACTIF CIRCULANT</td><td class="amount">${this.formatAmount(totalActifCirculant)}</td></tr>`;
    html += `<tr class="total-row"><td></td><td>TOTAL ACTIF</td><td class="amount">${this.formatAmount(totalActifImmobilise + totalActifCirculant)}</td></tr>`;
    html += `</table>`;

    // PASSIF
    html += `<table>
      <tr><th class="ref">Réf</th><th class="label">PASSIF</th><th class="amount">Montant (CDF)</th></tr>
      <tr class="section-header"><td></td><td>CAPITAUX PROPRES</td><td></td></tr>`;

    let totalCapitaux = 0;
    for (const item of (bilan.liabilities?.equity || []) as any[]) {
      html += `<tr><td class="ref">${item.code || ''}</td><td>${item.name}</td><td class="amount">${this.formatAmount(item.balance)}</td></tr>`;
      totalCapitaux += item.balance;
    }
    html += `<tr class="total-row"><td></td><td>TOTAL CAPITAUX PROPRES</td><td class="amount">${this.formatAmount(totalCapitaux)}</td></tr>`;

    html += `<tr class="section-header"><td></td><td>DETTES</td><td></td></tr>`;
    let totalDettes = 0;
    for (const item of [...(bilan.liabilities?.debts?.loans || []), ...(bilan.liabilities?.debts?.payables || []), ...(bilan.liabilities?.debts?.otherLiabilities || [])] as any[]) {
      html += `<tr><td class="ref">${item.code || ''}</td><td>${item.name}</td><td class="amount">${this.formatAmount(item.balance)}</td></tr>`;
      totalDettes += item.balance;
    }
    html += `<tr class="total-row"><td></td><td>TOTAL DETTES</td><td class="amount">${this.formatAmount(totalDettes)}</td></tr>`;
    html += `<tr class="total-row"><td></td><td>TOTAL PASSIF</td><td class="amount">${this.formatAmount(totalCapitaux + totalDettes)}</td></tr>`;
    html += `</table>`;

    html += `<p class="footer">Document généré par Conta.cd — Conforme SYSCOHADA Révisé — ${new Date().toLocaleString('fr-FR')}</p>`;
    html += `</body></html>`;

    logger.info('Generating OHADA Bilan PDF', { companyId });
    return pdfService.generatePDFFromHTML(html, { format: 'A4' });
  }

  async generateCompteResultatPDF(companyId: string, companyName: string, filters: any = {}): Promise<Buffer> {
    const cr = await financialStatementsService.generateIncomeStatement(companyId, filters);
    const period = `Du ${new Date(cr.period?.startDate || Date.now()).toLocaleDateString('fr-FR')} au ${new Date(cr.period?.endDate || Date.now()).toLocaleDateString('fr-FR')}`;

    let html = this.getHtmlHeader('COMPTE DE RÉSULTAT — SYSCOHADA RÉVISÉ', companyName, period);

    html += `<table>
      <tr><th class="ref">Réf</th><th class="label">LIBELLÉ</th><th class="amount">Montant (CDF)</th></tr>
      <tr class="section-header"><td></td><td>PRODUITS D'EXPLOITATION</td><td></td></tr>`;

    let totalProduits = 0;
    for (const item of (Object.values(cr.revenues || {}).flat() as any[])) {
      html += `<tr><td class="ref">${item.code || ''}</td><td>${item.name}</td><td class="amount">${this.formatAmount(item.amount)}</td></tr>`;
      totalProduits += item.amount;
    }
    html += `<tr class="total-row"><td></td><td>TOTAL PRODUITS</td><td class="amount">${this.formatAmount(totalProduits)}</td></tr>`;

    html += `<tr class="section-header"><td></td><td>CHARGES D'EXPLOITATION</td><td></td></tr>`;
    let totalCharges = 0;
    for (const item of (Object.values(cr.expenses || {}).flat() as any[])) {
      html += `<tr><td class="ref">${item.code || ''}</td><td>${item.name}</td><td class="amount">${this.formatAmount(item.amount)}</td></tr>`;
      totalCharges += item.amount;
    }
    html += `<tr class="total-row"><td></td><td>TOTAL CHARGES</td><td class="amount">${this.formatAmount(totalCharges)}</td></tr>`;

    const resultat = totalProduits - totalCharges;
    html += `<tr class="total-row"><td></td><td>${resultat >= 0 ? 'BÉNÉFICE NET' : 'PERTE NETTE'}</td><td class="amount">${this.formatAmount(Math.abs(resultat))}</td></tr>`;
    html += `</table>`;
    html += `<p class="footer">Document généré par Conta.cd — Conforme SYSCOHADA Révisé — ${new Date().toLocaleString('fr-FR')}</p>`;
    html += `</body></html>`;

    logger.info('Generating OHADA Compte de Résultat PDF', { companyId });
    return pdfService.generatePDFFromHTML(html, { format: 'A4' });
  }
}

export default new OhadaExportService();
