import { Trash2 } from 'lucide-react';

import type { PortfolioTransaction } from '../../types/portfolio';
import { formatAmount, formatRate } from '../../utils/numberFormat';
import { convertAppliedRateToDisplayUnit, formatRateUnit, getDisplayRateUnit } from '../../utils/portfolioRate';
import { Button } from '../common/Button';

interface PortfolioTransactionRowProps {
  transaction: PortfolioTransaction;
  investmentCurrency: string;
  onDelete?: (transactionId: number) => void;
}

export function PortfolioTransactionRow({
  transaction,
  investmentCurrency,
  onDelete,
}: PortfolioTransactionRowProps) {
  const currency = transaction.normalizedCurUnit ?? investmentCurrency;
  const displayRate = transaction.exchangeRate && transaction.unitFactor
    ? (() => {
      const targetBasis = {
        dealBasR: transaction.exchangeRate ?? 0,
        unitFactor: transaction.unitFactor ?? 1,
        normalizedCurUnit: currency,
      };
      const displayUnit = getDisplayRateUnit(targetBasis, transaction.exchangeRate);
      return {
        value: convertAppliedRateToDisplayUnit(transaction.exchangeRate, targetBasis, displayUnit.unitFactor),
        unit: displayUnit,
      };
    })()
    : null;

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-3 py-3 text-sm font-semibold">{transaction.transactionType}</td>
      <td className="px-3 py-3 text-sm">{currency}</td>
      <td className="px-3 py-3 text-sm">{transaction.transactionDate}</td>
      <td className="px-3 py-3 text-sm">{formatAmount(transaction.foreignAmount)}</td>
      <td className="px-3 py-3 text-sm">
        {displayRate === null
          ? '-'
          : `${formatRate(displayRate.value)} ${investmentCurrency} ${formatRateUnit(displayRate.unit)}`}
      </td>
      <td className="px-3 py-3 text-sm">{formatRate(transaction.amount)} {investmentCurrency}</td>
      <td className="px-3 py-3 text-sm text-muted">{transaction.memo || '-'}</td>
      <td className="px-3 py-3">
        <div className="flex gap-1">
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              aria-label="Delete transaction"
              onClick={() => onDelete(transaction.id)}
            >
              <Trash2 size={16} aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
