import { useState, useEffect } from 'react';
import { UserPlus, Search, Edit, Trash2, Mail, Lock, Shield, User as UserIcon, Briefcase, FileText } from 'lucide-react';
import userService, { User, InviteUserData } from '../../services/user.service';
import PermissionEditor from '../../components/users/PermissionEditor';
import { QuotaErrorModal } from '../../components/QuotaErrorModal';
import { useQuotaError } from '../../hooks/useQuotaError';

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const quotaErrorHandler = useQuotaError();

  // Formulaire d'invitation
  const [inviteData, setInviteData] = useState<InviteUserData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'manager',
  });

  useEffect(() => {
    loadUsers();
  }, [roleFilter, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (roleFilter) filters.role = roleFilter;
      if (searchTerm) filters.search = searchTerm;
      const data = await userService.list(filters);
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.invite(inviteData);
      setShowInviteForm(false);
      setInviteData({ email: '', firstName: '', lastName: '', role: 'manager' });
      loadUsers();
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.code === 'QUOTA_EXCEEDED') {
        const handled = quotaErrorHandler.handleError(err);
        if (!handled) {
          setError(err.response?.data?.message || 'Limite d\'utilisateurs atteinte. Veuillez upgrader votre plan.');
        }
      } else {
        setError(err.response?.data?.error?.message || err.response?.data?.message || 'Erreur lors de l\'invitation');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      await userService.delete(id);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la suppression');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdate = async (updatedUser: User) => {
    try {
      await userService.update(updatedUser.id, {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        role: updatedUser.role,
        permissions: updatedUser.permissions,
      });
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la mise à jour');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="text-primary" size={16} />;
      case 'accountant':
        return <FileText className="text-secondary" size={16} />;
      case 'manager':
        return <Briefcase className="text-accent" size={16} />;
      case 'rh':
        return <UserIcon className="text-purple-600" size={16} />;
      default:
        return <UserIcon className="text-text-muted" size={16} />;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      accountant: 'Comptable',
      manager: 'Manager',
      employee: 'Employé',
      rh: 'Ressources Humaines',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-primary/10 text-primary border-primary/20',
      accountant: 'bg-secondary/10 text-secondary border-secondary/20',
      manager: 'bg-accent/10 text-accent border-accent/20',
      employee: 'bg-text-muted/10 text-text-muted border-text-muted/20',
      rh: 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return colors[role] || colors.employee;
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Gestion des Utilisateurs</h1>
          <p className="text-text-secondary mt-1">Gérez les utilisateurs et leurs permissions</p>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={20} />
          Inviter un utilisateur
        </button>
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-start space-x-3">
          <div className="text-danger flex-shrink-0 mt-0.5">⚠️</div>
          <p className="text-sm text-danger flex-1">{error}</p>
        </div>
      )}

      {/* Filtres */}
      <div className="card flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Tous les rôles</option>
          <option value="admin">Administrateur</option>
          <option value="accountant">Comptable</option>
          <option value="manager">Manager</option>
          <option value="rh">Ressources Humaines</option>
          <option value="employee">Employé</option>
        </select>
      </div>

      {/* Liste des utilisateurs */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Utilisateur</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Rôle</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Statut</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Dernière connexion</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-background-secondary/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-semibold">
                        {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}
                        </div>
                        <div className="text-sm text-text-secondary">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {user.emailVerified ? (
                        <span className="text-xs text-success">✓ Vérifié</span>
                      ) : (
                        <span className="text-xs text-warning">En attente</span>
                      )}
                      {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                        <Lock className="text-danger" size={14} />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-text-secondary">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Jamais'}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit size={18} className="text-text-muted hover:text-primary" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} className="text-text-muted hover:text-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-text-secondary">
              <UserIcon className="mx-auto mb-4 text-text-muted" size={48} />
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'invitation */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-large max-w-md w-full p-6 animate-slide-up">
            <h2 className="text-2xl font-display font-semibold text-text-primary mb-4">Inviter un utilisateur</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Prénom</label>
                  <input
                    type="text"
                    value={inviteData.firstName}
                    onChange={(e) => setInviteData({ ...inviteData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Nom</label>
                  <input
                    type="text"
                    value={inviteData.lastName}
                    onChange={(e) => setInviteData({ ...inviteData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Rôle *</label>
                <select
                  required
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as any })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="manager">Manager</option>
                  <option value="accountant">Comptable</option>
                  <option value="rh">Ressources Humaines</option>
                  <option value="employee">Employé</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  <Mail size={18} className="inline mr-2" />
                  Envoyer l'invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && selectedUser && (
        <PermissionEditor
          user={selectedUser}
          onSave={handleUpdate}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

export default UsersPage;

