import type { PortfolioTransaction } from '../../types/portfolio';
import { EmptyView } from '../common/EmptyView';
import { PortfolioTransactionRow } from './PortfolioTransactionRow';

interface PortfolioTransactionListProps {
  transactions: PortfolioTransaction[];
  investmentCurrency: string;
  onDelete?: (transactionId: number) => void;
}

export function PortfolioTransactionList({
  transactions,
  investmentCurrency,
  onDelete,
}: PortfolioTransactionListProps) {
  if (transactions.length === 0) {
    return <EmptyView message="No transactions yet. Deposit cash and buy a currency to start tracking." />;
  }

  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-bold">Recent transactions</h2>
      <div className="overflow-x-auto rounded-app border border-line bg-panel shadow-sm">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-surface text-left text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Currency</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Rate</th>
              <th className="px-3 py-3">Payment</th>
              <th className="px-3 py-3">Memo</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <PortfolioTransactionRow
                key={transaction.id}
                transaction={transaction}
                investmentCurrency={investmentCurrency}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
