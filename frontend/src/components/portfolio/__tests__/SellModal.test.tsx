import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { getExchangeRateForSell, sellCurrency } from '../../../api/portfolioApi';
import type { PortfolioPosition } from '../../../types/portfolio';
import { SellModal } from '../SellModal';

vi.mock('../../../api/portfolioApi', () => ({
  getExchangeRateForSell: vi.fn(),
  sellCurrency: vi.fn(),
}));

const position: PortfolioPosition = {
  investmentCurrency: 'KRW',
  curUnit: 'USD',
  normalizedCurUnit: 'USD',
  curName: 'United States Dollar',
  holdingForeignAmount: 100,
  averageBuyRate: 900,
  investedCost: 90000,
  currentRate: 1000,
  currentValue: 100000,
  profitLoss: 10000,
  profitLossRate: 11.11,
  changeStatus: 'UP',
  baseDate: '2026-05-22',
};

describe('SellModal', () => {
  it('loads the latest stored rate and sends a sell body without exchangeRate or transactionDate', async () => {
    const user = userEvent.setup();
    vi.mocked(getExchangeRateForSell).mockResolvedValue({
      curUnit: 'USD',
      normalizedCurUnit: 'USD',
      curName: 'United States Dollar',
      baseDate: '2026-05-22',
      dealBasR: 1000,
      unitFactor: 1,
    });
    vi.mocked(sellCurrency).mockResolvedValue({} as never);

    render(
      <SellModal
        open
        portfolioId={7}
        investmentCurrency="KRW"
        position={position}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => expect(getExchangeRateForSell).toHaveBeenCalledWith('USD'));
    expect(screen.queryByLabelText('Transaction date')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Exchange rate')).not.toBeInTheDocument();
    expect(screen.getByText(/Latest rate date:/)).toBeInTheDocument();
    expect(screen.getByText(/Applied rate:/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('USD amount'), '50');
    await user.click(screen.getByRole('button', { name: 'Sell' }));

    await waitFor(() => expect(sellCurrency).toHaveBeenCalled());
    expect(sellCurrency).toHaveBeenCalledWith({
      portfolioId: 7,
      curUnit: 'USD',
      foreignAmount: 50,
      memo: null,
    });
    expect(vi.mocked(sellCurrency).mock.calls[0][0]).not.toHaveProperty('exchangeRate');
    expect(vi.mocked(sellCurrency).mock.calls[0][0]).not.toHaveProperty('transactionDate');
  });
});
