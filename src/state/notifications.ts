import type { AchievementProgress } from '@/core';

/**
 * Surface an achievement unlock with the least-naggy delivery (open question #8): a
 * single, non-repeating local notification at unlock time — never a reminder, never a
 * "come back" nudge. It is a no-op until `expo-notifications` is added (see
 * NATIVE-INTEGRATION.md); the in-app banner and the widget badge already announce the
 * unlock, so this channel is purely additive and easy to leave off.
 */
export async function notifyAchievementUnlocked(
  _achievement: AchievementProgress,
  _enabled: boolean,
): Promise<void> {
  // TODO(native): if (_enabled) schedule a one-off local notification.
}
