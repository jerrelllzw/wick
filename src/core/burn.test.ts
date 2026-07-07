import assert from 'node:assert/strict';
import { test } from 'node:test';

import { burnFractionForRatio } from './burn';
import type { BurnConfig } from './types';

const acc: BurnConfig = { curve: 'accelerating', exponent: 2 };
const lin: BurnConfig = { curve: 'linear', exponent: 2 };

test('full candle at or below zero usage', () => {
  assert.equal(burnFractionForRatio(0, acc), 0);
  assert.equal(burnFractionForRatio(-1, acc), 0);
});

test('burnt out at or above the threshold', () => {
  assert.equal(burnFractionForRatio(1, acc), 1);
  assert.equal(burnFractionForRatio(2, acc), 1);
  assert.equal(burnFractionForRatio(Infinity, acc), 1);
});

test('linear curve returns the ratio', () => {
  assert.equal(burnFractionForRatio(0.25, lin), 0.25);
  assert.equal(burnFractionForRatio(0.5, lin), 0.5);
});

test('accelerating curve is r^exponent', () => {
  assert.ok(Math.abs(burnFractionForRatio(0.5, acc) - 0.25) < 1e-9);
  assert.ok(Math.abs(burnFractionForRatio(0.9, acc) - 0.81) < 1e-9);
});

test('accelerating burns less than linear below threshold (danger-zone shape)', () => {
  for (const r of [0.1, 0.3, 0.6, 0.8]) {
    assert.ok(burnFractionForRatio(r, acc) < burnFractionForRatio(r, lin));
  }
});

test('a close-but-under day looks far worse than a light day', () => {
  const light = burnFractionForRatio(0.2, acc); // 0.04
  const close = burnFractionForRatio(0.9, acc); // 0.81
  assert.ok(close - light > 0.5);
});

test('monotonic non-decreasing in the ratio', () => {
  let prev = -1;
  for (let r = 0; r <= 1.0001; r += 0.05) {
    const b = burnFractionForRatio(r, acc);
    assert.ok(b >= prev, `burn should not decrease at r=${r}`);
    prev = b;
  }
});

test('NaN usage is treated as a full candle', () => {
  assert.equal(burnFractionForRatio(NaN, acc), 0);
});
