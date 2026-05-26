import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { getExchangeRateForSell, sellCurrency } from '../../api/portfolioApi';
import { toAppApiError } from '../../api/httpClient';
import type { ExchangeRateForTransaction, PortfolioPosition } from '../../types/portfolio';
import { formatAmount, formatRate } from '../../utils/numberFormat';
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

interface SellModalProps {
  open: boolean;
  portfolioId: number;
  investmentCurrency: string;
  position: PortfolioPosition;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function SellModal({
  open,
  portfolioId,
  investmentCurrency,
  position,
  onClose,
  onSuccess,
}: SellModalProps) {
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
    setForeignAmount('');
    setMemo('');
    setTargetRate(null);
    setInvestmentRate(null);
    setError(null);
    setValidationError(null);

    let active = true;
    setRateLoading(true);
    // 매도 미리보기는 대상 통화의 최신 저장 영업일과 같은 날짜의 투자 통화 환율을 사용한다.
    // Sell preview uses the target currency's latest stored business date and the investment rate for that same date.
    getExchangeRateForSell(position.normalizedCurUnit)
      .then(async (loadedTargetRate) => {
        const loadedInvestmentRate = investmentCurrency === 'KRW'
          ? syntheticKrwRate(loadedTargetRate.baseDate)
          : await getExchangeRateForSell(investmentCurrency);
        if (active) {
          setTargetRate(loadedTargetRate);
          setInvestmentRate(loadedInvestmentRate);
        }
      })
      .catch((error) => {
        if (active) {
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
  }, [investmentCurrency, open, position.normalizedCurUnit]);

  const proceedsPreview = useMemo(() => {
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
    if (!targetRate || !investmentRate) {
      setValidationError('Latest stored exchange rate is unavailable.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setValidationError(`${position.normalizedCurUnit} amount must be greater than zero.`);
      return;
    }
    if (amount > position.holdingForeignAmount) {
      setValidationError('Sell amount cannot exceed your holding amount.');
      return;
    }

    setSaving(true);
    setError(null);
    setValidationError(null);
    try {
      await sellCurrency({
        portfolioId,
        curUnit: position.normalizedCurUnit,
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
    <Modal open={open} title={`Sell ${position.normalizedCurUnit}`} onClose={onClose}>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-semibold">{position.curName}</p>
          <p className="text-xs text-muted">
            Proceeds are paid in {investmentCurrency}. The backend applies the latest stored business-day rate.
          </p>
        </div>
        <label className="grid gap-1 text-sm font-semibold">
          {position.normalizedCurUnit} amount
          <input
            type="number"
            min="0"
            max={position.holdingForeignAmount}
            step="0.000001"
            inputMode="decimal"
            value={foreignAmount}
            onChange={(event) => setForeignAmount(event.target.value)}
            className="rounded-app border border-line bg-panel px-3 py-2"
            placeholder={String(position.holdingForeignAmount)}
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
        {rateLoading ? <LoadingView label="Loading latest stored rate..." /> : null}
        {targetRate && investmentRate ? (
          <div className="grid gap-2 rounded-app border border-line bg-surface p-3 text-sm">
            <p><strong>Latest rate date:</strong> {targetRate.baseDate}</p>
            <p>
              <strong>Applied rate:</strong> {formatRate(displayRate?.value)} {investmentCurrency}{' '}
              {displayRate ? formatRateUnit(displayRate.unit) : ''}
            </p>
            <p><strong>Available holding:</strong> {formatAmount(position.holdingForeignAmount)}</p>
          </div>
        ) : null}
        <div className="rounded-app border border-line bg-surface p-3">
          <p className="text-xs font-semibold text-muted">Estimated {investmentCurrency} proceeds</p>
          <p className="text-xl font-bold">
            {formatRate(proceedsPreview)} {investmentCurrency}
          </p>
        </div>
        {validationError ? <ErrorView message={validationError} /> : null}
        {error ? <ErrorView message={error} /> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || rateLoading}>
            {saving ? 'Selling...' : 'Sell'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
