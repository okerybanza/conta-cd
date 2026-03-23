import { useAuthStore } from '../../store/auth.store';

interface InvoiceTemplatePreviewProps {
  templateId: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Données de démo pour l'aperçu
const DEMO_INVOICE = {
  invoiceNumber: 'INV-2025-001',
  invoiceDate: new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }),
  customer: {
    name: 'Client Exemple',
    email: 'client@exemple.com',
    address: '123 Rue Exemple\n75001 Paris, France',
  },
  lines: [
    { name: 'Service de consultation', quantity: 5, unitPrice: 1000, taxRate: 18, total: 5900 },
    { name: 'Développement web', quantity: 10, unitPrice: 2500, taxRate: 18, total: 29500 },
  ],
  subtotalHt: 30000,
  totalTax: 5400,
  totalTtc: 35400,
  currency: 'CDF',
};

function InvoiceTemplatePreview({ templateId, primaryColor = '#2563EB', secondaryColor = '#1FAB89' }: InvoiceTemplatePreviewProps) {
  const { company } = useAuthStore();

  const formatPrice = (price: number, currency: string = 'CDF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Styles dynamiques basés sur le template
  const getTemplateStyles = () => {
    const styles: Record<string, { header: string; accent: string; bg: string; layout: 'standard' | 'spreadsheet' | 'minimalist' | 'retail' }> = {
      // Catégorie Standard
      'template-standard': {
        header: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
        accent: primaryColor,
        bg: '#F8F8F8',
        layout: 'standard',
      },
      'template-standard-japanese': {
        header: primaryColor,
        accent: primaryColor,
        bg: '#ffffff',
        layout: 'standard',
      },
      'template-standard-japanese-no-seal': {
        header: primaryColor,
        accent: primaryColor,
        bg: '#fafafa',
        layout: 'standard',
      },
      'template-standard-european': {
        header: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        accent: secondaryColor,
        bg: '#ffffff',
        layout: 'standard',
      },
      'template-standard-modern': {
        header: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
        accent: primaryColor,
        bg: '#F8F8F8',
        layout: 'standard',
      },
      'template-standard-classic': {
        header: primaryColor,
        accent: primaryColor,
        bg: '#f8f9fa',
        layout: 'standard',
      },
      
      // Catégorie Feuille de calcul
      'template-spreadsheet': {
        header: '#000000',
        accent: '#000000',
        bg: '#f5f5f5',
        layout: 'spreadsheet',
      },
      'template-spreadsheet-plus': {
        header: '#1a1a1a',
        accent: '#1a1a1a',
        bg: '#f5f5f5',
        layout: 'spreadsheet',
      },
      'template-spreadsheet-lite': {
        header: '#333333',
        accent: '#333333',
        bg: '#ffffff',
        layout: 'spreadsheet',
      },
      'template-spreadsheet-compact': {
        header: '#000000',
        accent: '#000000',
        bg: '#f9f9f9',
        layout: 'spreadsheet',
      },
      
      // Catégorie Premium
      'template-minimalist': {
        header: 'transparent',
        accent: primaryColor,
        bg: '#ffffff',
        layout: 'minimalist',
      },
      'template-grandiose': {
        header: `linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)`,
        accent: '#d4af37',
        bg: '#ffffff',
        layout: 'standard',
      },
      'template-continental': {
        header: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        accent: secondaryColor,
        bg: '#fafafa',
        layout: 'standard',
      },
      
      // Catégorie Universel
      'template-lightweight': {
        header: primaryColor,
        accent: primaryColor,
        bg: '#ffffff',
        layout: 'standard',
      },
      'template-simple': {
        header: '#333333',
        accent: '#333333',
        bg: '#ffffff',
        layout: 'standard',
      },
      'template-compact': {
        header: primaryColor,
        accent: primaryColor,
        bg: '#f5f5f5',
        layout: 'spreadsheet',
      },
      'template-universal': {
        header: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        accent: secondaryColor,
        bg: '#ffffff',
        layout: 'standard',
      },
      
      // Catégorie Vente au détail
      'template-retail-standard': {
        header: '#000000',
        accent: '#000000',
        bg: '#ffffff',
        layout: 'retail',
      },
      'template-retail-premium': {
        header: '#1a1a1a',
        accent: '#1a1a1a',
        bg: '#ffffff',
        layout: 'retail',
      },
      'template-pos-premium': {
        header: '#000000',
        accent: '#000000',
        bg: '#ffffff',
        layout: 'retail',
      },
      'template-pos-standard': {
        header: '#333333',
        accent: '#333333',
        bg: '#ffffff',
        layout: 'retail',
      },
      
      // Anciens templates (pour compatibilité)
      'template-1-modern': {
        header: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
        accent: primaryColor,
        bg: '#F8F8F8',
        layout: 'standard',
      },
      'template-2-classic': {
        header: primaryColor,
        accent: primaryColor,
        bg: '#f8f9fa',
        layout: 'standard',
      },
      'template-3-green-accent': {
        header: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        accent: secondaryColor,
        bg: '#F8F8F8',
        layout: 'standard',
      },
      'template-4-elegant': {
        header: '#2c3e50',
        accent: '#2c3e50',
        bg: '#fafafa',
        layout: 'standard',
      },
      'template-5-colorful': {
        header: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        accent: secondaryColor,
        bg: '#F8F8F8',
        layout: 'standard',
      },
      'template-6-corporate': {
        header: primaryColor,
        accent: primaryColor,
        bg: '#ffffff',
        layout: 'standard',
      },
      'template-7-compact': {
        header: primaryColor,
        accent: primaryColor,
        bg: '#f5f5f5',
        layout: 'spreadsheet',
      },
      'template-8-premium': {
        header: '#1a1a1a',
        accent: '#d4af37',
        bg: '#ffffff',
        layout: 'standard',
      },
    };
    return styles[templateId] || styles['template-standard'];
  };

  const templateStyles = getTemplateStyles();

  // Rendu pour layout Minimalist (logo en bas)
  if (templateStyles.layout === 'minimalist') {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header sans logo */}
               <div className="p-6 border-b border-gray-200 text-center">
                 <h2 className="text-lg font-bold mb-1.5">{company?.name || 'Mon Entreprise'}</h2>
                 <div className="text-gray-600 text-xs space-y-1">
            {company?.address && <p>{company.address}</p>}
            {(company?.city || company?.country) && (
              <p>
                {company.city}
                {company.city && company.country && ', '}
                {company.country}
              </p>
            )}
          </div>
        </div>

        {/* Invoice Title */}
        <div className="text-center py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold uppercase">FACTURE</h1>
        </div>

        {/* Invoice Meta */}
        <div className="p-6 text-center text-sm border-b border-gray-200" style={{ backgroundColor: templateStyles.bg }}>
          <p className="font-semibold">
            N°: {DEMO_INVOICE.invoiceNumber} | Date: {DEMO_INVOICE.invoiceDate}
            {DEMO_INVOICE.dueDate && ` | Échéance: ${DEMO_INVOICE.dueDate}`}
          </p>
        </div>

        {/* Client Section */}
        <div className="p-6 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Facturé à</p>
          <p className="font-semibold text-gray-900 mb-2">{DEMO_INVOICE.customer.name}</p>
          <p className="text-gray-600 text-xs whitespace-pre-line">{DEMO_INVOICE.customer.address}</p>
        </div>

        {/* Tableau */}
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2" style={{ borderColor: templateStyles.accent }}>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Description</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">Qté</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">Prix</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">TVA</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_INVOICE.lines.map((line, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-3">
                    <div className="font-medium text-gray-900">{line.name}</div>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-600">{line.quantity}</td>
                  <td className="py-3 px-3 text-right text-gray-600">{formatPrice(line.unitPrice, DEMO_INVOICE.currency)}</td>
                  <td className="py-3 px-3 text-right text-gray-600">{line.taxRate}%</td>
                  <td className="py-3 px-3 text-right font-semibold text-gray-900">{formatPrice(line.total, DEMO_INVOICE.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="p-6" style={{ backgroundColor: templateStyles.bg }}>
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sous-total HT</span>
                <span className="font-medium">{formatPrice(DEMO_INVOICE.subtotalHt, DEMO_INVOICE.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TVA</span>
                <span className="font-medium">{formatPrice(DEMO_INVOICE.totalTax, DEMO_INVOICE.currency)}</span>
              </div>
              <div className="border-t-2 pt-2 mt-2" style={{ borderColor: templateStyles.accent }}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg text-gray-900">Total TTC</span>
                  <span className="text-xl font-bold" style={{ color: templateStyles.accent }}>
                    {formatPrice(DEMO_INVOICE.totalTtc, DEMO_INVOICE.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec logo */}
        <div className="p-6 border-t border-gray-200 text-center">
          {company?.logoUrl && (
            <div className="mb-4">
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-12 mx-auto object-contain"
              />
            </div>
          )}
          <div className="text-xs text-gray-500">
            {company?.name} - {company?.address}, {company?.city}
          </div>
        </div>
      </div>
    );
  }

  // Rendu pour layout Spreadsheet (style tableau)
  if (templateStyles.layout === 'spreadsheet') {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header compact */}
        <div className="p-4 border-b-2 border-black flex justify-between items-start">
          <div>
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-10 mb-2 object-contain"
              />
            ) : (
              <h2 className="text-base font-bold">{company?.name || 'Mon Entreprise'}</h2>
            )}
            <div className="text-xs text-gray-600 mt-1">
              {company?.address}, {company?.city}, {company?.country}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-lg font-bold uppercase mb-1.5">FACTURE</h1>
            <div className="text-xs">
              <p><strong>N°:</strong> {DEMO_INVOICE.invoiceNumber}</p>
              <p><strong>Date:</strong> {DEMO_INVOICE.invoiceDate}</p>
            </div>
          </div>
        </div>

        {/* Client compact */}
        <div className="p-4 border-b border-gray-300 bg-gray-50">
          <p className="text-xs font-semibold mb-1">Facturé à: <span className="font-normal">{DEMO_INVOICE.customer.name}</span></p>
          <p className="text-xs text-gray-600">{DEMO_INVOICE.customer.address}</p>
        </div>

        {/* Tableau style spreadsheet */}
        <div className="p-4">
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr style={{ backgroundColor: templateStyles.header, color: '#fff' }}>
                <th className="border border-black p-2 text-left font-bold">Description</th>
                <th className="border border-black p-2 text-center font-bold">Qté</th>
                <th className="border border-black p-2 text-right font-bold">Prix unit.</th>
                <th className="border border-black p-2 text-right font-bold">TVA</th>
                <th className="border border-black p-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_INVOICE.lines.map((line, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-2">{line.name}</td>
                  <td className="border border-gray-300 p-2 text-center">{line.quantity}</td>
                  <td className="border border-gray-300 p-2 text-right">{formatPrice(line.unitPrice, DEMO_INVOICE.currency)}</td>
                  <td className="border border-gray-300 p-2 text-right">{line.taxRate}%</td>
                  <td className="border border-gray-300 p-2 text-right font-semibold">{formatPrice(line.total, DEMO_INVOICE.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux compact */}
        <div className="p-4 border-t-2 border-black">
          <div className="flex justify-end">
            <div className="w-56 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Sous-total HT</span>
                <span>{formatPrice(DEMO_INVOICE.subtotalHt, DEMO_INVOICE.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA</span>
                <span>{formatPrice(DEMO_INVOICE.totalTax, DEMO_INVOICE.currency)}</span>
              </div>
              <div className="flex justify-between border-t-2 border-black pt-1 mt-1 font-bold">
                <span>TOTAL TTC</span>
                <span>{formatPrice(DEMO_INVOICE.totalTtc, DEMO_INVOICE.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rendu pour layout Retail (format étroit)
  if (templateStyles.layout === 'retail') {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200" style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* Header retail */}
        <div className="p-4 border-b border-black text-center">
          {company?.logoUrl && (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="h-10 mx-auto mb-2 object-contain"
            />
          )}
          <h2 className="text-lg font-bold">{company?.name || 'Mon Entreprise'}</h2>
          <div className="text-xs text-gray-600 mt-1">
            {company?.address}, {company?.city}
          </div>
        </div>

        {/* Invoice info */}
        <div className="p-4 border-b border-gray-300 text-center">
          <h1 className="text-base font-bold uppercase mb-1.5">FACTURE</h1>
          <div className="text-xs">
            <p><strong>N°:</strong> {DEMO_INVOICE.invoiceNumber}</p>
            <p><strong>Date:</strong> {DEMO_INVOICE.invoiceDate}</p>
          </div>
        </div>

        {/* Items retail */}
        <div className="p-4">
          {DEMO_INVOICE.lines.map((line, index) => (
            <div key={index} className="border-b border-gray-200 py-2 text-xs">
              <div className="flex justify-between mb-1">
                <span className="font-semibold">{line.name}</span>
                <span className="font-semibold">{formatPrice(line.total, DEMO_INVOICE.currency)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{line.quantity} x {formatPrice(line.unitPrice, DEMO_INVOICE.currency)}</span>
                <span>TVA {line.taxRate}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totaux retail */}
        <div className="p-4 border-t-2 border-black">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Sous-total HT</span>
              <span>{formatPrice(DEMO_INVOICE.subtotalHt, DEMO_INVOICE.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>TVA</span>
              <span>{formatPrice(DEMO_INVOICE.totalTax, DEMO_INVOICE.currency)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-black pt-1 mt-1 font-bold text-sm">
              <span>TOTAL</span>
              <span>{formatPrice(DEMO_INVOICE.totalTtc, DEMO_INVOICE.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rendu standard (par défaut)
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* En-tête */}
      <div 
        className="text-white p-6"
        style={{ background: templateStyles.header }}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-12 mb-3 object-contain"
              />
            ) : (
              <h2 className="text-lg font-bold mb-1.5">{company?.name || 'Mon Entreprise'}</h2>
            )}
            <div className="text-white/90 text-xs space-y-1">
              {company?.address && <p>{company.address}</p>}
              {(company?.city || company?.country) && (
                <p>
                  {company.city}
                  {company.city && company.country && ', '}
                  {company.country}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 inline-block">
              <p className="text-xs uppercase tracking-wide mb-1 opacity-90">Facture</p>
              <p className="text-lg font-bold">{DEMO_INVOICE.invoiceNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div className="p-6 border-b border-gray-200" style={{ backgroundColor: templateStyles.bg }}>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Facturé à</p>
            <p className="font-semibold text-gray-900">{DEMO_INVOICE.customer.name}</p>
            <p className="text-gray-600 text-xs mt-1">{DEMO_INVOICE.customer.email}</p>
            <p className="text-gray-600 text-xs mt-1 whitespace-pre-line">{DEMO_INVOICE.customer.address}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Date de facture</p>
            <p className="font-semibold text-gray-900">{DEMO_INVOICE.invoiceDate}</p>
            <p className="text-xs text-gray-500 mt-3">Date d'échéance</p>
            <p className="font-semibold text-gray-900">{DEMO_INVOICE.dueDate}</p>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2" style={{ borderColor: templateStyles.accent }}>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Description</th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">Qté</th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">Prix</th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">TVA</th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_INVOICE.lines.map((line, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 px-3">
                  <div className="font-medium text-gray-900">{line.name}</div>
                </td>
                <td className="py-3 px-3 text-right text-gray-600">{line.quantity}</td>
                <td className="py-3 px-3 text-right text-gray-600">{formatPrice(line.unitPrice, DEMO_INVOICE.currency)}</td>
                <td className="py-3 px-3 text-right text-gray-600">{line.taxRate}%</td>
                <td className="py-3 px-3 text-right font-semibold text-gray-900">{formatPrice(line.total, DEMO_INVOICE.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div className="p-6" style={{ backgroundColor: templateStyles.bg }}>
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Sous-total HT</span>
              <span className="font-medium">{formatPrice(DEMO_INVOICE.subtotalHt, DEMO_INVOICE.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">TVA</span>
              <span className="font-medium">{formatPrice(DEMO_INVOICE.totalTax, DEMO_INVOICE.currency)}</span>
            </div>
            <div className="border-t-2 pt-2 mt-2" style={{ borderColor: templateStyles.accent }}>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-base text-gray-900">Total TTC</span>
                <span className="text-lg font-bold" style={{ color: templateStyles.accent }}>
                  {formatPrice(DEMO_INVOICE.totalTtc, DEMO_INVOICE.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceTemplatePreview;

