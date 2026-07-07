/**
 * Core domain types for wick.
 *
 * This module (and everything else under `src/core`) is PURE: it must not import
 * React, React Native, Expo, or any native module. That keeps the burn/baseline/
 * achievement logic trivially unit-testable in plain Node (see the *.test.ts files)
 * and reusable from the app UI, the background refresh task, and the widgets.
 */

/** Minutes of screen time. Always treated as a non-negative number. */
export type Minutes = number;

/** A local calendar day, formatted `YYYY-MM-DD`. Lexical order == chronological order. */
export type DayKey = string;

/**
 * The lifecycle state of a single day's candle.
 * - `calibrating` — not enough prior history to set a real threshold yet.
 * - `burning`     — today, in progress, still under the threshold.
 * - `survived`    — a finalized day that ended under the threshold (the "win").
 * - `burntOut`    — usage reached/exceeded the threshold; locked out for the day.
 */
export type CandleStatus = 'calibrating' | 'burning' | 'survived' | 'burntOut';

/** Shape of the burn curve mapping usage → how much wax has melted. */
export type BurnCurve = 'linear' | 'accelerating';

export interface BurnConfig {
  curve: BurnCurve;
  /**
   * Exponent used by the `accelerating` curve. Values > 1 make the candle burn
   * slowly at first and then steeply as usage nears the threshold — the intended
   * "danger zone" drop-off. Ignored by the `linear` curve.
   */
  exponent: number;
}

export interface BaselineConfig {
  /** Length of the rolling window, in days (the prompt specifies 30). */
  windowDays: number;
  /**
   * Minimum number of finalized prior days required before a real threshold is
   * computed. Below this the day is `calibrating` and cannot burn out.
   */
  minDaysToCalibrate: number;
}

/**
 * A single day's tracked usage. This is the persisted unit of history.
 * `screenTimeMinutes` is a live cumulative value while the day is today, and the
 * final total once `finalized` flips true (at the next local midnight).
 */
export interface DayRecord {
  date: DayKey;
  screenTimeMinutes: Minutes;
  /**
   * The threshold snapshotted at the start of this day. `null` during calibration.
   * Snapshotting (rather than recomputing against ever-changing history) is what
   * makes a finalized candle reproducible forever.
   */
  baselineMinutes: Minutes | null;
  /** True once the day is complete (local midnight passed). */
  finalized: boolean;
}

/**
 * Derived, presentational candle state for a day. Never persisted — always
 * recomputed from a `DayRecord` via {@link evaluateCandle} so there is a single
 * source of truth for how a record looks.
 */
export interface CandleState {
  date: DayKey;
  status: CandleStatus;
  /** Fraction of the candle burned away: 0 = full, 1 = burnt out. */
  burn: number;
  /** Convenience: `1 - burn`. */
  waxRemaining: number;
  screenTimeMinutes: Minutes;
  baselineMinutes: Minutes | null;
  /** `baseline - screenTime`; positive = under threshold. `null` while calibrating. */
  marginMinutes: Minutes | null;
  /** `max(0, screenTime - baseline)`; 0 unless over. `null` while calibrating. */
  overByMinutes: Minutes | null;
}
