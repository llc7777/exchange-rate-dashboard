import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buyCurrency, getExchangeRateForBuy } from '../../../api/portfolioApi';
import { getKoreanPublicHolidayMap } from '../../../api/holidayApi';
import { BuyModal } from '../BuyModal';

vi.mock('../../../api/portfolioApi', () => ({
  buyCurrency: vi.fn(),
  getExchangeRateForBuy: vi.fn(),
}));

vi.mock('../../../api/holidayApi', () => ({
  getKoreanPublicHolidayMap: vi.fn(),
}));

describe('BuyModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-05-20T00:00:00Z'));
    vi.mocked(getKoreanPublicHolidayMap).mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('loads a readonly stored rate and sends a buy body without exchangeRate', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.mocked(getExchangeRateForBuy).mockResolvedValue({
      curUnit: 'USD',
      normalizedCurUnit: 'USD',
      curName: 'United States Dollar',
      baseDate: '2026-05-20',
      dealBasR: 1000,
      unitFactor: 1,
    });
    vi.mocked(buyCurrency).mockResolvedValue({} as never);
    const onSuccess = vi.fn();

    render(
      <BuyModal
        open
        portfolioId={7}
        targetCurrency="USD"
        targetCurrencyName="United States Dollar"
        investmentCurrency="KRW"
        cashBalance={200000}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    expect(screen.queryByLabelText('Exchange rate')).not.toBeInTheDocument();

    await waitFor(() => expect(getExchangeRateForBuy).toHaveBeenCalledWith('USD', '2026-05-20'));
    expect(screen.getByText(/Applied rate:/)).toBeInTheDocument();
    expect(screen.getByText(/1,000 KRW per 1 USD/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('USD amount'), '100');
    expect(screen.getByText('100,000 KRW')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Buy' }));

    await waitFor(() => expect(buyCurrency).toHaveBeenCalled());
    expect(buyCurrency).toHaveBeenCalledWith({
      portfolioId: 7,
      curUnit: 'USD',
      transactionDate: '2026-05-20',
      foreignAmount: 100,
      memo: null,
    });
    expect(vi.mocked(buyCurrency).mock.calls[0][0]).not.toHaveProperty('exchangeRate');
  });
});
