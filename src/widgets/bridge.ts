import { requireOptionalNativeModule } from 'expo-modules-core';

import type { WidgetSnapshot } from './snapshot';

/**
 * Native bridge that hands a snapshot to the widget extensions. Implement it in the
 * same local Expo module that hosts the widgets (see NATIVE-INTEGRATION.md):
 *   - iOS:     write JSON into the shared App Group container, then
 *              `WidgetCenter.shared.reloadAllTimelines()`.
 *   - Android: write to SharedPreferences, then broadcast an AppWidget update.
 *
 * Absent (Expo Go / no config plugin), this is a no-op so the app runs unchanged.
 */
interface WickWidgetBridgeModule {
  setSnapshot(json: string): void;
  reloadAll(): void;
}

const bridge = requireOptionalNativeModule<WickWidgetBridgeModule>('WickWidgetBridge');

export function widgetBridgeAvailable(): boolean {
  return bridge != null;
}

/**
 * Best-effort publish of the current candle to the widgets. Respects the OS refresh
 * budget by design: we only push when the snapshot actually changes, and WidgetKit
 * coalesces reloads — we never try to force real-time updates.
 */
export function publishWidgetSnapshot(snapshot: WidgetSnapshot): void {
  if (!bridge) return;
  try {
    bridge.setSnapshot(JSON.stringify(snapshot));
    bridge.reloadAll();
  } catch {
    // Widgets are non-critical; never let a bridge hiccup surface to the user.
  }
}
