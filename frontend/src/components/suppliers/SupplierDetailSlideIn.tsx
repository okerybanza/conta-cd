import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlideIn } from '../ui/SlideIn';
import { Edit, Trash2, Mail, Phone, MapPin, Building2, AlertCircle } from 'lucide-react';
import supplierService, { Supplier } from '../../services/supplier.service';
import api from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  onRefresh?: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(n);

export function SupplierDetailSlideIn({ isOpen, onClose, supplierId, onRefresh }: Props) {
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !supplierId) return;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const [supData, expRes] = await Promise.all([
          supplierService.getById(supplierId),
          api.get(`/expenses?supplierId=${supplierId}&limit=5&sortBy=createdAt&sortOrder=desc`),
        ]);
        setSupplier(supData);
        const expList = expRes.data?.data?.expenses ?? expRes.data?.data ?? [];
        setExpenses(expList);
        setTotalExpenses(expList.reduce((sum: number, e: any) => sum + Number(e.amountTtc ?? e.amount ?? 0), 0));
      } catch { setError('Erreur de chargement.'); }
      finally { setLoading(false); }
    };
    load();
  }, [isOpen, supplierId]);

  const handleDelete = async () => {
    if (!supplier || !window.confirm('Supprimer ce fournisseur ?')) return;
    try {
      setDeleting(true);
      await supplierService.delete(supplier.id);
      onRefresh?.(); onClose();
    } catch { setError('Erreur lors de la suppression.'); setDeleting(false); }
  };

  return (
    <SlideIn isOpen={isOpen} onClose={onClose} title="Fournisseur" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : !supplier ? (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error || 'Fournisseur introuvable'}
        </div>
      ) : (
        <div className="space-y-6">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle size={16} /> {error}</div>}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 size={22} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate">{supplier.name}</h3>
              {(supplier as any).type && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{(supplier as any).type}</span>}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coordonnees</h4>
            {supplier.email && <div className="flex items-center gap-2 text-sm text-gray-700"><Mail size={14} className="text-gray-400 flex-shrink-0" /><a href={`mailto:${supplier.email}`} className="hover:text-blue-600 truncate">{supplier.email}</a></div>}
            {supplier.phone && <div className="flex items-center gap-2 text-sm text-gray-700"><Phone size={14} className="text-gray-400 flex-shrink-0" /><span>{supplier.phone}</span></div>}
            {(supplier.city || supplier.country) && <div className="flex items-center gap-2 text-sm text-gray-700"><MapPin size={14} className="text-gray-400 flex-shrink-0" /><span>{[supplier.city, supplier.country].filter(Boolean).join(', ')}</span></div>}
            {(supplier as any).nif && <div className="flex justify-between text-sm"><span className="text-gray-500">NIF</span><span className="font-medium text-gray-900">{(supplier as any).nif}</span></div>}
            {(supplier as any).rccm && <div className="flex justify-between text-sm"><span className="text-gray-500">RCCM</span><span className="font-medium text-gray-900">{(supplier as any).rccm}</span></div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-gray-900">{fmt(totalExpenses)}</p>
              <p className="text-xs text-gray-500 mt-1">Total depenses</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-gray-900">{expenses.length}</p>
              <p className="text-xs text-gray-500 mt-1">Nb depenses</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Depenses recentes</h4>
            {expenses.length === 0 ? <p className="text-sm text-gray-400">Aucune depense enregistree</p> : (
              <div className="space-y-2">
                {expenses.map((exp: any) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{exp.description || '—'}</p>
                      <p className="text-xs text-gray-500">{exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString('fr-FR') : '—'}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{fmt(Number(exp.amountTtc ?? exp.amount ?? 0))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => { navigate(`/suppliers/${supplier.id}/edit`); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"><Edit size={15} /> Modifier</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"><Trash2 size={15} /> {deleting ? 'Suppression...' : 'Supprimer'}</button>
          </div>
        </div>
      )}
    </SlideIn>
  );
}

export default SupplierDetailSlideIn;
