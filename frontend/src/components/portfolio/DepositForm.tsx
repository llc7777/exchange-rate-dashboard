import { type FormEvent, useState } from 'react';

import { depositPortfolioCash } from '../../api/portfolioApi';
import { toAppApiError } from '../../api/httpClient';
import { formatRate } from '../../utils/numberFormat';
import { Button } from '../common/Button';
import { ErrorView } from '../common/ErrorView';

interface DepositFormProps {
  portfolioId: number;
  cashBalance: number;
  investmentCurrency: string;
  onSuccess: () => void | Promise<void>;
}

export function DepositForm({
  portfolioId,
  cashBalance,
  investmentCurrency,
  onSuccess,
}: DepositFormProps) {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const depositAmount = Number(amount);
    if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
      setError('Deposit amount must be greater than zero.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await depositPortfolioCash({
        portfolioId,
        amount: depositAmount,
        memo: memo.trim() || null,
      });
      setAmount('');
      setMemo('');
      await onSuccess();
    } catch (error) {
      setError(toAppApiError(error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-app border border-line bg-panel p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Investment cash</h2>
          <p className="text-sm text-muted">
            Available cash balance: {formatRate(cashBalance)} {investmentCurrency}
          </p>
        </div>
      </div>
      <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-sm font-semibold">
          Deposit amount ({investmentCurrency})
          <input
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="rounded-app border border-line bg-panel px-3 py-2"
            placeholder="1000000"
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
        <div className="flex items-end">
          <Button type="submit" disabled={saving} className="w-full md:w-auto">
            {saving ? 'Depositing...' : 'Deposit'}
          </Button>
        </div>
      </form>
      {error ? <div className="mt-3"><ErrorView message={error} /></div> : null}
    </section>
  );
}
