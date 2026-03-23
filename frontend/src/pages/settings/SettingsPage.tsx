import { useNavigate } from 'react-router-dom';
import { Building2, User, Bell, ArrowRight, Users, CreditCard, FileSearch, LucideIcon } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useTranslation } from 'react-i18next';

interface SettingsCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color: string;
  adminOnly?: boolean;
}

function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { t } = useTranslation();

  const settingsCategories: SettingsCategory[] = [
    {
      id: 'company',
      title: t('settings.categories.company.title'),
      description: t('settings.categories.company.description'),
      icon: Building2,
      path: '/settings/company',
      color: 'from-primary to-primary-dark',
    },
    {
      id: 'subscription',
      title: t('settings.categories.subscription.title'),
      description: t('settings.categories.subscription.description'),
      icon: CreditCard,
      path: '/settings/subscription',
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'users',
      title: t('settings.categories.users.title'),
      description: t('settings.categories.users.description'),
      icon: Users,
      path: '/settings/users',
      color: 'from-secondary to-secondary-dark',
    },
    {
      id: 'notifications',
      title: t('settings.categories.notifications.title'),
      description: t('settings.categories.notifications.description'),
      icon: Bell,
      path: '/settings/notifications',
      color: 'from-accent to-accent-dark',
    },
    {
      id: 'accountant',
      title: t('settings.categories.accountant.title'),
      description: t('settings.categories.accountant.description'),
      icon: FileSearch,
      path: '/settings/accountants/search',
      color: 'from-green-500 to-green-600',
      adminOnly: true,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">{t('settings.title')}</h1>
        <p className="text-text-secondary mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => navigate(category.path)}
              className="card group hover:shadow-medium transition-all duration-300 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                  <Icon className="text-white" size={24} />
                </div>
                <ArrowRight className="text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
              </div>
              
              <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                {category.title}
              </h3>
              
              <p className="text-sm text-text-secondary leading-relaxed">
                {category.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <h3 className="text-lg font-semibold text-text-primary mb-2">{t('settings.help.title')}</h3>
        <p className="text-sm text-text-secondary mb-4">{t('settings.help.body')}</p>
        <div className="flex gap-3">
          <button className="btn-ghost text-sm">
            {t('settings.help.documentation')}
          </button>
          <button className="btn-ghost text-sm">
            {t('settings.help.contactSupport')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

