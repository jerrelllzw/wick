import { LIGHT_DAY_MINUTES } from './config';
import { evaluateCandle, type EvaluateOptions } from './day';
import { daysInMonth, isNextDay, monthKeyOf } from './time';
import type { CandleState, DayKey, DayRecord } from './types';

/** Static metadata for an achievement. */
export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  /** Emoji used as a lightweight glyph in the UI and widget badge. */
  glyph: string;
}

interface AchievementRule extends AchievementDef {
  /**
   * The earliest finalized day at which the achievement first becomes true, or
   * `null` if it has not been earned. Returning the *date* (not just a boolean)
   * lets the UI show when it unlocked and lets the app detect fresh unlocks.
   */
  firstUnlock: (days: readonly CandleState[]) => DayKey | null;
}

/** Earliest day that completes a run of `n` calendar-consecutive surviving days. */
function firstStreakEnd(days: readonly CandleState[], n: number): DayKey | null {
  let run = 0;
  let prev: DayKey | null = null;
  for (const d of days) {
    if (d.status === 'survived') {
      run = prev != null && isNextDay(prev, d.date) ? run + 1 : 1;
    } else {
      run = 0;
    }
    prev = d.date;
    if (run >= n) return d.date;
  }
  return null;
}

/** Earliest fully-covered calendar month in which every day survived (no burnouts). */
function firstFlawlessMonth(days: readonly CandleState[]): DayKey | null {
  const byMonth = new Map<string, CandleState[]>();
  for (const d of days) {
    const m = monthKeyOf(d.date);
    const bucket = byMonth.get(m);
    if (bucket) bucket.push(d);
    else byMonth.set(m, [d]);
  }

  for (const month of [...byMonth.keys()].sort()) {
    const list = byMonth.get(month)!;
    const [year, monthNum] = month.split('-').map(Number);
    const need = daysInMonth(year, monthNum);

    const uniqueDays = new Set(list.map((d) => d.date));
    if (uniqueDays.size !== need) continue; // month not fully covered
    if (list.some((d) => d.status !== 'survived')) continue; // any burnout / gap / calibrating

    return `${month}-${String(need).padStart(2, '0')}`; // unlocks on the month's last day
  }
  return null;
}

/**
 * The curated achievement catalogue. Deliberately small, one-off, and milestone-
 * based — no daily quests, no grind, no streak multipliers (see the design brief).
 */
export const ACHIEVEMENTS: readonly AchievementRule[] = [
  {
    id: 'first-light',
    title: 'First Light',
    description: 'Save your very first candle.',
    glyph: '🕯️',
    firstUnlock: (days) => days.find((d) => d.status === 'survived')?.date ?? null,
  },
  {
    id: 'barely-lit',
    title: 'Barely Lit',
    description: `Under ${LIGHT_DAY_MINUTES} minutes of screen time in a day.`,
    glyph: '🌱',
    firstUnlock: (days) =>
      days.find((d) => d.screenTimeMinutes < LIGHT_DAY_MINUTES)?.date ?? null,
  },
  {
    id: 'tall-candle',
    title: 'Tall Candle',
    description: 'End a day with at least half your candle still standing.',
    glyph: '📏',
    firstUnlock: (days) =>
      days.find((d) => d.status === 'survived' && d.waxRemaining >= 0.5)?.date ?? null,
  },
  {
    id: 'steady-hand',
    title: 'Steady Hand',
    description: 'Three surviving candles in a row.',
    glyph: '🔥',
    firstUnlock: (days) => firstStreakEnd(days, 3),
  },
  {
    id: 'full-week',
    title: 'Full Week',
    description: 'Seven surviving candles in a row.',
    glyph: '📅',
    firstUnlock: (days) => firstStreakEnd(days, 7),
  },
  {
    id: 'untouched-month',
    title: 'Untouched Month',
    description: 'A whole calendar month with no burnouts.',
    glyph: '🌙',
    firstUnlock: firstFlawlessMonth,
  },
];

export interface AchievementProgress {
  def: AchievementDef;
  unlocked: boolean;
  unlockedOn: DayKey | null;
}

function toDef(rule: AchievementRule): AchievementDef {
  return { id: rule.id, title: rule.title, description: rule.description, glyph: rule.glyph };
}

/** Evaluate the whole catalogue against finalized history. */
export function evaluateAchievements(
  history: readonly DayRecord[],
  options: EvaluateOptions = {},
): AchievementProgress[] {
  const days = history
    .filter((r) => r.finalized)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((r) => evaluateCandle(r, options));

  return ACHIEVEMENTS.map((rule) => {
    const unlockedOn = rule.firstUnlock(days);
    return { def: toDef(rule), unlocked: unlockedOn != null, unlockedOn };
  });
}

/**
 * Achievements newly earned relative to a previously-recorded set of unlocked ids.
 * Drives the "surface briefly, don't nag" unlock flow (open question #8).
 */
export function newlyUnlocked(
  previousUnlockedIds: readonly string[],
  current: readonly AchievementProgress[],
): AchievementProgress[] {
  const prev = new Set(previousUnlockedIds);
  return current.filter((a) => a.unlocked && !prev.has(a.def.id));
}
