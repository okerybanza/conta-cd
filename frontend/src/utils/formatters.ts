export function formatCurrency(amount: number | string, currency: string = 'CDF'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0,00 ' + currency;
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num) + ' ' + currency;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatNumber(num: number | string, decimals: number = 2): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatFullName(firstName?: string | null, lastName?: string | null, fallback: string = 'Utilisateur'): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : fallback;
}

export function formatCustomerName(customer: { type?: string; firstName?: string; lastName?: string; first_name?: string; last_name?: string; businessName?: string; business_name?: string }): string {
  if (!customer) return '-';
  const businessName = customer.businessName || customer.business_name;
  const firstName = customer.firstName || customer.first_name;
  const lastName = customer.lastName || customer.last_name;
  if (customer.type === 'business' || businessName) return businessName || '-';
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '-';
}

export function truncate(text: string, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', partially_paid: 'Partiellement payée',
    cancelled: 'Annulée', open: 'Ouverte', closed: 'Clôturée', pending: 'En attente',
    approved: 'Approuvé', rejected: 'Rejeté', active: 'Actif', inactive: 'Inactif',
  };
  return labels[status] || status;
}
