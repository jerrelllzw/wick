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
import { PaperBackground } from '@/ui/PaperBackground';

export default function StatsScreen() {
  const { stats, history } = useWick();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={styles.fill}>
      <PaperBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.five },
        ]}>
        <View style={styles.inner}>
        <ThemedText type="subtitle">History</ThemedText>

        <ThemedView type="backgroundElement" style={styles.hero}>
          <View style={styles.heroText}>
            <ThemedText type="title" style={styles.heroValue}>
              {`${Math.round(stats.survivalRate * 100)}%`}
            </ThemedText>
            <ThemedText type="smallBold">candles saved</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {`of ${stats.measuredDays} judged days`}
            </ThemedText>
          </View>
          <Candle
            burn={1 - stats.survivalRate}
            status={stats.measuredDays > 0 && stats.survivalRate === 0 ? 'burntOut' : 'survived'}
            size={96}
          />
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.statRow}>
          <MiniStat value={String(stats.currentStreak)} label="day streak" />
          <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
          <MiniStat value={String(stats.longestStreak)} label="best streak" />
          <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
          <MiniStat
            value={stats.averageScreenTimeMinutes != null ? formatMinutes(stats.averageScreenTimeMinutes) : '—'}
            label="daily avg"
          />
        </ThemedView>

        <CandleGrid history={history} />

        <Legend />
        </View>
      </ScrollView>
    </View>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <ThemedText type="subtitle" style={styles.miniValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.miniLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

function Legend() {
  return (
    <View style={styles.legend}>
      <LegendItem burn={0.05} status="survived" label="Light day" />
      <LegendItem burn={0.8} status="survived" label="Close call" />
      <LegendItem burn={1} status="burntOut" label="Burnt out" />
    </View>
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
      <Candle burn={burn} status={status} size={22} detail="mini" />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  heroText: {
    gap: Spacing.half,
  },
  heroValue: {
    fontSize: 56,
    lineHeight: 60,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  miniValue: {
    fontSize: 26,
    lineHeight: 30,
  },
  miniLabel: {
    textAlign: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: Spacing.four,
    rowGap: Spacing.two,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
