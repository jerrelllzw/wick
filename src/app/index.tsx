import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWick } from '@/state/AppStateProvider';
import { Candle } from '@/ui/Candle';
import { formatMinutes } from '@/ui/format';
import { PaperBackground } from '@/ui/PaperBackground';
import { candleCopy, useTone, type Tone } from '@/ui/tone';

export default function TodayScreen() {
  const { candleToday, sourceStatus } = useWick();
  const theme = useTheme();
  const tone = useTone();

  const candle = candleToday;
  const copy = candleCopy(candle);
  const toneColor: Record<Tone, string> = {
    good: tone.good,
    warn: tone.warn,
    danger: tone.danger,
    neutral: theme.textSecondary,
  };

  return (
    <ThemedView style={styles.fill}>
      <PaperBackground />
      <ScrollView contentContainerStyle={styles.scroll}>
        <SafeAreaView style={styles.content}>
          <Candle
            burn={candle?.burn ?? 0}
            status={candle?.status ?? 'calibrating'}
            size={260}
          />

          <ThemedText type="subtitle" style={[styles.headline, { color: toneColor[copy.tone] }]}>
            {copy.title}
          </ThemedText>

          {candle?.status === 'calibrating' && (
            <ThemedText themeColor="textSecondary" style={styles.center}>
              A few more days of history and your candle starts burning down.
            </ThemedText>
          )}

          {candle && candle.status !== 'calibrating' && (
            <ThemedView type="backgroundElement" style={styles.statRow}>
              <Stat label="Today" value={formatMinutes(candle.screenTimeMinutes)} />
              <Divider />
              <Stat
                label="Your limit"
                value={candle.baselineMinutes != null ? formatMinutes(candle.baselineMinutes) : '—'}
              />
              <Divider />
              <Stat
                label={candle.status === 'burntOut' ? 'Over by' : 'Left'}
                value={
                  candle.status === 'burntOut'
                    ? formatMinutes(candle.overByMinutes ?? 0)
                    : formatMinutes(candle.marginMinutes ?? 0)
                }
                color={candle.status === 'burntOut' ? tone.danger : undefined}
              />
            </ThemedView>
          )}

          <SourceNotice status={sourceStatus} />
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <ThemedView style={styles.stat}>
      <ThemedText type="smallBold" style={color ? { color } : undefined}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function Divider() {
  const tone = useTone();
  return <ThemedView style={[styles.divider, { backgroundColor: tone.hairline }]} />;
}

function SourceNotice({ status }: { status: string }) {
  if (status !== 'granted') {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Screen Time access isn&apos;t set up yet — grant it in your device settings to track for real.
      </ThemedText>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  headline: {
    textAlign: 'center',
  },
  center: {
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    backgroundColor: 'transparent',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: Spacing.one,
  },
});
