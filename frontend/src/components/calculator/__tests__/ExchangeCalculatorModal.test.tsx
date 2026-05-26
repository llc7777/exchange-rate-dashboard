import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { calculateExchangeRate } from '../../../api/exchangeRateApi';
import { ExchangeCalculatorModal } from '../ExchangeCalculatorModal';
import type { ExchangeRate } from '../../../types/exchange';

vi.mock('../../../api/exchangeRateApi', () => ({
  calculateExchangeRate: vi.fn(),
}));

function rate(code: string): ExchangeRate {
  return {
    id: 1,
    curUnit: code,
    normalizedCurUnit: code,
    curName: code,
    ttb: 1,
    tts: 1,
    dealBasR: 1000,
    bkpr: 1000,
    yyEfeeR: 0,
    tenDdEfeeR: 0,
    kftcDealBasR: 1000,
    kftcBkpr: 1000,
    baseDate: '2026-05-24',
    changeAmount: 0,
    changeRate: 0,
    favorite: false,
  };
}

describe('ExchangeCalculatorModal', () => {
  it('validates zero amount', async () => {
    const user = userEvent.setup();
    render(<ExchangeCalculatorModal open rates={[rate('USD')]} onClose={vi.fn()} />);

    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '0');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByText('Amount must be greater than zero.')).toBeInTheDocument();
  });

  it('calls calculate API and renders result', async () => {
    const user = userEvent.setup();
    vi.mocked(calculateExchangeRate).mockResolvedValue({
      fromCurrency: 'USD',
      toCurrency: 'KRW',
      amount: 100,
      convertedAmount: 136015,
      appliedRate: 1360.15,
    });

    render(<ExchangeCalculatorModal open rates={[rate('USD')]} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(calculateExchangeRate).toHaveBeenCalledWith({
      fromCurrency: 'USD',
      toCurrency: 'KRW',
      amount: 100,
    });
    expect(await screen.findByText('136,015 KRW')).toBeInTheDocument();
  });

  it('selects source and target currencies', async () => {
    const user = userEvent.setup();
    render(<ExchangeCalculatorModal open rates={[rate('USD'), rate('JPY')]} onClose={vi.fn()} />);

    await user.click(screen.getByLabelText('Swap currencies'));

    expect(screen.getByText('KRW')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });
});
