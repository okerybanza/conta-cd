import { useState, useEffect } from 'react';
import paymentService, { CreatePaymentData } from '../../services/payment.service';
import invoiceService, { Invoice } from '../../services/invoice.service';
import customerService, { Customer } from '../../services/customer.service';
import { SlideIn } from '../ui/SlideIn';
import { useToastContext } from '../../contexts/ToastContext';

interface PaymentFormSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string; // Optionnel si customerId fourni
  customerId?: string; // Optionnel si invoiceId fourni
  paymentId?: string; // Pour le mode édition
  onSuccess?: () => void;
}

export function PaymentFormSlideIn({
  isOpen,
  onClose,
  invoiceId,
  customerId,
  paymentId,
  onSuccess,
}: PaymentFormSlideInProps) {
  const { showSuccess, showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const isEdit = !!paymentId;
  const [formData, setFormData] = useState<CreatePaymentData>({
    invoiceId: invoiceId || '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    currency: 'CDF',
    status: 'confirmed',
  });

  const getSafeRemainingBalance = (
    inv: Invoice | (Invoice & { remainingBalance?: number | string }) | null
  ): number => {
    if (!inv) return 0;

    const rawRemaining = (inv as any).remainingBalance;
    const explicit = Number(rawRemaining);

    if (Number.isFinite(explicit) && explicit >= 0) {
      return explicit;
    }

    const total = Number((inv as any).totalAmount ?? (inv as any).totalTtc ?? 0);
    const paid = Number((inv as any).paidAmount ?? 0);
    const computed = total - paid;

    if (!Number.isFinite(computed)) {
      return 0;
    }

    return Math.max(0, computed);
  };

  useEffect(() => {
    if (isOpen) {
      if (isEdit && paymentId) {
        loadPayment();
      } else if (invoiceId) {
        loadInvoice();
      } else if (customerId) {
        loadCustomer();
      }
    }
  }, [isOpen, invoiceId, customerId, paymentId, isEdit]);

  useEffect(() => {
    if (customerId && !invoiceId) {
      loadCustomerInvoices();
    }
  }, [customerId, invoiceId]);

  const loadCustomer = async () => {
    if (!customerId) return;
    try {
      const data = await customerService.getById(customerId);
      setCustomer(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du client');
    }
  };

  const loadCustomerInvoices = async () => {
    if (!customerId) return;
    try {
      const response = await invoiceService.list({
        customerId: customerId,
        limit: 100,
      });
      // Filtrer les factures avec solde restant
      const unpaidInvoices = response.data.filter((inv: Invoice) => {
        const remaining = getSafeRemainingBalance(inv);
        return (
          remaining > 0 &&
          (inv.status === 'sent' || inv.status === 'partially_paid' || inv.status === 'draft')
        );
      });
      setCustomerInvoices(unpaidInvoices);
    } catch (err: any) {
      console.error('Erreur lors du chargement des factures:', err);
    }
  };

  const loadPayment = async () => {
    if (!paymentId) return;
    try {
      setLoading(true);
      const payment = await paymentService.getById(paymentId);
      setFormData({
        invoiceId: payment.invoiceId,
        amount: Number(payment.amount),
        currency: payment.currency || 'CDF',
        paymentDate: payment.paymentDate.split('T')[0],
        paymentMethod: payment.paymentMethod as any,
        mobileMoneyProvider: payment.mobileMoneyProvider || '',
        mobileMoneyNumber: payment.mobileMoneyNumber || '',
        transactionReference: payment.transactionReference || '',
        bankName: payment.bankName || '',
        checkNumber: payment.checkNumber || '',
        cardLastFour: payment.cardLastFour || '',
        reference: payment.reference || '',
        notes: payment.notes || '',
        status: payment.status,
      });
      if (payment.invoice) {
        setInvoice(payment.invoice as any);
      } else if (payment.invoiceId) {
        // Charger la facture si elle n'est pas incluse
        await loadInvoiceById(payment.invoiceId);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceById = async (invId: string) => {
    try {
      const data = await invoiceService.getById(invId);
      setInvoice(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement de la facture:', err);
    }
  };

  const loadInvoice = async () => {
    if (!invoiceId) return;
    try {
      const data = await invoiceService.getById(invoiceId);
      setInvoice(data);
      const remaining = getSafeRemainingBalance(data);
      setFormData((prev) => ({
        ...prev,
        invoiceId: invoiceId,
        amount: remaining,
        currency: data.currency || 'CDF',
      }));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de la facture');
    }
  };

  const handleInvoiceSelect = async (selectedInvoiceId: string) => {
    try {
      const data = await invoiceService.getById(selectedInvoiceId);
      setInvoice(data);
      const remaining = getSafeRemainingBalance(data);
      setFormData((prev) => ({
        ...prev,
        invoiceId: selectedInvoiceId,
        amount: remaining,
        currency: data.currency || 'CDF',
      }));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de la facture');
    }
  };

  const getCustomerName = (cust: Customer | null): string => {
    if (!cust) return '';
    if (cust.type === 'particulier') {
      return `${cust.firstName || ''} ${cust.lastName || ''}`.trim();
    }
    return cust.businessName || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.invoiceId) {
      setError('Veuillez sélectionner une facture');
      return;
    }

    if (formData.amount <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    // Validation montant max (solde restant)
    if (invoice) {
      const maxAmount = getSafeRemainingBalance(invoice);
      if (formData.amount > maxAmount) {
        setError(
          `Le montant ne peut pas dépasser le solde restant de ${formatPrice(maxAmount, invoice.currency || 'CDF')}`
        );
        return;
      }
    }

    // Règle métier: pour les entreprises, un paiement doit avoir une référence
    const isEnterpriseCustomer = (invoice as any)?.customer?.type === 'entreprise';
    if (isEnterpriseCustomer) {
      const hasReference =
        !!formData.transactionReference ||
        !!formData.checkNumber ||
        !!formData.cardLastFour ||
        !!formData.reference ||
        !!formData.mobileMoneyNumber;

      if (!hasReference) {
        setError(
          'Pour les clients entreprise, une référence de paiement est obligatoire (référence, numéro de chèque, transaction, etc.).'
        );
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (isEdit && paymentId) {
        await paymentService.update(paymentId, formData);
        showSuccess('Paiement modifié avec succès !');
      } else {
        await paymentService.create(formData);
        showSuccess('Paiement enregistré avec succès !');
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreatePaymentData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAmountChange = (value: number) => {
    if (invoice) {
      const maxAmount = getSafeRemainingBalance(invoice);
      const amount = Math.min(Math.max(0, value), maxAmount);
      setFormData((prev) => ({ ...prev, amount }));
    } else {
      setFormData((prev) => ({ ...prev, amount: Math.max(0, value) }));
    }
  };

  const formatPrice = (price: number, currency: string = 'CDF') => {
    if (isNaN(price) || price === null || price === undefined) return '0,00 CDF';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <SlideIn
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Modifier le paiement' : 'Enregistrer un paiement'}
      size="lg"
    >
      {loading && isEdit ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

        {/* Affichage client si customerId fourni */}
        {customer && !invoice && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-600">Client</label>
            <p className="font-semibold text-lg">{getCustomerName(customer)}</p>
          </div>
        )}

        {/* Sélection facture si customerId fourni et pas en mode édition */}
        {customer && !invoice && !isEdit && (
          <div className="mb-4">
            {customerInvoices.length > 0 ? (
              <>
                <label className="block text-sm font-medium mb-1">Facture impayée *</label>
                <select
                  value={formData.invoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="input w-full"
                  required
                >
                  <option value="">Sélectionner une facture</option>
                  {customerInvoices.map((inv) => {
                    const remaining = getSafeRemainingBalance(inv);
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} -{' '}
                        {formatPrice(remaining, inv.currency || 'CDF')} restant
                      </option>
                    );
                  })}
                </select>
              </>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Aucune facture impayée pour ce client
                </p>
              </div>
            )}
          </div>
        )}

        {invoice && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Facture {invoice.invoiceNumber}</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 block mb-1">Total TTC:</span>
                <p className="font-semibold text-lg">
                  {formatPrice(
                    Number(
                      (invoice as any).totalTtc ??
                      (invoice as any).totalAmount ??
                      0
                    ),
                    invoice.currency || 'CDF'
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Montant payé:</span>
                <p className="font-semibold text-lg text-green-600">
                  {formatPrice(Number(invoice.paidAmount || 0), invoice.currency || 'CDF')}
                </p>
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Solde restant:</span>
                <p className="font-semibold text-lg text-red-600">
                  {formatPrice(getSafeRemainingBalance(invoice), invoice.currency || 'CDF')}
                </p>
              </div>
            </div>
            {formData.amount > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Montant du paiement:</span>
                  <span className="font-bold text-lg text-blue-700">
                    {formatPrice(formData.amount, invoice.currency || 'CDF')}
                  </span>
                </div>
                {formData.amount < getSafeRemainingBalance(invoice) && (
                  <div className="mt-2 text-sm text-orange-600">
                    ⚠️ Paiement partiel - Solde restant après ce paiement:{' '}
                    {formatPrice(
                      getSafeRemainingBalance(invoice) - formData.amount,
                      invoice.currency || 'CDF'
                    )}
                  </div>
                )}
                {formData.amount === getSafeRemainingBalance(invoice) && (
                  <div className="mt-2 text-sm text-green-600">
                    ✅ Ce paiement couvrira entièrement la facture
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message si pas de facture sélectionnée (uniquement en mode création) */}
        {!invoice && !customer && !isEdit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Veuillez sélectionner une facture pour continuer
            </p>
          </div>
        )}

        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Montant *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={invoice ? getSafeRemainingBalance(invoice) : undefined}
              value={Number.isFinite(formData.amount) ? formData.amount : ''}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              required
              className="input"
              placeholder="Montant à payer"
            />
            {invoice && !isEdit && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">
                  Solde disponible:{' '}
                  {formatPrice(getSafeRemainingBalance(invoice), invoice.currency || 'CDF')}
                </p>
                <button
                  type="button"
                  onClick={() => handleAmountChange(getSafeRemainingBalance(invoice))}
                  className="text-xs text-primary hover:underline"
                >
                  Utiliser le solde complet
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date de paiement *</label>
            <input
              type="date"
              value={
                typeof formData.paymentDate === 'string'
                  ? formData.paymentDate
                  : formData.paymentDate
                  ? typeof formData.paymentDate === 'object' && 'toISOString' in formData.paymentDate
                    ? formData.paymentDate.toISOString().split('T')[0]
                    : ''
                  : ''
              }
              onChange={(e) => handleChange('paymentDate', e.target.value)}
              required
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mode de paiement *</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
              required
              className="input"
            >
              <option value="cash">Espèces</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Virement bancaire</option>
              <option value="check">Chèque</option>
              <option value="card">Carte bancaire</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Devise</label>
            <select
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="input"
            >
              <option value="CDF">CDF</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Champs conditionnels selon mode de paiement */}
        {formData.paymentMethod === 'mobile_money' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Opérateur *</label>
              <select
                value={formData.mobileMoneyProvider || ''}
                onChange={(e) => handleChange('mobileMoneyProvider', e.target.value)}
                required
                className="input"
              >
                <option value="">Sélectionner</option>
                <option value="orange_money">Orange Money</option>
                <option value="m_pesa">M-Pesa</option>
                <option value="airtel_money">Airtel Money</option>
                <option value="afrimoney">Afrimoney</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Numéro *</label>
              <input
                type="text"
                value={formData.mobileMoneyNumber || ''}
                onChange={(e) => handleChange('mobileMoneyNumber', e.target.value)}
                required
                className="input"
                placeholder="+243 XXX XXX XXX"
              />
            </div>
          </div>
        )}

        {formData.paymentMethod === 'bank_transfer' && (
          <div>
            <label className="block text-sm font-medium mb-1">Banque *</label>
            <input
              type="text"
              value={formData.bankName || ''}
              onChange={(e) => handleChange('bankName', e.target.value)}
              required
              className="input"
              placeholder="Nom de la banque"
            />
          </div>
        )}

        {formData.paymentMethod === 'check' && (
          <div>
            <label className="block text-sm font-medium mb-1">Numéro de chèque *</label>
            <input
              type="text"
              value={formData.checkNumber || ''}
              onChange={(e) => handleChange('checkNumber', e.target.value)}
              required
              className="input"
            />
          </div>
        )}

        {formData.paymentMethod === 'card' && (
          <div>
            <label className="block text-sm font-medium mb-1">4 derniers chiffres</label>
            <input
              type="text"
              maxLength={4}
              value={formData.cardLastFour || ''}
              onChange={(e) =>
                handleChange('cardLastFour', e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              className="input"
              placeholder="1234"
            />
          </div>
        )}

        {/* Références */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Référence transaction</label>
            <input
              type="text"
              value={formData.transactionReference || ''}
              onChange={(e) => handleChange('transactionReference', e.target.value || undefined)}
              className="input"
              placeholder="Référence de la transaction"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Référence</label>
            <input
              type="text"
              value={formData.reference || ''}
              onChange={(e) => handleChange('reference', e.target.value || undefined)}
              className="input"
            />
          </div>
        </div>

        {/* Statut */}
        <div>
          <label className="block text-sm font-medium mb-1">Statut</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="input"
          >
            <option value="confirmed">Confirmé</option>
            <option value="pending">En attente</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value || undefined)}
            className="input"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={loading || (!isEdit && !formData.invoiceId)}>
            {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Enregistrer'}
          </button>
        </div>
      </form>
      )}
    </SlideIn>
  );
}
