import { useState, useEffect } from 'react';
import { Plus, Users, Mail, Shield, Calendar, Loader2, AlertCircle, X, Save, Key, RotateCcw, Edit, Trash2 } from 'lucide-react';
import adminService, { ContaUser, CreateContaUserData } from '../../services/admin.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../utils/formatters';
import { useAuthStore } from '../../store/auth.store';

interface ContaPermissions {
  companies?: { view: boolean; edit: boolean; suspend: boolean; changePlan: boolean };
  plans?: { view: boolean; edit: boolean; create: boolean; delete: boolean };
  users?: { view: boolean; create: boolean; edit: boolean; delete: boolean; managePermissions: boolean };
  accountants?: { view: boolean; approve: boolean; reject: boolean };
  branding?: { view: boolean; edit: boolean };
  audit?: { view: boolean; export: boolean };
  settings?: { view: boolean; edit: boolean };
}

function AdminUsersPage() {
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<ContaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateContaUserData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    contaRole: 'admin',
  });
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ContaUser | null>(null);
  const [permissions, setPermissions] = useState<ContaPermissions>({});
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ContaUser | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<CreateContaUserData>>({});
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getContaUsers();
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
      showError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.password) {
      showError('Email et mot de passe sont obligatoires');
      return;
    }

    try {
      setSaving(true);
      await adminService.createContaUser(formData);
      showSuccess('Utilisateur Conta créé avec succès');
      setShowCreateForm(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        contaRole: 'admin',
      });
      loadUsers();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPermissions = async (user: ContaUser) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
    setLoadingPermissions(true);
    try {
      const response = await adminService.getUserPermissions(user.id);
      setPermissions(response.data);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors du chargement des permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSavingPermissions(true);
      await adminService.updateUserPermissions(selectedUser.id, permissions);
      showSuccess('Permissions mises à jour avec succès');
      setShowPermissionsModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleEdit = (user: ContaUser) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      contaRole: user.contaRole as CreateContaUserData['contaRole'],
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);
      await adminService.updateContaUser(editingUser.id, editFormData);
      showSuccess('Utilisateur mis à jour avec succès');
      setShowEditModal(false);
      setEditingUser(null);
      setEditFormData({});
      loadUsers();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userToDelete: ContaUser) => {
    // Ne pas permettre de supprimer soi-même
    if (userToDelete.id === currentUser?.id) {
      showError('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    // Ne pas permettre de supprimer un Super Admin
    if (userToDelete.isSuperAdmin) {
      showError('Impossible de supprimer un Super Admin');
      return;
    }

    const confirmed = await confirm.confirm({
      title: 'Supprimer l\'utilisateur',
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete.email}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setDeletingUserId(userToDelete.id);
      await adminService.deleteContaUser(userToDelete.id);
      showSuccess('Utilisateur supprimé avec succès');
      loadUsers();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleResetPermissions = async () => {
    if (!selectedUser) return;

    const confirmed = await confirm.confirm({
      title: 'Réinitialiser les permissions',
      message: `Êtes-vous sûr de vouloir réinitialiser les permissions de ${selectedUser.email} aux valeurs par défaut de son rôle ?`,
    });

    if (!confirmed) return;

    try {
      setSavingPermissions(true);
      const response = await adminService.resetUserPermissions(selectedUser.id);
      setPermissions(response.data);
      showSuccess('Permissions réinitialisées avec succès');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erreur lors de la réinitialisation');
    } finally {
      setSavingPermissions(false);
    }
  };

  const togglePermission = (module: keyof ContaPermissions, action: string) => {
    setPermissions((prev) => {
      const newPerms = { ...prev };
      if (!newPerms[module]) {
        newPerms[module] = {} as any;
      }
      (newPerms[module] as any)[action] = !(newPerms[module] as any)?.[action];
      return newPerms;
    });
  };

  const getRoleBadge = (role: string, isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
          Super Admin
        </span>
      );
    }
    const badges: Record<string, { bg: string; text: string }> = {
      admin: { bg: 'bg-blue-100', text: 'text-blue-800' },
      support: { bg: 'bg-green-100', text: 'text-green-800' },
      developer: { bg: 'bg-gray-100', text: 'text-gray-800' },
      sales: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      finance: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      marketing: { bg: 'bg-pink-100', text: 'text-pink-800' },
    };
    const badge = badges[role] || badges.admin;
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-xs font-medium rounded-full`}>
        {role}
      </span>
    );
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
          <h1 className="text-3xl font-display font-bold text-text-primary">Utilisateurs Conta</h1>
          <p className="text-text-secondary mt-1">
            Gérez les utilisateurs internes de la plateforme
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Nouvel Utilisateur</span>
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Créer un Utilisateur Conta</h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setFormData({
                  email: '',
                  password: '',
                  firstName: '',
                  lastName: '',
                  phone: '',
                  contaRole: 'admin',
                });
              }}
              className="btn-ghost"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input w-full"
                placeholder="admin@conta.cd"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input w-full"
                placeholder="Minimum 8 caractères"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Prénom</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Nom</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Rôle <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.contaRole}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contaRole: e.target.value as CreateContaUserData['contaRole'],
                  })
                }
                className="input w-full"
              >
                <option value="admin">Admin</option>
                <option value="support">Support</option>
                <option value="developer">Developer</option>
                <option value="sales">Sales</option>
                <option value="finance">Finance</option>
                <option value="marketing">Marketing</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setFormData({
                  email: '',
                  password: '',
                  firstName: '',
                  lastName: '',
                  phone: '',
                  contaRole: 'admin',
                });
              }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary">
              {saving ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Création...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Créer
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Liste des utilisateurs */}
      {users.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="mx-auto text-text-muted mb-4" size={48} />
          <p className="text-text-secondary">Aucun utilisateur Conta</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div key={user.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </h3>
                    <p className="text-sm text-text-secondary">{user.email}</p>
                  </div>
                </div>
                {getRoleBadge(user.contaRole, user.isSuperAdmin)}
              </div>
              <div className="space-y-2 text-sm">
                {user.phone && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail size={14} />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-text-secondary">
                  <Calendar size={14} />
                  <span>Créé le {formatDate(user.createdAt)}</span>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Calendar size={14} />
                    <span>Dernière connexion : {formatDate(user.lastLoginAt)}</span>
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                {user.isSuperAdmin && (
                  <button
                    onClick={() => handleOpenPermissions(user)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                  >
                    <Key size={16} />
                    <span>Permissions</span>
                  </button>
                )}
                {user.id !== currentUser?.id && !user.isSuperAdmin && (
                  <>
                    <button
                      onClick={() => handleEdit(user)}
                      className="btn-secondary flex items-center justify-center gap-2 text-sm px-3"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={deletingUserId === user.id}
                      className="btn-secondary flex items-center justify-center gap-2 text-sm px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer"
                    >
                      {deletingUserId === user.id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </>
                )}
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de gestion des permissions */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                  <Key size={24} />
                  Permissions - {selectedUser.email}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Rôle: {selectedUser.contaRole} {selectedUser.isSuperAdmin && '(Super Admin)'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedUser(null);
                  setPermissions({});
                }}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {loadingPermissions ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Entreprises */}
                  <div className="card">
                    <h4 className="font-semibold text-text-primary mb-4">Entreprises</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.companies?.view || false}
                          onChange={() => togglePermission('companies', 'view')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Voir</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.companies?.edit || false}
                          onChange={() => togglePermission('companies', 'edit')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Modifier</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.companies?.suspend || false}
                          onChange={() => togglePermission('companies', 'suspend')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Suspendre</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.companies?.changePlan || false}
                          onChange={() => togglePermission('companies', 'changePlan')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Changer plan</span>
                      </label>
                    </div>
                  </div>

                  {/* Plans */}
                  <div className="card">
                    <h4 className="font-semibold text-text-primary mb-4">Plans</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.plans?.view || false}
                          onChange={() => togglePermission('plans', 'view')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Voir</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.plans?.edit || false}
                          onChange={() => togglePermission('plans', 'edit')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Modifier</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.plans?.create || false}
                          onChange={() => togglePermission('plans', 'create')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Créer</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.plans?.delete || false}
                          onChange={() => togglePermission('plans', 'delete')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Supprimer</span>
                      </label>
                    </div>
                  </div>

                  {/* Utilisateurs */}
                  <div className="card">
                    <h4 className="font-semibold text-text-primary mb-4">Utilisateurs Conta</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.users?.view || false}
                          onChange={() => togglePermission('users', 'view')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Voir</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.users?.create || false}
                          onChange={() => togglePermission('users', 'create')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Créer</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.users?.edit || false}
                          onChange={() => togglePermission('users', 'edit')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Modifier</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.users?.delete || false}
                          onChange={() => togglePermission('users', 'delete')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Supprimer</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.users?.managePermissions || false}
                          onChange={() => togglePermission('users', 'managePermissions')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Gérer permissions</span>
                      </label>
                    </div>
                  </div>

                  {/* Branding */}
                  <div className="card">
                    <h4 className="font-semibold text-text-primary mb-4">Branding</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.branding?.view || false}
                          onChange={() => togglePermission('branding', 'view')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Voir</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.branding?.edit || false}
                          onChange={() => togglePermission('branding', 'edit')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Modifier</span>
                      </label>
                    </div>
                  </div>

                  {/* Audit */}
                  <div className="card">
                    <h4 className="font-semibold text-text-primary mb-4">Audit</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.audit?.view || false}
                          onChange={() => togglePermission('audit', 'view')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Voir</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.audit?.export || false}
                          onChange={() => togglePermission('audit', 'export')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Exporter</span>
                      </label>
                    </div>
                  </div>

                  {/* Paramètres */}
                  <div className="card">
                    <h4 className="font-semibold text-text-primary mb-4">Paramètres</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.settings?.view || false}
                          onChange={() => togglePermission('settings', 'view')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Voir</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.settings?.edit || false}
                          onChange={() => togglePermission('settings', 'edit')}
                          disabled={selectedUser.isSuperAdmin}
                          className="rounded"
                        />
                        <span>Modifier</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-between items-center">
              <button
                onClick={handleResetPermissions}
                disabled={savingPermissions || selectedUser.isSuperAdmin}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw size={18} />
                <span>Réinitialiser</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setSelectedUser(null);
                    setPermissions({});
                  }}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={savingPermissions || selectedUser.isSuperAdmin}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {savingPermissions ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-text-primary">Modifier l'utilisateur</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setEditFormData({});
                }}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Prénom</label>
                  <input
                    type="text"
                    value={editFormData.firstName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Nom</label>
                  <input
                    type="text"
                    value={editFormData.lastName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Rôle</label>
                  <select
                    value={editFormData.contaRole || 'admin'}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        contaRole: e.target.value as CreateContaUserData['contaRole'],
                      })
                    }
                    className="input w-full"
                  >
                    <option value="admin">Admin</option>
                    <option value="support">Support</option>
                    <option value="developer">Developer</option>
                    <option value="sales">Sales</option>
                    <option value="finance">Finance</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Nouveau mot de passe (laisser vide pour ne pas changer)
                  </label>
                  <input
                    type="password"
                    value={editFormData.password || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    className="input w-full"
                    placeholder="Laisser vide pour ne pas changer"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setEditFormData({});
                }}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Annuler
              </button>
              <button onClick={handleUpdate} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? (
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
            </div>
          </div>
        </div>
      )}

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

export default AdminUsersPage;

