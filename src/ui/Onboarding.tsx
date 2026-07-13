import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWick } from '@/state/AppStateProvider';
import { Candle } from './Candle';
import { PaperBackground } from './PaperBackground';
import { useTone } from './tone';

export function Onboarding() {
  const { requestPermission, completeOnboarding, deviceAvailable, sourceStatus } = useWick();
  const theme = useTheme();
  const tone = useTone();
  const [step, setStep] = useState(0);

  return (
    <ThemedView style={[styles.overlay, { backgroundColor: theme.background }]}>
      <PaperBackground />
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
                  wick uses your Screen Time.
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.center}>
                  Your daily total comes straight from your device — nothing to log by hand. It never
                  leaves your phone.
                </ThemedText>

                {deviceAvailable ? (
                  <>
                    <Pressable
                      onPress={() => void requestPermission()}
                      style={({ pressed }) => [
                        styles.primary,
                        { backgroundColor: tone.flame },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="smallBold" style={styles.primaryLabel}>
                        {Platform.OS === 'android' ? 'Open usage-access settings' : 'Grant Screen Time access'}
                      </ThemedText>
                    </Pressable>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                      {Platform.OS === 'android'
                        ? 'Android needs Usage Access granted in system Settings. Access: '
                        : 'iOS will ask for Screen Time access. Access: '}
                      <ThemedText type="smallBold">{sourceStatus}</ThemedText>
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                    Screen Time needs a development build with the native module. Your candle will
                    stay in calibration until that&apos;s wired up.
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
