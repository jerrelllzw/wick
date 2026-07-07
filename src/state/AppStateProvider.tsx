import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState as RNAppState } from 'react-native';

import {
  advance,
  computeStats,
  dayKeyFromDate,
  evaluateAchievements,
  evaluateCandle,
  evaluatedHistory,
  type AchievementProgress,
  type BurnConfig,
  type CandleState,
  type HistoryStats,
} from '@/core';
import {
  createKvRepository,
  DEFAULT_SETTINGS,
  EMPTY_PERSISTED_STATE,
  type AppSettings,
  type PersistedState,
  type Repository,
} from '@/data';
import {
  createProvider,
  deviceSourceAvailable,
  type PermissionStatus,
  type ScreenTimeProvider,
  type ScreenTimeSourceKind,
} from '@/screentime';

import { buildWidgetSnapshot, publishWidgetSnapshot } from '@/widgets';

import { applyEngineState, seedHistory, toEngineState } from './derive';
import { notifyAchievementUnlocked } from './notifications';

/** Everything a screen needs. Read the derived candle/history/stats; call the actions. */
export interface WickStore {
  ready: boolean;
  settings: AppSettings;
  today: string;
  candleToday: CandleState | null;
  /** Finalized days, chronologically ascending — for the stats grid. */
  history: CandleState[];
  stats: HistoryStats;
  achievements: AchievementProgress[];
  /** Newly-unlocked achievements awaiting an in-app acknowledgement. */
  pendingUnlocks: AchievementProgress[];
  sourceStatus: PermissionStatus;
  deviceAvailable: boolean;

  refresh: () => Promise<void>;
  setManualMinutes: (minutes: number) => Promise<void>;
  setSource: (kind: ScreenTimeSourceKind) => Promise<void>;
  requestPermission: () => Promise<PermissionStatus>;
  completeOnboarding: () => Promise<void>;
  setNotifyOnAchievement: (value: boolean) => Promise<void>;
  setBurnCurve: (curve: BurnConfig['curve']) => Promise<void>;
  dismissUnlock: (id: string) => void;
  resetAll: () => Promise<void>;
}

const WickContext = createContext<WickStore | null>(null);

export function useWick(): WickStore {
  const ctx = useContext(WickContext);
  if (!ctx) throw new Error('useWick must be used inside <WickProvider>');
  return ctx;
}

/** How often to re-read the source while the app is foregrounded. */
const ACTIVE_POLL_MS = 60_000;

export function WickProvider({
  children,
  repository,
}: {
  children: ReactNode;
  /** Injectable for tests/previews; defaults to the SQLite-backed repository. */
  repository?: Repository;
}) {
  const repoRef = useRef<Repository>(repository ?? createKvRepository());
  const persistedRef = useRef<PersistedState>(EMPTY_PERSISTED_STATE);
  const providerRef = useRef<ScreenTimeProvider | null>(null);

  const [persisted, setPersistedState] = useState<PersistedState>(EMPTY_PERSISTED_STATE);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState<string>(() => dayKeyFromDate(new Date()));
  const [pendingUnlocks, setPendingUnlocks] = useState<AchievementProgress[]>([]);
  const [sourceStatus, setSourceStatus] = useState<PermissionStatus>('undetermined');
  const deviceAvailable = useMemo(() => deviceSourceAvailable(), []);

  const commit = useCallback((next: PersistedState) => {
    persistedRef.current = next;
    setPersistedState(next);
    // Fire-and-forget persistence; the in-memory ref is the source of truth for reads.
    void repoRef.current.save(next);
  }, []);

  const buildProvider = useCallback((kind: ScreenTimeSourceKind) => {
    providerRef.current = createProvider(kind, {
      getStoredTodayMinutes: () => {
        const key = dayKeyFromDate(new Date());
        return persistedRef.current.days[key]?.screenTimeMinutes ?? 0;
      },
    });
  }, []);

  const refresh = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider) return;

    let reading;
    try {
      reading = await provider.read();
    } catch {
      // Source unavailable/denied — leave state untouched; the UI reflects sourceStatus.
      return;
    }

    const current = persistedRef.current;
    const now = dayKeyFromDate(new Date());
    const engineSeeded = seedHistory(
      toEngineState(current),
      reading.history,
      current.settings.baseline,
    );
    const result = advance(engineSeeded, now, reading.todayMinutes, {
      burn: current.settings.burn,
      baseline: current.settings.baseline,
      exact: provider.kind === 'manual',
    });

    const unlockedOn = { ...current.achievementUnlockedOn };
    for (const a of result.newlyUnlocked) {
      if (a.unlockedOn) unlockedOn[a.def.id] = a.unlockedOn;
    }

    setToday(now);
    commit(applyEngineState(current, result.state, unlockedOn));

    if (result.newlyUnlocked.length > 0) {
      setPendingUnlocks((prev) => [...prev, ...result.newlyUnlocked]);
      for (const a of result.newlyUnlocked) {
        void notifyAchievementUnlocked(a, current.settings.notifyOnAchievement);
      }
    }
  }, [commit]);

  // Load persisted state, build the provider, read the source once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await repoRef.current.load();
      if (cancelled) return;
      persistedRef.current = loaded;
      setPersistedState(loaded);
      buildProvider(loaded.settings.source);
      const status = await providerRef.current!.getPermissionStatus();
      if (cancelled) return;
      setSourceStatus(status);
      setReady(true);
      await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [buildProvider, refresh]);

  // Re-read on foreground, and poll gently while active.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });
    const interval = setInterval(() => {
      if (RNAppState.currentState === 'active') void refresh();
    }, ACTIVE_POLL_MS);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [refresh]);

  const setManualMinutes = useCallback(
    async (minutes: number) => {
      const current = persistedRef.current;
      const now = dayKeyFromDate(new Date());
      const result = advance(toEngineState(current), now, minutes, {
        burn: current.settings.burn,
        baseline: current.settings.baseline,
        exact: true,
      });
      const unlockedOn = { ...current.achievementUnlockedOn };
      for (const a of result.newlyUnlocked) if (a.unlockedOn) unlockedOn[a.def.id] = a.unlockedOn;
      setToday(now);
      commit(applyEngineState(current, result.state, unlockedOn));
      if (result.newlyUnlocked.length > 0) {
        setPendingUnlocks((prev) => [...prev, ...result.newlyUnlocked]);
      }
    },
    [commit],
  );

  const persistSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      const current = persistedRef.current;
      const next = { ...current, settings: { ...current.settings, ...patch } };
      commit(next);
      return next;
    },
    [commit],
  );

  const setSource = useCallback(
    async (kind: ScreenTimeSourceKind) => {
      persistSettings({ source: kind });
      buildProvider(kind);
      const status = await providerRef.current!.getPermissionStatus();
      setSourceStatus(status);
      await refresh();
    },
    [buildProvider, persistSettings, refresh],
  );

  const requestPermission = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider) return 'unavailable' as PermissionStatus;
    const status = await provider.requestAuthorization();
    setSourceStatus(status);
    if (status === 'granted') await refresh();
    return status;
  }, [refresh]);

  const completeOnboarding = useCallback(async () => {
    persistSettings({ onboardingComplete: true });
  }, [persistSettings]);

  const setNotifyOnAchievement = useCallback(
    async (value: boolean) => {
      persistSettings({ notifyOnAchievement: value });
    },
    [persistSettings],
  );

  const setBurnCurve = useCallback(
    async (curve: BurnConfig['curve']) => {
      const current = persistedRef.current;
      persistSettings({ burn: { ...current.settings.burn, curve } });
    },
    [persistSettings],
  );

  const dismissUnlock = useCallback((id: string) => {
    setPendingUnlocks((prev) => prev.filter((a) => a.def.id !== id));
  }, []);

  const resetAll = useCallback(async () => {
    await repoRef.current.clear();
    const fresh: PersistedState = { ...EMPTY_PERSISTED_STATE, settings: DEFAULT_SETTINGS };
    persistedRef.current = fresh;
    setPersistedState(fresh);
    setPendingUnlocks([]);
    buildProvider(fresh.settings.source);
    await refresh();
  }, [buildProvider, refresh]);

  const burn = persisted.settings.burn;
  const days = useMemo(() => Object.values(persisted.days), [persisted.days]);

  const candleToday = useMemo(() => {
    const record = persisted.days[today];
    return record ? evaluateCandle(record, { burn }) : null;
  }, [persisted.days, today, burn]);

  const history = useMemo(() => evaluatedHistory(days, { burn }), [days, burn]);
  const stats = useMemo(() => computeStats(days, { burn }), [days, burn]);
  const achievements = useMemo(() => evaluateAchievements(days, { burn }), [days, burn]);

  // Push today's candle to the home/lock-screen widgets whenever it changes. No-op
  // until the native widget bridge exists; WidgetKit coalesces the reloads for us.
  useEffect(() => {
    publishWidgetSnapshot(buildWidgetSnapshot(candleToday, pendingUnlocks[0]?.def.glyph));
  }, [candleToday, pendingUnlocks]);

  const value: WickStore = {
    ready,
    settings: persisted.settings,
    today,
    candleToday,
    history,
    stats,
    achievements,
    pendingUnlocks,
    sourceStatus,
    deviceAvailable,
    refresh,
    setManualMinutes,
    setSource,
    requestPermission,
    completeOnboarding,
    setNotifyOnAchievement,
    setBurnCurve,
    dismissUnlock,
    resetAll,
  };

  return <WickContext.Provider value={value}>{children}</WickContext.Provider>;
}
