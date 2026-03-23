import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Search, Plus, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import attendanceService, { Attendance, AttendanceFilters } from '../../services/attendance.service';
import employeeService, { Employee } from '../../services/employee.service';

function AttendancePage() {
  const navigate = useNavigate();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AttendanceFilters>({
    page: 1,
    limit: 50,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadEmployees();
    loadAttendances();
  }, [filters]);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.list({ limit: 1000 });
      setEmployees(response.data);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const loadAttendances = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attendanceService.list(filters);
      setAttendances(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des pointages');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      employeeId: selectedEmployee || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 1,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; badgeClass: string; icon: React.ElementType }> = {
      present: { label: 'Présent', badgeClass: 'badge-success', icon: CheckCircle2 },
      absent: { label: 'Absent', badgeClass: 'badge-danger', icon: XCircle },
      late: { label: 'En retard', badgeClass: 'badge-warning', icon: Clock },
      leave: { label: 'Congé', badgeClass: 'badge-secondary', icon: Calendar },
      holiday: { label: 'Férié', badgeClass: 'badge-primary', icon: Calendar },
    };

    const config = statusConfig[status] || { label: status, badgeClass: 'badge-primary', icon: Clock };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.badgeClass} flex items-center space-x-1`}>
        <Icon size={12} />
        <span>{config.label}</span>
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Pointage de Présence</h1>
          <p className="text-text-secondary mt-1">
            Gérez les présences et absences de vos employés
          </p>
        </div>
        <button
          onClick={() => navigate('/hr/attendance/new')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Nouveau Pointage</span>
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
            <label className="block text-sm font-medium text-text-primary mb-2">Date début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Date fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
            <span className="ml-3 text-text-secondary">Chargement des pointages...</span>
          </div>
        </div>
      ) : attendances.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Aucun pointage trouvé</h3>
          <p className="text-text-secondary">
            {selectedEmployee || startDate || endDate ? 'Aucun résultat pour votre recherche' : 'Aucun pointage enregistré'}
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-left px-6 py-3">Employé</th>
                    <th className="text-left px-6 py-3">Heure d'arrivée</th>
                    <th className="text-left px-6 py-3">Heure de départ</th>
                    <th className="text-right px-6 py-3">Heures travaillées</th>
                    <th className="text-left px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((attendance) => (
                    <tr
                      key={attendance.id}
                      className="table-row cursor-pointer hover:bg-gray-50"
                      onClick={() => attendance.employeeId && navigate(`/hr/employees/${attendance.employeeId}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-text-muted" />
                          <span className="font-medium text-text-primary">
                            {formatDate(attendance.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {attendance.employee ? (
                          <div className="flex items-center space-x-2">
                            <User size={16} className="text-text-muted" />
                            <span className="text-text-secondary">
                              {attendance.employee.firstName} {attendance.employee.lastName}
                            </span>
                            <span className="text-xs text-text-muted">
                              (#{attendance.employee.employeeNumber})
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {attendance.checkIn ? (
                          <div className="flex items-center space-x-2">
                            <Clock size={14} />
                            <span>{formatTime(attendance.checkIn)}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {attendance.checkOut ? (
                          <div className="flex items-center space-x-2">
                            <Clock size={14} />
                            <span>{formatTime(attendance.checkOut)}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-text-primary">
                          {attendance.hoursWorked ? `${Number(attendance.hoursWorked).toFixed(2)}h` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(attendance.status)}</td>
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
    </div>
  );
}

export default AttendancePage;

