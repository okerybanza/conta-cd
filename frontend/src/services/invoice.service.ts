import api from './api';

export interface InvoiceLine {
  id?: string;
  productId?: string;
  name: string;
  description?: string;
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

export interface Invoice {
  id: string;
  companyId: string;
  customerId: string;
  invoiceNumber: string;
  invoicePrefix?: string;
  sequentialNumber?: number;
  invoiceDate: string;
  dueDate?: string;
  paidAt?: string;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'cancelled';
  reference?: string;
  poNumber?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  subtotal: number;
  transportFees?: number;
  platformFees?: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount?: number;
  currency?: string;
  templateId?: string;
  isRdcNormalized?: boolean;
  qrCodeUrl?: string;
  qrCodeData?: string;
  notes?: string;
  paymentTerms?: string;
  footerText?: string;
  sentAt?: string;
  sentVia?: string;
  viewCount?: number;
  lastViewedAt?: string;
  createdBy?: string;
  customer?: {
    id: string;
    type: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    email?: string;
  };
  lines?: InvoiceLine[];
  payments?: any[];
  creator?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceData {
  customerId: string;
  invoiceDate?: Date | string;
  dueDate?: Date | string;
  reference?: string;
  poNumber?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  transportFees?: number;
  platformFees?: number;
  currency?: string;
  templateId?: string;
  notes?: string;
  paymentTerms?: string;
  footerText?: string;
  lines: InvoiceLine[];
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  lines?: InvoiceLine[];
}

export interface InvoiceFilters {
  customerId?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceListResponse {
  success: boolean;
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper to map snake_case backend response to camelCase frontend interface
const mapInvoice = (data: any): Invoice => {
  if (!data) return data;

  return {
    id: data.id,
    companyId: data.company_id || data.companyId,
    customerId: data.customer_id || data.customerId,
    invoiceNumber: data.invoice_number || data.invoiceNumber,
    invoicePrefix: data.invoice_prefix || data.invoicePrefix,
    sequentialNumber: data.sequential_number || data.sequentialNumber,
    invoiceDate: data.invoice_date || data.invoiceDate,
    dueDate: data.due_date || data.dueDate,
    paidAt: data.paid_at || data.paidAt,
    status: data.status,
    reference: data.reference,
    poNumber: data.po_number || data.poNumber,
    shippingAddress: data.shipping_address || data.shippingAddress,
    shippingCity: data.shipping_city || data.shippingCity,
    shippingCountry: data.shipping_country || data.shippingCountry,
    subtotal: Number(data.subtotal),
    transportFees: Number(data.transport_fees || data.transportFees || 0),
    platformFees: Number(data.platform_fees || data.platformFees || 0),
    taxAmount: Number(data.tax_amount || data.taxAmount),
    totalAmount: Number(data.total_amount || data.totalAmount),
    paidAmount: Number(data.paid_amount || data.paidAmount || 0),
    currency: data.currency,
    templateId: data.template_id || data.templateId,
    isRdcNormalized: data.is_rdc_normalized || data.isRdcNormalized,
    qrCodeUrl: data.qr_code_url || data.qrCodeUrl,
    qrCodeData: data.qr_code_data || data.qrCodeData,
    notes: data.notes,
    paymentTerms: data.payment_terms || data.paymentTerms,
    footerText: data.footer_text || data.footerText,
    sentAt: data.sent_at || data.sentAt,
    sentVia: data.sent_via || data.sentVia,
    viewCount: data.view_count || data.viewCount,
    lastViewedAt: data.last_viewed_at || data.lastViewedAt,
    createdBy: data.created_by || data.createdBy,
    customer: data.customers ? {
      id: data.customers.id,
      type: data.customers.type,
      firstName: data.customers.first_name,
      lastName: data.customers.last_name,
      businessName: data.customers.business_name,
      email: data.customers.email,
    } : data.customer,
    lines: data.invoice_lines ? data.invoice_lines.map((line: any) => ({
      id: line.id,
      productId: line.product_id,
      name: line.name,
      description: line.description,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unit_price),
      taxRate: Number(line.tax_rate),
      taxAmount: Number(line.tax_amount),
      subtotal: Number(line.subtotal),
      total: Number(line.total),
    })) : data.lines,
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
  };
};

class InvoiceService {
  async create(data: CreateInvoiceData): Promise<Invoice> {
    const response = await api.post('/invoices', data);
    return mapInvoice(response.data.data);
  }

  async getById(id: string): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}`);
    return mapInvoice(response.data.data);
  }

  async list(filters?: InvoiceFilters): Promise<InvoiceListResponse> {
    const response = await api.get('/invoices', { params: filters });
    return {
      ...response.data,
      data: response.data.data.map(mapInvoice),
    };
  }

  async update(id: string, data: UpdateInvoiceData): Promise<Invoice> {
    const response = await api.put(`/invoices/${id}`, data);
    return mapInvoice(response.data.data);
  }

  async delete(id: string, justification?: string): Promise<void> {
    await api.delete(`/invoices/${id}`, {
      data: { justification } // Pass justification in body for delete
    });
  }

  async duplicate(id: string): Promise<Invoice> {
    const response = await api.post(`/invoices/${id}/duplicate`);
    return mapInvoice(response.data.data);
  }

  async updateStatus(id: string, status: string, justification?: string): Promise<Invoice> {
    const response = await api.patch(`/invoices/${id}/status`, {
      status,
      justification
    });
    return mapInvoice(response.data.data);
  }
}

export default new InvoiceService();
