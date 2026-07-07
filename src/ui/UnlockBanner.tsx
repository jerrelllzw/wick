import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useWick } from '@/state/AppStateProvider';
import { useTone } from './tone';

/**
 * A single, tap-to-dismiss banner for freshly-earned awards. This is the in-app half
 * of the least-naggy unlock surface (open question #8) — it appears only right after
 * an unlock and never re-nags. The widget badge and the optional one-off local
 * notification are the other, equally quiet, halves.
 */
export function UnlockBanner() {
  const { pendingUnlocks, dismissUnlock } = useWick();
  const tone = useTone();
  const top = pendingUnlocks[0];
  if (!top) return null;

  return (
    <SafeAreaView pointerEvents="box-none" edges={['top']} style={styles.container}>
      <Pressable onPress={() => dismissUnlock(top.def.id)} style={styles.press}>
        <ThemedView type="backgroundElement" style={[styles.banner, { borderColor: tone.warn }]}>
          <ThemedText style={styles.glyph}>{top.def.glyph}</ThemedText>
          <View style={styles.text}>
            <ThemedText type="smallBold">Award earned</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {top.def.title}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Dismiss
          </ThemedText>
        </ThemedView>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  press: {
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  glyph: {
    fontSize: 24,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
});
