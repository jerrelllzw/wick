import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWick } from '@/state/AppStateProvider';
import type { ScreenTimeSourceKind } from '@/screentime';
import { useTone } from '@/ui/tone';

const SOURCES: { kind: ScreenTimeSourceKind; label: string; desc: string }[] = [
  { kind: 'device', label: 'Screen Time', desc: 'Automatic, from your device’s system usage data.' },
  { kind: 'manual', label: 'Manual entry', desc: 'Type today’s total on the Today screen yourself.' },
  { kind: 'mock', label: 'Demo data', desc: 'Made-up data so you can explore the app.' },
];

export default function SettingsScreen() {
  const {
    settings,
    sourceStatus,
    deviceAvailable,
    setSource,
    requestPermission,
    setBurnCurve,
    setNotifyOnAchievement,
    resetAll,
  } = useWick();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const tone = useTone();

  const confirmReset = () => {
    Alert.alert('Erase all data?', 'Every recorded day, streak, and award will be gone. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: () => void resetAll() },
    ]);
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.five },
      ]}>
      <View style={styles.inner}>
        <ThemedText type="subtitle">Settings</ThemedText>

        <Section title="Tracking source">
          {SOURCES.map((s) => (
            <SelectRow
              key={s.kind}
              label={s.label}
              desc={s.kind === 'device' && !deviceAvailable ? 'Needs a development build with the screen-time module (see docs).' : s.desc}
              selected={settings.source === s.kind}
              onPress={() => void setSource(s.kind)}
            />
          ))}

          {settings.source === 'device' && (
            <View style={styles.deviceStatus}>
              <ThemedText type="small" themeColor="textSecondary">
                Access: <ThemedText type="smallBold">{sourceStatus}</ThemedText>
              </ThemedText>
              {sourceStatus !== 'granted' && (
                <Pressable
                  onPress={() => void requestPermission()}
                  style={({ pressed }) => [styles.button, { backgroundColor: tone.flame }, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.buttonLabel}>
                    {Platform.OS === 'android' ? 'Open usage-access settings' : 'Grant Screen Time access'}
                  </ThemedText>
                </Pressable>
              )}
              <ThemedText type="small" themeColor="textSecondary">
                {Platform.OS === 'android'
                  ? 'Android requires you to enable Usage Access in system Settings — it can’t be granted from a pop-up.'
                  : 'iOS asks for Screen Time (Family Controls) authorization the first time.'}
              </ThemedText>
            </View>
          )}
        </Section>

        <Section title="Candle" footer="An accelerating curve melts slowly at first, then drops off fast as you near your limit — the danger zone.">
          <SelectRow label="Accelerating burn" desc="Punishes the final stretch before your limit." selected={settings.burn.curve === 'accelerating'} onPress={() => void setBurnCurve('accelerating')} />
          <SelectRow label="Linear burn" desc="Melts evenly with screen time." selected={settings.burn.curve === 'linear'} onPress={() => void setBurnCurve('linear')} />
        </Section>

        <Section title="Awards" footer="One quiet local notification when you earn an award — never a reminder or a nudge to come back.">
          <ToggleRow
            label="Notify me when I earn an award"
            value={settings.notifyOnAchievement}
            onValueChange={(v) => void setNotifyOnAchievement(v)}
          />
        </Section>

        <Section title="Data">
          <Pressable onPress={confirmReset} style={({ pressed }) => [styles.destructive, { borderColor: tone.danger }, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: tone.danger }}>
              Erase all data
            </ThemedText>
          </Pressable>
        </Section>

        <ThemedText type="small" themeColor="textSecondary" style={styles.about}>
          wick tracks nothing about you off-device. Everything lives in local storage. There are no
          streak-shaming pushes, no in-app shop, and nothing designed to pull you back in.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

function Section({ title, footer, children }: { title: string; footer?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.sectionCard}>
        {children}
      </ThemedView>
      {footer && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionFooter}>
          {footer}
        </ThemedText>
      )}
    </View>
  );
}

function SelectRow({
  label,
  desc,
  selected,
  onPress,
}: {
  label: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
}) {
  const tone = useTone();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.selectRow, pressed && styles.pressed]}>
      <View style={styles.selectText}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {desc}
        </ThemedText>
      </View>
      <ThemedText style={[styles.check, { color: selected ? tone.good : 'transparent' }]}>✓</ThemedText>
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <ThemedText type="smallBold" style={styles.toggleLabel}>
        {label}
      </ThemedText>
      <Switch value={value} onValueChange={onValueChange} />
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
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  sectionFooter: {
    paddingHorizontal: Spacing.one,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  selectText: {
    flex: 1,
    gap: Spacing.half,
  },
  check: {
    fontSize: 18,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  deviceStatus: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  buttonLabel: {
    color: '#ffffff',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  toggleLabel: {
    flex: 1,
  },
  destructive: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  about: {
    paddingHorizontal: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
});
