import { Response, NextFunction } from 'express';
import { AuthRequest, getCompanyId } from '../middleware/auth.middleware';
import reportingService from '../services/reporting.service';
import pdfService from '../services/pdf.service';
import logger from '../utils/logger';

export class ReportingController {
  // Rapport revenus
  async getRevenueReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const filters = {
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        customerId: req.query.customerId as string | undefined,
        status: req.query.status as string | undefined,
      };

      const report = await reportingService.generateRevenueReport(
        getCompanyId(req),
        filters
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // Rapport factures impayées
  async getUnpaidInvoicesReport(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const filters = {
        customerId: req.query.customerId as string | undefined,
      };

      const report = await reportingService.generateUnpaidInvoicesReport(
        getCompanyId(req),
        filters
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // Rapport paiements
  async getPaymentsReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const filters = {
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        customerId: req.query.customerId as string | undefined,
        paymentMethod: req.query.paymentMethod as string | undefined,
      };

      const report = await reportingService.generatePaymentsReport(
        getCompanyId(req),
        filters
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // Rapport dépenses par fournisseur
  async getSupplierExpensesReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const filters = {
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        status: req.query.status as string | undefined,
        supplierId: req.query.supplierId as string | undefined,
      };

      const report = await reportingService.generateSupplierExpensesReport(
        getCompanyId(req),
        filters
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // Journal comptable
  async getAccountingJournal(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const filters = {
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        customerId: req.query.customerId as string | undefined,
        status: req.query.status as string | undefined,
      };

      const journal = await reportingService.generateAccountingJournal(
        getCompanyId(req),
        filters
      );

      res.json({
        success: true,
        data: journal,
      });
    } catch (error) {
      next(error);
    }
  }

  // Export CSV revenus
  async exportRevenueCSV(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const filters = {
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        customerId: req.query.customerId as string | undefined,
      };

      const report = await reportingService.generateRevenueReport(
        getCompanyId(req),
        filters
      );

      // Préparer les données CSV
      const csvData = report.byMonth.map((month) => ({
        Mois: month.month,
        Revenus: month.revenue,
        Factures: month.invoices,
        Paiements: month.payments,
      }));

      const csv = await reportingService.exportToCSV(csvData, [
        'Mois',
        'Revenus',
        'Factures',
        'Paiements',
      ]);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="revenus-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.send('\ufeff' + csv); // BOM UTF-8 pour Excel
    } catch (error) {
      next(error);
    }
  }

  // Export CSV factures impayées
  async exportUnpaidInvoicesCSV(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const filters = {
        customerId: req.query.customerId as string | undefined,
      };

      const report = await reportingService.generateUnpaidInvoicesReport(
        getCompanyId(req),
        filters
      );

      const csvData = report.invoices.map((inv) => ({
        'Numéro facture': inv.invoiceNumber,
        Client: inv.customerName,
        'Date facture': new Date(inv.invoiceDate).toLocaleDateString('fr-FR'),
        'Date échéance': new Date(inv.dueDate).toLocaleDateString('fr-FR'),
        'Montant total': inv.totalTtc,
        'Solde restant': inv.remainingBalance,
        'Jours de retard': inv.daysOverdue,
        Devise: inv.currency,
      }));

      const csv = await reportingService.exportToCSV(csvData, [
        'Numéro facture',
        'Client',
        'Date facture',
        'Date échéance',
        'Montant total',
        'Solde restant',
        'Jours de retard',
        'Devise',
      ]);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="factures-impayees-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.send('\ufeff' + csv);
    } catch (error) {
      next(error);
    }
  }

  // Export CSV paiements
  async exportPaymentsCSV(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const filters = {
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        customerId: req.query.customerId as string | undefined,
        paymentMethod: req.query.paymentMethod as string | undefined,
      };

      const report = await reportingService.generatePaymentsReport(
        getCompanyId(req),
        filters
      );

      const csvData = report.payments.map((payment) => ({
        'Date paiement': new Date(payment.paymentDate).toLocaleDateString('fr-FR'),
        'Numéro facture': payment.invoiceNumber,
        Client: payment.customerName,
        Montant: payment.amount,
        Méthode: payment.method,
        Devise: payment.currency,
      }));

      const csv = await reportingService.exportToCSV(csvData, [
        'Date paiement',
        'Numéro facture',
        'Client',
        'Montant',
        'Méthode',
        'Devise',
      ]);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="paiements-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.send('\ufeff' + csv);
    } catch (error) {
      next(error);
    }
  }

  // Export CSV journal comptable
  async exportAccountingJournalCSV(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const filters = {
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        customerId: req.query.customerId as string | undefined,
        status: req.query.status as string | undefined,
      };

      const journal = await reportingService.generateAccountingJournal(
        getCompanyId(req),
        filters
      );

      const csvData = journal.entries.map((entry) => ({
        Date: new Date(entry.date).toLocaleDateString('fr-FR'),
        Type: entry.type,
        Référence: entry.reference,
        Description: entry.description,
        Débit: entry.debit,
        Crédit: entry.credit,
        Solde: entry.balance,
        Devise: entry.currency,
      }));

      const csv = await reportingService.exportToCSV(csvData, [
        'Date',
        'Type',
        'Référence',
        'Description',
        'Débit',
        'Crédit',
        'Solde',
        'Devise',
      ]);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="journal-comptable-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.send('\ufeff' + csv);
    } catch (error) {
      next(error);
    }
  }

  // Rapports avancés
  async getAgingReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const report = await reportingService.generateAgingReport(getCompanyId(req));
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerPerformanceReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        customerId: req.query.customerId as string | undefined,
      };
      const report = await reportingService.generateCustomerPerformanceReport(getCompanyId(req), filters);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getCashFlowReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const report = await reportingService.generateCashFlowReport(getCompanyId(req), filters);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getTaxReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const report = await reportingService.generateTaxReport(getCompanyId(req), filters);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getProfitabilityReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const report = await reportingService.generateProfitabilityReport(getCompanyId(req), filters);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getForecastReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const report = await reportingService.generateForecastReport(getCompanyId(req));
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getFinancialSummaryReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not authenticated');
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const report = await reportingService.generateFinancialSummaryReport(getCompanyId(req), filters);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportingController();

