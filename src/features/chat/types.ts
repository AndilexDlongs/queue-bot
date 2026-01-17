export type ChatStep =
  | 'welcome'
  | 'select-barber'
  | 'confirm-join'
  | 'select-notification'
  | 'enter-phone'
  | 'enter-email'
  | 'verify-code'
  | 'duplicate-confirm'
  | 'off-duty'
  | 'off-duty-entry'
  | 'off-duty-provider'
  | 'check-start'
  | 'check-phone'
  | 'check-email'
  | 'leave-start'
  | 'leave-phone'
  | 'leave-email'
  | 'leave-confirm'
  | 'joined-success'
  | 'cancelled';

export type ContactMethod = 'phone' | 'email';

export interface MessageOption {
  label: string;
  sublabel?: string;
  value: string;
}

export interface Message {
  id: string;
  text: string;
  isBot: boolean;
  options?: MessageOption[];
}

export interface StoredContact {
  method: ContactMethod;
  value: string;
  storedAt: number;
}
