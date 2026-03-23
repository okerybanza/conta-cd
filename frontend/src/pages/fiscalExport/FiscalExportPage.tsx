import { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import fiscalExportService, { ExportFormat } from '../../services/fiscalExport.service';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { hasFeature } from '../../utils/featureToggle';
import { useToastContext } from '../../contexts/ToastContext';

type ExportType = 'vat-declaration' | 'fiscal-control';

function FiscalExportPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportType, setExportType] = useState<ExportType>('vat-declaration');

  // Déclaration TVA
  const [vatPeriod, setVatPeriod] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [vatFormat, setVatFormat] = useState<ExportFormat>('pdf');

  // Contrôle fiscal
  const [fiscalStartDate, setFiscalStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [fiscalEndDate, setFiscalEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [fiscalFormat, setFiscalFormat] = useState<'excel' | 'csv'>('excel');

  const canAccessAccounting = user && hasFeature(user, 'accounting');

  const handleExportVAT = async () => {
    if (!vatPeriod) {
      showError('Veuillez sélectionner une période.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const blob = await fiscalExportService.exportVATDeclaration(vatPeriod, vatFormat);
      const filename = `declaration-tva-${vatPeriod}.${vatFormat === 'excel' ? 'xlsx' : vatFormat}`;
      fiscalExportService.downloadBlob(blob, filename);
      showSuccess('Déclaration TVA exportée avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'export de la déclaration TVA.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExportFiscalControl = async () => {
    if (!fiscalStartDate || !fiscalEndDate) {
      showError('Veuillez sélectionner une période.');
      return;
    }

    if (new Date(fiscalStartDate) > new Date(fiscalEndDate)) {
      showError('La date de début doit être antérieure à la date de fin.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const blob = await fiscalExportService.exportFiscalControl(
        fiscalStartDate,
        fiscalEndDate,
        fiscalFormat
      );
      const filename = `controle-fiscal-${fiscalStartDate}-${fiscalEndDate}.${fiscalFormat === 'excel' ? 'xlsx' : 'csv'}`;
      fiscalExportService.downloadBlob(blob, filename);
      showSuccess('Export pour contrôle fiscal généré avec succès.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'export pour contrôle fiscal.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!canAccessAccounting) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              Votre abonnement ne permet pas d'accéder à l'Export Fiscal. Veuillez upgrader votre plan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Fiscal</h1>
          <p className="text-gray-600 mt-1">Déclaration TVA et export pour contrôle fiscal</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setExportType('vat-declaration')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              exportType === 'vat-declaration'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Déclaration TVA
          </button>
          <button
            onClick={() => setExportType('fiscal-control')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              exportType === 'fiscal-control'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 inline mr-2" />
            Contrôle Fiscal
          </button>
        </nav>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Export Content */}
      {exportType === 'vat-declaration' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Exporter la Déclaration TVA</h2>
            <p className="text-sm text-gray-600 mb-6">
              Générer et télécharger la déclaration TVA pour une période donnée.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Période (Mois) *
                </label>
                <input
                  type="month"
                  value={vatPeriod}
                  onChange={(e) => setVatPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Format: YYYY-MM (ex: 2025-01)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format d'export *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setVatFormat('pdf')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      vatFormat === 'pdf'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium">PDF</p>
                  </button>
                  <button
                    onClick={() => setVatFormat('excel')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      vatFormat === 'excel'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium">Excel</p>
                  </button>
                  <button
                    onClick={() => setVatFormat('xml')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      vatFormat === 'xml'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileCode className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium">XML</p>
                  </button>
                </div>
              </div>

              <button
                onClick={handleExportVAT}
                disabled={loading || !vatPeriod}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Exporter la Déclaration TVA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {exportType === 'fiscal-control' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export pour Contrôle Fiscal</h2>
            <p className="text-sm text-gray-600 mb-6">
              Générer un export complet (factures, dépenses, écritures comptables) pour une période donnée.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    value={fiscalStartDate}
                    onChange={(e) => setFiscalStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    value={fiscalEndDate}
                    onChange={(e) => setFiscalEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format d'export *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFiscalFormat('excel')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      fiscalFormat === 'excel'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium">Excel</p>
                  </button>
                  <button
                    onClick={() => setFiscalFormat('csv')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      fiscalFormat === 'csv'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm font-medium">CSV</p>
                  </button>
                </div>
              </div>

              <button
                onClick={handleExportFiscalControl}
                disabled={loading || !fiscalStartDate || !fiscalEndDate}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Exporter pour Contrôle Fiscal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FiscalExportPage;

