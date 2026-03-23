import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, DollarSign, Calendar, User, Plus, Trash2 } from 'lucide-react';
import payrollService, { CreatePayrollData, PayrollItemData } from '../../services/payroll.service';
import employeeService, { Employee } from '../../services/employee.service';
import { useToastContext } from '../../contexts/ToastContext';
import { formatPrice } from '../../utils/formatters';

function PayrollFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<CreatePayrollData>({
    employeeId: searchParams.get('employeeId') || '',
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    payDate: new Date().toISOString().split('T')[0],
    items: [],
    notes: '',
  });

  useEffect(() => {
    loadEmployees();
    if (formData.employeeId) {
      const emp = employees.find(e => e.id === formData.employeeId);
      if (emp) {
        setSelectedEmployee(emp);
        // Ajouter le salaire de base comme premier item
        if (formData.items.length === 0) {
          setFormData({
            ...formData,
            items: [{
              type: 'base_salary',
              description: 'Salaire de base',
              amount: Number(emp.baseSalary),
              isDeduction: false,
            }],
          });
        }
      }
    }
  }, [formData.employeeId]);

  const loadEmployees = async () => {
    try {
      const response = await employeeService.list({ limit: 1000 });
      setEmployees(response.data);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleChange = (field: keyof CreatePayrollData, value: any) => {
    setFormData({ ...formData, [field]: value });
    
    if (field === 'employeeId') {
      const emp = employees.find(e => e.id === value);
      setSelectedEmployee(emp || null);
      if (emp && formData.items.length === 0) {
        setFormData({
          ...formData,
          employeeId: value,
          items: [{
            type: 'base_salary',
            description: 'Salaire de base',
            amount: Number(emp.baseSalary),
            isDeduction: false,
          }],
        });
      }
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          type: 'other',
          description: '',
          amount: 0,
          isDeduction: false,
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: keyof PayrollItemData, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const additions = formData.items.filter(item => !item.isDeduction).reduce((sum, item) => sum + item.amount, 0);
    const deductions = formData.items.filter(item => item.isDeduction).reduce((sum, item) => sum + item.amount, 0);
    const grossSalary = additions;
    const totalDeductions = deductions;
    const netSalary = grossSalary - totalDeductions;
    return { grossSalary, totalDeductions, netSalary };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await payrollService.create(formData);
      showSuccess('Paie créée avec succès');
      navigate('/hr/payroll');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la création de la paie';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();
  const currency = selectedEmployee?.currency || 'CDF';

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/hr/payroll')}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* En-tête */}
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Nouvelle paie</h1>
          <p className="text-gray-600 mt-1">Créez une nouvelle paie pour un employé</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date début période *</label>
                <input
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => handleChange('periodStart', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin période *</label>
                <input
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => handleChange('periodEnd', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de paiement *</label>
                <input
                  type="date"
                  value={formData.payDate}
                  onChange={(e) => handleChange('payDate', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Éléments de paie */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <DollarSign size={20} />
                <span>Éléments de paie</span>
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Ajouter</span>
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded border border-gray-200 text-center text-gray-600">
                Aucun élément. Cliquez sur "Ajouter" pour commencer.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={item.type}
                          onChange={(e) => updateItem(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="base_salary">Salaire de base</option>
                          <option value="overtime">Heures supplémentaires</option>
                          <option value="bonus">Prime</option>
                          <option value="allowance">Indemnité</option>
                          <option value="tax">Impôt</option>
                          <option value="social_security">Sécurité sociale</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                      <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.amount}
                          onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={item.isDeduction ? 'deduction' : 'addition'}
                          onChange={(e) => updateItem(index, 'isDeduction', e.target.value === 'deduction')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="addition">Ajout</option>
                          <option value="deduction">Déduction</option>
                        </select>
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-900 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totaux */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Totaux</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <div className="flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Salaire brut:</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(totals.grossSalary, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Total déductions:</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(totals.totalDeductions, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-3 text-gray-900">
                    <span>Salaire net:</span>
                    <span className="text-blue-600">
                      {formatPrice(totals.netSalary, currency)}
                    </span>
                  </div>
                </div>
              </div>
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
              placeholder="Notes additionnelles sur la paie..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/hr/payroll')}
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

export default PayrollFormPage;

