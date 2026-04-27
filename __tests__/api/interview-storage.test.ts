import { describe, it, expect } from '@jest/globals';
import {
  INTERVIEW_SESSION_STORAGE_KEY,
  INTERVIEW_USER_STORAGE_KEY,
  LEGACY_USER_STORAGE_KEY,
  clearInterviewIdentity,
  getStoredInterviewUserId,
  persistInterviewIdentity,
} from '@/lib/interviewStorage';

function createMemoryStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
}

describe('Interview storage helpers', () => {
  it('falls back to the legacy userId key when the interview-specific key is missing', () => {
    const storage = createMemoryStorage({
      [LEGACY_USER_STORAGE_KEY]: 'legacy-user-id',
    });

    expect(getStoredInterviewUserId(storage)).toBe('legacy-user-id');
  });

  it('persists both interview and legacy user keys so preview pages can read the same identity', () => {
    const storage = createMemoryStorage();

    persistInterviewIdentity(storage, {
      sessionId: 'session-123',
      userId: 'user-456',
    });

    expect(storage.getItem(INTERVIEW_SESSION_STORAGE_KEY)).toBe('session-123');
    expect(storage.getItem(INTERVIEW_USER_STORAGE_KEY)).toBe('user-456');
    expect(storage.getItem(LEGACY_USER_STORAGE_KEY)).toBe('user-456');
  });

  it('clears only interview-scoped keys and keeps the shared user identity', () => {
    const storage = createMemoryStorage({
      [INTERVIEW_SESSION_STORAGE_KEY]: 'session-123',
      [INTERVIEW_USER_STORAGE_KEY]: 'user-456',
      [LEGACY_USER_STORAGE_KEY]: 'user-456',
    });

    clearInterviewIdentity(storage);

    expect(storage.getItem(INTERVIEW_SESSION_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(INTERVIEW_USER_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(LEGACY_USER_STORAGE_KEY)).toBe('user-456');
  });
});
