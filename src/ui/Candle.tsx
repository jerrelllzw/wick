import { memo, useId } from 'react';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import type { CandleStatus } from '@/core';

import { candlePalette } from './candleColors';

export interface CandleProps {
  /** Burn fraction 0 (full) .. 1 (burnt out). */
  burn: number;
  status: CandleStatus;
  /** Rendered height in px. Width scales proportionally. */
  size?: number;
  /** `mini` drops gradients/glow/drips for cheap rendering in the stats grid. */
  detail?: 'full' | 'mini';
}

// Geometry in a 100 x 160 viewBox.
const VIEW_W = 100;
const VIEW_H = 160;
const BODY_LEFT = 30;
const BODY_W = 40;
const BASE_Y = 148;
const FULL_TOP = 26;
const STUB_TOP = 116;
const CENTER = 50;

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function flamePath(baseY: number, height: number, width: number): string {
  const topY = baseY - height;
  const w = width;
  return (
    `M${CENTER},${baseY} ` +
    `C${CENTER + w},${baseY - height * 0.35} ${CENTER + w * 0.85},${topY + height * 0.28} ${CENTER},${topY} ` +
    `C${CENTER - w * 0.85},${topY + height * 0.28} ${CENTER - w},${baseY - height * 0.35} ${CENTER},${baseY} Z`
  );
}

function CandleComponent({ burn, status, size = 220, detail = 'full' }: CandleProps) {
  const gid = useId();
  const p = candlePalette(burn, status);
  const b = clamp01(burn);

  const waxTopY = FULL_TOP + b * (STUB_TOP - FULL_TOP);
  const waxHeight = BASE_Y - waxTopY;
  const wickTopY = waxTopY - 10;

  const flameHeight = 30 * (1 - b * 0.5);
  const flameBaseY = waxTopY - 8;
  const flameWidth = flameHeight * 0.5;
  const glowCy = flameBaseY - flameHeight * 0.45;

  const width = size * (VIEW_W / VIEW_H);
  const isMini = detail === 'mini';

  return (
    <Svg width={width} height={size} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      {!isMini && (
        <Defs>
          <LinearGradient id={`${gid}-wax`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={p.waxTop} />
            <Stop offset="1" stopColor={p.waxBottom} />
          </LinearGradient>
          <RadialGradient id={`${gid}-glow`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={p.glow} stopOpacity={p.glowOpacity} />
            <Stop offset="1" stopColor={p.glow} stopOpacity="0" />
          </RadialGradient>
        </Defs>
      )}

      {/* Holder dish */}
      {!isMini && <Ellipse cx={CENTER} cy={BASE_Y + 4} rx="34" ry="7" fill="#00000022" />}
      <Ellipse cx={CENTER} cy={BASE_Y + 2} rx="30" ry="6" fill={isMini ? '#00000018' : '#0000002A'} />

      {/* Soft glow behind the flame */}
      {!isMini && p.showFlame && (
        <Rect
          x={CENTER - flameHeight * 1.4}
          y={glowCy - flameHeight * 1.4}
          width={flameHeight * 2.8}
          height={flameHeight * 2.8}
          fill={`url(#${gid}-glow)`}
        />
      )}

      {/* Wax body */}
      <Rect
        x={BODY_LEFT}
        y={waxTopY}
        width={BODY_W}
        height={waxHeight}
        rx={isMini ? 4 : 7}
        fill={isMini ? p.waxTop : `url(#${gid}-wax)`}
      />

      {/* A melt drip on heavier (but surviving) days for extra "worse" character */}
      {!isMini && b > 0.4 && !p.showSmoke && (
        <Path
          d={`M${BODY_LEFT + BODY_W - 3},${waxTopY + 6} q6,10 1,${8 + b * 22} q-5,6 -8,0 q-3,-14 7,-${14 + b * 8} Z`}
          fill={p.waxBottom}
          opacity={0.9}
        />
      )}

      {/* Melt pool rim */}
      <Ellipse cx={CENTER} cy={waxTopY} rx={BODY_W / 2} ry={isMini ? 3 : 5.5} fill={p.rim} />

      {/* Wick */}
      <Rect x={CENTER - 1} y={wickTopY} width="2" height="10" rx="1" fill={p.wick} />

      {/* Flame */}
      {p.showFlame && (
        <>
          <Path d={flamePath(flameBaseY, flameHeight, flameWidth)} fill={p.flameOuter} opacity={p.flameOpacity} />
          {!isMini && (
            <Path
              d={flamePath(flameBaseY, flameHeight * 0.6, flameWidth * 0.55)}
              fill={p.flameInner}
              opacity={p.flameOpacity}
            />
          )}
        </>
      )}

      {/* Smoke wisp for a burnt-out candle */}
      {p.showSmoke && (
        <Path
          d={`M${CENTER},${wickTopY} q10,-12 0,-24 q-10,-12 0,-24`}
          stroke="#8A8078"
          strokeWidth={isMini ? 2.5 : 2}
          fill="none"
          opacity={0.4}
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}

export const Candle = memo(CandleComponent);
