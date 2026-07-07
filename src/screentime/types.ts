import type { DayKey } from '@/core';

/** Where today's screen-time number comes from. */
export type ScreenTimeSourceKind = 'device' | 'manual' | 'mock';

export type PermissionStatus =
  | 'unavailable' // the source cannot work on this device/build (e.g. native module missing)
  | 'undetermined' // never asked
  | 'denied' // user (or system) refused
  | 'granted';

export interface DailyMinutes {
  date: DayKey;
  minutes: number;
}

export interface ScreenTimeReading {
  /** Cumulative screen time so far today, in minutes. */
  todayMinutes: number;
  /**
   * Optional back-fill of prior daily totals, when the platform can provide them
   * (Android UsageStatsManager can look back ~7 days; iOS is far more restricted —
   * see NATIVE-INTEGRATION.md). Used to warm up the rolling baseline.
   */
  history?: DailyMinutes[];
  /** Epoch ms when this reading was captured. */
  capturedAt: number;
}

/**
 * The single seam between the pure app engine and the platform. Every source
 * (real device APIs, manual entry, and the dev mock) implements this, so the rest
 * of the app never imports a native module directly and stays fully testable.
 */
export interface ScreenTimeProvider {
  readonly kind: ScreenTimeSourceKind;
  /** True if this source can function in the current build/device. */
  isSupported(): boolean;
  getPermissionStatus(): Promise<PermissionStatus>;
  /** Run the platform authorization flow (or a no-op) and return the new status. */
  requestAuthorization(): Promise<PermissionStatus>;
  /** Read today's cumulative minutes (plus history when available). */
  read(): Promise<ScreenTimeReading>;
}
