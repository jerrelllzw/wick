# wick — Decisions on the open questions

This records the calls made on the ten open questions from the build brief, and why.
Anything marked **Deferred** is intentionally out of v1 but the architecture already
leaves room for it.

## 1. Backend / sync — **Local-only for v1**
Ship as a fully local, single-device app first. All state lives on-device in
`expo-sqlite` (via its key-value store). Leaderboards wait for a backend.

Why: the core loop (track → burn → survive/burn-out → history) needs no server, and
staying local removes a privacy surface and a whole class of engagement-loop
temptation. The data layer is already behind a `Repository` interface
([src/data/repository.ts](src/data/repository.ts)), so adding a sync adapter later is
additive, not a rewrite.

When we do add it: **Supabase** is the lightest fit — Postgres + row-level security +
anonymous/OTP auth, and we only need two tiny tables (friend edges, daily summary rows
of `{userId, date, survived, burn, screenTimeMinutes}`). Firebase is the alternative;
Supabase wins on the SQL model matching our day-record shape and on not dragging in a
heavy SDK.

## 2. Friend connections — **Invite code / link (deferred with the backend)**
Lightest possible: a short invite code or deep link, no contact-book scraping and no
username directory to moderate. Contact sync is a privacy cost that fights the app's
minimalism. Deferred until #1 exists.

## 3. iOS Screen Time permissions — **Provider abstraction + manual/threshold fallback**
Apple heavily restricts raw screen-time access (see
[NATIVE-INTEGRATION.md](NATIVE-INTEGRATION.md) for the specifics). We do **not** assume
granular per-app data. The app talks to a `ScreenTimeProvider`
([src/screentime/types.ts](src/screentime/types.ts)) with three implementations —
device, manual, and mock — so if fine-grained data is unavailable we degrade to
`DeviceActivityMonitor` threshold events (which map perfectly onto "you crossed your
average → burn out") plus a manual-entry fallback, with zero UI changes.

## 4. Android usage-stats permission — **Onboarding built around the Settings redirect**
`PACKAGE_USAGE_STATS` can't be granted from a runtime dialog. `requestAuthorization()`
on the Android provider opens the Usage Access settings screen, and both onboarding and
Settings copy explain the friction up front ("Android needs Usage Access granted in
system Settings — it can't be granted from a pop-up"). See
[src/app/settings.tsx](src/app/settings.tsx) and [src/ui/Onboarding.tsx](src/ui/Onboarding.tsx).

## 5. Burn-curve shape — **Accelerating (`burn = (usage / limit)²`), configurable**
Default is the accelerating curve; linear is a toggle in Settings. The candle melts
slowly early in the day and drops off steeply near the personal limit — the "danger
zone" — which serves the deliberately punishing tone. A day at 90% of your average is
already ~81% burnt while a light day at 20% is ~4% burnt, so a close-but-survived day
visibly looks far worse than a genuinely light one (a requirement in the brief).
Implemented in [src/core/burn.ts](src/core/burn.ts), tested in
[src/core/burn.test.ts](src/core/burn.test.ts).

## 6. Focus sessions (Forest-style) — **Deferred to v2**
Attractive, but it's an *additive engagement mechanic* — the exact kind of "spend time
in the app" pull the brief warns against. v1 stays purely passive/observational. If
added later it maps cleanly onto "add wax back," and the engine already treats screen
time as the only input, so it slots in without disturbing the model.

## 7. Relative-leaderboard categories — **Not needed; survival-rate is the fair metric**
Ranking on "% of days your candle survived vs. **your own** rolling average" is already
fair to heavy-work-phone users without any per-app-category data. `survivalRate` is
computed in [src/core/stats.ts](src/core/stats.ts) and is exactly this number. Category
exclusion (Slack/email) is deferred — it adds real complexity for marginal fairness gain.

## 8. Achievement unlock delivery — **The three quietest surfaces, no nagging**
1. An in-app banner the moment it happens ([src/ui/UnlockBanner.tsx](src/ui/UnlockBanner.tsx)),
   tap-to-dismiss, never re-shown.
2. A quiet badge on the widget (`awardGlyph` in the widget snapshot).
3. **Optionally** a single, non-repeating local notification at unlock time — never a
   reminder, never a "come back" nudge. Off/on via `notifyOnAchievement` (default on);
   the firing itself is stubbed in [src/state/notifications.ts](src/state/notifications.ts)
   pending `expo-notifications`.

No badge counts that persist, no "you haven't opened the app" messages.

## 9. Monetization — **None in v1; flat price or one-time cosmetics later**
No IAP, no ads, no loot boxes, no engagement-driven anything. If it ever needs revenue:
a flat one-time purchase, or one-time cosmetic candle packs. Nothing that rewards
opening the app more.

## 10. Platform priority — **iOS first, platform-agnostic JS**
Build order favors iOS: its Screen Time and WidgetKit stories are more mature, and
**lock-screen widgets are iOS-only** and are the single highest-value surface for a
"never even open the app" design. Everything above the native seam (the entire
`src/` tree, ~all the logic and UI) is platform-agnostic and already bundles for both;
only the two native modules and the widget targets are iOS-first.

---

### Snapshot of what's live now vs. pending native work
| Area | v1 status |
| --- | --- |
| Burn / baseline / achievements / stats engine | ✅ Done, unit-tested (49 tests) |
| App UI (Today, History grid, Awards, Settings, Onboarding) | ✅ Done, bundles for iOS |
| Local persistence (`expo-sqlite`) | ✅ Done |
| Mock + manual screen-time sources | ✅ Done |
| Device screen-time (iOS DeviceActivity / Android UsageStats) | ⛔ Native module — see NATIVE-INTEGRATION.md |
| Widgets (WidgetKit + App Widgets) | ⛔ Native extensions — bridge + snapshot ready on the JS side |
| Leaderboards / friends | ⏸ Deferred (needs backend) |
| Focus sessions | ⏸ Deferred to v2 |
