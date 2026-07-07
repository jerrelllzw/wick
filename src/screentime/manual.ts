import type { PermissionStatus, ScreenTimeProvider, ScreenTimeReading } from './types';

/**
 * Manual-entry source (the iOS/Android fallback when native access is unavailable or
 * declined — open questions #3 and #4). It never fetches; the user types today's
 * total in the app, which the state layer folds in via an exact engine update. `read`
 * just echoes the currently-stored value so a passive refresh is a harmless no-op.
 */
export function createManualProvider(getStoredTodayMinutes: () => number): ScreenTimeProvider {
  return {
    kind: 'manual',
    isSupported: () => true,
    async getPermissionStatus(): Promise<PermissionStatus> {
      return 'granted';
    },
    async requestAuthorization(): Promise<PermissionStatus> {
      return 'granted';
    },
    async read(): Promise<ScreenTimeReading> {
      return { todayMinutes: Math.max(0, getStoredTodayMinutes()), capturedAt: Date.now() };
    },
  };
}
