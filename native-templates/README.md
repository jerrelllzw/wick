# native-templates

Reference scaffolding for the native work that can't live in JavaScript. These files
are **not** wired into the build — they're a starting point. See
[../NATIVE-INTEGRATION.md](../NATIVE-INTEGRATION.md) for the full plan, the iOS
Screen Time constraints, and the feasibility/blocker assessment.

- `withWickNative.js` — Expo config plugin: adds the iOS `family-controls` entitlement +
  App Group and the Android `PACKAGE_USAGE_STATS` permission. Enable it in `app.json`
  and re-run `npx expo prebuild`.

Still to author (as a local Expo module + widget targets, per the doc):
- `WickScreenTime` native module — iOS `DeviceActivity`/`FamilyControls`, Android
  `UsageStatsManager`.
- `WickWidgetBridge` native module — writes the `WidgetSnapshot` to the shared
  container and reloads widget timelines.
- WidgetKit extension (home + lock screen) and Android `AppWidgetProvider`.
