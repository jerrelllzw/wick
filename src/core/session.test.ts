import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildDayRecord, candleForToday, withScreenTime } from './session';
import type { BaselineConfig, DayRecord } from './types';

const cfg: BaselineConfig = { windowDays: 30, minDaysToCalibrate: 3 };

function rec(date: string, screenTimeMinutes: number): DayRecord {
  return { date, screenTimeMinutes, baselineMinutes: null, finalized: true };
}

const history = [rec('2026-07-01', 100), rec('2026-07-02', 200), rec('2026-07-03', 300)];

test('buildDayRecord snapshots the baseline from prior history', () => {
  const today = buildDayRecord(history, '2026-07-04', 50, cfg);
  assert.equal(today.baselineMinutes, 200);
  assert.equal(today.screenTimeMinutes, 50);
  assert.equal(today.finalized, false);
});

test('withScreenTime keeps the snapshotted baseline', () => {
  const today = buildDayRecord(history, '2026-07-04', 50, cfg);
  const updated = withScreenTime(today, 130);
  assert.equal(updated.baselineMinutes, 200); // unchanged
  assert.equal(updated.screenTimeMinutes, 130);
});

test('candleForToday composes baseline + evaluation', () => {
  const candle = candleForToday(history, '2026-07-04', 100, { baseline: cfg });
  assert.equal(candle.baselineMinutes, 200);
  assert.equal(candle.status, 'burning');
  assert.ok(Math.abs(candle.burn - 0.25) < 1e-9); // (100/200)^2
});

test('candleForToday is calibrating with too little history', () => {
  const candle = candleForToday(history.slice(0, 2), '2026-07-04', 100, { baseline: cfg });
  assert.equal(candle.status, 'calibrating');
});
