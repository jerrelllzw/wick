import assert from 'node:assert/strict';
import { test } from 'node:test';

import { computeStats } from './stats';
import type { DayRecord } from './types';

function day(date: string, screenTimeMinutes: number, baselineMinutes: number | null): DayRecord {
  return { date, screenTimeMinutes, baselineMinutes, finalized: true };
}

const history = [
  day('2026-07-01', 100, null), // calibrating
  day('2026-07-02', 120, 240), // survived, margin 120
  day('2026-07-03', 60, 240), // survived, margin 180 (best)
  day('2026-07-04', 300, 240), // burnt out
  day('2026-07-05', 120, 240), // survived
  day('2026-07-06', 100, 240), // survived
];

test('counts, survival rate and averages', () => {
  const s = computeStats(history);
  assert.equal(s.measuredDays, 5);
  assert.equal(s.survivedDays, 4);
  assert.equal(s.burntOutDays, 1);
  assert.equal(s.calibratingDays, 1);
  assert.ok(Math.abs(s.survivalRate - 0.8) < 1e-9);
  assert.equal(s.bestMarginMinutes, 180);
  assert.equal(s.averageScreenTimeMinutes, 140); // (120+60+300+120+100)/5
});

test('streaks respect burnout breaks and calendar gaps', () => {
  const s = computeStats(history);
  assert.equal(s.longestStreak, 2); // 02-03 and 05-06
  assert.equal(s.currentStreak, 2); // 05-06 up to the latest day
});

test('current streak is zero when the latest measured day burnt out', () => {
  const ending = [...history, day('2026-07-07', 500, 240)];
  assert.equal(computeStats(ending).currentStreak, 0);
});

test('empty history is well-defined', () => {
  const s = computeStats([]);
  assert.equal(s.measuredDays, 0);
  assert.equal(s.survivalRate, 0);
  assert.equal(s.currentStreak, 0);
  assert.equal(s.bestMarginMinutes, null);
  assert.equal(s.averageScreenTimeMinutes, null);
});
