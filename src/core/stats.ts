import { evaluateCandle, type EvaluateOptions } from './day';
import { isNextDay } from './time';
import type { CandleState, DayRecord } from './types';

export interface HistoryStats {
  /** Finalized days that had a real baseline (i.e. survived or burnt out). */
  measuredDays: number;
  survivedDays: number;
  burntOutDays: number;
  /** Finalized days still within the calibration period (no baseline). */
  calibratingDays: number;
  /** survivedDays / measuredDays, in [0, 1]. 0 when there are no measured days. */
  survivalRate: number;
  /** Consecutive surviving days ending at the most recent measured day. */
  currentStreak: number;
  /** Longest run of consecutive surviving days ever. */
  longestStreak: number;
  /** Largest single-day margin under threshold, in minutes (the "tallest candle"). */
  bestMarginMinutes: number | null;
  /** Mean screen time across measured days, in minutes. */
  averageScreenTimeMinutes: number | null;
}

/** Sort finalized history ascending and evaluate each day's candle. */
export function evaluatedHistory(
  history: readonly DayRecord[],
  options: EvaluateOptions = {},
): CandleState[] {
  return history
    .filter((r) => r.finalized)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((r) => evaluateCandle(r, options));
}

/**
 * Aggregate stats for the history/stats screen and the relative-leaderboard metric.
 * `survivalRate` is exactly the "% of days your candle survived vs. your own rolling
 * average" measure the relative leaderboard is meant to rank on (open question #7),
 * so no per-app-category data is needed to make it fair.
 */
export function computeStats(
  history: readonly DayRecord[],
  options: EvaluateOptions = {},
): HistoryStats {
  const days = evaluatedHistory(history, options);

  let survivedDays = 0;
  let burntOutDays = 0;
  let calibratingDays = 0;
  let measuredScreenTimeSum = 0;
  let bestMarginMinutes: number | null = null;

  let longestStreak = 0;
  let run = 0;
  let prev: string | null = null;

  for (const d of days) {
    if (d.status === 'calibrating') {
      calibratingDays += 1;
    } else {
      measuredScreenTimeSum += d.screenTimeMinutes;
      if (d.status === 'survived') {
        survivedDays += 1;
        if (d.marginMinutes != null && (bestMarginMinutes == null || d.marginMinutes > bestMarginMinutes)) {
          bestMarginMinutes = d.marginMinutes;
        }
      } else if (d.status === 'burntOut') {
        burntOutDays += 1;
      }
    }

    if (d.status === 'survived') {
      run = prev != null && isNextDay(prev, d.date) ? run + 1 : 1;
    } else {
      run = 0;
    }
    prev = d.date;
    if (run > longestStreak) longestStreak = run;
  }

  const measuredDays = survivedDays + burntOutDays;

  // Current streak: walk backwards from the latest measured day.
  const measured = days.filter((d) => d.status !== 'calibrating');
  let currentStreak = 0;
  for (let i = measured.length - 1; i >= 0; i -= 1) {
    const d = measured[i];
    if (d.status !== 'survived') break;
    const next = measured[i + 1];
    if (next && !isNextDay(d.date, next.date)) break;
    currentStreak += 1;
  }

  return {
    measuredDays,
    survivedDays,
    burntOutDays,
    calibratingDays,
    survivalRate: measuredDays === 0 ? 0 : survivedDays / measuredDays,
    currentStreak,
    longestStreak,
    bestMarginMinutes,
    averageScreenTimeMinutes: measuredDays === 0 ? null : measuredScreenTimeSum / measuredDays,
  };
}
