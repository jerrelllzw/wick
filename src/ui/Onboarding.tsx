import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ScreenTimeSourceKind } from '@/screentime';
import { useWick } from '@/state/AppStateProvider';
import { Candle } from './Candle';
import { useTone } from './tone';

const SOURCES: { kind: ScreenTimeSourceKind; label: string; desc: string }[] = [
  { kind: 'device', label: 'Screen Time', desc: 'Track automatically from your device.' },
  { kind: 'manual', label: 'Manual entry', desc: 'Type your daily total yourself.' },
  { kind: 'mock', label: 'Just exploring', desc: 'Use demo data for now.' },
];

export function Onboarding() {
  const { settings, setSource, requestPermission, completeOnboarding, deviceAvailable, sourceStatus } = useWick();
  const theme = useTheme();
  const tone = useTone();
  const [step, setStep] = useState(0);

  const pickSource = async (kind: ScreenTimeSourceKind) => {
    await setSource(kind);
    if (kind === 'device' && deviceAvailable) await requestPermission();
  };

  return (
    <ThemedView style={[styles.overlay, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.inner}>
            {step === 0 ? (
              <>
                <Candle burn={0.12} status="survived" size={220} />
                <ThemedText type="title" style={styles.center}>
                  Your day is a candle.
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.center}>
                  It burns down as you use your phone. Pass your own 30-day average and it burns out
                  for the day. Use less, and more wax survives. That&apos;s the whole game.
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                  No nudges. No streaks to shame you. Most of wick lives on your home and lock screen
                  — it&apos;s meant to be boring to open.
                </ThemedText>
                <Primary label="Next" onPress={() => setStep(1)} />
              </>
            ) : (
              <>
                <ThemedText type="subtitle" style={styles.center}>
                  Where should wick get your screen time?
                </ThemedText>
                <View style={styles.sourceList}>
                  {SOURCES.map((s) => (
                    <Pressable
                      key={s.kind}
                      onPress={() => void pickSource(s.kind)}
                      style={({ pressed }) => [pressed && styles.pressed]}>
                      <ThemedView
                        type="backgroundElement"
                        style={[styles.sourceCard, settings.source === s.kind && { borderColor: tone.flame }]}>
                        <View style={styles.sourceText}>
                          <ThemedText type="smallBold">{s.label}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {s.kind === 'device' && !deviceAvailable
                              ? 'Needs a development build with the native module — pick another for now.'
                              : s.desc}
                          </ThemedText>
                        </View>
                        <ThemedText style={{ color: settings.source === s.kind ? tone.good : 'transparent' }}>✓</ThemedText>
                      </ThemedView>
                    </Pressable>
                  ))}
                </View>

                {settings.source === 'device' && (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                    {Platform.OS === 'android'
                      ? 'Android needs Usage Access granted in system Settings. Access: '
                      : 'iOS will ask for Screen Time access. Access: '}
                    <ThemedText type="smallBold">{sourceStatus}</ThemedText>
                  </ThemedText>
                )}

                <Primary label="Light the first candle" onPress={() => void completeOnboarding()} />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Primary({ label, onPress }: { label: string; onPress: () => void }) {
  const tone = useTone();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.primary, { backgroundColor: tone.flame }, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={styles.primaryLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  inner: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  center: {
    textAlign: 'center',
  },
  sourceList: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sourceText: {
    flex: 1,
    gap: Spacing.half,
  },
  primary: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  primaryLabel: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.7,
  },
});
