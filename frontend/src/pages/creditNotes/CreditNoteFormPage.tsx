import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import creditNoteService from '../../services/creditNote.service';
import invoiceService, { Invoice } from '../../services/invoice.service';
import { useToastContext } from '../../contexts/ToastContext';

export default function CreditNoteFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const isEdit = Boolean(id);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    invoiceId: '',
    amount: 0,
    taxAmount: 0,
    reason: '',
    reference: '',
    notes: '',
    creditNoteDate: new Date().toISOString().split('T')[0],
    currency: 'CDF',
  });

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const response = await invoiceService.list({ page: 1, limit: 200 });
        setInvoices(response.data || []);
      } catch {
        // non bloquant
      }
    };

    const loadCreditNote = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const note = await creditNoteService.getById(id);
        setForm({
          invoiceId: note.invoiceId,
          amount: Number(note.amount || 0),
          taxAmount: Number(note.taxAmount || 0),
          reason: note.reason || '',
          reference: note.reference || '',
          notes: note.notes || '',
          creditNoteDate: note.creditNoteDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          currency: note.currency || 'CDF',
        });
      } catch (err: any) {
        showError(err.response?.data?.message || 'Erreur lors du chargement de l\'avoir');
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
    loadCreditNote();
  }, [id, showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.invoiceId) {
      showError('Veuillez selectionner une facture.');
      return;
    }
    if (!form.reason.trim()) {
      showError('Le motif est obligatoire.');
      return;
    }
    if (form.amount <= 0) {
      showError('Le montant doit etre superieur a 0.');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await creditNoteService.update(id, {
          reason: form.reason,
          reference: form.reference || undefined,
          notes: form.notes || undefined,
        });
        showSuccess('Avoir modifie avec succes.');
      } else {
        await creditNoteService.create({
          invoiceId: form.invoiceId,
          amount: Number(form.amount),
          taxAmount: Number(form.taxAmount || 0),
          reason: form.reason,
          reference: form.reference || undefined,
          notes: form.notes || undefined,
          creditNoteDate: form.creditNoteDate,
          currency: form.currency,
        });
        showSuccess('Avoir cree avec succes.');
      }
      navigate('/credit-notes');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'avoir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card p-6 space-y-4 max-w-2xl" onSubmit={handleSubmit}>
      <h1 className="text-xl font-semibold">{isEdit ? 'Modifier avoir' : 'Nouveau avoir'}</h1>

      <div>
        <label className="block text-sm font-medium mb-1">Facture</label>
        <select
          className="input"
          value={form.invoiceId}
          onChange={(e) => setForm((prev) => ({ ...prev, invoiceId: e.target.value }))}
          disabled={isEdit}
          required
        >
          <option value="">Selectionner une facture</option>
          {invoices.map((invoice) => (
            <option key={invoice.id} value={invoice.id}>
              {invoice.invoiceNumber} - {(invoice.totalAmount || 0).toFixed(2)} {invoice.currency || 'CDF'}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Montant</label>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">TVA</label>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={form.taxAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, taxAmount: Number(e.target.value || 0) }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            className="input"
            type="date"
            value={form.creditNoteDate}
            onChange={(e) => setForm((prev) => ({ ...prev, creditNoteDate: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Motif</label>
        <input className="input" value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Reference</label>
        <input className="input" value={form.reference} onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
      </div>

      <div className="flex gap-2">
        <button type="button" className="btn-secondary" onClick={() => navigate('/credit-notes')} disabled={loading}>
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
