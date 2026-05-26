import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import {
  getKoreanPublicHolidayMap,
  type KoreanPublicHoliday,
} from '../../api/holidayApi';
import { isWeekend } from '../../utils/businessDay';
import { Button } from '../common/Button';

interface BusinessDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  maxDate: string;
  label?: string;
  compact?: boolean;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDateValue(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildMonthDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);
  const days: Array<string | null> = Array.from({ length: firstDate.getDay() }, () => null);

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    days.push(formatDateValue(new Date(year, month, day)));
  }

  return days;
}

function getBlockedReason(
  value: string,
  maxDate: string,
  holidaysByDate: Record<string, KoreanPublicHoliday>,
) {
  if (value > maxDate) {
    return 'Future dates are unavailable';
  }
  if (isWeekend(value)) {
    return 'Weekend';
  }

  const holiday = holidaysByDate[value];
  if (holiday) {
    return holiday.name || holiday.localName || 'Korean public holiday';
  }

  return null;
}

function findPreviousSelectableDate(
  value: string,
  maxDate: string,
  holidaysByDate: Record<string, KoreanPublicHoliday>,
) {
  let cursor = parseDateValue(value > maxDate ? maxDate : value);

  for (let index = 0; index < 370; index += 1) {
    const dateValue = formatDateValue(cursor);
    if (!getBlockedReason(dateValue, maxDate, holidaysByDate)) {
      return dateValue;
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return value;
}

export function BusinessDatePicker({
  value,
  onChange,
  maxDate,
  label = 'Transaction date',
  compact = false,
}: BusinessDatePickerProps) {
  const inputId = useId();
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateValue(value || maxDate));
  const [holidaysByDate, setHolidaysByDate] = useState<Record<string, KoreanPublicHoliday>>({});
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidayError, setHolidayError] = useState<string | null>(null);
  const previousValueRef = useRef(value);
  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(visibleMonth),
    [visibleMonth],
  );

  useEffect(() => {
    if (!value || previousValueRef.current === value) {
      return;
    }
    previousValueRef.current = value;
    const selectedDate = parseDateValue(value);
    setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [value]);

  useEffect(() => {
    let active = true;
    const year = visibleMonth.getFullYear();

    setHolidayLoading(true);
    setHolidayError(null);
    getKoreanPublicHolidayMap(year)
      .then((loadedHolidays) => {
        if (active) {
          setHolidaysByDate(loadedHolidays);
        }
      })
      .catch(() => {
        if (active) {
          setHolidaysByDate({});
          setHolidayError('Unable to load Korean holidays. Weekends are still blocked.');
        }
      })
      .finally(() => {
        if (active) {
          setHolidayLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [visibleMonth]);

  useEffect(() => {
    if (holidayLoading || !value) {
      return;
    }

    const blockedReason = getBlockedReason(value, maxDate, holidaysByDate);
    if (!blockedReason) {
      return;
    }

    // 한국 공휴일과 주말은 거래일이 아니므로 가장 가까운 이전 거래일로 보정한다.
    // Korean holidays and weekends are not trading days, so the picker moves to the nearest previous trading day.
    const fallbackDate = findPreviousSelectableDate(value, maxDate, holidaysByDate);
    if (fallbackDate !== value) {
      onChange(fallbackDate);
    }
  }, [holidayLoading, holidaysByDate, maxDate, onChange, value]);

  function moveMonth(direction: -1 | 1) {
    setVisibleMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1),
    );
  }

  function handleDateClick(dateValue: string) {
    if (getBlockedReason(dateValue, maxDate, holidaysByDate)) {
      return;
    }
    onChange(dateValue);
  }

  return (
    <div className="grid gap-2">
      <label htmlFor={inputId} className="text-sm font-semibold">
        {label}
      </label>
      {compact ? (
        <div
          id={inputId}
          className="rounded-app border border-line bg-surface px-3 py-2 text-sm font-semibold"
          aria-describedby={`${inputId}-hint`}
        >
          {value}
        </div>
      ) : (
        <input
          id={inputId}
          readOnly
          value={value}
          className="rounded-app border border-line bg-panel px-3 py-2 text-sm"
          aria-describedby={`${inputId}-hint`}
        />
      )}
      <div id={`${inputId}-hint`} className="text-xs text-muted">
        Weekends and Korean public holidays are disabled.
      </div>
      <div className={`rounded-app border border-line bg-panel ${compact ? 'p-2' : 'p-3'}`}>
        <div className={`${compact ? 'mb-2' : 'mb-3'} flex items-center justify-between gap-2`}>
          <Button
            type="button"
            variant="secondary"
            className={compact ? 'min-h-8 px-2' : 'min-h-9 px-3'}
            aria-label="Previous month"
            onClick={() => moveMonth(-1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Button>
          <p className="text-sm font-bold">{monthLabel}</p>
          <Button
            type="button"
            variant="secondary"
            className={compact ? 'min-h-8 px-2' : 'min-h-9 px-3'}
            aria-label="Next month"
            onClick={() => moveMonth(1)}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
          {WEEKDAY_LABELS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthDays.map((dateValue, index) => {
            if (!dateValue) {
              return <span key={`empty-${index}`} aria-hidden="true" />;
            }

            const blockedReason = getBlockedReason(dateValue, maxDate, holidaysByDate);
            const isSelected = dateValue === value;
            const dayNumber = Number(dateValue.slice(-2));

            return (
              <button
                key={dateValue}
                type="button"
                disabled={Boolean(blockedReason)}
                title={blockedReason ?? dateValue}
                aria-label={
                  blockedReason
                    ? `${dateValue} unavailable: ${blockedReason}`
                    : `Select ${dateValue}`
                }
                onClick={() => handleDateClick(dateValue)}
                className={`${compact ? 'min-h-8 text-xs' : 'min-h-9 text-sm'} rounded-app font-semibold transition ${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'border border-transparent bg-surface text-text hover:border-primary'
                } disabled:cursor-not-allowed disabled:border-line disabled:bg-surface disabled:text-muted disabled:opacity-60`}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>
        {holidayLoading ? (
          <p className="mt-2 text-xs text-muted">Loading Korean holiday calendar...</p>
        ) : null}
        {holidayError ? <p className="mt-2 text-xs text-[var(--color-up)]">{holidayError}</p> : null}
      </div>
    </div>
  );
}
