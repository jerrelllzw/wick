import Storage from 'expo-sqlite/kv-store';

import { migrate, type PersistedState } from './schema';
import type { Repository } from './repository';

const STORAGE_KEY = 'wick.state';

/**
 * The production repository. Persists the whole app document as a single JSON blob
 * in `expo-sqlite`'s key-value store — an AsyncStorage-compatible API backed by
 * SQLite, so it is durable and synchronous-capable without us hand-rolling a schema
 * for what is only ~one row per day.
 */
export function createKvRepository(): Repository {
  return {
    async load(): Promise<PersistedState> {
      const raw = await Storage.getItem(STORAGE_KEY);
      if (!raw) return migrate(null);
      try {
        return migrate(JSON.parse(raw));
      } catch {
        // Corrupt blob — start clean rather than crash on launch.
        return migrate(null);
      }
    },

    async save(state: PersistedState): Promise<void> {
      await Storage.setItem(STORAGE_KEY, JSON.stringify(state));
    },

    async clear(): Promise<void> {
      await Storage.removeItem(STORAGE_KEY);
    },
  };
}
