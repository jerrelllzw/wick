import type { CandleStatus } from '@/core';

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function channel(n: number): string {
  return Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
}

/** Linear-interpolate two hex colors. `t` is clamped to [0, 1]. */
export function lerpColor(a: string, b: string, t: number): string {
  const tt = clamp(t, 0, 1);
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return `#${channel(ca.r + (cb.r - ca.r) * tt)}${channel(ca.g + (cb.g - ca.g) * tt)}${channel(
    ca.b + (cb.b - ca.b) * tt,
  )}`;
}

export interface CandlePalette {
  waxTop: string;
  waxBottom: string;
  /** The melt-pool ellipse at the top of the wax. */
  rim: string;
  wick: string;
  flameOuter: string;
  flameInner: string;
  glow: string;
  flameOpacity: number;
  glowOpacity: number;
  showFlame: boolean;
  showSmoke: boolean;
}

/**
 * Map a burn fraction + status to candle colors. The visual worsens continuously with
 * burn — the wax toasts from ivory toward a scorched tan and the flame dims — and a
 * burnt-out day goes fully charred with a smoke wisp and no flame. This deliberately
 * makes a close-but-survived day read as clearly worse than a light one, and a burnout
 * read as plainly bad (per the punishing-tone brief). Pure, so the widget renderer can
 * reuse it.
 */
export function candlePalette(burn: number, status: CandleStatus): CandlePalette {
  if (status === 'burntOut') {
    return {
      waxTop: '#4A4038',
      waxBottom: '#2E2721',
      rim: '#211A15',
      wick: '#15110E',
      flameOuter: '#000000',
      flameInner: '#000000',
      glow: '#000000',
      flameOpacity: 0,
      glowOpacity: 0,
      showFlame: false,
      showSmoke: true,
    };
  }

  if (status === 'calibrating') {
    return {
      waxTop: '#ECE6D9',
      waxBottom: '#D8D0C0',
      rim: '#C6BCA6',
      wick: '#8F8677',
      flameOuter: '#F2C879',
      flameInner: '#FDEEC2',
      glow: '#F2C879',
      flameOpacity: 0.55,
      glowOpacity: 0.35,
      showFlame: true,
      showSmoke: false,
    };
  }

  const b = clamp(burn, 0, 1);
  return {
    waxTop: lerpColor('#F6EDD6', '#C79E64', b),
    waxBottom: lerpColor('#E9DCBE', '#A67C46', b),
    rim: lerpColor('#DAC99F', '#6B4C2B', b),
    wick: '#4A4038',
    flameOuter: '#F6963A',
    flameInner: '#FFE08A',
    glow: '#F6963A',
    flameOpacity: clamp(1 - b * 0.7, 0.3, 1),
    glowOpacity: clamp(0.5 - b * 0.4, 0.08, 0.5),
    showFlame: true,
    showSmoke: false,
  };
}
