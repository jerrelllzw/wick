import { EMPTY_PERSISTED_STATE, type PersistedState } from './schema';

/** Persistence seam. The app depends on this interface, never on a storage engine. */
export interface Repository {
  load(): Promise<PersistedState>;
  save(state: PersistedState): Promise<void>;
  clear(): Promise<void>;
}

/** Volatile repository for previews, Storybook, and tests. */
export class InMemoryRepository implements Repository {
  private state: PersistedState;

  constructor(initial: PersistedState = EMPTY_PERSISTED_STATE) {
    this.state = initial;
  }

  async load(): Promise<PersistedState> {
    return this.state;
  }

  async save(state: PersistedState): Promise<void> {
    this.state = state;
  }

  async clear(): Promise<void> {
    this.state = EMPTY_PERSISTED_STATE;
  }
}
