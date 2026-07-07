import { DEFAULT_BURN_CONFIG } from './config';
import type { BurnConfig } from './types';

/**
 * Map a usage ratio `r = screenTime / baseline` to a burn fraction in [0, 1].
 *
 * - `r <= 0`  → 0 (a full, untouched candle)
 * - `r >= 1`  → 1 (burnt out; usage reached the personal threshold)
 * - `linear`       → `r`
 * - `accelerating` → `r ^ exponent` (exponent > 1): gentle early, steep near the
 *   threshold, so the last stretch before burnout is where the candle visibly drops.
 *
 * The function is total and monotonic non-decreasing in `r`. Because a day's
 * cumulative screen time only ever increases, the resulting burn is monotonic too,
 * which is exactly what "locked in as burnt out" requires — no extra latching.
 */
export function burnFractionForRatio(
  ratio: number,
  config: BurnConfig = DEFAULT_BURN_CONFIG,
): number {
  if (Number.isNaN(ratio) || ratio <= 0) return 0;
  if (ratio >= 1) return 1; // includes +Infinity
  switch (config.curve) {
    case 'linear':
      return ratio;
    case 'accelerating':
      return Math.pow(ratio, config.exponent);
    default:
      return ratio;
  }
}
