import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import type { AchievementProgress } from '@/core';
import { useTheme } from '@/hooks/use-theme';
import { useWick } from '@/state/AppStateProvider';
import { formatDayKeyLong } from '@/ui/format';
import { useTone } from '@/ui/tone';

export default function AchievementsScreen() {
	const { achievements } = useWick();
	const insets = useSafeAreaInsets();
	const theme = useTheme();

	const earned = achievements.filter((a) => a.unlocked).length;

	return (
		<ScrollView
			style={[styles.scroll, { backgroundColor: theme.background }]}
			contentContainerStyle={[
				styles.content,
				{ paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.five },
			]}
		>
			<View style={styles.inner}>
				<View style={styles.header}>
					<ThemedText type='subtitle'>Awards</ThemedText>
					<ThemedText type='small' themeColor='textSecondary'>
						{earned} of {achievements.length} earned
					</ThemedText>
				</View>

				<View style={styles.list}>
					{achievements.map((item) => (
						<AchievementRow key={item.def.id} item={item} />
					))}
				</View>
			</View>
		</ScrollView>
	);
}

function AchievementRow({ item }: { item: AchievementProgress }) {
	const tone = useTone();
	const unlocked = item.unlocked;

	return (
		<ThemedView
			type='backgroundElement'
			style={[
				styles.row,
				unlocked ? [styles.rowUnlocked, { borderColor: tone.good }] : styles.rowLocked,
			]}
		>
			<View
				style={[
					styles.badge,
					{
						backgroundColor: unlocked ? tone.goodBg : tone.neutralBg,
						borderColor: unlocked ? tone.good : tone.hairline,
					},
				]}
			>
				<ThemedText style={styles.glyph}>{unlocked ? item.def.glyph : '🔒'}</ThemedText>
			</View>
			<View style={styles.rowText}>
				<ThemedText type='smallBold'>{item.def.title}</ThemedText>
				<ThemedText type='small' themeColor='textSecondary'>
					{item.def.description}
				</ThemedText>
				{unlocked && item.unlockedOn && (
					<ThemedText type='small' style={{ color: tone.good }}>
						Earned {formatDayKeyLong(item.unlockedOn)}
					</ThemedText>
				)}
			</View>
		</ThemedView>
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
	header: {
		gap: Spacing.one,
	},
	list: {
		gap: Spacing.two,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.three,
		borderRadius: Spacing.three,
		padding: Spacing.three,
	},
	rowLocked: {
		opacity: 0.55,
	},
	rowUnlocked: {
		borderWidth: 1,
	},
	badge: {
		width: 52,
		height: 52,
		borderRadius: 26,
		borderWidth: StyleSheet.hairlineWidth,
		alignItems: 'center',
		justifyContent: 'center',
	},
	glyph: {
		fontSize: 24,
	},
	rowText: {
		flex: 1,
		gap: Spacing.half,
	},
});
