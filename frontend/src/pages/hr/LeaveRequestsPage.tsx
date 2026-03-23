import { useState, useEffect } from 'react';
import { Calendar, User, Search, Plus, Loader2, AlertCircle, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import leaveRequestService, { LeaveRequest, LeaveRequestFilters } from '../../services/leaveRequest.service';
import employeeService, { Employee } from '../../services/employee.service';
import { useToastContext } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

function LeaveRequestsPage() {
  const { showSuccess, showError } = useToastContext();
  const confirm = useConfirm();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeaveRequestFilters>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');

  useEffect(() => {
    loadEmployees();
    loadLeaveRequests();
  }, [filters]);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.list({ limit: 1000 });
      setEmployees(response.data);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leaveRequestService.list(filters);
      setLeaveRequests(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des demandes de congés');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      employeeId: selectedEmployee || undefined,
      status: statusFilter || undefined,
      leaveType: leaveTypeFilter || undefined,
      page: 1,
    });
  };

  const handleApprove = async (id: string) => {
    const confirmed = await confirm.confirm({
      title: 'Approuver la demande',
      message: 'Êtes-vous sûr de vouloir approuver cette demande de congé ?',
      variant: 'info',
      confirmText: 'Approuver',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await leaveRequestService.approve(id);
      loadLeaveRequests();
      showSuccess('Demande de congé approuvée avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'approbation';
      showError(errorMessage);
    }
  };

  const handleReject = async (id: string) => {
    const confirmed = await confirm.confirm({
      title: 'Rejeter la demande',
      message: 'Êtes-vous sûr de vouloir rejeter cette demande de congé ?',
      variant: 'danger',
      confirmText: 'Rejeter',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await leaveRequestService.reject(id);
      loadLeaveRequests();
      showSuccess('Demande de congé rejetée.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du rejet';
      showError(errorMessage);
    }
  };

  const handleCancel = async (id: string) => {
    const confirmed = await confirm.confirm({
      title: 'Annuler la demande',
      message: 'Êtes-vous sûr de vouloir annuler cette demande de congé ?',
      variant: 'warning',
      confirmText: 'Annuler',
      cancelText: 'Retour',
    });

    if (!confirmed) return;

    try {
      await leaveRequestService.cancel(id);
      loadLeaveRequests();
      showSuccess('Demande de congé annulée.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'annulation';
      showError(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; badgeClass: string; icon: React.ElementType }> = {
      pending: { label: 'En attente', badgeClass: 'badge-warning', icon: Clock },
      approved: { label: 'Approuvée', badgeClass: 'badge-success', icon: CheckCircle2 },
      rejected: { label: 'Rejetée', badgeClass: 'badge-danger', icon: XCircle },
      cancelled: { label: 'Annulée', badgeClass: 'badge-secondary', icon: AlertCircle },
    };

    const config = statusConfig[status] || { label: status, badgeClass: 'badge-primary', icon: FileText };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.badgeClass} flex items-center space-x-1`}>
        <Icon size={12} />
        <span>{config.label}</span>
      </span>
    );
  };

  const getLeaveTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      paid: 'Congés payés',
      sick: 'Congés maladie',
      unpaid: 'Congés sans solde',
      maternity: 'Congé maternité',
      paternity: 'Congé paternité',
    };
    return types[type] || type;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Demandes de Congés</h1>
          <p className="text-text-secondary mt-1">
            Gérez les demandes de congés de vos employés
          </p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Nouvelle Demande</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Employé</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="input"
            >
              <option value="">Tous les employés</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} (#{emp.employeeNumber})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Type de congé</label>
            <select
              value={leaveTypeFilter}
              onChange={(e) => setLeaveTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">Tous les types</option>
              <option value="paid">Congés payés</option>
              <option value="sick">Congés maladie</option>
              <option value="unpaid">Congés sans solde</option>
              <option value="maternity">Congé maternité</option>
              <option value="paternity">Congé paternité</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvée</option>
              <option value="rejected">Rejetée</option>
              <option value="cancelled">Annulée</option>
            </select>
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
            <span className="ml-3 text-text-secondary">Chargement des demandes...</span>
          </div>
        </div>
      ) : leaveRequests.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Aucune demande trouvée</h3>
          <p className="text-text-secondary">
            {selectedEmployee || statusFilter || leaveTypeFilter ? 'Aucun résultat pour votre recherche' : 'Aucune demande de congé enregistrée'}
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-6 py-3">Employé</th>
                    <th className="text-left px-6 py-3">Type</th>
                    <th className="text-left px-6 py-3">Période</th>
                    <th className="text-right px-6 py-3">Jours</th>
                    <th className="text-left px-6 py-3">Date de demande</th>
                    <th className="text-left px-6 py-3">Statut</th>
                    <th className="text-right px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((request) => (
                    <tr key={request.id} className="table-row">
                      <td className="px-6 py-4">
                        {request.employee ? (
                          <div className="flex items-center space-x-2">
                            <User size={16} className="text-text-muted" />
                            <span className="text-text-primary font-medium">
                              {request.employee.firstName} {request.employee.lastName}
                            </span>
                            <span className="text-xs text-text-muted">
                              (#{request.employee.employeeNumber})
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-text-secondary">{getLeaveTypeLabel(request.leaveType)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-text-muted" />
                          <span className="text-text-secondary">
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-text-primary">{request.daysRequested} jour(s)</span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {formatDate(request.requestedAt)}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="btn-success text-sm"
                                title="Approuver"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                className="btn-danger text-sm"
                                title="Rejeter"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          {request.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(request.id)}
                              className="btn-secondary text-sm"
                              title="Annuler"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
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
                  <span className="font-semibold text-text-primary">{pagination.totalPages}</span>
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

export default LeaveRequestsPage;

