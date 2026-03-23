import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, User, Loader2, AlertCircle, Briefcase, MapPin, Phone, Mail } from 'lucide-react';
import employeeService, { Employee, EmployeeFilters } from '../../services/employee.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

function EmployeesListPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmployeeFilters>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  useEffect(() => {
    loadEmployees();
  }, [filters]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeService.list(filters);
      setEmployees(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      department: departmentFilter || undefined,
      page: 1,
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm.confirm({
      title: 'Supprimer l\'employé',
      message: 'Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await employeeService.delete(id);
      loadEmployees();
      showSuccess('Employé supprimé avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
      showError(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; badgeClass: string }> = {
      active: { label: 'Actif', badgeClass: 'badge-success' },
      inactive: { label: 'Inactif', badgeClass: 'badge-secondary' },
      terminated: { label: 'Terminé', badgeClass: 'badge-danger' },
      on_leave: { label: 'En congé', badgeClass: 'badge-warning' },
    };

    const config = statusConfig[status] || { label: status, badgeClass: 'badge-primary' };
    return (
      <span className={`badge ${config.badgeClass}`}>
        {config.label}
      </span>
    );
  };

  const formatPrice = (price: number, currency: string = 'CDF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Employés</h1>
          <p className="text-text-secondary mt-1">
            Gérez vos employés et leurs informations
          </p>
        </div>
        <Link to="/hr/employees/new" className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Nouvel Employé</span>
        </Link>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Nom, numéro, poste..."
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="terminated">Terminé</option>
              <option value="on_leave">En congé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Département</label>
            <input
              type="text"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              placeholder="Département..."
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} className="btn-primary w-full flex items-center justify-center space-x-2">
              <Search size={18} />
              <span>Rechercher</span>
            </button>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="card border-danger/20 bg-danger/5 flex items-start space-x-3 animate-fade-in">
          <AlertCircle className="text-danger flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-danger flex-1">{error}</p>
        </div>
      )}

      {/* Tableau */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="ml-3 text-text-secondary">Chargement des employés...</span>
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="card text-center py-12">
          <User className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Aucun employé trouvé</h3>
          <p className="text-text-secondary mb-6">
            {searchTerm || statusFilter || departmentFilter ? 'Aucun résultat pour votre recherche' : 'Commencez par créer votre premier employé'}
          </p>
          {!searchTerm && !statusFilter && !departmentFilter && (
            <Link to="/hr/employees/new" className="btn-primary inline-flex items-center space-x-2">
              <Plus size={18} />
              <span>Créer un employé</span>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-6 py-3">Employé</th>
                    <th className="text-left px-6 py-3">Poste</th>
                    <th className="text-left px-6 py-3">Département</th>
                    <th className="text-left px-6 py-3">Contact</th>
                    <th className="text-right px-6 py-3">Salaire</th>
                    <th className="text-left px-6 py-3">Statut</th>
                    <th className="text-right px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="table-row">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="text-primary" size={20} />
                          </div>
                          <div>
                            <span className="font-semibold text-text-primary">
                              {employee.firstName} {employee.lastName}
                            </span>
                            <p className="text-sm text-text-muted">#{employee.employeeNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        <div className="flex items-center space-x-2">
                          <Briefcase size={16} className="text-text-muted" />
                          <span>{employee.position || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {employee.department || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {employee.email && (
                            <div className="flex items-center space-x-2 text-sm text-text-secondary">
                              <Mail size={14} />
                              <span>{employee.email}</span>
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center space-x-2 text-sm text-text-secondary">
                              <Phone size={14} />
                              <span>{employee.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-text-primary">
                          {formatPrice(Number(employee.baseSalary), employee.currency)}
                        </span>
                        <p className="text-xs text-text-muted">
                          {employee.salaryFrequency === 'monthly' ? 'Mensuel' : 
                           employee.salaryFrequency === 'weekly' ? 'Hebdomadaire' : 
                           employee.salaryFrequency === 'biweekly' ? 'Bihebdomadaire' : 'Mensuel'}
                        </p>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(employee.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/hr/employees/${employee.id}`}
                            className="btn-ghost p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Voir"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            to={`/hr/employees/${employee.id}/edit`}
                            className="btn-ghost p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Modifier"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="btn-ghost p-2 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="card">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-text-secondary">
                  Page <span className="font-semibold text-text-primary">{pagination.page}</span> sur{' '}
                  <span className="font-semibold text-text-primary">{pagination.totalPages}</span> ({pagination.total} employé{pagination.total > 1 ? 's' : ''})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm Dialog */}
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

export default EmployeesListPage;

