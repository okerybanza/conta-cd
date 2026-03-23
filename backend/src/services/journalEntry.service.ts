// SPRINT 3 - TASK 3.1 (ARCH-004): JournalEntryService Facade
// This service now delegates to specialized sub-services for better maintainability

import journalEntryCoreService from './journalEntry/journalEntryCore.service';
import journalEntryWorkflowService from './journalEntry/journalEntryWorkflow.service';
import journalEntryAutomationService from './journalEntry/journalEntryAutomation.service';
import journalEntryHelperService, { JournalEntryLineData } from './journalEntry/journalEntryHelper.service';
import { CreateJournalEntryData, UpdateJournalEntryData, JournalEntryFilters, JournalEntrySourceType, JournalEntryStatus } from './journalEntry/journalEntryCore.service';

export { JournalEntryLineData, CreateJournalEntryData, UpdateJournalEntryData, JournalEntryFilters, JournalEntrySourceType, JournalEntryStatus };

export class JournalEntryService {
  // Delegate Helper Methods (private but kept for internal facade compatibility)
  private async getAccountBySettingOrCode(companyId: string, settingKey: string, defaultCode: string) {
    return journalEntryHelperService.getAccountBySettingOrCode(companyId, settingKey, defaultCode);
  }

  private async generateEntryNumber(companyId: string): Promise<string> {
    return journalEntryHelperService.generateEntryNumber(companyId);
  }

  private validateBalance(lines: JournalEntryLineData[]): void {
    return journalEntryHelperService.validateBalance(lines);
  }

  // Core CRUD Operations
  async create(companyId: string, data: CreateJournalEntryData) {
    return journalEntryCoreService.create(companyId, data);
  }

  async getById(companyId: string, entryId: string) {
    return journalEntryCoreService.getById(companyId, entryId);
  }

  async list(companyId: string, filters: JournalEntryFilters = {}) {
    return journalEntryCoreService.list(companyId, filters);
  }

  async update(companyId: string, entryId: string, data: UpdateJournalEntryData) {
    return journalEntryCoreService.update(companyId, entryId, data);
  }

  async delete(companyId: string, entryId: string) {
    return journalEntryCoreService.delete(companyId, entryId);
  }

  // Workflow Operations
  async post(companyId: string, entryId: string) {
    return journalEntryWorkflowService.post(companyId, entryId);
  }

  async reverse(companyId: string, entryId: string, userId: string, reason: string) {
    return journalEntryWorkflowService.reverse(companyId, entryId, userId, reason);
  }

  // Automation Operations
  async createForInvoice(companyId: string, invoiceId: string, invoiceData: any) {
    return journalEntryAutomationService.createForInvoice(companyId, invoiceId, invoiceData);
  }

  async createForCreditNote(companyId: string, creditNoteId: string, creditNoteData: any) {
    return journalEntryAutomationService.createForCreditNote(companyId, creditNoteId, creditNoteData);
  }

  async ensureForCreditNote(companyId: string, creditNoteId: string, creditNoteData: any) {
    return journalEntryAutomationService.ensureForCreditNote(companyId, creditNoteId, creditNoteData);
  }

  async ensureForInvoice(companyId: string, invoiceId: string, invoiceData: any) {
    return journalEntryAutomationService.ensureForInvoice(companyId, invoiceId, invoiceData);
  }

  async createForExpense(companyId: string, expenseId: string, expenseData: any) {
    return journalEntryAutomationService.createForExpense(companyId, expenseId, expenseData);
  }

  async ensureForExpense(companyId: string, expenseId: string, expenseData: any) {
    return journalEntryAutomationService.ensureForExpense(companyId, expenseId, expenseData);
  }

  async deleteForInvoice(companyId: string, invoiceId: string) {
    return journalEntryAutomationService.deleteForInvoice(companyId, invoiceId);
  }

  async createForPayment(companyId: string, paymentId: string, paymentData: any) {
    return journalEntryAutomationService.createForPayment(companyId, paymentId, paymentData);
  }
}

export default new JournalEntryService();
