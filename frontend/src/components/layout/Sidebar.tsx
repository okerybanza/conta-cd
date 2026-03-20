import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  CreditCard,
  Settings,
  BarChart3,
  FileCheck,
  LogOut,
  Repeat,
  Receipt,
  BookOpen,
  BookText,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  Wallet,
  Calculator,
  PieChart,
  Shield,
  MessageCircle,
  User,
  Clock,
  DollarSign,
  Building2,
  CalendarDays,
  Sparkles,
  Mail,
  Award,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import brandingService from '../../services/branding.service';
import quotaService from '../../services/quota.service';
import { useUserRole } from '../../hooks/useUserRole';
import CompanySelector from '../accountant/CompanySelector';
// Appareillement de thème (Apparence) désactivé pour le moment pour éviter la confusion
// import { ThemeSelector } from '../theme/ThemeSelector';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
}

function Sidebar() {
  const location = useLocation();
  // Utiliser le logo depuis public comme fallback principal
  const [logoUrl, setLogoUrl] = useState<string>('/logo-color.png');
  const { logout, user, company } = useAuthStore();
  const navigate = useNavigate();
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['sales']));
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [currentPackage, setCurrentPackage] = useState<string | null>(null);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [showContaMenu, setShowContaMenu] = useState(false);
  const contaMenuRef = useRef<HTMLDivElement>(null);
  const { role, isOwner, isAdmin: isUserAdmin, isAccountant: isUserAccountant, isRH, isManager, isEmployee, isExpertComptable } = useUserRole();
  const isAccountant = user?.isAccountant && !user?.companyId;
  const isAdmin = user?.isSuperAdmin || user?.isContaUser;
  // Un admin ne doit pas voir les menus clients, seulement le dashboard admin
  // Un expert comptable indépendant (sans companyId) voit les menus pour SON PROPRE CABINET
  // Un utilisateur normal ou un expert associé à une entreprise voit les menus clients
  const isRegularUser = !isAdmin; // Les experts comptables sont maintenant inclus pour gérer leur cabinet

  // Dashboard seul, sans catégorie
  const dashboardItem: NavItem = { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard };

  // Catégorie spéciale pour les experts comptables (gestion des entreprises clientes)
  const accountantCategory: NavCategory = {
    id: 'accountant',
    label: 'Expert Comptable',
    icon: Award,
    defaultOpen: true,
    items: [
      { path: '/accountant/requests', label: 'Demandes reçues', icon: Mail },
      { path: '/accountant/profile', label: 'Mon Profil', icon: User },
    ],
  };

  // Catégories organisées par ordre d'utilisation (du plus utilisé au moins utilisé)
  const navCategories: NavCategory[] = [
    {
      id: 'sales',
      label: 'Facturation',
      icon: ShoppingCart,
      defaultOpen: true,
      items: [
        { path: '/invoices', label: 'Factures', icon: FileText },
        { path: '/quotations', label: 'Devis', icon: FileText },
        { path: '/credit-notes', label: 'Avoirs', icon: FileText },
        { path: '/customers', label: 'Clients', icon: Users },
        { path: '/payments', label: 'Paiements', icon: CreditCard },
        { path: '/products', label: 'Articles', icon: Package },
        { path: '/recurring-invoices', label: 'Factures Récurrentes', icon: Repeat },
        { path: '/reports', label: 'Rapports Business', icon: BarChart3 },
      ],
    },
    {
      id: 'stock',
      label: 'Gestion de Stock',
      icon: Package,
      defaultOpen: false,
      items: [
        { path: '/stock/movements', label: 'Mouvements', icon: TrendingUp },
        { path: '/stock/warehouses', label: 'Entrepôts', icon: Building2 },
        { path: '/stock/alerts', label: 'Alertes Stock', icon: Clock },
      ],
    },
    {
      id: 'expenses',
      label: 'Dépenses',
      icon: Wallet,
      defaultOpen: false,
      items: [
        { path: '/expenses', label: 'Dépenses', icon: Receipt },
        { path: '/expenses/approvals', label: 'Approbations', icon: Clock },
        { path: '/suppliers', label: 'Fournisseurs', icon: Building2 },
      ],
    },
    {
      id: 'accounting',
      label: 'Comptabilité',
      icon: Calculator,
      defaultOpen: false,
      items: [
        // Configuration
        { path: '/accounts', label: 'Plan Comptable', icon: BookOpen },
        { path: '/fiscal-periods', label: 'Exercices Comptables', icon: Calendar },
        // Saisie
        { path: '/journal-entries', label: 'Écritures Comptables', icon: BookText },
        // Rapports Comptables
        { path: '/accounting-reports', label: 'Rapports Comptables', icon: FileText },
        { path: '/aged-balance', label: 'Balance Âgée', icon: TrendingUp },
        // États Financiers
        { path: '/financial-statements', label: 'États Financiers', icon: TrendingUp },
        // Fiscal & Réglementaire
        { path: '/tva', label: 'Gestion TVA', icon: Receipt },
        { path: '/depreciations', label: 'Amortissements', icon: TrendingDown },
        // Contrôles
        { path: '/reconciliation', label: 'Réconciliation', icon: FileCheck },
        { path: '/balance-validation', label: 'Validation Soldes', icon: Calculator },
      ],
    },
    {
      id: 'hr',
      label: 'RH',
      icon: Users,
      defaultOpen: false,
      items: [
        { path: '/hr/employees', label: 'Employés', icon: User },
        { path: '/hr/attendance', label: 'Pointage', icon: Clock },
        { path: '/hr/payroll', label: 'Paie', icon: DollarSign },
        { path: '/hr/leave-requests', label: 'Demandes de Congés', icon: CalendarDays },
        { path: '/hr/leave-balances', label: 'Soldes de Congés', icon: TrendingUp },
        { path: '/hr/compliance', label: 'Conformité Légale RDC', icon: Shield },
      ],
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: Shield,
      defaultOpen: false,
      items: [
        { path: '/audit', label: 'Audit', icon: FileCheck },
        { path: '/settings', label: 'Paramètres', icon: Settings },
        { path: '/settings/subscription', label: 'Abonnement', icon: CreditCard },
        { path: '/support', label: 'Support', icon: MessageCircle },
      ],
    },
  ];

  // Menu Admin pour Super Admins et utilisateurs Conta - directement comme items, pas de catégorie
  const adminItems: NavItem[] = [
    { path: '/admin/plans', label: 'Gestion des Plans', icon: Package },
    { path: '/admin/companies', label: 'Entreprises', icon: Building2 },
    { path: '/admin/users', label: 'Utilisateurs Conta', icon: Users },
    { path: '/admin/accountants', label: 'Experts Comptables', icon: Award },
    { path: '/admin/payments', label: 'Gestion des Paiements', icon: CreditCard },
    { path: '/admin/audit-logs', label: 'Journal d\'Audit', icon: FileCheck },
    { path: '/admin/settings', label: 'Paramètres Plateforme', icon: Settings },
  ];

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        // Si la catégorie est déjà ouverte, on la ferme
        newSet.delete(categoryId);
      } else {
        // Si on ouvre une nouvelle catégorie, on ferme toutes les autres
        // Les transitions CSS s'occuperont de l'animation
        return new Set([categoryId]);
      }
      return newSet;
    });
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname.startsWith('/admin/');
    }
    return location.pathname.startsWith(path);
  };

  // Charger les features disponibles
  useEffect(() => {
    const loadFeatures = async () => {
      // Ne pas charger les features si on est sur une page d'onboarding
      if (location.pathname.startsWith('/onboarding')) {
        setLoadingFeatures(false);
        return;
      }

      // Ne pas charger si l'utilisateur n'est pas authentifié
      if (!user || !company) {
        setLoadingFeatures(false);
        return;
      }

      try {
        const summary = await quotaService.getQuotaSummary();
        // Convertir PackageFeature en Record<string, boolean>
        const featuresRecord: Record<string, boolean> = {
          expenses: summary.features.expenses || false,
          accounting: summary.features.accounting || false,
          recurring_invoices: summary.features.recurring_invoices || false,
          api: summary.features.api || false,
          custom_templates: summary.features.custom_templates || false,
          multi_currency: summary.features.multi_currency || false,
          advanced_reports: summary.features.advanced_reports || false,
          workflows: summary.features.workflows || false,
          custom_branding: summary.features.custom_branding || false,
          stock: summary.features.stock || false,
          hr: summary.features.hr || false,
        };
        setFeatures(featuresRecord);
        setCurrentPackage(summary.currentPackage?.name || null);
      } catch (error: any) {
        // Gérer gracieusement les erreurs 401 (non authentifié) ou autres
        if (error.response?.status === 401) {
          // Utilisateur non authentifié, ne pas afficher d'erreur
          console.log('User not authenticated, skipping quota summary');
        } else {
          console.error('Error loading features:', error);
        }
      } finally {
        setLoadingFeatures(false);
      }
    };
    loadFeatures();
  }, [location.pathname, user, company]);

  /**
   * DOC-10 : Filtrer les catégories selon le rôle
   * L'UX est pensée par rôle, pas par fonctionnalités
   * Un rôle voit d'abord ce qui est utile, découvre le reste si nécessaire
   */
  const filterCategoriesByRole = (categories: NavCategory[]): NavCategory[] => {
    if (isAdmin) return []; // Admin voit seulement le dashboard admin

    // Expert-comptable indépendant : seulement ses menus
    if (isExpertComptable && !user?.companyId) {
      return [accountantCategory];
    }

    return categories.filter((category) => {
      // Owner : voit tout (vision globale)
      if (isOwner) return true;

      // Comptable : périodes, écritures, clôtures
      if (isUserAccountant) {
        return ['accounting', 'administration'].includes(category.id);
      }

      // RH : employés, contrats, préparation paie
      if (isRH) {
        return ['hr', 'administration'].includes(category.id);
      }

      // Manager : validation intermédiaire (facturation, rapports)
      if (isManager) {
        return ['sales', 'reports', 'administration'].includes(category.id);
      }

      // Employé : demandes personnelles seulement
      if (isEmployee) {
        return ['hr'].includes(category.id); // Pour les demandes de congés
      }

      // Par défaut : tout (pour les admins d'entreprise)
      return true;
    });
  };

  // Filtrer les éléments du menu selon les features disponibles
  const filterMenuItems = (items: NavItem[]): NavItem[] => {
    return items.filter((item) => {
      // Dashboard toujours visible
      if (item.path === '/dashboard') return true;

      // DOC-10 : Filtrer selon le rôle
      // Employé : seulement les demandes personnelles
      if (isEmployee) {
        const employeeAllowedPaths = ['/hr/leave-requests', '/hr/leave-balances', '/profile'];
        return employeeAllowedPaths.includes(item.path);
      }

      // RH : pas d'accès à la comptabilité
      if (isRH) {
        if (item.path.startsWith('/accounting') || item.path.startsWith('/fiscal-periods')) {
          return false;
        }
      }

      // Comptable : pas d'accès à la RH (sauf lecture)
      if (isUserAccountant) {
        if (item.path.startsWith('/hr/payroll') || item.path.startsWith('/hr/employees')) {
          return false; // Pas de création/modification, seulement lecture via rapports
        }
      }

      // Mapping des chemins vers les features
      const pathToFeature: Record<string, string> = {
        '/expenses': 'expenses',
        '/expenses/approvals': 'expenses',
        '/suppliers': 'expenses',
        '/accounting-reports': 'accounting',
        '/financial-statements': 'accounting',
        '/accounts': 'accounting',
        '/journal-entries': 'accounting',
        '/fiscal-periods': 'accounting',
        '/reconciliation': 'accounting',
        '/balance-validation': 'accounting',
        '/aged-balance': 'accounting',
        '/tva': 'accounting',
        '/depreciations': 'accounting',
        '/recurring-invoices': 'recurring_invoices',
        '/stock/movements': 'stock',
        '/stock/warehouses': 'stock',
        '/stock/alerts': 'stock',
        '/hr/employees': 'hr',
        '/hr/attendance': 'hr',
        '/hr/payroll': 'hr',
        '/hr/leave-requests': 'hr',
        '/hr/leave-balances': 'hr',
        '/hr/compliance': 'hr',
      };

      const requiredFeature = pathToFeature[item.path];
      if (!requiredFeature) return true; // Pas de restriction, toujours visible

      return features[requiredFeature] === true;
    });
  };

  // Ouvrir automatiquement la catégorie contenant la page active
  useEffect(() => {
    const getActiveCategory = () => {
      for (const category of navCategories) {
        if (category.items.some((item) => {
          if (item.path === '/dashboard') {
            return location.pathname === '/dashboard';
          }
          return location.pathname.startsWith(item.path);
        })) {
          return category.id;
        }
      }
      return null;
    };

    const activeCategoryId = getActiveCategory();
    if (activeCategoryId) {
      setOpenCategories((prev) => {
        if (!prev.has(activeCategoryId)) {
          return new Set([...prev, activeCategoryId]);
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Charger le logo du branding
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const branding = await brandingService.getBranding();
        const url = brandingService.getLogoUrl(branding);
        setLogoUrl(url);
      } catch (error) {
        console.error('Error loading branding:', error);
        // Fallback vers le logo depuis public (toujours accessible)
        setLogoUrl('/logo-color.png');
      }
    };
    loadBranding();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fermer le menu Conta si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contaMenuRef.current && !contaMenuRef.current.contains(event.target as Node)) {
        setShowContaMenu(false);
      }
    };

    if (showContaMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContaMenu]);

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || 'Utilisateur';
  };

  const getUserRole = () => {
    if (user?.isSuperAdmin) return 'Super Admin';
    if (user?.isContaUser) return 'Admin Conta';
    if (user?.isAccountant) return 'Expert Comptable';
    if (user?.role === 'admin') return 'Administrateur';
    if (user?.role === 'manager') return 'Manager';
    if (user?.role === 'employee') return 'Employé';
    return 'Utilisateur';
  };

  return (
    <div className="fixed left-0 top-0 h-full w-56 bg-white border-r border-border/30 z-40 flex flex-col">
      {/* Logo avec Menu Déroulant */}
      <div className="h-14 border-b border-border/30 flex items-center justify-start pl-4 relative" ref={contaMenuRef}>
        <button
          onClick={() => setShowContaMenu(!showContaMenu)}
          className="flex items-center gap-3 w-full hover:bg-gray-50 rounded-md p-2 -ml-2 transition-colors"
        >
          {logoUrl && logoUrl !== '/logo-color.png' ? (
            <img
              src={logoUrl}
              alt="Conta"
              className="h-10 w-auto object-contain max-w-[140px]"
              onError={(e) => {
                setLogoUrl('/logo-color.png');
              }}
              onLoad={() => {
                // Logo chargé avec succès
              }}
            />
          ) : (
            <>
              <img
                src="/logo-color.png"
                alt="Conta"
                className="h-10 w-auto object-contain max-w-[140px]"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center hidden">
                <span className="text-white font-bold text-xl">C</span>
              </div>
            </>
          )}
          <h1 className="text-2xl font-bold text-primary">Conta</h1>
          <ChevronDown
            size={16}
            className={`text-text-muted transition-transform ${showContaMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Menu Déroulant Conta */}
        {showContaMenu && (
          <div
            className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg border border-border/30 shadow-xl z-50"
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Informations Utilisateur */}
            <div className="p-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: '#0D3B66' }}
                >
                  {getUserInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {getUserName()}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                    {getUserRole()}
                  </span>
                </div>
              </div>
            </div>

            {/* Informations Entreprise */}
            {company && (
              <div className="p-4 border-b border-border/30">
                <p className="text-xs text-text-secondary mb-1">Entreprise</p>
                <p className="text-sm font-medium text-text-primary">{company.name}</p>
                {currentPackage && (
                  <p className="text-xs text-text-secondary mt-1">Plan: {currentPackage}</p>
                )}
              </div>
            )}

            {/* Sélecteur d'entreprise pour l'expert-comptable */}
            {isAccountant && (
              <div className="p-4 border-b border-border/30">
                <p className="text-xs text-text-secondary mb-2">
                  Entreprises gérées
                </p>
                <CompanySelector />
              </div>
            )}

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowContaMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-text-primary hover:bg-background-gray transition-colors"
              >
                <User size={16} className="text-text-muted" />
                Voir mon Profil
              </button>
              <button
                onClick={() => {
                  navigate('/settings');
                  setShowContaMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-text-primary hover:bg-background-gray transition-colors"
              >
                <Settings size={16} className="text-text-muted" />
                Paramètres
              </button>
              <div className="border-t border-border/30 my-1" />
              <button
                onClick={() => {
                  setShowContaMenu(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-1">
          {/* Dashboard - différent selon le type d'utilisateur */}
          {isAdmin ? (
            // Pour les admins, le dashboard pointe vers /admin
            <Link
              to="/admin"
              className={`
                flex items-center space-x-2 px-3 py-2 rounded
                transition-colors duration-150
                ${isActive('/admin')
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-background-gray'
                }
              `}
            >
              <dashboardItem.icon
                size={16}
                strokeWidth={isActive('/admin') ? 2.5 : 2}
                className={isActive('/admin') ? 'text-primary' : 'text-text-muted'}
              />
              <span className="flex-1 text-sm">Dashboard Admin</span>
            </Link>
          ) : (
            // Pour les utilisateurs normaux et experts, le dashboard standard
            <Link
              to={dashboardItem.path}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded
                transition-colors duration-150
                ${isActive(dashboardItem.path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-background-gray'
                }
              `}
            >
              <dashboardItem.icon
                size={16}
                strokeWidth={isActive(dashboardItem.path) ? 2.5 : 2}
                className={isActive(dashboardItem.path) ? 'text-primary' : 'text-text-muted'}
              />
              <span className="flex-1 text-sm">{dashboardItem.label}</span>
            </Link>
          )}

          {/* Catégorie Expert Comptable (si l'utilisateur est expert) */}
          {isAccountant && !loadingFeatures && (
            <div className="space-y-0.5">
              {(() => {
                const CategoryIcon = accountantCategory.icon;
                const isOpen = openCategories.has(accountantCategory.id);
                const hasActiveItem = accountantCategory.items.some((item) => isActive(item.path));

                return (
                  <>
                    <button
                      onClick={() => toggleCategory(accountantCategory.id)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded
                        transition-colors duration-150
                        ${hasActiveItem
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:bg-background-gray'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <CategoryIcon
                          size={16}
                          strokeWidth={hasActiveItem ? 2.5 : 2}
                          className={hasActiveItem ? 'text-primary' : 'text-text-muted'}
                        />
                        <span className="text-sm">{accountantCategory.label}</span>
                        <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                          Expert
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronDown size={14} className="text-text-muted" />
                      ) : (
                        <ChevronRight size={14} className="text-text-muted" />
                      )}
                    </button>

                    <div
                      className={`
                        ml-4 space-y-0.5 border-l border-border/30 pl-3
                        transition-all duration-200 ease-in-out overflow-hidden
                        ${isOpen
                          ? 'max-h-[500px] opacity-100'
                          : 'max-h-0 opacity-0'
                        }
                      `}
                    >
                      {accountantCategory.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`
                              flex items-center space-x-2 px-3 py-1.5 rounded
                              transition-colors duration-150
                              ${active
                                ? 'bg-primary/10 text-primary'
                                : 'text-text-secondary hover:bg-background-gray'
                              }
                            `}
                          >
                            <Icon
                              size={14}
                              strokeWidth={active ? 2.5 : 2}
                              className={active ? 'text-primary' : 'text-text-muted'}
                            />
                            <span className="flex-1 text-sm">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Menu Admin (si Super Admin ou Conta User) - directement comme items, pas de catégorie */}
          {isAdmin && !loadingFeatures && (
            <div className="space-y-0.5">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded
                      transition-colors duration-150
                      ${active
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:bg-background-gray'
                      }
                    `}
                  >
                    <Icon
                      size={16}
                      strokeWidth={active ? 2.5 : 2}
                      className={active ? 'text-primary' : 'text-text-muted'}
                    />
                    <span className="flex-1 text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Catégories - pour les utilisateurs normaux ET les experts comptables (pour leur propre cabinet) */}
          {!loadingFeatures && isRegularUser && filterCategoriesByRole(navCategories).map((category) => {
            const CategoryIcon = category.icon;
            const filteredItems = filterMenuItems(category.items);

            // Ne pas afficher la catégorie si tous les items sont filtrés
            if (filteredItems.length === 0) return null;

            const isOpen = openCategories.has(category.id);
            const hasActiveItem = filteredItems.some((item) => isActive(item.path));

            return (
              <div key={category.id} className="space-y-0.5">
                {/* En-tête de catégorie */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded
                    transition-colors duration-150
                    ${hasActiveItem
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-background-gray'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <CategoryIcon
                      size={16}
                      strokeWidth={hasActiveItem ? 2.5 : 2}
                      className={hasActiveItem ? 'text-primary' : 'text-text-muted'}
                    />
                    <span className="text-sm">{category.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown size={14} className="text-text-muted" />
                  ) : (
                    <ChevronRight size={14} className="text-text-muted" />
                  )}
                </button>

                {/* Items de la catégorie */}
                <div
                  className={`
                    ml-4 space-y-0.5 border-l border-border/30 pl-3
                    transition-all duration-200 ease-in-out overflow-hidden
                    ${isOpen
                      ? 'max-h-[500px] opacity-100'
                      : 'max-h-0 opacity-0'
                    }
                  `}
                >
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    // Afficher badge "Upgrade" sur l'item Abonnement si plan limité
                    const showUpgradeBadge = item.path === '/settings/subscription' &&
                      currentPackage &&
                      currentPackage.toLowerCase() !== 'premium' &&
                      currentPackage.toLowerCase() !== 'enterprise';

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                            flex items-center space-x-2 px-3 py-1.5 rounded
                            transition-colors duration-150
                            ${active
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-secondary hover:bg-background-gray'
                          }
                          `}
                      >
                        <Icon
                          size={14}
                          strokeWidth={active ? 2.5 : 2}
                          className={active ? 'text-primary' : 'text-text-muted'}
                        />
                        <span className="flex-1 text-sm">{item.label}</span>
                        {showUpgradeBadge && (
                          <span className="bg-gradient-to-r from-primary to-accent text-white text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Sparkles size={10} />
                            Upgrade
                          </span>
                        )}
                        {item.badge && !showUpgradeBadge && (
                          <span className="bg-primary text-white text-xs font-medium px-1.5 py-0.5 rounded min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* User & Settings */}
      <div className="p-3 border-t border-border/30 space-y-2">
        {/* Sélecteur d'apparence temporairement masqué */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded text-text-secondary hover:bg-background-gray transition-colors duration-150"
        >
          <LogOut size={14} strokeWidth={2} className="text-text-muted" />
          <span className="text-sm">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;

