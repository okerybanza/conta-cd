import { useEffect, useState } from 'react';
import customerService, { CreateCustomerData } from '../../services/customer.service';
import { useToastContext } from '../../contexts/ToastContext';
import { Upload, X } from 'lucide-react';

interface CustomerFormProps {
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CustomerForm({ customerId, onSuccess, onCancel }: CustomerFormProps) {
  const { showSuccess, showError } = useToastContext();
  const isEdit = Boolean(customerId);

  const [form, setForm] = useState<CreateCustomerData>({
    type: 'particulier',
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    country: '',
    nif: '',
    rccm: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomer = async () => {
      if (!customerId) return;
      try {
        setLoading(true);
        const c = await customerService.getById(customerId);
        setForm({
          type: c.type || 'particulier',
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          businessName: c.businessName || '',
          email: c.email || '',
          phone: c.phone || '',
        });
      } catch (err: any) {
        showError(err.response?.data?.message || 'Erreur de chargement du client');
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [customerId, showError]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showError('Le logo ne doit pas dépasser 2 MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showError('Le fichier doit être une image');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.type === 'entreprise' && !form.businessName?.trim()) {
      showError('Le nom de l\'entreprise est obligatoire.');
      return;
    }

    if (form.type === 'particulier' && !`${form.firstName || ''}${form.lastName || ''}`.trim()) {
      showError('Le nom du client est obligatoire.');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && customerId) {
        await customerService.update(customerId, form);
        showSuccess('Client modifie avec succes.');
      } else {
        await customerService.create(form);
        showSuccess('Client cree avec succes.');
      }
      onSuccess?.();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de l\'enregistrement du client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card p-6 space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold">{isEdit ? 'Modifier client' : 'Nouveau client'}</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          className="input"
          value={form.type}
          onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as 'particulier' | 'entreprise' }))}
        >
          <option value="particulier">Particulier</option>
          <option value="entreprise">Entreprise</option>
        </select>
      </div>

      {form.type === 'particulier' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prenom</label>
            <input className="input" value={form.firstName || ''} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input className="input" value={form.lastName || ''} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
          </div>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Nom entreprise</label>
            <input className="input" value={form.businessName || ''} onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Logo entreprise</label>
            <div className="space-y-2">
              {logoPreview ? (
                <div className="relative inline-block">
                  <img src={logoPreview} alt="Logo preview" className="w-32 h-32 object-contain border border-gray-200 rounded-lg p-2" />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">Cliquez pour uploader le logo</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (max 2MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoChange}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Le logo sera affiché sur les documents (factures, devis)</p>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input className="input" type="email" value={form.email || ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Telephone</label>
          <input className="input" value={form.phone || ''} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Mobile</label>
          <input className="input" value={form.mobile || ''} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))} placeholder="+243..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pays</label>
          <input className="input" value={form.country || ''} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} placeholder="RDC" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ville</label>
          <input className="input" value={form.city || ''} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Kinshasa" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <input className="input" value={form.address || ''} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">NIF</label>
          <input className="input" value={form.nif || ''} onChange={(e) => setForm((p) => ({ ...p, nif: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">RCCM</label>
          <input className="input" value={form.rccm || ''} onChange={(e) => setForm((p) => ({ ...p, rccm: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea className="input" rows={3} value={form.notes || ''} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  );
}

export default CustomerForm;
