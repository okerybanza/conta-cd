import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, Building2, Star } from 'lucide-react';
import warehouseService, { CreateWarehouseData } from '../../services/warehouse.service';
import { useAuth } from '../../contexts/AuthContext';
import { COUNTRIES, CITIES_BY_COUNTRY, mapCountryNameToCode } from '../../utils/locationOptions';
import { QuotaErrorModal } from '../../components/QuotaErrorModal';
import { useQuotaError } from '../../hooks/useQuotaError';

function WarehouseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { company } = useAuth();
  const quotaErrorHandler = useQuotaError();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateWarehouseData>({
    name: '',
    country: company?.country || 'RDC',
    city: company?.city,
  });

  useEffect(() => {
    if (isEdit && id) {
      loadWarehouse();
    } else if (company) {
      setFormData((prev) => ({
        ...prev,
        country: prev.country || company.country || 'RDC',
        city: prev.city || company.city,
      }));
    }
  }, [id, company]);

  const loadWarehouse = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await warehouseService.getById(id!);
      const data = response.data;
      setFormData({
        name: data.name,
        code: data.code || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        country: data.country || 'RDC',
        isDefault: data.isDefault || undefined,
        notes: data.notes || undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'entrepôt');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.name.trim().length === 0) {
      setError('Le nom de l\'entrepôt est obligatoire');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEdit && id) {
        await warehouseService.update(id, formData);
      } else {
        await warehouseService.create(formData);
      }
      navigate('/stock/warehouses');
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.code === 'QUOTA_EXCEEDED') {
        const handled = quotaErrorHandler.handleError(err);
        if (!handled) {
          setError(err.response?.data?.message || 'Limite atteinte. Veuillez upgrader votre plan.');
        }
      } else {
        setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateWarehouseData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="ml-3 text-text-secondary">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/stock/warehouses" className="btn btn-ghost">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'}
            </h1>
            <p className="text-muted mt-1">
              {isEdit
                ? 'Mettez à jour les informations de votre entrepôt'
                : 'Enregistrez un nouvel entrepôt pour gérer vos stocks'}
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
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center space-x-2">
              <Building2 size={20} />
              <span>Informations générales</span>
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nom *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="Ex: Entrepôt principal"
                />
              </div>
              <div>
                <label className="label">Code</label>
                <input
                  type="text"
                  className="input"
                  value={formData.code || ''}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="Code unique de l'entrepôt"
                />
              </div>
            </div>

            <div>
              <label className="label">Adresse</label>
              <input
                type="text"
                className="input"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Adresse complète"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Pays</label>
                <select
                  className="input"
                  value={mapCountryNameToCode(formData.country) || (company?.country ? mapCountryNameToCode(company.country) : 'CD')}
                  onChange={(e) => {
                    const code = e.target.value;
                    const countryName = COUNTRIES.find((c) => c.code === code)?.name || formData.country;
                    setFormData((prev) => ({
                      ...prev,
                      country: countryName,
                    }));
                    if (code === 'CD' && !formData.city && company?.city) {
                      setFormData((prev) => ({ ...prev, city: company.city }));
                    }
                  }}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Ville</label>
                {mapCountryNameToCode(formData.country || company?.country) === 'CD' ? (
                  <select
                    className="input"
                    value={formData.city || company?.city || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value || undefined }))
                    }
                  >
                    <option value="">Sélectionner une ville</option>
                    {CITIES_BY_COUNTRY.CD.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="input"
                    value={formData.city || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value || undefined }))
                    }
                  />
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault || false}
                onChange={(e) => handleChange('isDefault', e.target.checked)}
                className="checkbox"
              />
              <label htmlFor="isDefault" className="label flex items-center space-x-2 cursor-pointer">
                <Star size={16} className="text-primary" />
                <span>Définir comme entrepôt par défaut</span>
              </label>
            </div>
            <p className="text-xs text-muted">
              L'entrepôt par défaut sera utilisé automatiquement lors de la création de mouvements de stock.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Notes</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={4}
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Informations complémentaires sur l'entrepôt..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link to="/stock/warehouses" className="btn btn-outline">
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
                {isEdit ? 'Enregistrer' : 'Créer l\'entrepôt'}
              </>
            )}
          </button>
        </div>
      </form>
      <QuotaErrorModal
        isOpen={quotaErrorHandler.showModal}
        onClose={quotaErrorHandler.closeModal}
        error={quotaErrorHandler.quotaError}
      />
    </div>
  );
}

export default WarehouseFormPage;
