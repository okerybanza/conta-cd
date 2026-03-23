import { useState, useEffect } from 'react';
import creditNoteService, { CreateCreditNoteData } from '../../services/creditNote.service';
import invoiceService, { Invoice, InvoiceLine } from '../../services/invoice.service';
import { SlideIn } from '../ui/SlideIn';
import { useToastContext } from '../../contexts/ToastContext';

type CreditNoteLineDraft = {
  sourceLineId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  maxQuantity: number;
};

interface CreditNoteFormSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  onSuccess?: () => void;
}

export function CreditNoteFormSlideIn({
  isOpen,
  onClose,
  invoiceId,
  onSuccess,
}: CreditNoteFormSlideInProps) {
  const { showSuccess, showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [creditNoteLines, setCreditNoteLines] = useState<CreditNoteLineDraft[]>([]);
  const [formData, setFormData] = useState<CreateCreditNoteData>({
    invoiceId: invoiceId || '',
    amount: 0,
    taxAmount: 0,
    reason: '',
    reference: '',
    notes: '',
    creditNoteDate: new Date().toISOString().split('T')[0],
    returnStock: false,
  });

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadInvoice();
    }
  }, [isOpen, invoiceId]);

  const loadInvoice = async () => {
    try {
      const data = await invoiceService.getById(invoiceId);
      setInvoice(data);
      // Calculer le montant disponible pour l'avoir
      const invoiceTotal = Number(data.totalAmount || 0);
      const invoicePaid = Number(data.paidAmount || 0);
      const availableAmount = invoiceTotal - invoicePaid;
      // Pré-remplir avec le montant disponible
      setFormData((prev) => ({
        ...prev,
        invoiceId: invoiceId,
        amount: availableAmount,
        currency: data.currency || 'CDF',
        returnStock: Number(data.paidAmount || 0) === 0 ? prev.returnStock : false,
      }));
      setCreditNoteLines(buildLinesFromInvoice(data.lines || []));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de la facture');
    }
  };

  const buildLinesFromInvoice = (lines: InvoiceLine[]): CreditNoteLineDraft[] => {
    return (lines || [])
      .filter((line) => line.productId && Number(line.quantity || 0) > 0)
      .map((line) => ({
        sourceLineId: line.id || `${line.productId}-${Math.random().toString(36).slice(2, 8)}`,
        productId: line.productId,
        description: line.description || line.name || 'Produit',
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
        taxRate: Number(line.taxRate || 0),
        maxQuantity: Number(line.quantity || 0),
      }));
  };

  const calculateLineTotals = (lines: CreditNoteLineDraft[]) => {
    let subtotal = 0;
    let tax = 0;
    lines.forEach((line) => {
      const lineSubtotal = line.quantity * line.unitPrice;
      const lineTax = lineSubtotal * ((line.taxRate || 0) / 100);
      subtotal += lineSubtotal;
      tax += lineTax;
    });
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.invoiceId) {
      setError('Veuillez sélectionner une facture');
      return;
    }

    if (formData.amount <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Veuillez indiquer la raison de l\'avoir');
      return;
    }

    const totals = calculateLineTotals(creditNoteLines);
    const effectiveTotal = formData.returnStock
      ? totals.total
      : (formData.amount || 0) + (formData.taxAmount || 0);

    // Vérifier que le montant ne dépasse pas le montant disponible
    if (invoice) {
      const invoiceTotal = Number(invoice.totalAmount || 0);
      const invoicePaid = Number(invoice.paidAmount || 0);
      const availableAmount = invoiceTotal - invoicePaid;

      if (effectiveTotal > availableAmount) {
        setError(
          `Le montant de l'avoir ne peut pas dépasser le montant restant de ${formatPrice(availableAmount, invoice.currency || 'CDF')}`
        );
        return;
      }

      if (formData.returnStock && invoicePaid > 0) {
        setError('Retour stock impossible : la facture a déjà reçu des paiements');
        return;
      }
    }

    if (formData.returnStock) {
      const validLines = creditNoteLines.filter((line) => line.quantity > 0);
      if (validLines.length === 0) {
        setError('Veuillez sélectionner au moins une ligne pour le retour en stock');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const payload: CreateCreditNoteData = {
        ...formData,
        amount: formData.returnStock ? totals.subtotal : formData.amount,
        taxAmount: formData.returnStock ? totals.tax : formData.taxAmount,
        lines: formData.returnStock
          ? creditNoteLines
              .filter((line) => line.quantity > 0)
              .map((line) => ({
                productId: line.productId,
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                taxRate: line.taxRate,
              }))
          : undefined,
      };
      await creditNoteService.create(payload);
      showSuccess('Avoir créé avec succès !');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateCreditNoteData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAmountChange = (value: number) => {
    if (invoice) {
      const invoiceTotal = Number(invoice.totalAmount || 0);
      const invoicePaid = Number(invoice.paidAmount || 0);
      const availableAmount = invoiceTotal - invoicePaid;
      const amount = Math.min(Math.max(0, value), availableAmount);
      setFormData((prev) => ({ ...prev, amount }));
    } else {
      setFormData((prev) => ({ ...prev, amount: Math.max(0, value) }));
    }
  };

  const handleTotalAmount = () => {
    if (invoice) {
      const invoiceTotal = Number(invoice.totalAmount || 0);
      const invoicePaid = Number(invoice.paidAmount || 0);
      const availableAmount = invoiceTotal - invoicePaid;
      setFormData((prev) => ({ ...prev, amount: availableAmount }));
    }
  };

  const formatPrice = (price: number, currency: string = 'CDF') => {
    if (isNaN(price) || price === null || price === undefined) return '0,00 CDF';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const invoiceTotal = invoice ? Number(invoice.totalAmount || 0) : 0;
  const invoicePaid = invoice ? Number(invoice.paidAmount || 0) : 0;
  const availableAmount = invoiceTotal - invoicePaid;
  const lineTotals = calculateLineTotals(creditNoteLines);
  const totalTtc = formData.returnStock
    ? lineTotals.total
    : (formData.amount || 0) + (formData.taxAmount || 0);
  const canReturnStock = invoice ? Number(invoice.paidAmount || 0) === 0 : false;
  const hasStockableLines = (invoice?.lines || []).some((line) => line.productId);

  return (
    <SlideIn isOpen={isOpen} onClose={onClose} title="Créer un avoir" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {invoice && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Facture {invoice.invoiceNumber}</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 block mb-1">Montant total:</span>
                <p className="font-semibold text-lg">
                  {formatPrice(invoiceTotal, invoice.currency || 'CDF')}
                </p>
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Montant payé:</span>
                <p className="font-semibold text-lg text-green-600">
                  {formatPrice(invoicePaid, invoice.currency || 'CDF')}
                </p>
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Montant disponible:</span>
                <p className="font-semibold text-lg text-red-600">
                  {formatPrice(availableAmount, invoice.currency || 'CDF')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Date de l'avoir *</label>
          <input
            type="date"
            value={formData.creditNoteDate}
            onChange={(e) => handleChange('creditNoteDate', e.target.value)}
            required
            className="input"
          />
        </div>

        {/* Montant HT */}
        <div>
          <label className="block text-sm font-medium mb-1">Montant HT *</label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.01"
              min="0"
              max={availableAmount}
              value={formData.returnStock ? lineTotals.subtotal : formData.amount}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              disabled={!!formData.returnStock}
              required
              className="input flex-1"
            />
            <button
              type="button"
              onClick={handleTotalAmount}
              disabled={!!formData.returnStock}
              className="btn-secondary text-sm whitespace-nowrap"
            >
              Montant total
            </button>
          </div>
          {invoice && (
            <p className="mt-1 text-xs text-gray-500">
              Disponible: {formatPrice(availableAmount, invoice.currency || 'CDF')}
            </p>
          )}
        </div>

        {/* TVA */}
        <div>
          <label className="block text-sm font-medium mb-1">TVA (optionnel)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.returnStock ? lineTotals.tax : formData.taxAmount || 0}
            onChange={(e) => handleChange('taxAmount', parseFloat(e.target.value) || 0)}
            disabled={!!formData.returnStock}
            className="input"
          />
        </div>

        {/* Montant total TTC (calculé) */}
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-600 mb-1">Montant total TTC</div>
          <div className="text-xl font-bold text-gray-900">
            {formatPrice(totalTtc, invoice?.currency || 'CDF')}
          </div>
        </div>

        {/* Retour stock */}
        <div className="p-3 bg-gray-50 rounded-md">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={!!formData.returnStock}
              onChange={(e) => {
                const nextValue = e.target.checked;
                handleChange('returnStock', nextValue);
                if (nextValue && creditNoteLines.length === 0 && invoice) {
                  setCreditNoteLines(buildLinesFromInvoice(invoice.lines || []));
                }
              }}
              disabled={!canReturnStock || !hasStockableLines}
            />
            Retourner les articles en stock
          </label>
          {!canReturnStock && (
            <p className="mt-1 text-xs text-gray-500">
              Option disponible uniquement si la facture n'a reçu aucun paiement.
            </p>
          )}
          {!hasStockableLines && (
            <p className="mt-1 text-xs text-gray-500">
              Aucun article de stock trouvé sur cette facture.
            </p>
          )}
        </div>

        {/* Lignes retour stock */}
        {formData.returnStock && (
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-semibold mb-3">Articles retournés</h4>
            {creditNoteLines.length === 0 ? (
              <p className="text-xs text-gray-500">Aucune ligne disponible.</p>
            ) : (
              <div className="space-y-3">
                {creditNoteLines.map((line, index) => (
                  <div key={line.sourceLineId} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6 text-sm text-gray-700">
                      {line.description}
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={line.maxQuantity}
                        value={line.quantity}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const quantity = Math.min(Math.max(0, value), line.maxQuantity);
                          setCreditNoteLines((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, quantity } : item))
                          );
                        }}
                        className="input"
                      />
                    </div>
                    <div className="col-span-3 text-right text-sm text-gray-600">
                      {formatPrice(line.quantity * line.unitPrice, invoice?.currency || 'CDF')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Raison */}
        <div>
          <label className="block text-sm font-medium mb-1">Raison *</label>
          <textarea
            value={formData.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            required
            rows={3}
            className="input"
            placeholder="Raison de l'avoir (ex: Retour produit, Erreur de facturation, etc.)"
          />
        </div>

        {/* Référence */}
        <div>
          <label className="block text-sm font-medium mb-1">Référence</label>
          <input
            type="text"
            value={formData.reference || ''}
            onChange={(e) => handleChange('reference', e.target.value || undefined)}
            className="input"
            placeholder="Référence optionnelle"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value || undefined)}
            rows={3}
            className="input"
            placeholder="Notes additionnelles (optionnel)"
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
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Création...' : 'Créer l\'avoir'}
          </button>
        </div>
      </form>
    </SlideIn>
  );
}
