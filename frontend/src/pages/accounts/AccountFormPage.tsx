import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  FileText,
  Calculator,
} from 'lucide-react';
import accountService, { CreateAccountData, AccountType, AccountCategory } from '../../services/account.service';
import { Account } from '../../services/account.service';

function AccountFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<CreateAccountData>({
    code: '',
    name: '',
    type: 'expense',
    category: undefined,
    parentId: undefined,
    description: undefined,
  });

  useEffect(() => {
    loadParentAccounts();
    if (isEdit) {
      loadAccount();
    }
  }, [id]);

  const loadParentAccounts = async () => {
    try {
      const response = await accountService.list({ isActive: true });
      setParentAccounts(response.data);
    } catch (err) {
      console.error('Error loading parent accounts:', err);
    }
  };

  const loadAccount = async () => {
    try {
      setLoading(true);
      const account = await accountService.getById(id!);
      const data = account.data;
      setFormData({
        code: data.code,
        name: data.name,
        type: data.type,
        category: data.category || undefined,
        parentId: data.parentId || undefined,
        description: data.description || undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      setError('Le code et le nom sont requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await accountService.update(id!, formData);
      } else {
        await accountService.create(formData);
      }
      navigate('/accounts');
    } catch (err: any) {
      if (err.response?.status === 403) {
        if (err.response?.data?.code === 'FEATURE_NOT_AVAILABLE') {
          setError('La fonctionnalité Comptabilité n\'est pas disponible dans votre package. Veuillez upgrader votre plan.');
        } else {
          setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
        }
      } else {
        setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCategoryOptions = (type: AccountType): AccountCategory[] => {
    const categoryMap: Record<AccountType, AccountCategory[]> = {
      asset: ['2', '3', '5'],
      liability: ['1', '4'],
      equity: ['1', '8'],
      revenue: ['7'],
      expense: ['6'],
    };
    return categoryMap[type] || [];
  };

  const getTypeLabel = (type: AccountType): string => {
    const labels: Record<AccountType, string> = {
      asset: 'Actif',
      liability: 'Passif',
      equity: 'Capitaux',
      revenue: 'Produit',
      expense: 'Charge',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/accounts" className="btn btn-ghost">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Modifier le compte' : 'Nouveau compte comptable'}
            </h1>
            <p className="text-muted mt-1">
              {isEdit ? 'Modifiez les informations du compte' : 'Créez un nouveau compte comptable'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations générales */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title flex items-center space-x-2">
                  <FileText size={20} />
                  <span>Informations générales</span>
                </h2>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Code du compte *</label>
                    <input
                      type="text"
                      className="input font-mono"
                      placeholder="Ex: 401000, 701000"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      required
                    />
                    <p className="text-xs text-muted mt-1">
                      Code unique du compte (ex: 401000 pour Fournisseurs)
                    </p>
                  </div>
                  <div>
                    <label className="label">Nom du compte *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ex: Fournisseurs, Ventes"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Type de compte *</label>
                    <select
                      className="input"
                      value={formData.type}
                      onChange={(e) => {
                        const newType = e.target.value as AccountType;
                        setFormData({
                          ...formData,
                          type: newType,
                          category: undefined, // Réinitialiser la catégorie
                        });
                      }}
                      required
                    >
                      <option value="asset">Actif</option>
                      <option value="liability">Passif</option>
                      <option value="equity">Capitaux Propres</option>
                      <option value="revenue">Produit</option>
                      <option value="expense">Charge</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Classe comptable</label>
                    <select
                      className="input"
                      value={formData.category || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as AccountCategory || undefined,
                        })
                      }
                    >
                      <option value="">Sélectionner une classe</option>
                      {getCategoryOptions(formData.type).map((cat) => (
                        <option key={cat} value={cat}>
                          Classe {cat}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted mt-1">
                      Classe comptable selon le type ({getTypeLabel(formData.type)})
                    </p>
                  </div>
                </div>

                <div>
                  <label className="label">Compte parent (optionnel)</label>
                  <select
                    className="input"
                    value={formData.parentId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parentId: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">Aucun (compte racine)</option>
                    {parentAccounts
                      .filter((acc) => acc.id !== id && acc.type === formData.type)
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-muted mt-1">
                    Sélectionnez un compte parent pour créer une hiérarchie
                  </p>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Description du compte..."
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value || undefined })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link to="/accounts" className="btn btn-outline">
            Annuler
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                {isEdit ? 'Enregistrer' : 'Créer le compte'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AccountFormPage;

