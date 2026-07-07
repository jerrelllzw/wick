import { addDays, dateFromDayKey, dayKeyFromDate, type DayKey } from '@/core';

import type { DailyMinutes, PermissionStatus, ScreenTimeProvider, ScreenTimeReading } from './types';

/** Deterministic pseudo-random value in [0, 1) from a string seed (FNV-1a). */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** A plausible, stable daily total (minutes) for a given day — deterministic per date. */
function minutesForDay(date: DayKey): number {
  const base = 175;
  const noise = (hash01(date) - 0.5) * 150; // ±75
  const dow = dateFromDayKey(date).getDay();
  const weekend = dow === 0 || dow === 6 ? 45 : 0;
  return Math.max(20, Math.round(base + noise + weekend));
}

/**
 * The development/demo source. Always "granted", generates a lived-in 40-day history
 * so the baseline and stats grid are populated, and grows today's number in step with
 * the wall clock so the candle visibly melts through the day.
 */
export function createMockProvider(): ScreenTimeProvider {
  return {
    kind: 'mock',
    isSupported: () => true,
    async getPermissionStatus(): Promise<PermissionStatus> {
      return 'granted';
    },
    async requestAuthorization(): Promise<PermissionStatus> {
      return 'granted';
    },
    async read(): Promise<ScreenTimeReading> {
      const now = new Date();
      const today = dayKeyFromDate(now);
      const fractionOfDay = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
      const todayMinutes = Math.round(minutesForDay(today) * Math.min(1, fractionOfDay + 0.05));

      const history: DailyMinutes[] = [];
      for (let i = 40; i >= 1; i -= 1) {
        const date = addDays(today, -i);
        history.push({ date, minutes: minutesForDay(date) });
      }

      return { todayMinutes, history, capturedAt: now.getTime() };
    },
  };
}
