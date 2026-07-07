import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { daysInMonth, monthKeyOf, type CandleState } from '@/core';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

  // Index into `months`; 0 is the most recent month with any data.
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(0, months.length - 1));

  if (months.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
        No finished days yet. Your first candle is still burning.
      </ThemedText>
    );
  }

  const month = months[safeIndex];
  const hasOlder = safeIndex < months.length - 1;
  const hasNewer = safeIndex > 0;

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <NavButton label="‹" disabled={!hasOlder} onPress={() => setIndex(safeIndex + 1)} />
        <ThemedText type="smallBold" style={styles.navTitle}>
          {formatDayKeyLong(`${month}-01`).replace(/ \d+,/, ',')}
        </ThemedText>
        <NavButton label="›" disabled={!hasNewer} onPress={() => setIndex(safeIndex - 1)} />
      </View>
      <MonthBlock month={month} byDate={byDate} />
    </View>
  );
}

function NavButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={Spacing.two}
      style={({ pressed }) => [
        styles.navButton,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
        disabled && styles.navButtonDisabled,
      ]}>
      <ThemedText type="smallBold" themeColor={disabled ? 'textSecondary' : 'text'} style={styles.navArrow}>
        {label}
      </ThemedText>
    </Pressable>
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
    gap: Spacing.three,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navTitle: {
    textAlign: 'center',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navArrow: {
    fontSize: 20,
    lineHeight: 22,
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
