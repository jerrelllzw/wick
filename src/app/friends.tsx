import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { PaperBackground } from '@/ui/PaperBackground';

export default function FriendsScreen() {
  return (
    <ThemedView style={styles.fill}>
      <PaperBackground />
      <SafeAreaView style={styles.content}>
        <View style={styles.inner}>
          <ThemedText type="subtitle">Friends</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Coming soon — see how your friends are doing and cheer each other on.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
    gap: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
});
