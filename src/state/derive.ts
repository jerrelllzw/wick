import { computeBaseline, type BaselineConfig, type DayKey, type EngineState } from '@/core';
import type { PersistedState } from '@/data';
import type { DailyMinutes } from '@/screentime';

/** Project the persisted document down to just what the engine operates on. */
export function toEngineState(p: PersistedState): EngineState {
  return { days: p.days, unlockedAchievementIds: p.unlockedAchievementIds };
}

/** Fold an engine result (and updated unlock dates) back into the persisted document. */
export function applyEngineState(
  p: PersistedState,
  engine: EngineState,
  achievementUnlockedOn: Record<string, DayKey>,
): PersistedState {
  return {
    ...p,
    days: engine.days,
    unlockedAchievementIds: engine.unlockedAchievementIds,
    achievementUnlockedOn,
  };
}

/**
 * Back-fill finalized history from a provider reading, reconstructing each day's
 * baseline as it would have been at the time (a chronological pass). Never overwrites
 * a day already in state, so real tracked days always win over back-filled ones. This
 * is what lets the mock source present a lived-in grid immediately, and lets the
 * Android provider warm the baseline from its ~7 days of lookback.
 */
export function seedHistory(
  engine: EngineState,
  history: DailyMinutes[] | undefined,
  baselineConfig: BaselineConfig,
): EngineState {
  if (!history?.length) return engine;
  const days = { ...engine.days };
  const sorted = [...history].sort((a, b) => (a.date < b.date ? -1 : 1));
  for (const h of sorted) {
    if (days[h.date]) continue;
    days[h.date] = {
      date: h.date,
      screenTimeMinutes: Math.max(0, h.minutes),
      baselineMinutes: computeBaseline(Object.values(days), h.date, baselineConfig),
      finalized: true,
    };
  }
  return { ...engine, days };
}
