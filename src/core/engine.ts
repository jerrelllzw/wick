import { evaluateAchievements, newlyUnlocked, type AchievementProgress } from './achievements';
import { computeBaseline } from './baseline';
import { evaluateCandle } from './day';
import { compareDayKey } from './time';
import type { BaselineConfig, BurnConfig, CandleState, DayKey, DayRecord } from './types';

/**
 * The minimal persisted state the engine owns: the day history keyed by date, plus
 * the set of achievement ids already unlocked (so we can tell when a new one lands).
 * Settings and the raw screen-time source live in the data layer, not here.
 */
export interface EngineState {
  days: Record<DayKey, DayRecord>;
  unlockedAchievementIds: string[];
}

export const EMPTY_ENGINE_STATE: EngineState = { days: {}, unlockedAchievementIds: [] };

export interface EngineOptions {
  burn?: BurnConfig;
  baseline?: BaselineConfig;
  /**
   * When true, set today's screen time to exactly the given value instead of the
   * default monotonic max. Used for manual corrections; the passive device/mock
   * path leaves it false so a flaky low reading can never "un-burn" the candle.
   */
  exact?: boolean;
}

export interface AdvanceResult {
  state: EngineState;
  /** The freshly evaluated candle for `today`. */
  today: CandleState;
  /** Achievements that unlocked on this advance (empty on repeat calls). */
  newlyUnlocked: AchievementProgress[];
}

/** History as a chronologically sorted array. */
export function historyArray(state: EngineState): DayRecord[] {
  return Object.values(state.days).sort((a, b) => compareDayKey(a.date, b.date));
}

/**
 * The single state transition of the app. Given the current state, the current
 * local day, and the latest cumulative screen-time reading, it:
 *   1. finalizes any past days left open (e.g. the app was closed over midnight),
 *   2. ensures today's record exists with its baseline snapshotted exactly once,
 *   3. folds in the new reading,
 *   4. recomputes achievements over finalized history and reports fresh unlocks.
 *
 * Pure and deterministic: no clocks, no storage, no side effects — `today` and the
 * reading are passed in, which is what makes the whole app engine unit-testable.
 */
export function advance(
  state: EngineState,
  today: DayKey,
  screenTimeMinutes: number,
  options: EngineOptions = {},
): AdvanceResult {
  const days: Record<DayKey, DayRecord> = { ...state.days };

  // 1. Finalize past days still marked open.
  for (const key of Object.keys(days)) {
    if (compareDayKey(key, today) < 0 && !days[key].finalized) {
      days[key] = { ...days[key], finalized: true };
    }
  }

  // 2 & 3. Ensure today's record and fold in the reading.
  const reading = Math.max(0, screenTimeMinutes);
  const existing = days[today];
  if (!existing) {
    // `days` does not yet contain today, so this is exactly the prior finalized history.
    days[today] = {
      date: today,
      screenTimeMinutes: reading,
      baselineMinutes: computeBaseline(Object.values(days), today, options.baseline),
      finalized: false,
    };
  } else {
    const screenTimeMinutesNext = options.exact
      ? reading
      : Math.max(existing.screenTimeMinutes, reading);
    days[today] = { ...existing, screenTimeMinutes: screenTimeMinutesNext };
  }

  // 4. Achievements over finalized history only (today counts once it finalizes).
  const finalized = Object.values(days).filter((r) => r.finalized);
  const progress = evaluateAchievements(finalized, { burn: options.burn });
  const fresh = newlyUnlocked(state.unlockedAchievementIds, progress);
  const unlockedAchievementIds = progress.filter((p) => p.unlocked).map((p) => p.def.id);

  return {
    state: { days, unlockedAchievementIds },
    today: evaluateCandle(days[today], { burn: options.burn }),
    newlyUnlocked: fresh,
  };
}
