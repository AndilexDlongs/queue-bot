import type { StoredContact } from '../types';

const CONTACT_STORAGE_KEY = 'queuebot.last-contact';
const CONTACT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const loadStoredContact = (): StoredContact | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONTACT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredContact;
    if (!parsed?.method || !parsed.value || !parsed.storedAt) {
      return null;
    }
    if (Date.now() - parsed.storedAt > CONTACT_TTL_MS) {
      window.localStorage.removeItem(CONTACT_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveStoredContact = (contact: StoredContact) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contact));
  } catch {
    // Ignore storage failures (private browsing or disabled storage).
  }
};
