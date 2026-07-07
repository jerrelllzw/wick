/**
 * Expo config plugin for wick's native needs. TEMPLATE — wires the entitlements and
 * permissions the native modules require; the widget *targets* themselves are best
 * generated with `@bacons/apple-targets` (see NATIVE-INTEGRATION.md).
 *
 * Enable by adding "./native-templates/withWickNative" to `expo.plugins` in app.json,
 * then re-running `npx expo prebuild`.
 */
const { withEntitlementsPlist, withAndroidManifest } = require('@expo/config-plugins');

/** Shared container used by the app, the screen-time report extension, and the widgets. */
const APP_GROUP = 'group.com.wick.shared';

function withIosEntitlements(config) {
  return withEntitlementsPlist(config, (cfg) => {
    // Screen Time. NOTE: com.apple.developer.family-controls must be approved by Apple.
    cfg.modResults['com.apple.developer.family-controls'] = true;
    const groups = new Set(cfg.modResults['com.apple.security.application-groups'] ?? []);
    groups.add(APP_GROUP);
    cfg.modResults['com.apple.security.application-groups'] = [...groups];
    return cfg;
  });
}

function withAndroidUsageStats(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] ?? [];
    const has = manifest['uses-permission'].some(
      (p) => p.$?.['android:name'] === 'android.permission.PACKAGE_USAGE_STATS',
    );
    if (!has) {
      manifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.PACKAGE_USAGE_STATS',
          'tools:ignore': 'ProtectedPermissions',
        },
      });
    }
    return cfg;
  });
}

module.exports = function withWickNative(config) {
  config = withIosEntitlements(config);
  config = withAndroidUsageStats(config);
  return config;
};

module.exports.APP_GROUP = APP_GROUP;
