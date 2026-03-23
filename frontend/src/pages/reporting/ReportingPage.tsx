import { useState, useEffect } from 'react';
import reportingService, {
  RevenueReport,
  UnpaidInvoicesReport,
  PaymentsReport,
  AccountingJournal,
  SupplierExpensesReport,
  ReportFilters,
} from '../../services/reporting.service';
import customerService from '../../services/customer.service';
import { Customer } from '../../services/customer.service';
import supplierService, { Supplier } from '../../services/supplier.service';

function ReportingPage() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'unpaid' | 'payments' | 'journal' | 'suppliers'>('revenue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Filtres - Par défaut, de début d'année jusqu'à aujourd'hui
  const today = new Date();
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  });

  // Données rapports
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [unpaidReport, setUnpaidReport] = useState<UnpaidInvoicesReport | null>(null);
  const [paymentsReport, setPaymentsReport] = useState<PaymentsReport | null>(null);
  const [journal, setJournal] = useState<AccountingJournal | null>(null);
  const [supplierReport, setSupplierReport] = useState<SupplierExpensesReport | null>(null);

  useEffect(() => {
    loadCustomers();
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (activeTab === 'revenue') {
      loadRevenueReport();
    } else if (activeTab === 'unpaid') {
      loadUnpaidReport();
    } else if (activeTab === 'payments') {
      loadPaymentsReport();
    } else if (activeTab === 'journal') {
      loadJournal();
    } else if (activeTab === 'suppliers') {
      loadSupplierReport();
    }
  }, [activeTab, filters]);

  const loadCustomers = async () => {
    try {
      const response = await customerService.list();
      setCustomers(response.data);
    } catch (err) {
      // Ignorer erreur
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await supplierService.list({ page: 1, limit: 100 });
      setSuppliers(response.data);
    } catch (err) {
      // Ignorer erreur
    }
  };

  const loadRevenueReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportingService.getRevenueReport(filters);
      setRevenueReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const loadUnpaidReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportingService.getUnpaidInvoicesReport({
        customerId: filters.customerId,
      });
      setUnpaidReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentsReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportingService.getPaymentsReport(filters);
      setPaymentsReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const loadJournal = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportingService.getAccountingJournal(filters);
      setJournal(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du journal');
    } finally {
      setLoading(false);
    }
  };

  const loadSupplierReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportingService.getSupplierExpensesReport(filters);
      setSupplierReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'CDF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const handleExportCSV = (type: string) => {
    let url = '';
    if (type === 'revenue') {
      url = reportingService.exportRevenueCSV(filters);
    } else if (type === 'unpaid') {
      url = reportingService.exportUnpaidInvoicesCSV({ customerId: filters.customerId });
    } else if (type === 'payments') {
      url = reportingService.exportPaymentsCSV(filters);
    } else if (type === 'journal') {
      url = reportingService.exportAccountingJournalCSV(filters);
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Rapports</h1>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          {[
            { id: 'revenue', label: 'Revenus' },
            { id: 'unpaid', label: 'Factures impayées' },
            { id: 'payments', label: 'Paiements' },
            { id: 'journal', label: 'Journal comptable' },
            { id: 'suppliers', label: 'Dépenses par fournisseur' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date début</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date fin</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="input"
            />
          </div>
          <div>
            {activeTab === 'suppliers' ? (
              <>
                <label className="block text-sm font-medium mb-1">Fournisseur</label>
                <select
                  value={filters.supplierId || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      supplierId: e.target.value || undefined,
                    })
                  }
                  className="input"
                >
                  <option value="">Tous</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label className="block text-sm font-medium mb-1">Client</label>
                <select
                  value={filters.customerId || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      customerId: e.target.value || undefined,
                    })
                  }
                  className="input"
                >
                  <option value="">Tous</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.type === 'particulier'
                        ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                        : customer.businessName}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          <div className="flex items-end">
            <button
              onClick={() => handleExportCSV(activeTab)}
              className="btn-primary w-full"
              disabled={loading}
            >
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <>
          {/* Rapport Revenus */}
          {activeTab === 'revenue' && revenueReport && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Résumé</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Revenus totaux</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueReport.totalRevenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Factures</div>
                    <div className="text-2xl font-bold">
                      {revenueReport.totalInvoices}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Paiements</div>
                    <div className="text-2xl font-bold">
                      {revenueReport.totalPayments}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Moyenne facture</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueReport.averageInvoice)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Par client</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Client</th>
                        <th className="text-right p-3">Revenus</th>
                        <th className="text-right p-3">Factures</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueReport.byCustomer.map((customer) => (
                        <tr key={customer.customerId} className="border-b">
                          <td className="p-3">{customer.customerName}</td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrency(customer.revenue)}
                          </td>
                          <td className="p-3 text-right">{customer.invoices}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Rapport Factures impayées */}
          {activeTab === 'unpaid' && unpaidReport && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Résumé</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total factures</div>
                    <div className="text-2xl font-bold">
                      {unpaidReport.totalCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Montant total</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(unpaidReport.totalAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">En retard</div>
                    <div className="text-2xl font-bold text-red-600">
                      {unpaidReport.overdueCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Montant en retard</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(unpaidReport.overdueAmount)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Factures</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Facture</th>
                        <th className="text-left p-3">Client</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Échéance</th>
                        <th className="text-right p-3">Montant</th>
                        <th className="text-right p-3">Solde</th>
                        <th className="text-right p-3">Retard</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidReport.invoices.map((inv, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3">{inv.invoiceNumber}</td>
                          <td className="p-3">{inv.customerName}</td>
                          <td className="p-3">{formatDate(inv.invoiceDate)}</td>
                          <td className="p-3">{formatDate(inv.dueDate)}</td>
                          <td className="p-3 text-right">
                            {formatCurrency(inv.totalTtc, inv.currency)}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrency(inv.remainingBalance, inv.currency)}
                          </td>
                          <td className="p-3 text-right">
                            {inv.daysOverdue > 0 ? (
                              <span className="text-red-600">
                                {inv.daysOverdue} jour(s)
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Rapport Paiements */}
          {activeTab === 'payments' && paymentsReport && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Résumé</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Montant total</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(paymentsReport.totalAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Nombre paiements</div>
                    <div className="text-2xl font-bold">
                      {paymentsReport.totalCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Moyenne</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        paymentsReport.totalAmount / paymentsReport.totalCount
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Par méthode</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Méthode</th>
                        <th className="text-right p-3">Nombre</th>
                        <th className="text-right p-3">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsReport.byMethod.map((method, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3">{method.method}</td>
                          <td className="p-3 text-right">{method.count}</td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrency(method.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Journal comptable */}
          {activeTab === 'journal' && journal && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Résumé</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total débit</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(journal.totals.totalDebit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total crédit</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(journal.totals.totalCredit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Solde final</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(journal.totals.finalBalance)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Journal</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Référence</th>
                        <th className="text-left p-3">Description</th>
                        <th className="text-right p-3">Débit</th>
                        <th className="text-right p-3">Crédit</th>
                        <th className="text-right p-3">Solde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journal.entries.map((entry, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3">{formatDate(entry.date)}</td>
                          <td className="p-3">{entry.type}</td>
                          <td className="p-3">{entry.reference}</td>
                          <td className="p-3">{entry.description}</td>
                          <td className="p-3 text-right">
                            {entry.debit > 0 ? formatCurrency(entry.debit, entry.currency) : '-'}
                          </td>
                          <td className="p-3 text-right">
                            {entry.credit > 0 ? formatCurrency(entry.credit, entry.currency) : '-'}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrency(entry.balance, entry.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Rapport Dépenses par fournisseur */}
          {activeTab === 'suppliers' && supplierReport && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Résumé</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Nombre de fournisseurs</div>
                    <div className="text-2xl font-bold">
                      {supplierReport.totalSuppliers}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Montant total des dépenses</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(supplierReport.totalExpenses)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Dépenses par fournisseur</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Fournisseur</th>
                        <th className="text-left p-3">Contact</th>
                        <th className="text-left p-3">Localisation</th>
                        <th className="text-right p-3">Nombre de dépenses</th>
                        <th className="text-right p-3">Montant total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierReport.items.map((item, index) => (
                        <tr
                          key={item.supplierId || `supplier-${index}-${item.name}`}
                          className="border-b"
                        >
                          <td className="p-3">
                            <div className="font-semibold">
                              {item.name}
                            </div>
                          </td>
                          <td className="p-3">
                            {item.email && <div>{item.email}</div>}
                            {item.phone && (
                              <div className="text-xs text-gray-500">{item.phone}</div>
                            )}
                          </td>
                          <td className="p-3">
                            {(item.city || item.country) ? (
                              <>
                                {item.city && <span>{item.city}</span>}
                                {item.country && (
                                  <span>{item.city ? `, ${item.country}` : item.country}</span>
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {item.expenseCount}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrency(item.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReportingPage;

