const ENGLISH_CURRENCY_NAMES: Record<string, string> = {
  AED: 'United Arab Emirates Dirham',
  AUD: 'Australian Dollar',
  BHD: 'Bahraini Dinar',
  BND: 'Brunei Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  CNH: 'Chinese Yuan',
  DKK: 'Danish Krone',
  EUR: 'Euro',
  GBP: 'British Pound',
  HKD: 'Hong Kong Dollar',
  IDR: 'Indonesian Rupiah',
  JPY: 'Japanese Yen',
  KRW: 'Korean Won',
  KWD: 'Kuwaiti Dinar',
  MYR: 'Malaysian Ringgit',
  NOK: 'Norwegian Krone',
  NZD: 'New Zealand Dollar',
  SAR: 'Saudi Riyal',
  SEK: 'Swedish Krona',
  SGD: 'Singapore Dollar',
  THB: 'Thai Baht',
  USD: 'United States Dollar',
};

export function getEnglishCurrencyName(normalizedCurUnit: string, fallback?: string) {
  return ENGLISH_CURRENCY_NAMES[normalizedCurUnit] ?? fallback ?? normalizedCurUnit;
}
