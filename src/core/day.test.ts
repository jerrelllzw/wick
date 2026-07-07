import assert from 'node:assert/strict';
import { test } from 'node:test';

import { evaluateCandle } from './day';
import type { DayRecord } from './types';

function rec(
  screenTimeMinutes: number,
  baselineMinutes: number | null,
  finalized: boolean,
): DayRecord {
  return { date: '2026-07-07', screenTimeMinutes, baselineMinutes, finalized };
}

test('calibrating when there is no baseline', () => {
  const c = evaluateCandle(rec(500, null, false));
  assert.equal(c.status, 'calibrating');
  assert.equal(c.burn, 0);
  assert.equal(c.waxRemaining, 1);
  assert.equal(c.marginMinutes, null);
  assert.equal(c.overByMinutes, null);
});

test('burning while today and under threshold', () => {
  const c = evaluateCandle(rec(60, 240, false)); // ratio 0.25
  assert.equal(c.status, 'burning');
  assert.ok(Math.abs(c.burn - 0.0625) < 1e-9); // 0.25^2
  assert.equal(c.marginMinutes, 180);
  assert.equal(c.overByMinutes, 0);
});

test('survived when finalized and under threshold', () => {
  const c = evaluateCandle(rec(120, 240, true)); // ratio 0.5
  assert.equal(c.status, 'survived');
  assert.ok(Math.abs(c.burn - 0.25) < 1e-9);
  assert.equal(c.waxRemaining, 0.75);
});

test('burnt out at the threshold and locked regardless of finalized', () => {
  const live = evaluateCandle(rec(240, 240, false)); // ratio 1.0, still today
  assert.equal(live.status, 'burntOut');
  assert.equal(live.burn, 1);
  assert.equal(live.overByMinutes, 0);

  const over = evaluateCandle(rec(300, 240, true)); // ratio 1.25
  assert.equal(over.status, 'burntOut');
  assert.equal(over.burn, 1);
  assert.equal(over.overByMinutes, 60);
  assert.equal(over.marginMinutes, -60);
});

test('negative screen time is clamped to zero', () => {
  const c = evaluateCandle(rec(-10, 240, false));
  assert.equal(c.screenTimeMinutes, 0);
  assert.equal(c.burn, 0);
});

test('a close-but-under finalized day is far more burnt than a light one', () => {
  const light = evaluateCandle(rec(48, 240, true)); // ratio 0.2 -> burn 0.04
  const close = evaluateCandle(rec(216, 240, true)); // ratio 0.9 -> burn 0.81
  assert.equal(light.status, 'survived');
  assert.equal(close.status, 'survived');
  assert.ok(close.burn - light.burn > 0.5);
});
