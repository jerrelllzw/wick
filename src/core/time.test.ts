import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addDays,
  compareDayKey,
  dayKeyFromDate,
  dayKeyRange,
  daysInMonth,
  isDayKey,
  isNextDay,
  monthKeyOf,
} from './time';

test('dayKeyFromDate zero-pads month and day', () => {
  assert.equal(dayKeyFromDate(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(dayKeyFromDate(new Date(2026, 11, 31)), '2026-12-31');
});

test('isDayKey validates the format', () => {
  assert.ok(isDayKey('2026-07-07'));
  assert.ok(!isDayKey('2026-7-7'));
  assert.ok(!isDayKey('not-a-date'));
});

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2024-03-01', -1), '2024-02-29'); // leap year
});

test('isNextDay only for exact successors', () => {
  assert.ok(isNextDay('2026-07-07', '2026-07-08'));
  assert.ok(!isNextDay('2026-07-07', '2026-07-09'));
  assert.ok(!isNextDay('2026-07-07', '2026-07-07'));
});

test('monthKeyOf extracts the YYYY-MM bucket', () => {
  assert.equal(monthKeyOf('2026-07-07'), '2026-07');
});

test('daysInMonth handles leap years', () => {
  assert.equal(daysInMonth(2026, 2), 28);
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(2026, 4), 30);
  assert.equal(daysInMonth(2026, 12), 31);
});

test('compareDayKey orders chronologically', () => {
  assert.equal(compareDayKey('2026-07-07', '2026-07-08'), -1);
  assert.equal(compareDayKey('2026-07-08', '2026-07-07'), 1);
  assert.equal(compareDayKey('2026-07-07', '2026-07-07'), 0);
});

test('dayKeyRange is inclusive and empty when reversed', () => {
  assert.deepEqual(dayKeyRange('2026-07-07', '2026-07-09'), [
    '2026-07-07',
    '2026-07-08',
    '2026-07-09',
  ]);
  assert.deepEqual(dayKeyRange('2026-07-09', '2026-07-07'), []);
});
