import {
  DEFAULT_BASELINE_CONFIG,
  DEFAULT_BURN_CONFIG,
  type BaselineConfig,
  type BurnConfig,
  type DayKey,
  type DayRecord,
} from '@/core';
import type { ScreenTimeSourceKind } from '@/screentime/types';

export interface AppSettings {
  source: ScreenTimeSourceKind;
  burn: BurnConfig;
  baseline: BaselineConfig;
  /**
   * When an achievement unlocks, fire exactly one non-repeating local notification
   * (open question #8 — the least "naggy" option, alongside the widget badge). Never
   * a reminder, never a "come back" nudge.
   */
  notifyOnAchievement: boolean;
  onboardingComplete: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  // Device Screen Time is the only tracking source. Onboarding grants access to it.
  source: 'device',
  burn: DEFAULT_BURN_CONFIG,
  baseline: DEFAULT_BASELINE_CONFIG,
  notifyOnAchievement: true,
  onboardingComplete: false,
};

export const SCHEMA_VERSION = 1;

/** The full persisted document. Stored as a single JSON blob (data volume is tiny). */
export interface PersistedState {
  version: number;
  days: Record<DayKey, DayRecord>;
  unlockedAchievementIds: string[];
  /** achievementId -> the day it first unlocked, for the achievements screen. */
  achievementUnlockedOn: Record<string, DayKey>;
  settings: AppSettings;
}

export const EMPTY_PERSISTED_STATE: PersistedState = {
  version: SCHEMA_VERSION,
  days: {},
  unlockedAchievementIds: [],
  achievementUnlockedOn: {},
  settings: DEFAULT_SETTINGS,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function coerceDay(value: unknown, date: DayKey): DayRecord | null {
  if (!isRecord(value)) return null;
  const screenTimeMinutes = Number(value.screenTimeMinutes);
  if (!Number.isFinite(screenTimeMinutes)) return null;
  const baselineRaw = value.baselineMinutes;
  const baselineMinutes =
    baselineRaw == null || !Number.isFinite(Number(baselineRaw)) ? null : Number(baselineRaw);
  return {
    date,
    screenTimeMinutes: Math.max(0, screenTimeMinutes),
    baselineMinutes,
    finalized: Boolean(value.finalized),
  };
}

function coerceSource(value: unknown): ScreenTimeSourceKind {
  return value === 'device' || value === 'manual' || value === 'mock'
    ? value
    : DEFAULT_SETTINGS.source;
}

function coerceBurn(value: unknown): BurnConfig {
  if (isRecord(value) && (value.curve === 'linear' || value.curve === 'accelerating')) {
    const exponent = Number(value.exponent);
    return { curve: value.curve, exponent: Number.isFinite(exponent) ? exponent : DEFAULT_SETTINGS.burn.exponent };
  }
  return DEFAULT_SETTINGS.burn;
}

function coerceBaseline(value: unknown): BaselineConfig {
  if (isRecord(value)) {
    const windowDays = Number(value.windowDays);
    const minDaysToCalibrate = Number(value.minDaysToCalibrate);
    if (Number.isFinite(windowDays) && Number.isFinite(minDaysToCalibrate)) {
      return { windowDays, minDaysToCalibrate };
    }
  }
  return DEFAULT_SETTINGS.baseline;
}

function coerceStringRecord(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (isRecord(value)) {
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === 'string') out[k] = v;
    }
  }
  return out;
}

/**
 * Parse an untrusted stored blob into a valid {@link PersistedState}, filling in
 * defaults and dropping anything malformed. Future schema bumps branch on
 * `raw.version` here.
 */
export function migrate(raw: unknown): PersistedState {
  if (!isRecord(raw)) return EMPTY_PERSISTED_STATE;

  const days: Record<DayKey, DayRecord> = {};
  if (isRecord(raw.days)) {
    for (const [date, value] of Object.entries(raw.days)) {
      const day = coerceDay(value, date);
      if (day) days[date] = day;
    }
  }

  const settingsRaw = isRecord(raw.settings) ? raw.settings : {};
  const settings: AppSettings = {
    source: coerceSource(settingsRaw.source),
    burn: coerceBurn(settingsRaw.burn),
    baseline: coerceBaseline(settingsRaw.baseline),
    notifyOnAchievement:
      typeof settingsRaw.notifyOnAchievement === 'boolean'
        ? settingsRaw.notifyOnAchievement
        : DEFAULT_SETTINGS.notifyOnAchievement,
    onboardingComplete: Boolean(settingsRaw.onboardingComplete),
  };

  return {
    version: SCHEMA_VERSION,
    days,
    unlockedAchievementIds: Array.isArray(raw.unlockedAchievementIds)
      ? raw.unlockedAchievementIds.filter((x): x is string => typeof x === 'string')
      : [],
    achievementUnlockedOn: coerceStringRecord(raw.achievementUnlockedOn),
    settings,
  };
}
