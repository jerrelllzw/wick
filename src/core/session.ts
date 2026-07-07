import { computeBaseline } from './baseline';
import { evaluateCandle, type EvaluateOptions } from './day';
import type { BaselineConfig, CandleState, DayKey, DayRecord } from './types';

export interface TodayOptions extends EvaluateOptions {
  baseline?: BaselineConfig;
}

/**
 * Build today's (non-finalized) record by snapshotting the baseline from history.
 * Call this once at day rollover; persist the result so the baseline stays fixed
 * for the rest of the day even as new history accrues.
 */
export function buildDayRecord(
  history: readonly DayRecord[],
  date: DayKey,
  screenTimeMinutes: number,
  baselineConfig?: BaselineConfig,
): DayRecord {
  return {
    date,
    screenTimeMinutes: Math.max(0, screenTimeMinutes),
    baselineMinutes: computeBaseline(history, date, baselineConfig),
    finalized: false,
  };
}

/**
 * Update an existing (non-finalized) record with a fresh live screen-time reading,
 * keeping the already-snapshotted baseline. This is the hot path the app and the
 * widget refresh use many times per day.
 */
export function withScreenTime(record: DayRecord, screenTimeMinutes: number): DayRecord {
  return { ...record, screenTimeMinutes: Math.max(0, screenTimeMinutes) };
}

/** Convenience: snapshot today's baseline and evaluate its candle in one call. */
export function candleForToday(
  history: readonly DayRecord[],
  date: DayKey,
  screenTimeMinutes: number,
  options: TodayOptions = {},
): CandleState {
  const record = buildDayRecord(history, date, screenTimeMinutes, options.baseline);
  return evaluateCandle(record, options);
}
