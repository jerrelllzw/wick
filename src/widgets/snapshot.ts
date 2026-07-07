import type { CandleState, CandleStatus, DayKey } from '@/core';

/**
 * The small, serializable payload the home-screen and lock-screen widgets render.
 * Kept intentionally tiny: widgets only ever show today's candle plus one line of
 * text (leaderboard rank is added once a backend exists — see DECISIONS.md). Written
 * to the shared App Group / SharedPreferences container by {@link publishWidgetSnapshot}.
 */
export interface WidgetSnapshot {
  version: 1;
  date: DayKey;
  status: CandleStatus;
  burn: number;
  screenTimeMinutes: number;
  baselineMinutes: number | null;
  headline: string;
  updatedAt: number;
  /** A freshly-earned award's glyph, so the widget can show a quiet badge. */
  awardGlyph?: string;
}

/** One short, glanceable line for the widget. */
export function widgetHeadline(candle: CandleState | null): string {
  if (!candle) return 'Lighting up…';
  switch (candle.status) {
    case 'calibrating':
      return 'Calibrating';
    case 'burntOut':
      return 'Burnt out';
    case 'survived':
      return 'Candle saved';
    case 'burning': {
      const left = Math.max(0, Math.round(candle.marginMinutes ?? 0));
      if (left <= 0) return 'At your limit';
      const h = Math.floor(left / 60);
      const m = left % 60;
      return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
    }
  }
}

export function buildWidgetSnapshot(candle: CandleState | null, awardGlyph?: string): WidgetSnapshot {
  return {
    version: 1,
    date: candle?.date ?? '',
    status: candle?.status ?? 'calibrating',
    burn: candle?.burn ?? 0,
    screenTimeMinutes: candle?.screenTimeMinutes ?? 0,
    baselineMinutes: candle?.baselineMinutes ?? null,
    headline: widgetHeadline(candle),
    updatedAt: Date.now(),
    awardGlyph,
  };
}
