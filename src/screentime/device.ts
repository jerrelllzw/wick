import { WickScreenTime } from '@/native/WickScreenTimeModule';

import type { DailyMinutes, PermissionStatus, ScreenTimeProvider, ScreenTimeReading } from './types';

/**
 * The real device source. Delegates to the {@link WickScreenTime} native module; when
 * that module is absent (Expo Go, a build without the config plugin, or an
 * unsupported OS) every method degrades gracefully so onboarding can steer the user
 * to manual entry instead of crashing.
 */
export function createDeviceProvider(): ScreenTimeProvider {
  return {
    kind: 'device',
    isSupported: () => WickScreenTime?.isSupported() ?? false,

    async getPermissionStatus(): Promise<PermissionStatus> {
      if (!WickScreenTime) return 'unavailable';
      return WickScreenTime.getAuthorizationStatus();
    },

    async requestAuthorization(): Promise<PermissionStatus> {
      if (!WickScreenTime) return 'unavailable';
      return WickScreenTime.requestAuthorization();
    },

    async read(): Promise<ScreenTimeReading> {
      if (!WickScreenTime) {
        throw new Error('Native screen-time module is unavailable in this build.');
      }
      const todayMinutes = await WickScreenTime.getTodayMinutes();
      let history: DailyMinutes[] | undefined;
      if (WickScreenTime.getDailyMinutes) {
        history = await WickScreenTime.getDailyMinutes(30);
      }
      return { todayMinutes, history, capturedAt: Date.now() };
    },
  };
}
