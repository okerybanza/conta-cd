import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import journalEntryService, { CreateJournalEntryData, JournalEntryLineData } from '../../services/journalEntry.service';
import accountService, { Account } from '../../services/account.service';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/formatters';

interface FormLine {
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

const emptyLine = (): FormLine => ({ accountId: '', description: '', debit: 0, credit: 0 });

export default function JournalEntryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const isEdit = Boolean(id);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [postAfterSave, setPostAfterSave] = useState(false);

  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<FormLine[]>([emptyLine(), emptyLine()]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await accountService.list({});
        setAccounts(res.data || []);
      } catch { /* non bloquant */ }
    };
    loadAccounts();

    if (id) {
      const loadEntry = async () => {
        try {
          setLoading(true);
          const res = await journalEntryService.getById(id);
          const e = res.data;
          setEntryDate(e.entryDate?.split('T')[0] || '');
          setDescription(e.description || '');
          setReference(e.reference || '');
          setNotes(e.notes || '');
          if (e.lines?.length) {
            setLines(e.lines.map(l => ({
              accountId: l.accountId,
              description: l.description || '',
              debit: Number(l.debit || 0),
              credit: Number(l.credit || 0),
            })));
          }
        } catch { showError('Erreur de chargement de l\'ecriture'); }
        finally { setLoading(false); }
      };
      loadEntry();
    }
  }, [id]);

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const credit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 && debit > 0 };
  }, [lines]);

  const updateLine = (i: number, key: keyof FormLine, value: string | number) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: value } : l));
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (i: number) => {
    if (lines.length <= 2) return;
    setLines(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent, shouldPost = false) => {
    e.preventDefault();
    if (!entryDate) { showError('La date est obligatoire.'); return; }
    const validLines = lines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) { showError('Au moins 2 lignes valides sont requises.'); return; }
    if (!totals.balanced) { showError('L\'ecriture n\'est pas equilibree (debit ≠ credit).'); return; }

    const payload: CreateJournalEntryData = {
      entryDate,
      description: description || undefined,
      reference: reference || undefined,
      notes: notes || undefined,
      sourceType: 'manual',
      lines: validLines.map(l => ({
        accountId: l.accountId,
        description: l.description || undefined,
        debit: Number(l.debit),
        credit: Number(l.credit),
      } as JournalEntryLineData)),
    };

    try {
      setSaving(true);
      let entryId = id;
      if (isEdit && id) {
        await journalEntryService.update(id, payload as any);
        showSuccess('Ecriture modifiee.');
      } else {
        const res = await journalEntryService.create(payload);
        entryId = res.data.id;
        showSuccess('Ecriture creee.');
      }
      if (shouldPost && entryId) {
        await journalEntryService.post(entryId);
        showSuccess('Ecriture comptabilisee.');
      }
      navigate('/journal-entries');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/journal-entries')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Modifier l\'ecriture' : 'Nouvelle ecriture comptable'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Saisie en partie double — debit = credit</p>
        </div>
      </div>

      <form onSubmit={e => handleSubmit(e, postAfterSave)} className="space-y-6">
        {/* Infos generales */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Informations generales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="Ex: FAC-2024-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Libelle de l'ecriture"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Lignes d'ecriture</h2>
            <button type="button" onClick={addLine}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
              <Plus size={16} /> Ajouter une ligne
            </button>
          </div>

          {/* Header colonnes */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
            <div className="col-span-4">Compte</div>
            <div className="col-span-3">Libelle</div>
            <div className="col-span-2 text-right">Debit</div>
            <div className="col-span-2 text-right">Credit</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <select value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                    <option value="">-- Compte --</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input type="text" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)}
                    placeholder="Libelle"
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <input type="number" min="0" step="0.01" value={line.debit || ''}
                    onChange={e => { updateLine(i, 'debit', Number(e.target.value || 0)); if (Number(e.target.value) > 0) updateLine(i, 'credit', 0); }}
                    placeholder="0"
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right" />
                </div>
                <div className="col-span-2">
                  <input type="number" min="0" step="0.01" value={line.credit || ''}
                    onChange={e => { updateLine(i, 'credit', Number(e.target.value || 0)); if (Number(e.target.value) > 0) updateLine(i, 'debit', 0); }}
                    placeholder="0"
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right" />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button type="button" onClick={() => removeLine(i)} disabled={lines.length <= 2}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totaux + indicateur equilibre */}
          <div className={`rounded-xl p-4 border-2 ${totals.balanced ? 'bg-green-50 border-green-200' : totals.debit === 0 && totals.credit === 0 ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'}`}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Debit</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totals.debit)}</p>
              </div>
              <div className="flex items-center justify-center">
                {totals.balanced ? (
                  <div className="flex items-center gap-2 text-green-700 font-semibold">
                    <CheckCircle2 size={20} />
                    <span>Equilibre</span>
                  </div>
                ) : totals.debit === 0 && totals.credit === 0 ? (
                  <span className="text-gray-400 text-sm">En attente</span>
                ) : (
                  <div className="flex items-center gap-2 text-red-700 font-semibold">
                    <AlertCircle size={20} />
                    <span>Desequilibre ({formatCurrency(Math.abs(totals.debit - totals.credit))})</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Credit</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totals.credit)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Notes optionnelles..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/journal-entries')}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={saving} onClick={() => setPostAfterSave(false)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 transition-colors">
            <Save size={16} /> {saving && !postAfterSave ? 'Enregistrement...' : 'Enregistrer brouillon'}
          </button>
          <button type="submit" disabled={saving || !totals.balanced} onClick={() => setPostAfterSave(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <CheckCircle2 size={16} /> {saving && postAfterSave ? 'Comptabilisation...' : 'Valider et poster'}
          </button>
        </div>
      </form>
    </div>
  );
}
