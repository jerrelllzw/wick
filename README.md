# wick 🕯️

Your day is a candle. It burns down as you use your phone. Cross your own 30-day
average and it burns out for the day; use less and more wax survives. A grid of
burnt-down candles becomes your history.

wick is a deliberately **anti-engagement** screen-time app: no nudges, no streak-shaming
pushes, no in-app shop, nothing designed to pull you back in. Most of its value is meant
to live on your **home and lock screen widgets** — it should be boring to open and
useful to glance at.

> Built on Expo SDK 57 / React Native 0.86 / Expo Router, TypeScript throughout.

## Design philosophy

- **Boring to open, useful to glance.** The app never encourages you to spend more time
  in it to track how little time you spend on your phone.
- **Punishing on purpose.** A burnt-out candle looks plainly bad — a charred, smoking
  stub. A close-but-survived day looks visibly worse than a light one. We lean into the
  discomfort rather than softening heavy days into "neutral."
- **No engagement bait.** See [DECISIONS.md](DECISIONS.md) for the full list of things
  we deliberately did *not* build (push nudges, quests, currency, feeds, loot boxes).

## What works today

Running the app right now (against the built-in demo/manual sources) gives you the
entire experience end-to-end:

- **Today** — a big candle at its live burn state, your usage vs. your personal limit,
  and blunt copy for each state (calibrating / burning / burnt out).
- **History** — a calendar heatmap of tiny candle sprites at their true burn heights,
  plus survival rate, streaks, biggest save, and burnout count.
- **Awards** — six one-off, milestone-based achievements (no daily grind).
- **Settings & onboarding** — pick a tracking source, tune the burn curve, and the
  permission-flow framing for the real device sources.

The device screen-time sources and the widgets are the two native pieces still to build;
the JavaScript sides of both are done and the seams are in place. See
[NATIVE-INTEGRATION.md](NATIVE-INTEGRATION.md) for the plan and an honest blocker
assessment.

## Running it

```bash
npm install
npx expo start        # then open in a dev build / simulator; defaults to demo data

npm run typecheck     # tsc --noEmit over the whole app
npm test              # the pure domain core, 49 unit tests (see below)
```

The demo source seeds a lived-in 40-day history so the candle, grid, and stats are all
populated immediately. Switch to **Manual entry** in Settings to log real numbers today,
before the native providers exist.

## The mechanic, precisely

- **Baseline / limit** = the mean of your most-recent up-to-30 **finalized prior** days
  (never today itself — the threshold is non-circular). Below 3 prior days you're
  *calibrating* and the candle can't burn out.
- **Burn** = `(usage / limit)²` by default (an *accelerating* curve — gentle early, steep
  near the limit). Reach the limit and the candle is burnt out and locked for the day.
- **A fresh candle every day.** Yesterday's outcome is recorded in history but never
  penalizes tomorrow's starting state.

All of this is pure, deterministic TypeScript in [`src/core`](src/core) with no native
or React dependencies — which is why it's exhaustively unit-tested.

## Architecture

Layered so the logic is testable and the platform is swappable:

```
src/
  core/        Pure domain — burn curve, rolling baseline, day eval, achievements,
               stats, and the day-rollover engine. No RN/Expo imports. 49 unit tests.
  data/        Persistence: schema + migrate(), a Repository interface, and the
               expo-sqlite key-value adapter.
  screentime/  The provider seam: device (native), manual, and mock, behind one
               ScreenTimeProvider interface.
  native/      Optional native-module lookups (returns null → graceful fallback).
  widgets/     WidgetSnapshot + the optional native widget bridge.
  state/       WickProvider — the one React hub wiring engine ⇄ repo ⇄ provider ⇄ clock.
  ui/          Candle (SVG), CandleGrid, Onboarding, UnlockBanner, colors, formatting.
  app/         Expo Router screens: _layout, index (Today), stats, achievements, settings.
  components/  constants/  hooks/   — the template's themed design system.
```

The pure core is verified in plain Node using type-stripping — no Jest, no RN transform:

```bash
npm test   # tsc -p tools/tsconfig.core.json && node --test .core-test-build
```

## Where to read more

- [DECISIONS.md](DECISIONS.md) — the ten open questions, answered, with rationale.
- [NATIVE-INTEGRATION.md](NATIVE-INTEGRATION.md) — device screen-time + widgets plan,
  iOS Screen Time constraints, config plugin, and the feasibility/blocker table.
- [native-templates/](native-templates/) — config-plugin scaffolding to start the
  native work.
