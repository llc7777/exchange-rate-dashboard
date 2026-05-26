import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { ExchangeRate } from '../../../types/exchange';
import { ExchangeRateBar } from '../ExchangeRateBar';

function rate(changeRate: number, changeAmount = 1): ExchangeRate {
  return {
    id: 1,
    curUnit: 'USD',
    normalizedCurUnit: 'USD',
    curName: 'United States Dollar',
    ttb: 1340,
    tts: 1360,
    dealBasR: 1350,
    bkpr: 1350,
    yyEfeeR: 0,
    tenDdEfeeR: 0,
    kftcDealBasR: 1350,
    kftcBkpr: 1350,
    baseDate: '2026-05-24',
    changeAmount,
    changeRate,
    favorite: false,
  };
}

describe('ExchangeRateBar', () => {
  it('renders currency information', () => {
    render(
      <MemoryRouter>
        <ExchangeRateBar rate={rate(0)} onToggleFavorite={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('USD').length).toBeGreaterThan(0);
    expect(screen.getByText('United States Dollar')).toBeInTheDocument();
    expect(screen.getByText('1,350')).toBeInTheDocument();
  });

  it('renders up, down, and flat badges', () => {
    const { rerender } = render(
      <MemoryRouter>
        <ExchangeRateBar rate={rate(0.2)} onToggleFavorite={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('▲ Up')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ExchangeRateBar rate={rate(-0.2, -1)} onToggleFavorite={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('▼ Down')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ExchangeRateBar rate={rate(0, 0)} onToggleFavorite={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText('No change')).toBeInTheDocument();
  });

  it('calls favorite click handler', async () => {
    const user = userEvent.setup();
    const onToggleFavorite = vi.fn();
    render(
      <MemoryRouter>
        <ExchangeRateBar rate={rate(0)} onToggleFavorite={onToggleFavorite} />
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText('Add to favorites'));

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('calls detail navigation handler when the bar is clicked', async () => {
    const user = userEvent.setup();
    const onOpenDetail = vi.fn();
    render(
      <MemoryRouter>
        <ExchangeRateBar
          rate={rate(0)}
          onToggleFavorite={vi.fn()}
          onOpenDetail={onOpenDetail}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Open USD detail' }));

    expect(onOpenDetail).toHaveBeenCalledWith('USD');
  });
});
