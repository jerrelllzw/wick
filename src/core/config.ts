import type { BaselineConfig, BurnConfig } from './types';

/**
 * Default burn curve. We lean into an *accelerating* curve (open question #5):
 * the candle melts slowly early in the day and then drops off steeply as usage
 * approaches the personal threshold, emphasising the "danger zone" and matching
 * the app's deliberately punishing tone.
 *
 * With exponent 2 the mapping is simply `burn = (usage / threshold)^2`, e.g. a day
 * at 90% of your average is already ~81% burnt down, while a very light day at 20%
 * is only ~4% burnt — so a close-but-survived day visibly looks far worse than a
 * genuinely light day, as required.
 */
export const DEFAULT_BURN_CONFIG: BurnConfig = {
  curve: 'accelerating',
  exponent: 2,
};

/**
 * Default rolling baseline: a 30-day window, with a short calibration period so a
 * brand-new user is not judged against a meaningless one- or two-day average.
 */
export const DEFAULT_BASELINE_CONFIG: BaselineConfig = {
  windowDays: 30,
  minDaysToCalibrate: 3,
};

/** Absolute-usage threshold (minutes) for the "barely lit" achievement. */
export const LIGHT_DAY_MINUTES = 60;
