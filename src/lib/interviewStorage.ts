export const INTERVIEW_SESSION_STORAGE_KEY = 'interview_session_id';
export const INTERVIEW_USER_STORAGE_KEY = 'interview_user_id';
export const LEGACY_USER_STORAGE_KEY = 'userId';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function getStoredInterviewUserId(storage: StorageLike): string | null {
  return storage.getItem(INTERVIEW_USER_STORAGE_KEY) || storage.getItem(LEGACY_USER_STORAGE_KEY);
}

export function persistInterviewIdentity(
  storage: StorageLike,
  identity: { sessionId: string; userId: string }
) {
  storage.setItem(INTERVIEW_SESSION_STORAGE_KEY, identity.sessionId);
  storage.setItem(INTERVIEW_USER_STORAGE_KEY, identity.userId);
  storage.setItem(LEGACY_USER_STORAGE_KEY, identity.userId);
}

export function clearInterviewIdentity(storage: StorageLike) {
  storage.removeItem(INTERVIEW_SESSION_STORAGE_KEY);
  storage.removeItem(INTERVIEW_USER_STORAGE_KEY);
}
