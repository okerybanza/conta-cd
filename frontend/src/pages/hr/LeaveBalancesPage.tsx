import { useState, useEffect } from 'react';
import { Calendar, User, Search, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import leaveBalanceService, { LeaveBalance } from '../../services/leaveBalance.service';
import employeeService, { Employee } from '../../services/employee.service';
import { useToastContext } from '../../contexts/ToastContext';

function LeaveBalancesPage() {
  const { showError } = useToastContext();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadBalances();
    } else {
      setBalances([]);
    }
  }, [selectedEmployee, year]);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.list({ limit: 1000 });
      setEmployees(response.data);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const loadBalances = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      setError(null);
      const data = await leaveBalanceService.getEmployeeBalances(selectedEmployee, year);
      setBalances(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des soldes');
      showError(err.response?.data?.message || 'Erreur lors du chargement des soldes');
    } finally {
      setLoading(false);
    }
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

  const getSelectedEmployee = () => {
    return employees.find((emp) => emp.id === selectedEmployee);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Soldes de Congés</h1>
          <p className="text-text-secondary mt-1">
            Consultez les soldes de congés de vos employés
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Employé</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="input"
            >
              <option value="">Sélectionner un employé</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} (#{emp.employeeNumber})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Année</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="input"
              min="2020"
              max="2100"
            />
          </div>
          <div className="flex items-end">
            <button onClick={loadBalances} className="btn-primary w-full flex items-center justify-center space-x-2">
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

      {/* Informations employé */}
      {selectedEmployee && getSelectedEmployee() && (
        <div className="card bg-primary/5 border-primary/20">
          <div className="flex items-center space-x-3">
            <User className="text-primary" size={24} />
            <div>
              <h3 className="font-semibold text-text-primary">
                {getSelectedEmployee()?.firstName} {getSelectedEmployee()?.lastName}
              </h3>
              <p className="text-sm text-text-secondary">
                #{getSelectedEmployee()?.employeeNumber} • {getSelectedEmployee()?.department || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Soldes */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="ml-3 text-text-secondary">Chargement des soldes...</span>
          </div>
        </div>
      ) : !selectedEmployee ? (
        <div className="card text-center py-12">
          <Calendar className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Sélectionnez un employé</h3>
          <p className="text-text-secondary">
            Veuillez sélectionner un employé pour consulter ses soldes de congés
          </p>
        </div>
      ) : balances.length === 0 ? (
        <div className="card text-center py-12">
          <AlertCircle className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Aucun solde trouvé</h3>
          <p className="text-text-secondary">
            Aucun solde de congé disponible pour cet employé pour l'année {year}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {balances.map((balance) => (
            <div key={balance.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-text-primary text-lg">
                    {getLeaveTypeLabel(balance.leaveType)}
                  </h3>
                  <p className="text-sm text-text-secondary">Année {balance.year}</p>
                </div>
                <TrendingUp className="text-primary" size={24} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Total alloué</span>
                  <span className="font-semibold text-text-primary">{balance.totalDays} jour(s)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Utilisés</span>
                  <span className="font-semibold text-warning">{balance.usedDays} jour(s)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">En attente</span>
                  <span className="font-semibold text-warning">{balance.pendingDays} jour(s)</span>
                </div>
                {balance.carriedForward > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Report année précédente</span>
                    <span className="font-semibold text-info">{balance.carriedForward} jour(s)</span>
                  </div>
                )}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-primary font-medium">Disponible</span>
                    <span className="font-bold text-lg text-success">{balance.remainingDays} jour(s)</span>
                  </div>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (Number(balance.usedDays) / Number(balance.totalDays)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {((Number(balance.usedDays) / Number(balance.totalDays)) * 100).toFixed(1)}% utilisé
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LeaveBalancesPage;

