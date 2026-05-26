import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { getKoreanPublicHolidayMap } from '../../../api/holidayApi';
import { BusinessDatePicker } from '../BusinessDatePicker';

vi.mock('../../../api/holidayApi', () => ({
  getKoreanPublicHolidayMap: vi.fn(),
}));

describe('BusinessDatePicker', () => {
  it('blocks Korean public holidays and weekends', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.mocked(getKoreanPublicHolidayMap).mockResolvedValue({
      '2026-05-01': {
        date: '2026-05-01',
        localName: 'Labor Day',
        name: 'Labour Day',
        countryCode: 'KR',
        fixed: false,
        global: true,
        counties: null,
        launchYear: null,
        types: ['Public'],
      },
    });

    render(
      <BusinessDatePicker value="2026-05-04" maxDate="2026-05-20" onChange={onChange} />,
    );

    const holidayButton = await screen.findByRole('button', {
      name: '2026-05-01 unavailable: Labour Day',
    });
    expect(holidayButton).toBeDisabled();
    expect(screen.getByRole('button', { name: '2026-05-02 unavailable: Weekend' })).toBeDisabled();

    await waitFor(() => expect(getKoreanPublicHolidayMap).toHaveBeenCalledWith(2026));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('April 2026')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('May 2026')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Select 2026-05-06' }));
    expect(onChange).toHaveBeenCalledWith('2026-05-06');
  });
});
