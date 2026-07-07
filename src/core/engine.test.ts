import assert from 'node:assert/strict';
import { test } from 'node:test';

import { advance, EMPTY_ENGINE_STATE, type EngineState } from './engine';
import type { BaselineConfig } from './types';

const baseline: BaselineConfig = { windowDays: 30, minDaysToCalibrate: 3 };

test('first ever advance creates a calibrating today', () => {
  const { state, today, newlyUnlocked } = advance(EMPTY_ENGINE_STATE, '2026-07-01', 100, {
    baseline,
  });
  assert.equal(today.status, 'calibrating');
  assert.equal(state.days['2026-07-01'].finalized, false);
  assert.deepEqual(newlyUnlocked, []);
});

test('screen time is monotonic within the day by default', () => {
  let state: EngineState = EMPTY_ENGINE_STATE;
  state = advance(state, '2026-07-01', 100, { baseline }).state;
  const r = advance(state, '2026-07-01', 40, { baseline }); // lower reading is ignored
  assert.equal(r.state.days['2026-07-01'].screenTimeMinutes, 100);
});

test('exact option allows a manual downward correction', () => {
  let state: EngineState = EMPTY_ENGINE_STATE;
  state = advance(state, '2026-07-01', 100, { baseline }).state;
  const r = advance(state, '2026-07-01', 40, { baseline, exact: true });
  assert.equal(r.state.days['2026-07-01'].screenTimeMinutes, 40);
});

test('reopening on a later day finalizes the open past day', () => {
  let state: EngineState = EMPTY_ENGINE_STATE;
  state = advance(state, '2026-07-01', 100, { baseline }).state;
  assert.equal(state.days['2026-07-01'].finalized, false);
  state = advance(state, '2026-07-02', 50, { baseline }).state;
  assert.equal(state.days['2026-07-01'].finalized, true);
  assert.equal(state.days['2026-07-02'].finalized, false);
});

test('baseline is snapshotted once and does not drift within a day', () => {
  let state: EngineState = EMPTY_ENGINE_STATE;
  for (const d of ['2026-07-01', '2026-07-02', '2026-07-03']) {
    state = advance(state, d, 200, { baseline }).state;
  }
  const first = advance(state, '2026-07-04', 10, { baseline });
  assert.equal(first.today.baselineMinutes, 200);
  const second = advance(first.state, '2026-07-04', 30, { baseline });
  assert.equal(second.today.baselineMinutes, 200); // unchanged same-day
});

test('a multi-day run unlocks each achievement exactly once, on finalization', () => {
  const usage: Record<string, number> = {
    '2026-07-01': 240, // calibration days set a high baseline
    '2026-07-02': 240,
    '2026-07-03': 240,
    '2026-07-04': 50, // light, sub-hour, surviving days
    '2026-07-05': 50,
    '2026-07-06': 50,
    '2026-07-07': 50,
    '2026-07-08': 50, // extra day so 07-07 finalizes inside the loop
  };

  let state: EngineState = EMPTY_ENGINE_STATE;
  const seen: string[] = [];
  for (const [day, minutes] of Object.entries(usage)) {
    const r = advance(state, day, minutes, { baseline });
    state = r.state;
    for (const a of r.newlyUnlocked) seen.push(a.def.id);
  }

  assert.equal(new Set(seen).size, seen.length, 'no achievement should be reported twice');
  for (const id of ['first-light', 'barely-lit', 'tall-candle', 'steady-hand']) {
    assert.ok(seen.includes(id), `expected ${id} to unlock`);
  }
});
