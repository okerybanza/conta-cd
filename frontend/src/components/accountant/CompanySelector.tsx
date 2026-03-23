import { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check, Briefcase, Award } from 'lucide-react';
import accountantService from '../../services/accountant.service';
import { useAuthStore } from '../../store/auth.store';
import { useToastContext } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

interface ManagedCompany {
  id: string;
  name: string;
  businessName?: string;
  logoUrl?: string;
  relationId: string;
  acceptedAt?: string;
}

interface CompanyOption {
  id: string;
  name: string;
  businessName?: string;
  logoUrl?: string;
  type: 'cabinet' | 'client';
  relationId?: string;
}

function CompanySelector() {
  const { user, company, setActiveCompany } = useAuthStore();
  const { showError, showSuccess } = useToastContext();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<ManagedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [ownCabinet, setOwnCabinet] = useState<CompanyOption | null>(null);

  useEffect(() => {
    loadCompanies();
  }, [user?.companyId]);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await accountantService.getManagedCompanies();
      setCompanies(response || []);
      
      // Si l'expert a un cabinet, le charger aussi
      if (user?.companyId) {
        try {
          const companyResponse = await accountantService.getOwnCabinet();
          const cabinet = (companyResponse as any)?.data ?? companyResponse;
          if (cabinet) {
            setOwnCabinet({
              id: cabinet.id,
              name: cabinet.name,
              businessName: cabinet.businessName,
              logoUrl: cabinet.logoUrl,
              type: 'cabinet',
            });
          }
        } catch {
          // Cabinet non trouvé, ignorer
        }
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du chargement des entreprises');
    } finally {
      setLoading(false);
    }
  };

  // Construire la liste des options : "Mon Cabinet" en premier, puis les entreprises clientes
  const getCompanyOptions = (): CompanyOption[] => {
    const options: CompanyOption[] = [];
    
    // Si l'expert a son propre cabinet, l'ajouter en premier
    if (ownCabinet) {
      options.push(ownCabinet);
    } else if (user?.companyId && company) {
      options.push({
        id: company.id,
        name: company.name,
        businessName: company.businessName,
        logoUrl: company.logoUrl,
        type: 'cabinet',
      });
    }
    
    // Ajouter les entreprises clientes
    companies.forEach((c) => {
      options.push({
        id: c.id,
        name: c.name,
        businessName: c.businessName,
        logoUrl: c.logoUrl,
        type: 'client',
        relationId: c.relationId,
      });
    });
    
    return options;
  };

  const selectCompany = async (selectedOption: CompanyOption) => {
    // Fermer le dropdown
    setIsOpen(false);

    // Si c'est déjà l'entreprise active, ne rien faire
    if (selectedOption.id === company?.id) {
      return;
    }

    // Mettre à jour le store avec setActiveCompany (incrémente companyVersion)
    setActiveCompany({
      id: selectedOption.id,
      name: selectedOption.name,
      businessName: selectedOption.businessName,
      logoUrl: selectedOption.logoUrl,
    });

    showSuccess(`Contexte changé vers ${selectedOption.name}`);
    
    // Naviguer vers le dashboard pour rafraîchir le contexte
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-5 w-32 bg-gray-300 rounded"></div>
      </div>
    );
  }

  const companyOptions = getCompanyOptions();
  
  if (companyOptions.length === 0) {
    return null;
  }

  const currentOption = companyOptions.find((c) => c.id === company?.id) || companyOptions[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {currentOption.logoUrl ? (
          <img
            src={currentOption.logoUrl}
            alt={currentOption.name}
            className="w-6 h-6 rounded object-cover"
          />
        ) : (
          <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
            {currentOption.type === 'cabinet' ? (
              <Briefcase className="text-primary" size={16} />
            ) : (
              <Building2 className="text-primary" size={16} />
            )}
          </div>
        )}
        <span className="text-sm font-medium text-text-primary hidden md:block max-w-[150px] truncate">
          {currentOption.name}
        </span>
        <ChevronDown
          className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {/* Section "Mon Cabinet" */}
            {user?.companyId && company && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase">
                  Mon Cabinet
                </div>
                <button
                  onClick={() => selectCompany({
                    id: company.id,
                    name: company.name,
                    businessName: company.businessName,
                    logoUrl: company.logoUrl,
                    type: 'cabinet',
                  })}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                    company.id === currentOption.id ? 'bg-primary/5' : ''
                  }`}
                >
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                      <Briefcase className="text-primary" size={18} />
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{company.name}</p>
                    {company.businessName && (
                      <p className="text-xs text-text-secondary truncate">{company.businessName}</p>
                    )}
                  </div>
                  {company.id === currentOption.id && (
                    <Check className="text-primary flex-shrink-0" size={18} />
                  )}
                </button>
                {companies.length > 0 && (
                  <div className="border-t border-gray-200 my-2"></div>
                )}
              </>
            )}

            {/* Section "Entreprises Client" */}
            {companies.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase">
                  Entreprises Client ({companies.length})
                </div>
                {companies.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => selectCompany({
                      id: comp.id,
                      name: comp.name,
                      businessName: comp.businessName,
                      logoUrl: comp.logoUrl,
                      type: 'client',
                      relationId: comp.relationId,
                    })}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                      comp.id === currentOption.id ? 'bg-primary/5' : ''
                    }`}
                  >
                    {comp.logoUrl ? (
                      <img
                        src={comp.logoUrl}
                        alt={comp.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                        <Building2 className="text-primary" size={18} />
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{comp.name}</p>
                      {comp.businessName && (
                        <p className="text-xs text-text-secondary truncate">{comp.businessName}</p>
                      )}
                    </div>
                    {comp.id === currentOption.id && (
                      <Check className="text-primary flex-shrink-0" size={18} />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanySelector;

