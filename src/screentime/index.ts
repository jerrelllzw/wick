import { createDeviceProvider } from './device';
import { createManualProvider } from './manual';
import { createMockProvider } from './mock';
import type { ScreenTimeProvider, ScreenTimeSourceKind } from './types';

export * from './types';
export { createDeviceProvider, createManualProvider, createMockProvider };

export interface ProviderDeps {
  /** Returns the current stored cumulative minutes for today (used by manual mode). */
  getStoredTodayMinutes: () => number;
}

/** Build the provider for a chosen source. */
export function createProvider(
  kind: ScreenTimeSourceKind,
  deps: ProviderDeps,
): ScreenTimeProvider {
  switch (kind) {
    case 'device':
      return createDeviceProvider();
    case 'manual':
      return createManualProvider(deps.getStoredTodayMinutes);
    case 'mock':
    default:
      return createMockProvider();
  }
}

/** Whether the real device source can run in this build right now. */
export function deviceSourceAvailable(): boolean {
  return createDeviceProvider().isSupported();
}
