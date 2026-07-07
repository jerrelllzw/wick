# wick — Native integration & widgets

This is the plan for the two pieces that can't be pure JavaScript: **device
screen-time access** and **widgets**. It also gives an honest read on what's feasible
inside Expo and what the real blockers are (the brief asked us to surface these early).

## TL;DR feasibility

| Piece | Feasible in Expo? | Risk | Notes |
| --- | --- | --- | --- |
| Android usage stats | ✅ Yes | Low | `UsageStatsManager`; gives real per-day totals + history. |
| iOS burnout trigger | ✅ Yes | Medium | `DeviceActivityMonitor` threshold = your personal average. Maps perfectly onto "burn out when you cross it." |
| iOS *continuous* total | ⚠️ Partial | **High** | Apple does not hand raw totals to your app process. You get them only inside a `DeviceActivityReport` extension and must shuttle an aggregate through an App Group. |
| `FamilyControls` entitlement | ⚠️ Gated | Medium | Must be requested from Apple; approval is a process, not a checkbox. |
| iOS widgets (home + lock) | ✅ Yes | **High (wiring)** | WidgetKit works; adding the extension **target** is the fiddliest part — use `@bacons/apple-targets`. |
| Android widgets (home) | ✅ Yes | Low | `AppWidgetProvider` + `RemoteViews`. No lock-screen widgets exist on Android. |
| Staying in Expo Go / managed | ❌ No | — | All of the above needs **prebuild / CNG** and a **development build**. |

**Bottom line:** nothing here blocks the core mechanic. The one genuine constraint is
that a *smooth, exact, live* burn gradient from iOS is hard — but our burnout event maps
onto a `DeviceActivityMonitor` threshold, which iOS *does* support, and the manual/mock
providers keep the app fully functional today.

## The seam (already built on the JS side)

The app never imports a native module directly. It depends on two small contracts, and
both fall back to no-ops/other sources when the native side is absent:

- `ScreenTimeProvider` — [src/screentime/types.ts](src/screentime/types.ts). Device
  implementation delegates to the optional native module `WickScreenTime`
  ([src/native/WickScreenTimeModule.ts](src/native/WickScreenTimeModule.ts)).
- Widget bridge — [src/widgets/bridge.ts](src/widgets/bridge.ts) delegates to the
  optional native module `WickWidgetBridge`, publishing a tiny
  [`WidgetSnapshot`](src/widgets/snapshot.ts).

So the native work is: **implement two Expo modules named `WickScreenTime` and
`WickWidgetBridge`, add the widget targets, and wire entitlements via a config plugin.**

## Step 0 — Move to a development build (prebuild / CNG)

```bash
npx expo prebuild          # generates ios/ and android/ (CNG)
# add the config plugin (below) to app.json first
npx expo run:ios           # or run:android — builds a dev client
```

Expo Go cannot load custom native modules or app extensions. Everything below assumes a
dev build.

## Step 1 — The local Expo module

```bash
npx create-expo-module@latest --local
# name it e.g. wick-native; export module classes named
#   "WickScreenTime" and "WickWidgetBridge"
```

The exported module names **must** match the strings in
`requireOptionalNativeModule('WickScreenTime')` and `'WickWidgetBridge'`.

### The `WickScreenTime` contract the app expects
```ts
isSupported(): boolean
getAuthorizationStatus(): Promise<'unavailable'|'undetermined'|'denied'|'granted'>
requestAuthorization(): Promise<...same...>
getTodayMinutes(): Promise<number>
getDailyMinutes?(days: number): Promise<{ date: string; minutes: number }[]>
```

## Step 2 — iOS screen time (FamilyControls + DeviceActivity)

### The constraint, plainly
Third-party apps **cannot read raw screen-time totals in-process**. Apple gives you two
sanctioned tools:

1. **`DeviceActivityMonitor`** — schedule a day-long `DeviceActivitySchedule` with a
   `DeviceActivityEvent` whose threshold is the user's rolling average. iOS wakes your
   monitor extension at `eventDidReachThreshold`. → This is our **burn-out signal** and
   it's a clean fit.
2. **`DeviceActivityReport`** — a SwiftUI extension that receives aggregated
   `DeviceActivityData`. It can compute a daily total and **write it to a shared App
   Group** (`UserDefaults(suiteName:)`), which the app and widget then read. This is how
   you get a *number* for the continuous gradient — indirect and the trickiest bit.

You choose apps/categories with `FamilyActivityPicker` (opaque tokens — you never see
which apps, by design).

### Authorization (Swift, in the module — template)
```swift
import FamilyControls
import DeviceActivity

// Requires the com.apple.developer.family-controls entitlement (request from Apple).
func requestAuthorization() async -> String {
  do {
    try await AuthorizationCenter.shared.requestAuthorization(for: .individual) // iOS 16+
    return "granted"
  } catch { return "denied" }
}
```

`getTodayMinutes()` reads the aggregate the report extension wrote to the App Group; if
none is present yet, resolve `0` and let the monitor's threshold event drive burnout.

### Blockers to flag now
- **Entitlement approval** from Apple for `com.apple.developer.family-controls`.
- **No exact live total** without the report-extension + App Group dance.
- Simulator support for these frameworks is spotty — test on device.

## Step 3 — Android screen time (UsageStatsManager)

Comparatively easy and gives real daily totals *and* history (great for warming the
rolling baseline via `seedHistory`).

```kotlin
// Permission is granted in Settings, not via a dialog:
fun requestAuthorization() {
  context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
}

fun hasPermission(): Boolean {
  val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
  val mode = ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
    Process.myUid(), context.packageName)
  return mode == AppOpsManager.MODE_ALLOWED
}

fun todayMinutes(): Long {
  val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
  val start = /* local midnight */; val end = System.currentTimeMillis()
  val stats = usm.queryAndAggregateUsageStats(start, end)
  val totalMs = stats.values.sumOf { it.totalTimeInForeground }
  return totalMs / 60000
}
```

Add `<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS"
tools:ignore="ProtectedPermissions"/>` via the config plugin.

## Step 4 — Widgets

### `WickWidgetBridge` contract the app expects
```ts
setSnapshot(json: string): void   // write WidgetSnapshot JSON to the shared container
reloadAll(): void                 // WidgetCenter.reloadAllTimelines() / AppWidget update
```
The app calls this automatically whenever the candle changes
([AppStateProvider](src/state/AppStateProvider.tsx)).

### iOS WidgetKit (home + lock screen)
Read the snapshot from the App Group in a `TimelineProvider`; support home families and
the lock-screen accessory families. The circular accessory is a natural fit — draw a
ring/candle filled to `1 - burn`.

```swift
struct WickWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "WickWidget", provider: Provider()) { entry in
      WickWidgetView(entry: entry)   // reads snapshot.json from the App Group
    }
    .supportedFamilies([
      .systemSmall, .systemMedium,               // home screen
      .accessoryCircular, .accessoryRectangular, // lock screen (iOS 16+)
      .accessoryInline,
    ])
  }
}
```

**Refresh budget:** WidgetKit allows only ~40–70 timeline reloads/day. We push via
`reloadAllTimelines()` on real changes and let the timeline refresh a few times a day.
This is a *feature* for us — it aligns with the "not real-time, boring to glance at"
goal, so don't fight it with background hacks.

**Adding the target:** creating a WidgetKit **extension target** is the fiddliest part
of the whole project. Use **[`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets)**
— it lets you define the widget as a Swift target that the config plugin materializes
during prebuild, instead of hand-editing the Xcode project. This is the single biggest
build-system risk in the app; budget time for it.

### Android App Widgets (home only)
`AppWidgetProvider` + `RemoteViews`, updated from the bridge. Android has **no
lock-screen widget** equivalent, so the lock-screen surface is iOS-only.

```kotlin
class WickWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    val snapshot = readSnapshotFromPrefs(ctx) // written by WickWidgetBridge.setSnapshot
    val views = RemoteViews(ctx.packageName, R.layout.wick_widget)
    // bind headline + draw the candle at (1 - snapshot.burn)
    ids.forEach { mgr.updateAppWidget(it, views) }
  }
}
```

## Step 5 — The config plugin

A template lives at
[native-templates/withWickNative.js](native-templates/withWickNative.js). It stubs the
iOS entitlements + App Group and the Android permission + widget receiver. Add it to
`app.json`:

```json
{ "expo": { "plugins": ["expo-router", "expo-splash-screen", "./native-templates/withWickNative"] } }
```

Then re-run `npx expo prebuild`.

## Recommended sequencing
1. **Android device provider** (fast win, real data + history).
2. **iOS `DeviceActivityMonitor` burnout threshold** (the core mechanic on iOS).
3. **iOS `DeviceActivityReport` → App Group aggregate** (enables the live gradient).
4. **iOS home-screen widget**, then **lock-screen accessory**, then **Android widget**.
5. Backend + leaderboards (separate track — see [DECISIONS.md](DECISIONS.md) #1).

Until 1–3 land, ship with **manual entry** as the real source and **demo** for
exploration — both already work.
