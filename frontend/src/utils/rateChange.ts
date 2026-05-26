export type RateChangeDirection = 'up' | 'down' | 'flat';

export function getRateChangeDirection(changeRate: number): RateChangeDirection {
  if (changeRate > 0) {
    return 'up';
  }
  if (changeRate < 0) {
    return 'down';
  }
  return 'flat';
}

export function getRateChangeLabel(changeRate: number) {
  const direction = getRateChangeDirection(changeRate);
  if (direction === 'up') {
    return '▲ Up';
  }
  if (direction === 'down') {
    return '▼ Down';
  }
  return 'No change';
}
