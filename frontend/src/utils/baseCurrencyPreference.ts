const BASE_CURRENCY_STORAGE_KEY = 'exchangeRate.baseCurrency';
const DEFAULT_BASE_CURRENCY = 'KRW';

export function readStoredBaseCurrency() {
  try {
    return window.localStorage.getItem(BASE_CURRENCY_STORAGE_KEY) || DEFAULT_BASE_CURRENCY;
  } catch {
    return DEFAULT_BASE_CURRENCY;
  }
}

export function storeBaseCurrency(value: string) {
  try {
    window.localStorage.setItem(BASE_CURRENCY_STORAGE_KEY, value);
  } catch {
    // 기준 통화 저장 실패는 화면 동작을 막지 않는다.
    // Failing to persist the base currency should not block UI behavior.
  }
}

export function isBaseCurrencyStorageEvent(event: StorageEvent) {
  return event.key === BASE_CURRENCY_STORAGE_KEY;
}
