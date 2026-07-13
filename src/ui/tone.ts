import type { CandleState, CandleStatus } from '@/core';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * App-specific accent colors layered on top of the template's neutral theme. The
 * ramp intentionally has a blunt `danger` red for burnouts — the design brief asks us
 * to lean into the punishing framing rather than soften heavy-use days.
 */
export const ToneColors = {
  light: {
    flame: '#C2691C',
    good: '#4C6B3C',
    warn: '#9A741E',
    danger: '#9B3022',
    goodBg: '#E6EAD3',
    warnBg: '#F0E6CA',
    dangerBg: '#EFDDD2',
    neutralBg: '#EBE0C6',
    hairline: '#3A2E1F1F',
  },
  dark: {
    flame: '#E0913C',
    good: '#89A96B',
    warn: '#C99A45',
    danger: '#C55B48',
    goodBg: '#20281A',
    warnBg: '#2A2213',
    dangerBg: '#2E1C16',
    neutralBg: '#241B12',
    hairline: '#EDE3CC1F',
  },
} as const;

export type Tone = 'good' | 'warn' | 'danger' | 'neutral';

export function useTone() {
  const scheme = useColorScheme();
  return ToneColors[scheme === 'dark' ? 'dark' : 'light'];
}

/** Map a candle status + burn depth to a coarse tone used for copy and accents. */
export function toneForCandle(status: CandleStatus, burn: number): Tone {
  switch (status) {
    case 'calibrating':
      return 'neutral';
    case 'survived':
      return 'good';
    case 'burntOut':
      return 'danger';
    case 'burning':
      if (burn < 0.5) return 'good';
      if (burn < 0.8) return 'warn';
      return 'danger';
  }
}

export interface CandleCopy {
  title: string;
  tone: Tone;
}

/** The blunt, glanceable headline for today's candle. */
export function candleCopy(candle: CandleState | null): CandleCopy {
  if (!candle) return { title: 'Setting the wick', tone: 'neutral' };
  const tone = toneForCandle(candle.status, candle.burn);
  switch (candle.status) {
    case 'calibrating':
      return { title: 'Still learning your rhythm', tone };
    case 'survived':
      return { title: 'Candle saved', tone };
    case 'burntOut':
      return { title: 'Burnt out', tone };
    case 'burning':
      if (candle.burn < 0.5) return { title: 'Burning steady', tone };
      if (candle.burn < 0.8) return { title: 'Burning low', tone };
      return { title: 'Almost gone', tone };
  }
}
