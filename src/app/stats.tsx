import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWick } from '@/state/AppStateProvider';
import { Candle } from '@/ui/Candle';
import { CandleGrid } from '@/ui/CandleGrid';
import { formatMinutes } from '@/ui/format';
import { useTone } from '@/ui/tone';

export default function StatsScreen() {
  const { stats, history } = useWick();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const tone = useTone();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.five },
      ]}>
      <View style={styles.inner}>
        <ThemedText type="subtitle">History</ThemedText>

        <View style={styles.cardGrid}>
          <StatCard value={`${Math.round(stats.survivalRate * 100)}%`} label="candles saved" hint={`of ${stats.measuredDays} judged days`} />
          <StatCard value={String(stats.currentStreak)} label="day streak" hint="right now" />
          <StatCard value={String(stats.longestStreak)} label="best streak" hint="all time" />
          <StatCard
            value={stats.bestMarginMinutes != null ? formatMinutes(stats.bestMarginMinutes) : '—'}
            label="biggest save"
            hint="most under your limit"
          />
          <StatCard value={String(stats.burntOutDays)} label="burnouts" hint="days you blew past" color={stats.burntOutDays > 0 ? tone.danger : undefined} />
          <StatCard
            value={stats.averageScreenTimeMinutes != null ? formatMinutes(stats.averageScreenTimeMinutes) : '—'}
            label="daily average"
            hint="across judged days"
          />
        </View>

        <Legend />

        <CandleGrid history={history} />
      </View>
    </ScrollView>
  );
}

function StatCard({
  value,
  label,
  hint,
  color,
}: {
  value: string;
  label: string;
  hint: string;
  color?: string;
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="title" style={[styles.cardValue, color ? { color } : undefined]}>
        {value}
      </ThemedText>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {hint}
      </ThemedText>
    </ThemedView>
  );
}

function Legend() {
  return (
    <ThemedView type="backgroundElement" style={styles.legend}>
      <ThemedText type="smallBold">How to read the grid</ThemedText>
      <View style={styles.legendRow}>
        <LegendItem burn={0.05} status="survived" label="Light day" />
        <LegendItem burn={0.8} status="survived" label="Close call" />
        <LegendItem burn={1} status="burntOut" label="Burnt out" />
      </View>
    </ThemedView>
  );
}

function LegendItem({
  burn,
  status,
  label,
}: {
  burn: number;
  status: 'survived' | 'burntOut';
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <Candle burn={burn} status={status} size={44} detail="mini" />
      <ThemedText type="small" themeColor="textSecondary" style={styles.legendLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  inner: {
    flex: 1,
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  cardValue: {
    fontSize: 34,
    lineHeight: 40,
  },
  legend: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendLabel: {
    textAlign: 'center',
  },
});
