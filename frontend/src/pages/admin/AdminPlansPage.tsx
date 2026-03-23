import { useState, useEffect } from 'react';
import { Edit, Save, X, Loader2, AlertCircle, Package as PackageIcon, Eye, AlertTriangle, TrendingUp, TrendingDown, Plus, Minus, History, Clock, User, Trash2, Copy } from 'lucide-react';
import adminService, { Package, UpdatePackageData, CreatePackageData } from '../../services/admin.service';
import { useToastContext } from '../../contexts/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';

function AdminPlansPage() {
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdatePackageData>({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [originalPackage, setOriginalPackage] = useState<Package | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  
  // États pour la création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreatePackageData>({
    code: '',
    name: '',
    description: '',
    price: 0,
    currency: 'CDF',
    limits: {},
    features: {},
    isActive: true,
    displayOrder: 0,
  });
  
  // États pour la suppression
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subscriptionsCount, setSubscriptionsCount] = useState<Record<string, number>>({});

  useEffect(() => {
    loadPackages();
  }, []);

  // Charger le nombre de subscriptions pour chaque plan
  useEffect(() => {
    if (packages.length > 0) {
      packages.forEach((pkg) => {
        loadSubscriptionsCount(pkg.id);
      });
    }
  }, [packages]);

  const loadSubscriptionsCount = async (packageId: string) => {
    try {
      const response = await adminService.getPackageSubscriptionsCount(packageId);
      setSubscriptionsCount((prev) => ({ ...prev, [packageId]: response.data.count }));
    } catch (err) {
      // Ignorer les erreurs silencieusement
    }
  };

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getPackages();
      setPackages(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des plans');
      showError(err.response?.data?.message || 'Erreur lors du chargement des plans');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingId(pkg.id);
    setOriginalPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      limits: pkg.limits,
      features: pkg.features,
      isActive: pkg.isActive,
      displayOrder: pkg.displayOrder,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
    setOriginalPackage(null);
    setShowPreview(false);
    setPreviewData(null);
  };

  const handlePreview = async (id: string) => {
    try {
      setPreviewLoading(true);
      const impact = await adminService.getPackageModificationImpact(
        id,
        formData.limits || {},
        formData.features || {}
      );
      setPreviewData(impact.data);
      setShowPreview(true);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la prévisualisation');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    try {
      setSavingId(id);
      await adminService.updatePackage(id, formData);
      showSuccess('Plan mis à jour avec succès');
      setEditingId(null);
      setFormData({});
      setOriginalPackage(null);
      setShowPreview(false);
      setPreviewData(null);
      loadPackages();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSavingId(null);
    }
  };

  const handleChange = (field: keyof UpdatePackageData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleLimitChange = (key: string, value: string) => {
    const limits = { ...formData.limits };
    if (value === '' || value === null) {
      delete limits[key];
    } else {
      const numValue = parseInt(value);
      limits[key] = isNaN(numValue) ? null : numValue;
    }
    setFormData({ ...formData, limits });
  };

  const handleFeatureChange = (key: string, value: boolean) => {
    const features = { ...formData.features };
    features[key] = value;
    setFormData({ ...formData, features });
  };

  // Création de plan
  const handleCreate = () => {
    setCreateFormData({
      code: '',
      name: '',
      description: '',
      price: 0,
      currency: 'CDF',
      limits: {
        customers: null,
        products: null,
        users: null,
        invoices: null,
        expenses: null,
        suppliers: null,
        storage_mb: null,
        emails_per_month: null,
        sms_per_month: null,
        managed_companies: null,
      },
      features: {
        expenses: false,
        accounting: false,
        recurring_invoices: false,
        api: false,
        custom_templates: false,
        multi_currency: false,
        advanced_reports: false,
        workflows: false,
        custom_branding: false,
        stock: false,
        hr: false,
        multi_companies: false,
        consolidated_reports: false,
        priority_support: false,
      },
      isActive: true,
      displayOrder: packages.length,
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async () => {
    if (!createFormData.code || !createFormData.name || createFormData.price === undefined) {
      showError('Le code, le nom et le prix sont obligatoires');
      return;
    }

    try {
      setCreating(true);
      await adminService.createPackage(createFormData);
      showSuccess('Plan créé avec succès');
      setShowCreateModal(false);
      setCreateFormData({
        code: '',
        name: '',
        description: '',
        price: 0,
        currency: 'CDF',
        limits: {
          customers: null,
          products: null,
          users: null,
          invoices: null,
          expenses: null,
          suppliers: null,
          storage_mb: null,
          emails_per_month: null,
          sms_per_month: null,
          managed_companies: null,
        },
        features: {
          expenses: false,
          accounting: false,
          recurring_invoices: false,
          api: false,
          custom_templates: false,
          multi_currency: false,
          advanced_reports: false,
          workflows: false,
          custom_branding: false,
          stock: false,
          hr: false,
          multi_companies: false,
          consolidated_reports: false,
          priority_support: false,
        },
        isActive: true,
        displayOrder: 0,
      });
      loadPackages();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la création du plan');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateChange = (field: keyof CreatePackageData, value: any) => {
    setCreateFormData({ ...createFormData, [field]: value });
  };

  const handleCreateLimitChange = (key: string, value: string) => {
    const limits = { ...createFormData.limits };
    if (value === '' || value === null) {
      limits[key] = null;
    } else {
      const numValue = parseInt(value);
      limits[key] = isNaN(numValue) ? null : numValue;
    }
    setCreateFormData({ ...createFormData, limits });
  };

  const handleCreateFeatureChange = (key: string, value: boolean) => {
    const features = { ...createFormData.features };
    features[key] = value;
    setCreateFormData({ ...createFormData, features });
  };

  // Suppression de plan
  const handleDelete = async (pkg: Package) => {
    const count = subscriptionsCount[pkg.id] || 0;
    
    let message = `Êtes-vous sûr de vouloir supprimer le plan "${pkg.name}" ?`;
    let variant: 'danger' | 'warning' | 'info' = 'danger';
    
    if (count > 0) {
      message += `\n\n⚠️ Attention : ${count} entreprise${count > 1 ? 's' : ''} ${count > 1 ? 'utilisent' : 'utilise'} actuellement ce plan.`;
      message += `\n\nSi vous forcez la suppression, toutes les subscriptions actives seront annulées.`;
    }

    const confirmed = await confirm.confirm({
      title: 'Supprimer le plan',
      message,
      confirmText: count > 0 ? 'Forcer la suppression' : 'Supprimer',
      cancelText: 'Annuler',
      variant,
    });

    if (!confirmed) return;

    // Si le plan a des subscriptions, demander confirmation supplémentaire
    if (count > 0) {
      const forceConfirmed = await confirm.confirm({
        title: 'Confirmation finale',
        message: `Cette action va annuler ${count} subscription${count > 1 ? 's' : ''} active${count > 1 ? 's' : ''}. Êtes-vous absolument sûr ?`,
        confirmText: 'Oui, supprimer quand même',
        cancelText: 'Annuler',
        variant: 'danger',
      });

      if (!forceConfirmed) return;
    }

    try {
      setDeletingId(pkg.id);
      await adminService.deletePackage(pkg.id, count > 0);
      showSuccess('Plan supprimé avec succès');
      loadPackages();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la suppression du plan');
    } finally {
      setDeletingId(null);
    }
  };

  // Duplication de plan
  const handleDuplicate = (pkg: Package) => {
    setCreateFormData({
      code: `${pkg.code}-copy`,
      name: `${pkg.name} (Copie)`,
      description: pkg.description || '',
      price: pkg.price,
      currency: pkg.currency || 'CDF',
      limits: { ...pkg.limits },
      features: { ...pkg.features },
      isActive: false, // Désactiver par défaut pour permettre la modification
      displayOrder: packages.length,
    });
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Gestion des Plans</h1>
          <p className="text-text-secondary mt-1">
            Créez, modifiez et supprimez les plans d'abonnement
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Créer un plan</span>
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Liste des plans */}
      <div className="space-y-4">
        {packages.map((pkg) => {
          const isEditing = editingId === pkg.id;
          const isSaving = savingId === pkg.id;
          const currentData = isEditing ? formData : pkg;

          return (
            <div key={pkg.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <PackageIcon className="text-primary" size={24} />
                  </div>
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="text-xl font-bold text-text-primary border-b-2 border-primary focus:outline-none"
                      />
                    ) : (
                      <h3 className="text-xl font-bold text-text-primary">{pkg.name}</h3>
                    )}
                    <p className="text-sm text-text-secondary">{pkg.code}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handlePreview(pkg.id)}
                        disabled={isSaving || previewLoading}
                        className="btn-secondary flex items-center gap-2"
                      >
                        {previewLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Analyse...</span>
                          </>
                        ) : (
                          <>
                            <Eye size={18} />
                            <span>Prévisualiser l'impact</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleSave(pkg.id)}
                        disabled={isSaving}
                        className="btn-primary flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Enregistrement...</span>
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            <span>Enregistrer</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <X size={18} />
                        <span>Annuler</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={async () => {
                          setShowHistory(true);
                          setHistoryLoading(true);
                          try {
                            const response = await adminService.getPackageHistory(pkg.id);
                            setHistoryData(response.data);
                          } catch (err: any) {
                            showError(err.response?.data?.message || 'Erreur lors du chargement de l\'historique');
                          } finally {
                            setHistoryLoading(false);
                          }
                        }}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <History size={18} />
                        <span>Historique</span>
                      </button>
                      <button
                        onClick={() => handleDuplicate(pkg)}
                        className="btn-secondary flex items-center gap-2"
                        title="Dupliquer ce plan"
                      >
                        <Copy size={18} />
                        <span>Dupliquer</span>
                      </button>
                      <button
                        onClick={() => handleEdit(pkg)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Edit size={18} />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => handleDelete(pkg)}
                        disabled={deletingId === pkg.id}
                        className="btn-secondary flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title={`Supprimer ce plan${subscriptionsCount[pkg.id] > 0 ? ` (${subscriptionsCount[pkg.id]} abonnement${subscriptionsCount[pkg.id] > 1 ? 's' : ''} actif${subscriptionsCount[pkg.id] > 1 ? 's' : ''})` : ''}`}
                      >
                        {deletingId === pkg.id ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Trash2 size={18} />
                        )}
                        <span>Supprimer</span>
                        {subscriptionsCount[pkg.id] > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            {subscriptionsCount[pkg.id]}
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prix */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Prix mensuel
                  </label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={currentData.price || ''}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                        className="input flex-1"
                        min="0"
                        step="0.01"
                      />
                      <span className="text-text-secondary">{pkg.currency}</span>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-text-primary">
                      {formatCurrency(pkg.price, pkg.currency)}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={currentData.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="input w-full"
                      rows={2}
                    />
                  ) : (
                    <p className="text-text-secondary">{pkg.description || 'Aucune description'}</p>
                  )}
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Statut
                  </label>
                  {isEditing ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentData.isActive ?? true}
                        onChange={(e) => handleChange('isActive', e.target.checked)}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <span className="text-sm text-text-secondary">Plan actif</span>
                    </label>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        pkg.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {pkg.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  )}
                </div>

                {/* Ordre d'affichage */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Ordre d'affichage
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={currentData.displayOrder || 0}
                      onChange={(e) => handleChange('displayOrder', parseInt(e.target.value) || 0)}
                      className="input w-full"
                      min="0"
                    />
                  ) : (
                    <p className="text-text-secondary">{pkg.displayOrder}</p>
                  )}
                </div>
              </div>

              {/* Limites */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-text-primary mb-4">Limites</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(pkg.limits || {}).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs text-text-muted mb-1">{key}</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={value === null ? '' : value}
                          onChange={(e) => handleLimitChange(key, e.target.value)}
                          className="input w-full text-sm"
                          placeholder="Illimité"
                          min="0"
                        />
                      ) : (
                        <p className="text-sm font-medium text-text-primary">
                          {value === null ? 'Illimité' : value}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fonctionnalités */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-text-primary mb-4">Fonctionnalités</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(pkg.features || {}).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={currentData.features?.[key] ?? false}
                          onChange={(e) => handleFeatureChange(key, e.target.checked)}
                          className="w-4 h-4 text-primary rounded"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={value}
                          disabled
                          className="w-4 h-4 text-primary rounded"
                        />
                      )}
                      <span className="text-sm text-text-secondary">{key}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de prévisualisation */}
      {showPreview && previewData && originalPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Eye size={24} />
                Prévisualisation de l'impact
              </h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData(null);
                }}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Résumé */}
              <div className="card bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <AlertCircle size={20} />
                  <span className="font-semibold">Résumé de l'impact</span>
                </div>
                <p className="text-blue-700">
                  Cette modification affectera <strong>{previewData.totalCompanies} entreprise{previewData.totalCompanies > 1 ? 's' : ''}</strong> utilisant ce plan.
                </p>
              </div>

              {/* Entreprises avec problèmes */}
              {previewData.companiesWithIssues.length > 0 && (
                <div className="card bg-red-50 border-red-200">
                  <div className="flex items-center gap-2 text-red-800 mb-4">
                    <AlertTriangle size={20} />
                    <span className="font-semibold">⚠️ Attention : Problèmes détectés</span>
                  </div>
                  <p className="text-red-700 mb-4">
                    <strong>{previewData.companiesWithIssues.length} entreprise{previewData.companiesWithIssues.length > 1 ? 's' : ''}</strong> dépasser{previewData.companiesWithIssues.length > 1 ? 'ont' : 'a'} déjà la nouvelle limite :
                  </p>
                  <div className="space-y-3">
                    {previewData.companiesWithIssues.map((company: any) => (
                      <div key={company.companyId} className="bg-white p-3 rounded border border-red-200">
                        <p className="font-medium text-red-900 mb-2">{company.companyName}</p>
                        <ul className="space-y-1">
                          {company.issues.map((issue: any, idx: number) => (
                            <li key={idx} className="text-sm text-red-700">
                              • <strong>{issue.metric}</strong> : {issue.currentUsage} utilisés / nouvelle limite {issue.newLimit}
                              {issue.oldLimit !== null && (
                                <span className="text-red-600"> (ancienne limite: {issue.oldLimit})</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Limites augmentées */}
              {previewData.limitsIncreased.length > 0 && (
                <div className="card bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <TrendingUp size={20} />
                    <span className="font-semibold">Limites augmentées</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewData.limitsIncreased.map((metric: string) => (
                      <span key={metric} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Limites réduites */}
              {previewData.limitsDecreased.length > 0 && (
                <div className="card bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <TrendingDown size={20} />
                    <span className="font-semibold">Limites réduites</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewData.limitsDecreased.map((metric: string) => (
                      <span key={metric} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fonctionnalités ajoutées */}
              {previewData.featuresAdded.length > 0 && (
                <div className="card bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Plus size={20} />
                    <span className="font-semibold">Fonctionnalités ajoutées</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewData.featuresAdded.map((feature: string) => (
                      <span key={feature} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fonctionnalités supprimées */}
              {previewData.featuresRemoved.length > 0 && (
                <div className="card bg-red-50 border-red-200">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <Minus size={20} />
                    <span className="font-semibold">Fonctionnalités supprimées</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewData.featuresRemoved.map((feature: string) => (
                      <span key={feature} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparaison des limites */}
              {originalPackage && formData.limits && (
                <div className="card">
                  <h4 className="font-semibold text-text-primary mb-4">Comparaison des limites</h4>
                  <div className="space-y-2">
                    {Object.keys({ ...originalPackage.limits, ...formData.limits }).map((key) => {
                      const oldValue = originalPackage.limits?.[key] ?? null;
                      const newValue = formData.limits?.[key] ?? null;
                      const changed = oldValue !== newValue;

                      if (!changed) return null;

                      return (
                        <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-text-secondary">{key}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-text-primary">
                              {oldValue === null ? 'Illimité' : oldValue}
                            </span>
                            <span className="text-text-muted">→</span>
                            <span className={`text-sm font-medium ${newValue !== null && oldValue !== null && newValue < oldValue ? 'text-red-600' : 'text-green-600'}`}>
                              {newValue === null ? 'Illimité' : newValue}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-2">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData(null);
                }}
                className="btn-secondary flex-1"
              >
                Retour
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData(null);
                  handleSave(editingId!);
                }}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={savingId === editingId}
              >
                {savingId === editingId ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Confirmer et enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal historique */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <History size={24} />
                Historique des modifications
              </h3>
              <button
                onClick={() => {
                  setShowHistory(false);
                  setHistoryData([]);
                }}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {historyLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-12">
                  <History className="mx-auto text-text-muted mb-4" size={48} />
                  <p className="text-text-secondary">Aucune modification enregistrée pour ce plan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyData.map((entry) => (
                    <div key={entry.id} className="card border-l-4 border-l-primary">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-text-muted" />
                            <span className="text-sm text-text-secondary">
                              {formatDate(entry.createdAt)}
                            </span>
                            {entry.userEmail && (
                              <>
                                <span className="text-text-muted">•</span>
                                <User size={16} className="text-text-muted" />
                                <span className="text-sm text-text-secondary">{entry.userEmail}</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm text-text-primary mb-3">
                            <strong>{entry.totalChanges} modification{entry.totalChanges > 1 ? 's' : ''}</strong>
                          </div>
                          {entry.changes && Object.keys(entry.changes).length > 0 && (
                            <div className="space-y-2">
                              {Object.entries(entry.changes).slice(0, 5).map(([key, value]: [string, any]) => (
                                <div key={key} className="text-sm bg-gray-50 p-2 rounded">
                                  <span className="font-medium text-text-primary">{key}:</span>{' '}
                                  <span className="text-text-secondary">
                                    {typeof value === 'object' && value.old !== undefined ? (
                                      <>
                                        <span className="line-through text-red-600">
                                          {JSON.stringify(value.old)}
                                        </span>
                                        {' → '}
                                        <span className="text-green-600 font-medium">
                                          {JSON.stringify(value.new)}
                                        </span>
                                      </>
                                    ) : (
                                      JSON.stringify(value)
                                    )}
                                  </span>
                                </div>
                              ))}
                              {Object.keys(entry.changes).length > 5 && (
                                <p className="text-xs text-text-muted">
                                  + {Object.keys(entry.changes).length - 5} autre{Object.keys(entry.changes).length - 5 > 1 ? 's' : ''} modification{Object.keys(entry.changes).length - 5 > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          )}
                          {entry.ipAddress && (
                            <div className="mt-2 text-xs text-text-muted">
                              IP: {entry.ipAddress}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
              <button
                onClick={() => {
                  setShowHistory(false);
                  setHistoryData([]);
                }}
                className="btn-secondary w-full"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau plan"
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Code du plan *
              </label>
              <input
                type="text"
                value={createFormData.code}
                onChange={(e) => handleCreateChange('code', e.target.value)}
                placeholder="ex: starter, pro, enterprise"
                className="input w-full"
                required
              />
              <p className="text-xs text-text-muted mt-1">Identifiant unique (minuscules, sans espaces)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nom du plan *
              </label>
              <input
                type="text"
                value={createFormData.name}
                onChange={(e) => handleCreateChange('name', e.target.value)}
                placeholder="ex: Starter, Pro, Enterprise"
                className="input w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={createFormData.description}
              onChange={(e) => handleCreateChange('description', e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="Description du plan..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Prix mensuel *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={createFormData.price}
                  onChange={(e) => handleCreateChange('price', parseFloat(e.target.value) || 0)}
                  className="input flex-1"
                  min="0"
                  step="0.01"
                  required
                />
                <select
                  value={createFormData.currency}
                  onChange={(e) => handleCreateChange('currency', e.target.value)}
                  className="input w-24"
                >
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Ordre d'affichage
              </label>
              <input
                type="number"
                value={createFormData.displayOrder}
                onChange={(e) => handleCreateChange('displayOrder', parseInt(e.target.value) || 0)}
                className="input w-full"
                min="0"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createFormData.isActive ?? true}
                  onChange={(e) => handleCreateChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-sm text-text-secondary">Plan actif</span>
              </label>
            </div>
          </div>

          {/* Limites */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-text-primary mb-4">Limites</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['customers', 'products', 'users', 'invoices', 'expenses', 'recurring_invoices', 'suppliers', 'storage_mb', 'emails_per_month', 'sms_per_month', 'managed_companies'].map((key) => (
                <div key={key}>
                  <label className="block text-xs text-text-muted mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="number"
                    value={createFormData.limits?.[key] === null || createFormData.limits?.[key] === undefined ? '' : createFormData.limits[key]}
                    onChange={(e) => handleCreateLimitChange(key, e.target.value)}
                    className="input w-full text-sm"
                    placeholder="Illimité"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Fonctionnalités */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-text-primary mb-4">Fonctionnalités</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['expenses', 'accounting', 'recurring_invoices', 'api', 'custom_templates', 'multi_currency', 'advanced_reports', 'workflows', 'custom_branding', 'stock', 'hr', 'multi_companies', 'consolidated_reports', 'priority_support'].map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createFormData.features?.[key] ?? false}
                    onChange={(e) => handleCreateFeatureChange(key, e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-text-secondary capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary flex-1"
              disabled={creating}
            >
              Annuler
            </button>
            <button
              onClick={handleCreateSubmit}
              disabled={creating || !createFormData.code || !createFormData.name}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Créer le plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={confirm.handleCancel}
        onConfirm={confirm.handleConfirm}
        title={confirm.options.title || 'Confirmation'}
        message={confirm.options.message}
        confirmText={confirm.options.confirmText}
        cancelText={confirm.options.cancelText}
        variant={confirm.options.variant}
      />
    </div>
  );
}

export default AdminPlansPage;

