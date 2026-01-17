import type { Barber, QueueClient } from '../../../data/mockData';
import type { ContactMethod, StoredContact } from '../types';

export const normalizePhone = (value: string) => value.replace(/\D/g, '');

export const isActiveClient = (client: QueueClient) =>
  !['done', 'declined', 'left'].includes(client.status);

export const formatWaitTime = (minutes: number) => {
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) {
    return `${rounded} minute${rounded === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  const hourLabel = `${hours} hour${hours === 1 ? '' : 's'}`;
  if (mins === 0) {
    return hourLabel;
  }
  return `${hourLabel} ${mins} minute${mins === 1 ? '' : 's'}`;
};

export const formatJoinMethod = (method: ContactMethod) =>
  method === 'phone' ? 'phone number' : 'email';

export const formatStoredContactLabel = (contact: StoredContact) => {
  if (contact.method === 'phone') {
    const digits = normalizePhone(contact.value);
    if (!digits) return 'phone on file';
    const tail = digits.slice(-4);
    return tail ? `ending in ${tail}` : digits;
  }
  const normalized = contact.value.trim().toLowerCase();
  const [user, domain] = normalized.split('@');
  if (!domain) return normalized;
  if (!user) return `@${domain}`;
  const maskedUser =
    user.length <= 2 ? `${user[0]}*` : `${user[0]}***${user[user.length - 1]}`;
  return `${maskedUser}@${domain}`;
};

export const barberSupportsService = (barber: Barber, service: string) =>
  !barber.services || barber.services.includes(service);

export const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to manual copy.
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
};
