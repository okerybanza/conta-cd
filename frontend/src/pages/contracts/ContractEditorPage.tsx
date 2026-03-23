import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  File,
  Eye,
  Download,
} from 'lucide-react';
import contractService, { Contract, ContractTemplate, CreateContractData, UpdateContractData } from '../../services/contract.service';
import accountantService from '../../services/accountant.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useAuthStore } from '../../store/auth.store';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

function ContractEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, company } = useAuthStore();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [contract, setContract] = useState<Contract | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateContractData | UpdateContractData>({
    title: '',
    content: '',
    type: 'accountant_service',
    startDate: '',
    endDate: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
    if (id && id !== 'new') {
      loadContract();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadTemplates = async () => {
    try {
      const response = await contractService.getTemplates();
      setTemplates(response.data);
    } catch (err: any) {
      console.error('Error loading templates:', err);
    }
  };

  const loadContract = async () => {
    try {
      setLoading(true);
      const response = await contractService.getById(id!);
      setContract(response.data);
      setFormData({
        title: response.data.title,
        content: response.data.content || '',
        type: response.data.type,
        templateId: response.data.templateId,
        fileUrl: response.data.fileUrl,
        startDate: response.data.startDate ? new Date(response.data.startDate).toISOString().split('T')[0] : '',
        endDate: response.data.endDate ? new Date(response.data.endDate).toISOString().split('T')[0] : '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du contrat');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      // Remplacer les variables du template
      let content = template.content;
      if (company) {
        content = content.replace(/\{\{company\.name\}\}/g, company.name);
        content = content.replace(/\{\{company\.businessName\}\}/g, company.businessName || company.name);
      }
      if (user) {
        content = content.replace(/\{\{accountant\.name\}\}/g, `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email);
      }
      content = content.replace(/\{\{date\}\}/g, new Date().toLocaleDateString('fr-FR'));
      content = content.replace(/\{\{city\}\}/g, company?.city || '');
      
      setFormData({
        ...formData,
        content,
        templateId: template.id,
      });
    }
  };

  const handleSave = async () => {
    if (!formData.title || formData.title.trim().length === 0) {
      showError('Le titre est obligatoire');
      return;
    }

    try {
      setSaving(true);
      if (id && id !== 'new') {
        // Mise à jour
        await contractService.update(id, formData);
        showSuccess('Contrat mis à jour avec succès');
      } else {
        // Création - nécessite companyId et accountantId
        if (!company?.id || !user?.id) {
          showError('Informations manquantes pour créer le contrat');
          return;
        }
        await contractService.create({
          ...formData,
          companyId: company.id,
          accountantId: user.id,
        } as CreateContractData);
        showSuccess('Contrat créé avec succès');
      }
      navigate('/contracts');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implémenter l'upload de fichier
      showError('Upload de fichier non implémenté pour le moment');
    }
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
          <h1 className="text-3xl font-display font-bold text-text-primary">
            {id === 'new' ? 'Nouveau Contrat' : 'Éditer le Contrat'}
          </h1>
          <p className="text-text-secondary mt-1">
            {id === 'new'
              ? 'Créez un nouveau contrat avec un template ou depuis zéro'
              : 'Modifiez le contenu du contrat'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/contracts')} className="btn-secondary">
            <X size={18} className="mr-2" />
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Enregistrer
              </>
            )}
          </button>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de base */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Informations du Contrat</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Contrat de Prestation Comptable"
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Date de début</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Date de fin</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contenu du contrat */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Contenu du Contrat</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="btn-secondary text-sm"
                >
                  <Eye size={16} className="mr-1" />
                  {showPreview ? 'Éditer' : 'Aperçu'}
                </button>
              </div>
            </div>
            {showPreview ? (
              <div className="prose max-w-none p-4 bg-gray-50 rounded-lg min-h-[400px]">
                <div dangerouslySetInnerHTML={{ __html: formData.content || '' }} />
              </div>
            ) : (
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Contenu du contrat... Vous pouvez utiliser du HTML ou Markdown."
                className="input w-full min-h-[400px] font-mono text-sm"
                rows={20}
              />
            )}
          </div>

          {/* Upload de fichier */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Fichier du Contrat</h2>
            <div className="space-y-4">
              {formData.fileUrl ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <File className="text-primary" size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">Fichier actuel</p>
                    <a
                      href={formData.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {formData.fileUrl}
                    </a>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, fileUrl: undefined })}
                    className="btn-ghost text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-text-secondary mb-2">
                    Téléchargez un fichier PDF du contrat
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="contract-file"
                  />
                  <label htmlFor="contract-file" className="btn-secondary cursor-pointer inline-block">
                    Choisir un fichier
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Templates */}
        <div className="space-y-6">
          {/* Templates */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Templates</h2>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium text-text-primary text-sm">{template.name}</p>
                  <p className="text-xs text-text-secondary mt-1">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Aide */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Variables disponibles</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li><code>{'{{company.name}}'}</code> - Nom de l'entreprise</li>
              <li><code>{'{{accountant.name}}'}</code> - Nom de l'expert</li>
              <li><code>{'{{date}}'}</code> - Date actuelle</li>
              <li><code>{'{{city}}'}</code> - Ville</li>
            </ul>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={confirm.handleCancel}
        onConfirm={confirm.handleConfirm}
        title={confirm.options.title ?? 'Confirmation'}
        message={confirm.options.message}
        confirmText={confirm.options.confirmText}
        cancelText={confirm.options.cancelText}
        variant={confirm.options.variant}
        requireJustification={confirm.options.requireJustification}
        justificationPlaceholder={confirm.options.justificationPlaceholder}
      />
    </div>
  );
}

export default ContractEditorPage;

