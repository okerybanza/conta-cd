import api from './api';

export interface CreditNote {
  id: string;
  companyId: string;
  invoiceId: string;
  creditNoteNumber: string;
  creditNoteDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'applied' | 'cancelled';
  reason: string;
  reference?: string;
  currency?: string;
  templateId?: string;
  notes?: string;
  footerText?: string;
  returnStock?: boolean;
  lines?: CreditNoteLine[];
  appliedAmount: number;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
  invoices?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
  };
  users?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export interface CreditNoteLine {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  taxAmount?: number;
  subtotal?: number;
  total?: number;
  product?: {
    id: string;
    name: string;
  };
}

export interface CreateCreditNoteData {
  invoiceId: string;
  amount: number;
  taxAmount?: number;
  reason: string;
  reference?: string;
  notes?: string;
  creditNoteDate?: string;
  currency?: string;
  templateId?: string;
  footerText?: string;
  returnStock?: boolean;
  lines?: CreditNoteLine[];
}

export interface UpdateCreditNoteData {
  reason?: string;
  reference?: string;
  notes?: string;
  footerText?: string;
  status?: 'draft' | 'sent' | 'applied' | 'cancelled';
  returnStock?: boolean;
}

const mapCreditNoteLine = (line: any): CreditNoteLine => ({
  id: line.id,
  productId: line.product_id || line.productId,
  description: line.description,
  quantity: Number(line.quantity || 0),
  unitPrice: Number(line.unit_price ?? line.unitPrice ?? 0),
  taxRate: Number(line.tax_rate ?? line.taxRate ?? 0),
  taxAmount: Number(line.tax_amount ?? line.taxAmount ?? 0),
  subtotal: Number(line.subtotal ?? 0),
  total: Number(line.total ?? 0),
  product: line.products
    ? { id: line.products.id, name: line.products.name }
    : line.product,
});

const mapCreditNote = (data: any): CreditNote => {
  if (!data) return data;

  return {
    id: data.id,
    companyId: data.company_id || data.companyId,
    invoiceId: data.invoice_id || data.invoiceId,
    creditNoteNumber: data.credit_note_number || data.creditNoteNumber,
    creditNoteDate: data.credit_note_date || data.creditNoteDate,
    amount: Number(data.amount || 0),
    taxAmount: Number(data.tax_amount || data.taxAmount || 0),
    totalAmount: Number(data.total_amount || data.totalAmount || 0),
    status: data.status,
    reason: data.reason,
    reference: data.reference,
    currency: data.currency,
    templateId: data.template_id || data.templateId,
    notes: data.notes,
    footerText: data.footer_text || data.footerText,
    returnStock: data.return_stock ?? data.returnStock,
    lines: data.credit_note_lines
      ? data.credit_note_lines.map(mapCreditNoteLine)
      : (data.lines ? data.lines.map(mapCreditNoteLine) : undefined),
    appliedAmount: Number(data.applied_amount || data.appliedAmount || 0),
    appliedAt: data.applied_at || data.appliedAt,
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
    invoices: data.invoices ? {
      id: data.invoices.id,
      invoiceNumber: data.invoices.invoice_number || data.invoices.invoiceNumber,
      totalAmount: Number(data.invoices.total_amount || data.invoices.totalAmount || 0),
      paidAmount: Number(data.invoices.paid_amount || data.invoices.paidAmount || 0),
      status: data.invoices.status,
    } : data.invoices,
    users: data.users ? {
      id: data.users.id,
      firstName: data.users.first_name || data.users.firstName,
      lastName: data.users.last_name || data.users.lastName,
      email: data.users.email,
    } : data.users,
  };
};

class CreditNoteService {
  /**
   * Créer un avoir
   */
  async create(data: CreateCreditNoteData): Promise<CreditNote> {
    const response = await api.post('/credit-notes', data);
    return mapCreditNote(response.data.data);
  }

  /**
   * Obtenir un avoir par ID
   */
  async getById(id: string): Promise<CreditNote> {
    const response = await api.get(`/credit-notes/${id}`);
    return mapCreditNote(response.data.data);
  }

  /**
   * Lister les avoirs
   */
  async list(filters?: {
    invoiceId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: CreditNote[]; pagination: any }> {
    const response = await api.get('/credit-notes', { params: filters });
    return {
      data: response.data.data.map(mapCreditNote),
      pagination: response.data.pagination,
    };
  }

  /**
   * Mettre à jour un avoir
   */
  async update(id: string, data: UpdateCreditNoteData): Promise<CreditNote> {
    const response = await api.put(`/credit-notes/${id}`, data);
    return mapCreditNote(response.data.data);
  }

  /**
   * Supprimer un avoir
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/credit-notes/${id}`);
  }

  /**
   * Appliquer un avoir à une facture
   */
  async apply(id: string): Promise<CreditNote> {
    const response = await api.post(`/credit-notes/${id}/apply`);
    return mapCreditNote(response.data.data);
  }
}

export default new CreditNoteService();

