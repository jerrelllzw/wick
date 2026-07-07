import { DEFAULT_BASELINE_CONFIG } from './config';
import { compareDayKey } from './time';
import type { BaselineConfig, DayKey, DayRecord } from './types';

/**
 * The rolling baseline (personal threshold) for `targetDate`: the mean daily
 * screen time over the most-recent finalized days strictly *before* `targetDate`,
 * capped at `windowDays`.
 *
 * Two deliberate properties:
 * 1. Only *prior* finalized days count, so a day is never measured against itself —
 *    the threshold is non-circular.
 * 2. Below `minDaysToCalibrate` prior days it returns `null`; the caller treats that
 *    as the calibration period, during which the candle cannot burn out.
 */
export function computeBaseline(
  history: readonly DayRecord[],
  targetDate: DayKey,
  config: BaselineConfig = DEFAULT_BASELINE_CONFIG,
): number | null {
  const prior = history
    .filter((r) => r.finalized && compareDayKey(r.date, targetDate) < 0)
    .sort((a, b) => compareDayKey(b.date, a.date)) // most-recent first
    .slice(0, config.windowDays);

  if (prior.length < config.minDaysToCalibrate) return null;

  const sum = prior.reduce((acc, r) => acc + Math.max(0, r.screenTimeMinutes), 0);
  return sum / prior.length;
}
