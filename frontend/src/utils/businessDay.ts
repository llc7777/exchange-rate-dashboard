export function isWeekend(dateValue: string) {
  if (!dateValue) {
    return false;
  }
  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
}
