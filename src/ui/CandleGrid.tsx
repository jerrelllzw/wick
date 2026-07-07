import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { daysInMonth, monthKeyOf, type CandleState } from '@/core';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Candle } from './Candle';
import { formatDayKeyLong } from './format';
import { useTone } from './tone';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CANDLE_HEIGHT = 34;
const MAX_MONTHS = 12;

type Cell = { kind: 'blank' } | { kind: 'empty' } | { kind: 'candle'; candle: CandleState };

/**
 * A calendar heatmap of candle sprites — one tiny candle per day at its true burn
 * height, so a light month reads as a row of tall candles and a heavy month as
 * scorched stubs and black burnt-out nubs. Deliberately unsoftened: burnouts render
 * as clearly dead candles (per the punishing-tone brief) while staying grid-legible.
 */
export function CandleGrid({ history }: { history: CandleState[] }) {
  const byDate = useMemo(() => new Map(history.map((c) => [c.date, c])), [history]);
  const months = useMemo(() => {
    const set = new Set(history.map((c) => monthKeyOf(c.date)));
    return [...set].sort((a, b) => (a < b ? 1 : -1)).slice(0, MAX_MONTHS); // most recent first
  }, [history]);

  if (months.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
        No finished days yet. Your first candle is still burning.
      </ThemedText>
    );
  }

  return (
    <View style={styles.container}>
      {months.map((month) => (
        <MonthBlock key={month} month={month} byDate={byDate} />
      ))}
    </View>
  );
}

function MonthBlock({ month, byDate }: { month: string; byDate: Map<string, CandleState> }) {
  const tone = useTone();
  const [year, monthNum] = month.split('-').map(Number);
  const offset = new Date(year, monthNum - 1, 1).getDay();
  const total = daysInMonth(year, monthNum);

  const cells: Cell[] = [];
  for (let i = 0; i < offset; i += 1) cells.push({ kind: 'blank' });
  for (let d = 1; d <= total; d += 1) {
    const key = `${month}-${String(d).padStart(2, '0')}`;
    const candle = byDate.get(key);
    cells.push(candle ? { kind: 'candle', candle } : { kind: 'empty' });
  }

  return (
    <View style={styles.month}>
      <ThemedText type="smallBold">{formatDayKeyLong(`${month}-01`).replace(/ \d+,/, ',')}</ThemedText>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.weekday}>
            {w}
          </ThemedText>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, i) => (
          <View key={i} style={styles.cell}>
            {cell.kind === 'candle' ? (
              <Candle burn={cell.candle.burn} status={cell.candle.status} size={CANDLE_HEIGHT} detail="mini" />
            ) : cell.kind === 'empty' ? (
              <View style={[styles.emptyDot, { backgroundColor: tone.hairline }]} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.five,
  },
  month: {
    gap: Spacing.two,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.two,
  },
  cell: {
    width: `${100 / 7}%`,
    height: CANDLE_HEIGHT + 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: CANDLE_HEIGHT / 2 - 3,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
});
