// SPRINT 3 - TASK 3.1 (ARCH-004): InvoiceService Facade
// This service now delegates to specialized sub-services for better maintainability

import invoiceCoreService from './invoice/invoiceCore.service';
import invoiceWorkflowService from './invoice/invoiceWorkflow.service';
import invoiceAccountingService from './invoice/invoiceAccounting.service';
import invoiceHelperService from './invoice/invoiceHelper.service';
import invoiceCreationService from './invoice/invoiceCreation.service';
import invoiceUpdateService from './invoice/invoiceUpdate.service';
import invoiceDeleteService from './invoice/invoiceDelete.service';
import { CreateInvoiceData, InvoiceFilters, UpdateInvoiceData, InvoiceLineData } from './invoice/invoiceHelper.service';

export { CreateInvoiceData, InvoiceFilters, UpdateInvoiceData, InvoiceLineData };

export class InvoiceService {
  // Delegate to Helper Service
  private async generateInvoiceNumber(companyId: string): Promise<string> {
    return invoiceHelperService.generateInvoiceNumber(companyId);
  }

  private calculateTotals(lines: InvoiceLineData[], transportFees = 0, platformFees = 0) {
    return invoiceHelperService.calculateTotals(lines, transportFees, platformFees);
  }

  async create(companyId: string, userId: string, data: CreateInvoiceData) {
    return invoiceCreationService.create(companyId, userId, data);
  }

  // Delegate CRUD to Core Service
  async getInvoiceId(companyId: string, identifier: string): Promise<string> {
    return invoiceCoreService.getInvoiceId(companyId, identifier);
  }

  async getById(companyId: string, invoiceId: string) {
    return invoiceCoreService.getById(companyId, invoiceId);
  }

  async list(companyId: string, filters: InvoiceFilters = {}) {
    return invoiceCoreService.list(companyId, filters);
  }

  // UpdateStatus delegates to Workflow Service
  async updateStatus(companyId: string, invoiceId: string, status: string, userId?: string, justification?: string) {
    return invoiceWorkflowService.updateStatus(companyId, invoiceId, status, userId, justification);
  }

  // Accounting delegates to Accounting Service
  async createJournalEntryForInvoice(companyId: string, invoice: any, userId?: string) {
    return invoiceAccountingService.createJournalEntryForInvoice(companyId, invoice, userId);
  }

  async update(companyId: string, invoiceId: string, data: UpdateInvoiceData, userId?: string) {
    return invoiceUpdateService.update(companyId, invoiceId, data, userId);
  }

  async delete(companyId: string, invoiceId: string, userId?: string, justification?: string) {
    return invoiceDeleteService.delete(companyId, invoiceId, userId, justification);
  }

  async duplicate(companyId: string, invoiceId: string, userId: string) {
    return invoiceCreationService.duplicate(companyId, invoiceId, userId);
  }
}

export default new InvoiceService();
