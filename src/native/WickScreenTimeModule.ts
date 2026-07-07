import { requireOptionalNativeModule } from 'expo-modules-core';

import type { PermissionStatus } from '@/screentime/types';

/**
 * Contract for the (not-yet-built) native module that will bridge the platform
 * screen-time APIs:
 *   - iOS:     DeviceActivity / FamilyControls (Screen Time). Requires the Family
 *              Controls entitlement and an explicit authorization flow. Apple exposes
 *              aggregate on-device data to an extension; see NATIVE-INTEGRATION.md.
 *   - Android: UsageStatsManager (Digital Wellbeing). Requires PACKAGE_USAGE_STATS,
 *              which the user must grant in system Settings (no runtime dialog).
 *
 * It is intentionally tiny — everything downstream consumes {@link ScreenTimeProvider},
 * not this module. Implement it as a local Expo module (`expo-module`) plus a config
 * plugin, then rebuild with prebuild/CNG. Until the native side ships,
 * `requireOptionalNativeModule` returns null and the app falls back to manual/mock.
 */
export interface WickScreenTimeNativeModule {
  /** True on a build/OS where the native APIs are actually usable. */
  isSupported(): boolean;
  getAuthorizationStatus(): Promise<PermissionStatus>;
  /** Launch the platform authorization flow and resolve to the resulting status. */
  requestAuthorization(): Promise<PermissionStatus>;
  /** Cumulative on-screen minutes for the current local day. */
  getTodayMinutes(): Promise<number>;
  /** Optional daily totals for the last `days` days (most recent last). */
  getDailyMinutes?(days: number): Promise<{ date: string; minutes: number }[]>;
}

export const WickScreenTime = requireOptionalNativeModule<WickScreenTimeNativeModule>(
  'WickScreenTime',
);
