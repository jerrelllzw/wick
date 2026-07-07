import type { DayKey } from './types';

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDayKey(value: string): value is DayKey {
  return DAY_KEY_RE.test(value);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Local-calendar day key for a `Date`, using the host's local timezone. Day
 * boundaries are local midnight, matching the prompt's "day ends (midnight)" rule.
 */
export function dayKeyFromDate(date: Date): DayKey {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function partsFromDayKey(key: DayKey): { year: number; month: number; day: number } {
  const [year, month, day] = key.split('-').map(Number);
  return { year, month, day };
}

/** A `Date` at local midnight for the given day key. */
export function dateFromDayKey(key: DayKey): Date {
  const { year, month, day } = partsFromDayKey(key);
  return new Date(year, month - 1, day);
}

/** Add (or subtract, with a negative delta) whole days, returning a new key. */
export function addDays(key: DayKey, delta: number): DayKey {
  const d = dateFromDayKey(key);
  d.setDate(d.getDate() + delta);
  return dayKeyFromDate(d);
}

/** -1 / 0 / 1 chronological ordering of two day keys. */
export function compareDayKey(a: DayKey, b: DayKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** True when `b` is exactly the calendar day after `a`. */
export function isNextDay(a: DayKey, b: DayKey): boolean {
  return addDays(a, 1) === b;
}

/** The `YYYY-MM` month bucket a day key belongs to. */
export function monthKeyOf(key: DayKey): string {
  return key.slice(0, 7);
}

/** Number of calendar days in a month. `month` is 1-12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Inclusive list of day keys from `start` to `end`. Returns `[]` when `end` is
 * before `start`. Useful for filling gaps in a stats grid.
 */
export function dayKeyRange(start: DayKey, end: DayKey): DayKey[] {
  const out: DayKey[] = [];
  let cursor = start;
  while (compareDayKey(cursor, end) <= 0) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}
