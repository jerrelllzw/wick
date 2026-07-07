import assert from 'node:assert/strict';
import { test } from 'node:test';

import { computeBaseline } from './baseline';
import type { BaselineConfig, DayRecord } from './types';

function rec(date: string, screenTimeMinutes: number, finalized = true): DayRecord {
  return { date, screenTimeMinutes, baselineMinutes: null, finalized };
}

const cfg: BaselineConfig = { windowDays: 30, minDaysToCalibrate: 3 };

test('null during calibration (fewer than min prior days)', () => {
  const history = [rec('2026-07-01', 100), rec('2026-07-02', 200)];
  assert.equal(computeBaseline(history, '2026-07-03', cfg), null);
});

test('mean of prior finalized days once calibrated', () => {
  const history = [
    rec('2026-07-01', 100),
    rec('2026-07-02', 200),
    rec('2026-07-03', 300),
  ];
  assert.equal(computeBaseline(history, '2026-07-04', cfg), 200);
});

test('excludes the target day itself and any future days (non-circular)', () => {
  const history = [
    rec('2026-07-01', 100),
    rec('2026-07-02', 100),
    rec('2026-07-03', 100),
    rec('2026-07-04', 999), // the target day — must not count
    rec('2026-07-05', 999), // future — must not count
  ];
  assert.equal(computeBaseline(history, '2026-07-04', cfg), 100);
});

test('excludes non-finalized days', () => {
  const history = [
    rec('2026-07-01', 100),
    rec('2026-07-02', 100),
    rec('2026-07-03', 100, false), // not finalized -> ignored, drops below min
  ];
  assert.equal(computeBaseline(history, '2026-07-10', cfg), null);
});

test('caps to the most recent windowDays', () => {
  const windowed: BaselineConfig = { windowDays: 2, minDaysToCalibrate: 1 };
  const history = [
    rec('2026-07-01', 10),
    rec('2026-07-02', 20),
    rec('2026-07-03', 30), // most recent two are 20 and 30 -> mean 25
  ];
  assert.equal(computeBaseline(history, '2026-07-04', windowed), 25);
});
