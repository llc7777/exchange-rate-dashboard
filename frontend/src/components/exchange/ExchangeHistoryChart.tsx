import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ExchangeRateHistory } from '../../types/exchange';
import { formatRate } from '../../utils/numberFormat';
import { EmptyView } from '../common/EmptyView';

interface ExchangeHistoryChartProps {
  history: ExchangeRateHistory[];
  rateLabel?: string;
}

export function ExchangeHistoryChart({ history, rateLabel }: ExchangeHistoryChartProps) {
  if (history.length === 0) {
    return <EmptyView message="No history data is stored for this currency." />;
  }

  return (
    <section className="rounded-app border border-line bg-panel p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Recent exchange-rate trend</h2>
        <p className="text-sm text-muted">
          {rateLabel ?? 'Based on the latest stored business-day rates.'}
        </p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
            <XAxis dataKey="baseDate" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatRate} width={72} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatRate(Number(value))} />
            <Line
              type="monotone"
              dataKey="dealBasR"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
