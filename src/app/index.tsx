import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWick } from '@/state/AppStateProvider';
import { Candle } from '@/ui/Candle';
import { formatMinutes } from '@/ui/format';
import { candleCopy, useTone, type Tone } from '@/ui/tone';

export default function TodayScreen() {
  const { candleToday, settings, sourceStatus, setManualMinutes } = useWick();
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <SafeAreaView style={styles.content}>
          <Candle
            burn={candle?.burn ?? 0}
            status={candle?.status ?? 'calibrating'}
            size={260}
          />

          <ThemedView style={styles.headlineBlock}>
            <ThemedText type="subtitle" style={[styles.headline, { color: toneColor[copy.tone] }]}>
              {copy.title}
            </ThemedText>
            <SubCopy candle={candle} />
          </ThemedView>

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

          {settings.source === 'manual' && <ManualEntry onSubmit={setManualMinutes} current={candle?.screenTimeMinutes ?? 0} />}

          <SourceNotice source={settings.source} status={sourceStatus} />
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

function SubCopy({ candle }: { candle: ReturnType<typeof useWick>['candleToday'] }) {
  if (!candle) return null;
  if (candle.status === 'calibrating') {
    return (
      <ThemedText themeColor="textSecondary" style={styles.center}>
        We need a few days of history before your candle can burn out. Just keep living your life.
      </ThemedText>
    );
  }
  if (candle.status === 'burntOut') {
    return (
      <ThemedText themeColor="textSecondary" style={styles.center}>
        You passed your 30-day average. This candle is gone for the day — a fresh one starts at
        midnight.
      </ThemedText>
    );
  }
  return (
    <ThemedText themeColor="textSecondary" style={styles.center}>
      {formatMinutes(candle.screenTimeMinutes)} used against your{' '}
      {candle.baselineMinutes != null ? formatMinutes(candle.baselineMinutes) : ''} average.
    </ThemedText>
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

function ManualEntry({
  current,
  onSubmit,
}: {
  current: number;
  onSubmit: (minutes: number) => void;
}) {
  const theme = useTheme();
  const tone = useTone();
  const [text, setText] = useState(current ? String(Math.round(current)) : '');

  const submit = () => {
    const minutes = Number(text);
    if (Number.isFinite(minutes) && minutes >= 0) onSubmit(minutes);
  };

  return (
    <ThemedView type="backgroundElement" style={styles.manualCard}>
      <ThemedText type="smallBold">Log today&apos;s screen time</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Total minutes so far today.
      </ThemedText>
      <ThemedView style={styles.manualRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          keyboardType="number-pad"
          placeholder="e.g. 145"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: tone.hairline }]}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Pressable
          onPress={submit}
          style={({ pressed }) => [styles.logButton, { backgroundColor: tone.flame }, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
            Log
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

function SourceNotice({ source, status }: { source: string; status: string }) {
  if (source === 'mock') {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Showing demo data. Connect Screen Time in Settings to track for real.
      </ThemedText>
    );
  }
  if (source === 'device' && status !== 'granted') {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        Screen Time access isn&apos;t set up yet — open Settings to grant it.
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
  headlineBlock: {
    alignItems: 'center',
    gap: Spacing.two,
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
  manualCard: {
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  manualRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.select({ ios: Spacing.two, default: Spacing.one }),
    fontSize: 16,
  },
  logButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
