import { burnFractionForRatio } from './burn';
import { DEFAULT_BURN_CONFIG } from './config';
import type { BurnConfig, CandleState, CandleStatus, DayRecord } from './types';

export interface EvaluateOptions {
  burn?: BurnConfig;
}

/**
 * Derive the presentational {@link CandleState} from a {@link DayRecord}.
 *
 * Pure and deterministic: the same record always produces the same candle, so a
 * finalized day looks identical whether it is rendered today or a year from now.
 * Because within-day screen time is monotonic and the baseline is snapshotted on
 * the record, a candle that has reached `burntOut` stays burnt out for the rest of
 * the day with no extra latching logic.
 */
export function evaluateCandle(record: DayRecord, options: EvaluateOptions = {}): CandleState {
  const burnCfg = options.burn ?? DEFAULT_BURN_CONFIG;
  const screenTimeMinutes = Math.max(0, record.screenTimeMinutes);
  const baseline = record.baselineMinutes;

  if (baseline == null || baseline <= 0) {
    return {
      date: record.date,
      status: 'calibrating',
      burn: 0,
      waxRemaining: 1,
      screenTimeMinutes,
      baselineMinutes: baseline,
      marginMinutes: null,
      overByMinutes: null,
    };
  }

  const ratio = screenTimeMinutes / baseline;
  const burn = burnFractionForRatio(ratio, burnCfg);
  const burntOut = ratio >= 1;

  let status: CandleStatus;
  if (burntOut) status = 'burntOut';
  else if (record.finalized) status = 'survived';
  else status = 'burning';

  return {
    date: record.date,
    status,
    burn,
    waxRemaining: 1 - burn,
    screenTimeMinutes,
    baselineMinutes: baseline,
    marginMinutes: baseline - screenTimeMinutes,
    overByMinutes: Math.max(0, screenTimeMinutes - baseline),
  };
}
