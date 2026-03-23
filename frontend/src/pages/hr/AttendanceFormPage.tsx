import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, Calendar, Clock, User } from 'lucide-react';
import attendanceService, { CreateAttendanceData } from '../../services/attendance.service';
import employeeService, { Employee } from '../../services/employee.service';
import { useToastContext } from '../../contexts/ToastContext';

function AttendanceFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState<CreateAttendanceData>({
    employeeId: searchParams.get('employeeId') || '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    hoursWorked: 0,
    status: 'present',
    leaveType: '',
    notes: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.list({ limit: 1000 });
      setEmployees(response.data);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleChange = (field: keyof CreateAttendanceData, value: any) => {
    setFormData({ ...formData, [field]: value });
    
    // Calculer automatiquement les heures travaillées si checkIn et checkOut sont présents
    if (field === 'checkIn' || field === 'checkOut') {
      const updatedData = { ...formData, [field]: value };
      if (updatedData.checkIn && updatedData.checkOut) {
        const checkIn = new Date(`${updatedData.date}T${updatedData.checkIn}`);
        const checkOut = new Date(`${updatedData.date}T${updatedData.checkOut}`);
        const diff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        updatedData.hoursWorked = diff > 0 ? diff : 0;
      }
      setFormData(updatedData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await attendanceService.create(formData);
      showSuccess('Pointage créé avec succès');
      navigate('/hr/attendance');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la création du pointage';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/hr/attendance')}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* En-tête */}
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Nouveau pointage</h1>
          <p className="text-gray-600 mt-1">Enregistrez un nouveau pointage pour un employé</p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <div className="flex items-center">
              <AlertCircle size={20} className="mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <User size={20} />
              <span>Informations de base</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employé *</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Horaires */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Clock size={20} />
              <span>Horaires</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure d'arrivée</label>
                <input
                  type="time"
                  value={formData.checkIn}
                  onChange={(e) => handleChange('checkIn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure de départ</label>
                <input
                  type="time"
                  value={formData.checkOut}
                  onChange={(e) => handleChange('checkOut', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heures travaillées</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hoursWorked}
                  onChange={(e) => handleChange('hoursWorked', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Statut */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Calendar size={20} />
              <span>Statut</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="present">Présent</option>
                  <option value="absent">Absent</option>
                  <option value="late">En retard</option>
                  <option value="leave">Congé</option>
                  <option value="holiday">Férié</option>
                </select>
              </div>
              {formData.status === 'leave' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de congé</label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) => handleChange('leaveType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="annual">Congé annuel</option>
                    <option value="sick">Congé maladie</option>
                    <option value="maternity">Congé maternité</option>
                    <option value="paternity">Congé paternité</option>
                    <option value="unpaid">Congé sans solde</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes additionnelles sur le pointage..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/hr/attendance')}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary flex items-center space-x-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Créer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AttendanceFormPage;

