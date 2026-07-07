import type { CandleState, CandleStatus } from '@/core';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * App-specific accent colors layered on top of the template's neutral theme. The
 * ramp intentionally has a blunt `danger` red for burnouts — the design brief asks us
 * to lean into the punishing framing rather than soften heavy-use days.
 */
export const ToneColors = {
  light: {
    flame: '#E0781F',
    good: '#2E8B57',
    warn: '#B5771A',
    danger: '#BE3A2B',
    goodBg: '#E4F2EA',
    warnBg: '#F6EEDD',
    dangerBg: '#F7E5E1',
    neutralBg: '#F0F0F3',
    hairline: '#00000014',
  },
  dark: {
    flame: '#F6963A',
    good: '#5FBE86',
    warn: '#E0A94A',
    danger: '#E5675A',
    goodBg: '#15241C',
    warnBg: '#241E12',
    dangerBg: '#2A1815',
    neutralBg: '#212225',
    hairline: '#FFFFFF14',
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
