const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `135` -> `"2h 15m"`, `40` -> `"40m"`, `120` -> `"2h"`. */
export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** `"2026-07-07"` -> `"Jul 7"`. */
export function formatDayKeyShort(key: string): string {
  const [, month, day] = key.split('-').map(Number);
  return `${MONTHS[(month ?? 1) - 1]} ${day}`;
}

/** `"2026-07-07"` -> `"Jul 7, 2026"`. */
export function formatDayKeyLong(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  return `${MONTHS[(month ?? 1) - 1]} ${day}, ${year}`;
}
