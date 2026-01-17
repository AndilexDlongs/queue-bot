export type ManagerTab = 'salon' | 'barbers' | 'operations';

export interface NavigationItem {
  id: ManagerTab;
  label: string;
  description: string;
  icon: string;
}

export interface ProviderDraft {
  name: string;
  phone: string;
  email: string;
  startTime: string;
  endTime: string;
  lunchStart: string;
  lunchDurationMinutes: string;
  averageServiceMinutes: string;
  address: string;
}

export interface SalonForm {
  name: string;
  address: string;
  city: string;
  workingDays: string;
  opensAt: string;
  closesAt: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
}
