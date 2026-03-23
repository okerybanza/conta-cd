export const COUNTRIES = [
  { code: 'CD', name: 'RDC (République Démocratique du Congo)' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'BI', name: 'Burundi' },
  { code: 'UG', name: 'Ouganda' },
  { code: 'TZ', name: 'Tanzanie' },
  { code: 'KE', name: 'Kenya' },
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'US', name: 'États-Unis' },
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  CD: [
    'Kinshasa',
    'Lubumbashi',
    'Goma',
    'Kisangani',
    'Bukavu',
    'Matadi',
    'Mbuji-Mayi',
    'Kolwezi',
  ],
};

export function mapCountryNameToCode(name?: string): string | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  if (lower.includes('congo') || lower.includes('rdc')) return 'CD';
  const found = COUNTRIES.find((c) => c.name.toLowerCase().includes(lower));
  return found?.code;
}


