import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { buyCurrency, getExchangeRateForBuy } from '../../api/portfolioApi';
import { toAppApiError } from '../../api/httpClient';
import type { ExchangeRateForTransaction } from '../../types/portfolio';
import { isWeekend } from '../../utils/businessDay';
import { formatRate } from '../../utils/numberFormat';
import {
  calculateInvestmentCurrencyAmount,
  calculateInvestmentCurrencyRate,
  convertAppliedRateToDisplayUnit,
  formatRateUnit,
  getDisplayRateUnit,
  syntheticKrwRate,
  toRateBasis,
} from '../../utils/portfolioRate';
import { Button } from '../common/Button';
import { ErrorView } from '../common/ErrorView';
import { LoadingView } from '../common/LoadingView';
import { Modal } from '../common/Modal';
import { BusinessDatePicker } from './BusinessDatePicker';

interface BuyModalProps {
  open: boolean;
  portfolioId: number;
  targetCurrency: string;
  targetCurrencyName: string;
  investmentCurrency: string;
  cashBalance: number;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function BuyModal({
  open,
  portfolioId,
  targetCurrency,
  targetCurrencyName,
  investmentCurrency,
  cashBalance,
  onClose,
  onSuccess,
}: BuyModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [transactionDate, setTransactionDate] = useState(today);
  const [foreignAmount, setForeignAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [targetRate, setTargetRate] = useState<ExchangeRateForTransaction | null>(null);
  const [investmentRate, setInvestmentRate] = useState<ExchangeRateForTransaction | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTransactionDate(today);
    setForeignAmount('');
    setMemo('');
    setTargetRate(null);
    setInvestmentRate(null);
    setError(null);
    setValidationError(null);
  }, [open, today]);

  useEffect(() => {
    if (!open || !transactionDate) {
      return;
    }
    if (isWeekend(transactionDate)) {
      setTargetRate(null);
      setInvestmentRate(null);
      setError('Weekends are non-business days. Select a weekday.');
      return;
    }

    let active = true;
    setRateLoading(true);
    setError(null);
    // 선택한 날짜 환율이 DB에 없으면 백엔드가 외부 API 동기화를 한 번 시도한 뒤 응답한다.
    // If the selected date is missing in DB, the backend attempts one external API sync before responding.
    Promise.all([
      getExchangeRateForBuy(targetCurrency, transactionDate),
      investmentCurrency === 'KRW'
        ? Promise.resolve(syntheticKrwRate(transactionDate))
        : getExchangeRateForBuy(investmentCurrency, transactionDate),
    ])
      .then(([loadedTargetRate, loadedInvestmentRate]) => {
        if (active) {
          setTargetRate(loadedTargetRate);
          setInvestmentRate(loadedInvestmentRate);
        }
      })
      .catch((error) => {
        if (active) {
          setTargetRate(null);
          setInvestmentRate(null);
          setError(toAppApiError(error).message);
        }
      })
      .finally(() => {
        if (active) {
          setRateLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [investmentCurrency, open, targetCurrency, transactionDate]);

  const paymentPreview = useMemo(() => {
    const amount = Number(foreignAmount);
    if (!targetRate || !investmentRate || !Number.isFinite(amount) || amount <= 0) {
      return 0;
    }
    return calculateInvestmentCurrencyAmount(
      amount,
      toRateBasis(targetRate),
      toRateBasis(investmentRate),
    );
  }, [foreignAmount, investmentRate, targetRate]);

  const appliedRate = useMemo(() => {
    if (!targetRate || !investmentRate) {
      return null;
    }
    return calculateInvestmentCurrencyRate(toRateBasis(targetRate), toRateBasis(investmentRate));
  }, [investmentRate, targetRate]);

  const displayRate = useMemo(() => {
    if (!targetRate || appliedRate === null) {
      return null;
    }
    const targetBasis = toRateBasis(targetRate);
    const displayUnit = getDisplayRateUnit(targetBasis, appliedRate);
    return {
      value: convertAppliedRateToDisplayUnit(appliedRate, targetBasis, displayUnit.unitFactor),
      unit: displayUnit,
    };
  }, [appliedRate, targetRate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(foreignAmount);
    if (isWeekend(transactionDate)) {
      setValidationError('Weekends are non-business days. Select a weekday.');
      return;
    }
    if (!targetRate || !investmentRate) {
      setValidationError('Select a date with exchange-rate data.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setValidationError(`${targetCurrency} amount must be greater than zero.`);
      return;
    }
    if (paymentPreview > cashBalance) {
      setValidationError('Cash balance is insufficient.');
      return;
    }

    setSaving(true);
    setError(null);
    setValidationError(null);
    try {
      await buyCurrency({
        portfolioId,
        curUnit: targetCurrency,
        transactionDate,
        foreignAmount: amount,
        memo: memo.trim() || null,
      });
      await onSuccess();
      onClose();
    } catch (error) {
      setError(toAppApiError(error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title={`Buy ${targetCurrency}`} onClose={onClose}>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-semibold">{targetCurrencyName}</p>
          <p className="text-xs text-muted">
            This portfolio pays with {investmentCurrency}. Rates are applied by the backend and cannot be edited.
          </p>
        </div>
        <BusinessDatePicker
          value={transactionDate}
          onChange={setTransactionDate}
          maxDate={today}
        />
        <label className="grid gap-1 text-sm font-semibold">
          {targetCurrency} amount
          <input
            type="number"
            min="0"
            step="0.000001"
            inputMode="decimal"
            value={foreignAmount}
            onChange={(event) => setForeignAmount(event.target.value)}
            className="rounded-app border border-line bg-panel px-3 py-2"
            placeholder={`Amount in ${targetCurrency}`}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Memo
          <input
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            className="rounded-app border border-line bg-panel px-3 py-2"
            placeholder="Optional"
          />
        </label>
        {rateLoading ? <LoadingView label="Loading stored rate..." /> : null}
        {targetRate && investmentRate ? (
          <div className="grid gap-2 rounded-app border border-line bg-surface p-3 text-sm">
            <p><strong>Rate date:</strong> {targetRate.baseDate}</p>
            <p>
              <strong>Applied rate:</strong> {formatRate(displayRate?.value)} {investmentCurrency}{' '}
              {displayRate ? formatRateUnit(displayRate.unit) : ''}
            </p>
          </div>
        ) : null}
        <div className="rounded-app border border-line bg-surface p-3">
          <p className="text-xs font-semibold text-muted">Estimated {investmentCurrency} payment</p>
          <p className="text-xl font-bold">
            {formatRate(paymentPreview)} {investmentCurrency}
          </p>
          <p className="text-xs text-muted">
            Cash balance {formatRate(cashBalance)} {investmentCurrency}
          </p>
        </div>
        {paymentPreview > cashBalance ? <ErrorView message="Cash balance is insufficient." /> : null}
        {validationError ? <ErrorView message={validationError} /> : null}
        {error ? <ErrorView message={error} /> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || rateLoading}>
            {saving ? 'Buying...' : 'Buy'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
