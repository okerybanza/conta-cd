import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Building2, BookOpen, Package, Users, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';

type CompanyField = 'name' | 'phone' | 'address' | 'rccm' | 'nif' | 'country' | 'currency' | 'timezone' | 'activityType';
type CompanyData = Record<CompanyField, string>;

type BusinessType = 'commerce' | 'services' | 'production' | 'ngo' | 'multi';
type ModulesConfig = {
  invoicing: boolean;
  accounting: boolean;
  stock: boolean;
  hr: boolean;
};
type StockConfig = {
  enabled: boolean;
  multiWarehouse: boolean;
  valuationMethod: 'fifo' | 'weighted_average';
};
type HRConfig = {
  enabled: boolean;
  payrollCycle: 'monthly' | 'biweekly';
  accountingLink: boolean;
};

const STEPS = [
  { id: 1, title: 'Entreprise', icon: Building2, desc: 'Identification' },
  { id: 2, title: 'Type d\'activité', icon: Package, desc: 'Secteur' },
  { id: 3, title: 'Modules', icon: BookOpen, desc: 'Activation' },
  { id: 4, title: 'Stock', icon: Package, desc: 'Configuration' },
  { id: 5, title: 'RH', icon: Users, desc: 'Configuration' },
  { id: 6, title: 'Validation', icon: CheckCircle, desc: 'Récapitulatif' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<CompanyData>({
    name: '',
    phone: '',
    address: '',
    rccm: '',
    nif: '',
    country: 'RDC',
    currency: 'CDF',
    timezone: 'Africa/Kinshasa',
    activityType: '',
  });
  const [businessType, setBusinessType] = useState<BusinessType>('commerce');
  const [modules, setModules] = useState<ModulesConfig>({
    invoicing: true,
    accounting: false,
    stock: false,
    hr: false,
  });
  const [stockConfig, setStockConfig] = useState<StockConfig>({
    enabled: false,
    multiWarehouse: false,
    valuationMethod: 'fifo',
  });
  const [hrConfig, setHRConfig] = useState<HRConfig>({
    enabled: false,
    payrollCycle: 'monthly',
    accountingLink: false,
  });

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const handleCompanySave = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(company),
      });
      setStep(2);
    } catch (e) {
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalValidation = async () => {
    setLoading(true);
    try {
      const config = {
        company,
        businessType,
        modules,
        stockConfig: modules.stock ? stockConfig : null,
        hrConfig: modules.hr ? hrConfig : null,
      };
      
      await fetch('/api/v1/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });
      
      if (modules.accounting) {
        await fetch('/api/v1/accounts/initialize', {
          method: 'POST',
          credentials: 'include',
        });
      }
      
      navigate('/dashboard');
    } catch (e) {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a3a5c' }}>Bienvenue sur Conta.cd</div>
          <div style={{ color: '#666', marginTop: '8px' }}>Configurez votre espace en quelques étapes simples</div>
        </div>

        <div style={{ background: '#dde4f0', borderRadius: '99px', height: '6px', marginBottom: '32px' }}>
          <div style={{ background: '#1a3a5c', height: '6px', borderRadius: '99px', width: `${progress}%`, transition: 'width 0.4s' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', overflowX: 'auto' }}>
          {STEPS.map(s => (
            <div key={s.id} style={{ textAlign: 'center', flex: 1, minWidth: '80px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 6px',
                background: step >= s.id ? '#1a3a5c' : '#dde4f0',
                color: step >= s.id ? 'white' : '#999',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px'
              }}>{step > s.id ? '✓' : s.id}</div>
              <div style={{ fontSize: '11px', color: step >= s.id ? '#1a3a5c' : '#999', fontWeight: step === s.id ? 'bold' : 'normal' }}>{s.title}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

          {/* Étape 1 — Identification entreprise */}
          {step === 1 && (
            <div>
              <h2 style={{ color: '#1a3a5c', marginBottom: '16px' }}>🏢 Identification de votre entreprise</h2>
              <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
                Ces informations apparaîtront sur vos factures et documents officiels.
              </p>
              {[
                { key: 'name' as const, label: 'Nom de l\'entreprise *', placeholder: 'Ex: SARL MonEntreprise' },
                { key: 'country' as const, label: 'Pays *', type: 'select', options: ['RDC', 'Congo-Brazzaville', 'Burundi', 'Rwanda'] },
                { key: 'currency' as const, label: 'Devise principale *', type: 'select', options: ['CDF', 'USD', 'EUR'] },
                { key: 'timezone' as const, label: 'Fuseau horaire *', type: 'select', options: ['Africa/Kinshasa', 'Africa/Lubumbashi', 'Africa/Brazzaville'] },
                { key: 'activityType' as const, label: 'Type d\'activité', placeholder: 'Ex: Commerce de détail, Services IT...' },
                { key: 'phone' as const, label: 'Téléphone', placeholder: '+243 xxx xxx xxx' },
                { key: 'address' as const, label: 'Adresse', placeholder: 'Kinshasa, RDC' },
                { key: 'rccm' as const, label: 'RCCM', placeholder: 'CD/KIN/RCCM/...' },
                { key: 'nif' as const, label: 'NIF', placeholder: 'Numéro d\'identification fiscale' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#333' }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select
                      value={company[f.key]}
                      onChange={e => setCompany({ ...company, [f.key]: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    >
                      {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      value={company[f.key]}
                      onChange={e => setCompany({ ...company, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  )}
                </div>
              ))}
              <button
                onClick={handleCompanySave}
                disabled={!company.name || loading}
                style={{ width: '100%', padding: '12px', background: company.name ? '#1a3a5c' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: company.name ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? 'Enregistrement...' : 'Continuer'} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Étape 2 — Type d'entreprise */}
          {step === 2 && (
            <div>
              <h2 style={{ color: '#1a3a5c', marginBottom: '16px' }}>🏭 Type d'entreprise</h2>
              <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
                Sélectionnez le type qui correspond le mieux à votre activité principale.
              </p>
              <div style={{ background: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '8px', padding: '12px', marginBottom: '24px', fontSize: '13px', color: '#1565c0' }}>
                <strong>💡 Impact :</strong> Ce choix détermine les modèles de documents et rapports adaptés à votre secteur.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {[
                  { value: 'commerce' as const, label: 'Commerce', icon: '🛒', desc: 'Achat-revente de marchandises' },
                  { value: 'services' as const, label: 'Services', icon: '💼', desc: 'Prestations de services' },
                  { value: 'production' as const, label: 'Production', icon: '🏭', desc: 'Fabrication de produits' },
                  { value: 'ngo' as const, label: 'ONG', icon: '🤝', desc: 'Organisation non gouvernementale' },
                  { value: 'multi' as const, label: 'Multi-activité', icon: '🔄', desc: 'Plusieurs types d\'activités' },
                ].map(type => (
                  <button
                    key={type.value}
                    onClick={() => setBusinessType(type.value)}
                    style={{
                      padding: '16px',
                      border: businessType === type.value ? '2px solid #1a3a5c' : '1px solid #ddd',
                      borderRadius: '8px',
                      background: businessType === type.value ? '#f0f4ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{type.icon}</div>
                    <div style={{ fontWeight: 'bold', color: '#1a3a5c', marginBottom: '4px' }}>{type.label}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{type.desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Retour
                </button>
                <button onClick={() => setStep(3)} style={{ flex: 2, padding: '12px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 — Activation modules */}
          {step === 3 && (
            <div>
              <h2 style={{ color: '#1a3a5c', marginBottom: '16px' }}>📦 Activation des modules</h2>
              <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
                Choisissez les modules dont vous avez besoin. Vous pourrez les activer/désactiver plus tard.
              </p>
              <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#856404' }}>
                <strong>⚠️ Important :</strong> Le module Facturation est toujours activé (obligatoire).
              </div>
              <div style={{ background: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '8px', padding: '12px', marginBottom: '24px', fontSize: '13px', color: '#1565c0' }}>
                <strong>💡 Impact :</strong> Les modules activés déterminent les fonctionnalités disponibles et peuvent influencer votre plan tarifaire.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {[
                  { key: 'invoicing' as const, label: 'Facturation', icon: '📄', desc: 'Factures, devis, avoirs, paiements', disabled: true },
                  { key: 'accounting' as const, label: 'Comptabilité', icon: '📚', desc: 'Plan comptable SYSCOHADA, écritures, rapports' },
                  { key: 'stock' as const, label: 'Gestion de Stock', icon: '📦', desc: 'Mouvements, entrepôts, inventaires' },
                  { key: 'hr' as const, label: 'Ressources Humaines', icon: '👥', desc: 'Employés, pointage, paie, congés' },
                ].map(mod => (
                  <label
                    key={mod.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      border: modules[mod.key] ? '2px solid #1a3a5c' : '1px solid #ddd',
                      borderRadius: '8px',
                      background: modules[mod.key] ? '#f0f4ff' : 'white',
                      cursor: mod.disabled ? 'not-allowed' : 'pointer',
                      opacity: mod.disabled ? 0.7 : 1
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={modules[mod.key]}
                      onChange={e => !mod.disabled && setModules({ ...modules, [mod.key]: e.target.checked })}
                      disabled={mod.disabled}
                      style={{ width: '20px', height: '20px', cursor: mod.disabled ? 'not-allowed' : 'pointer' }}
                    />
                    <div style={{ fontSize: '32px' }}>{mod.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#1a3a5c', marginBottom: '4px' }}>
                        {mod.label} {mod.disabled && <span style={{ fontSize: '12px', color: '#666' }}>(Obligatoire)</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{mod.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Retour
                </button>
                <button onClick={() => setStep(modules.stock ? 4 : (modules.hr ? 5 : 6))} style={{ flex: 2, padding: '12px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Étape 4 — Config Stock */}
          {step === 4 && modules.stock && (
            <div>
              <h2 style={{ color: '#1a3a5c', marginBottom: '16px' }}>📦 Configuration Stock</h2>
              <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
                Configurez la gestion de votre stock selon vos besoins.
              </p>
              <div style={{ background: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '8px', padding: '12px', marginBottom: '24px', fontSize: '13px', color: '#1565c0' }}>
                <strong>💡 Impact :</strong> Ces paramètres influencent la valorisation de votre stock et vos rapports comptables.
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#333' }}>
                  Gestion des entrepôts
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: stockConfig.multiWarehouse ? '2px solid #1a3a5c' : '1px solid #ddd', borderRadius: '8px', background: stockConfig.multiWarehouse ? '#f0f4ff' : 'white', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={!stockConfig.multiWarehouse}
                      onChange={() => setStockConfig({ ...stockConfig, multiWarehouse: false })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1a3a5c' }}>Entrepôt unique</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Un seul lieu de stockage</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: stockConfig.multiWarehouse ? '2px solid #1a3a5c' : '1px solid #ddd', borderRadius: '8px', background: stockConfig.multiWarehouse ? '#f0f4ff' : 'white', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={stockConfig.multiWarehouse}
                      onChange={() => setStockConfig({ ...stockConfig, multiWarehouse: true })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1a3a5c' }}>Multi-entrepôts</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Plusieurs lieux de stockage</div>
                    </div>
                  </label>
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#333' }}>
                  Méthode de valorisation
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: stockConfig.valuationMethod === 'fifo' ? '2px solid #1a3a5c' : '1px solid #ddd', borderRadius: '8px', background: stockConfig.valuationMethod === 'fifo' ? '#f0f4ff' : 'white', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={stockConfig.valuationMethod === 'fifo'}
                      onChange={() => setStockConfig({ ...stockConfig, valuationMethod: 'fifo' })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1a3a5c' }}>FIFO (Premier Entré, Premier Sorti)</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Recommandé pour la plupart des entreprises</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: stockConfig.valuationMethod === 'weighted_average' ? '2px solid #1a3a5c' : '1px solid #ddd', borderRadius: '8px', background: stockConfig.valuationMethod === 'weighted_average' ? '#f0f4ff' : 'white', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={stockConfig.valuationMethod === 'weighted_average'}
                      onChange={() => setStockConfig({ ...stockConfig, valuationMethod: 'weighted_average' })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1a3a5c' }}>Coût Moyen Pondéré (CMP)</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Lisse les variations de prix</div>
                    </div>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Retour
                </button>
                <button onClick={() => setStep(modules.hr ? 5 : 6)} style={{ flex: 2, padding: '12px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Étape 5 — Config RH */}
          {step === 5 && modules.hr && (
            <div>
              <h2 style={{ color: '#1a3a5c', marginBottom: '16px' }}>👥 Configuration RH</h2>
              <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
                Configurez la gestion des ressources humaines selon vos besoins.
              </p>
              <div style={{ background: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '8px', padding: '12px', marginBottom: '24px', fontSize: '13px', color: '#1565c0' }}>
                <strong>💡 Impact :</strong> Ces paramètres déterminent la fréquence de paie et l'intégration avec la comptabilité.
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#333' }}>
                  Cycle de paie
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: hrConfig.payrollCycle === 'monthly' ? '2px solid #1a3a5c' : '1px solid #ddd', borderRadius: '8px', background: hrConfig.payrollCycle === 'monthly' ? '#f0f4ff' : 'white', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={hrConfig.payrollCycle === 'monthly'}
                      onChange={() => setHRConfig({ ...hrConfig, payrollCycle: 'monthly' })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1a3a5c' }}>Mensuel</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Paie une fois par mois (standard RDC)</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: hrConfig.payrollCycle === 'biweekly' ? '2px solid #1a3a5c' : '1px solid #ddd', borderRadius: '8px', background: hrConfig.payrollCycle === 'biweekly' ? '#f0f4ff' : 'white', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={hrConfig.payrollCycle === 'biweekly'}
                      onChange={() => setHRConfig({ ...hrConfig, payrollCycle: 'biweekly' })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1a3a5c' }}>Bimensuel</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Paie deux fois par mois</div>
                    </div>
                  </label>
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: hrConfig.accountingLink ? '2px solid #1a3a5c' : '1px solid #ddd', borderRadius: '8px', background: hrConfig.accountingLink ? '#f0f4ff' : 'white', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hrConfig.accountingLink}
                    onChange={e => setHRConfig({ ...hrConfig, accountingLink: e.target.checked })}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1a3a5c' }}>Lier avec la comptabilité</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Génère automatiquement les écritures comptables de paie</div>
                  </div>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(modules.stock ? 4 : 3)} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Retour
                </button>
                <button onClick={() => setStep(6)} style={{ flex: 2, padding: '12px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Étape 6 — Validation finale */}
          {step === 6 && (
            <div>
              <h2 style={{ color: '#1a3a5c', marginBottom: '16px' }}>✅ Récapitulatif et Validation</h2>
              <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
                Vérifiez votre configuration avant de finaliser.
              </p>
              
              <div style={{ background: '#fff3cd', border: '2px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <AlertTriangle size={24} className="text-warning" style={{ color: '#856404', flexShrink: 0 }} />
                  <div style={{ fontSize: '13px', color: '#856404' }}>
                    <strong>⚠️ Attention - Choix verrouillés :</strong>
                    <ul style={{ marginTop: '8px', marginLeft: '16px', lineHeight: '1.6' }}>
                      <li>Le <strong>type d'entreprise</strong> ne pourra plus être modifié après validation</li>
                      <li>La <strong>devise principale</strong> et le <strong>fuseau horaire</strong> sont verrouillés</li>
                      <li>La <strong>méthode de valorisation du stock</strong> (si activée) ne peut être changée</li>
                    </ul>
                    <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                      Ces paramètres impactent vos données comptables et ne peuvent être modifiés sans réinitialisation complète.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a3a5c', marginBottom: '12px' }}>Entreprise</h3>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                  <div><strong>Nom :</strong> {company.name}</div>
                  <div><strong>Pays :</strong> {company.country} 🔒</div>
                  <div><strong>Devise :</strong> {company.currency} 🔒</div>
                  <div><strong>Fuseau horaire :</strong> {company.timezone} 🔒</div>
                  <div><strong>Type d'activité :</strong> {businessType} 🔒</div>
                </div>
              </div>

              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a3a5c', marginBottom: '12px' }}>Modules activés</h3>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                  {modules.invoicing && <div>✓ Facturation (obligatoire)</div>}
                  {modules.accounting && <div>✓ Comptabilité SYSCOHADA</div>}
                  {modules.stock && <div>✓ Gestion de Stock ({stockConfig.multiWarehouse ? 'Multi-entrepôts' : 'Entrepôt unique'}, {stockConfig.valuationMethod === 'fifo' ? 'FIFO' : 'CMP'}) 🔒</div>}
                  {modules.hr && <div>✓ Ressources Humaines ({hrConfig.payrollCycle === 'monthly' ? 'Paie mensuelle' : 'Paie bimensuelle'}, {hrConfig.accountingLink ? 'Lié comptabilité' : 'Non lié'})</div>}
                </div>
              </div>

              <div style={{ background: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '8px', padding: '12px', marginBottom: '24px', fontSize: '13px', color: '#1565c0' }}>
                <strong>💡 Après validation :</strong> Vous serez redirigé vers votre tableau de bord. Les modules activés seront immédiatement disponibles.
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(modules.hr ? 5 : (modules.stock ? 4 : 3))} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Retour
                </button>
                <button onClick={handleFinalValidation} disabled={loading} style={{ flex: 2, padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
                  {loading ? 'Finalisation...' : '✓ Valider et Commencer'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
