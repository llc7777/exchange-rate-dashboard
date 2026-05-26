export function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return value;
}

export function sortByBaseDateAsc<T extends { baseDate: string }>(items: T[]) {
  return [...items].sort((left, right) => left.baseDate.localeCompare(right.baseDate));
}
