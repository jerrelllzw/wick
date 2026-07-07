import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ACHIEVEMENTS,
  evaluateAchievements,
  newlyUnlocked,
  type AchievementProgress,
} from './achievements';
import type { DayRecord } from './types';

function day(date: string, screenTimeMinutes: number, baselineMinutes: number | null): DayRecord {
  return { date, screenTimeMinutes, baselineMinutes, finalized: true };
}

function byId(list: AchievementProgress[], id: string): AchievementProgress {
  const found = list.find((a) => a.def.id === id);
  assert.ok(found, `missing achievement ${id}`);
  return found;
}

function fullMonth(month: string, count: number, screenTime: number, baseline: number): DayRecord[] {
  return Array.from({ length: count }, (_, i) =>
    day(`${month}-${String(i + 1).padStart(2, '0')}`, screenTime, baseline),
  );
}

test('catalogue exposes stable, unique ids', () => {
  const ids = ACHIEVEMENTS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('first-light unlocks on the first surviving day', () => {
  const history = [day('2026-07-01', 300, 240), day('2026-07-02', 100, 240)];
  const res = evaluateAchievements(history);
  assert.equal(byId(res, 'first-light').unlockedOn, '2026-07-02');
});

test('barely-lit unlocks under an hour of usage', () => {
  const history = [day('2026-07-01', 45, 240)];
  assert.equal(byId(evaluateAchievements(history), 'barely-lit').unlocked, true);

  const heavier = [day('2026-07-01', 90, 240)];
  assert.equal(byId(evaluateAchievements(heavier), 'barely-lit').unlocked, false);
});

test('tall-candle needs at least half the candle left', () => {
  // ratio 0.5 -> burn 0.25 -> wax 0.75 (>= 0.5)
  const good = [day('2026-07-01', 120, 240)];
  assert.equal(byId(evaluateAchievements(good), 'tall-candle').unlocked, true);
  // ratio 0.9 -> wax ~0.19 (< 0.5), still survived but not tall
  const skinny = [day('2026-07-01', 216, 240)];
  assert.equal(byId(evaluateAchievements(skinny), 'tall-candle').unlocked, false);
});

test('steady-hand needs three consecutive surviving days', () => {
  const streak = [
    day('2026-07-07', 100, 240),
    day('2026-07-08', 100, 240),
    day('2026-07-09', 100, 240),
  ];
  assert.equal(byId(evaluateAchievements(streak), 'steady-hand').unlockedOn, '2026-07-09');

  const brokenByGap = [
    day('2026-07-07', 100, 240),
    day('2026-07-08', 100, 240),
    day('2026-07-10', 100, 240), // gap on the 9th
  ];
  assert.equal(byId(evaluateAchievements(brokenByGap), 'steady-hand').unlocked, false);

  const brokenByBurnout = [
    day('2026-07-07', 100, 240),
    day('2026-07-08', 300, 240), // burnt out
    day('2026-07-09', 100, 240),
  ];
  assert.equal(byId(evaluateAchievements(brokenByBurnout), 'steady-hand').unlocked, false);
});

test('untouched-month needs full coverage with no burnouts', () => {
  const feb = fullMonth('2026-02', 28, 100, 240); // 2026 is not a leap year
  assert.equal(byId(evaluateAchievements(feb), 'untouched-month').unlockedOn, '2026-02-28');

  const withBurnout = fullMonth('2026-02', 28, 100, 240);
  withBurnout[10] = day('2026-02-11', 300, 240);
  assert.equal(byId(evaluateAchievements(withBurnout), 'untouched-month').unlocked, false);

  const partial = fullMonth('2026-02', 27, 100, 240); // missing the 28th
  assert.equal(byId(evaluateAchievements(partial), 'untouched-month').unlocked, false);
});

test('calibrating (baseline-less) days never satisfy survival achievements', () => {
  const history = [
    day('2026-07-07', 10, null),
    day('2026-07-08', 10, null),
    day('2026-07-09', 10, null),
  ];
  const res = evaluateAchievements(history);
  assert.equal(byId(res, 'first-light').unlocked, false);
  assert.equal(byId(res, 'steady-hand').unlocked, false);
  // ...but barely-lit is about absolute usage, so it still counts.
  assert.equal(byId(res, 'barely-lit').unlocked, true);
});

test('newlyUnlocked diffs against previously-known ids', () => {
  const current = evaluateAchievements([day('2026-07-01', 45, 240)]);
  const fresh = newlyUnlocked(['first-light'], current);
  const freshIds = fresh.map((a) => a.def.id);
  assert.ok(freshIds.includes('barely-lit'));
  assert.ok(!freshIds.includes('first-light')); // already known
});
