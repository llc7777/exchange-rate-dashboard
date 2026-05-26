export interface KoreanPublicHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

const HOLIDAY_API_BASE_URL = 'https://date.nager.at/api/v3/PublicHolidays';
const memoryCache = new Map<number, KoreanPublicHoliday[]>();

function storageKey(year: number) {
  return `kr-public-holidays:${year}:v1`;
}

function readStoredHolidays(year: number): KoreanPublicHoliday[] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(storageKey(year));
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as KoreanPublicHoliday[];
  } catch {
    window.localStorage.removeItem(storageKey(year));
    return null;
  }
}

function writeStoredHolidays(year: number, holidays: KoreanPublicHoliday[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey(year), JSON.stringify(holidays));
}

export async function getKoreanPublicHolidays(year: number): Promise<KoreanPublicHoliday[]> {
  const cached = memoryCache.get(year);
  if (cached) {
    return cached;
  }

  const stored = readStoredHolidays(year);
  if (stored) {
    memoryCache.set(year, stored);
    return stored;
  }

  try {
    const response = await fetch(`${HOLIDAY_API_BASE_URL}/${year}/KR`);
    if (!response.ok) {
      throw new Error(`Holiday API returned ${response.status}`);
    }

    const holidays = (await response.json()) as KoreanPublicHoliday[];
    memoryCache.set(year, holidays);
    writeStoredHolidays(year, holidays);
    return holidays;
  } catch (error) {
    const fallback = readStoredHolidays(year);
    if (fallback) {
      memoryCache.set(year, fallback);
      return fallback;
    }
    throw error;
  }
}

export async function getKoreanPublicHolidayMap(
  year: number,
): Promise<Record<string, KoreanPublicHoliday>> {
  const holidays = await getKoreanPublicHolidays(year);
  return holidays.reduce<Record<string, KoreanPublicHoliday>>((acc, holiday) => {
    acc[holiday.date] = holiday;
    return acc;
  }, {});
}
