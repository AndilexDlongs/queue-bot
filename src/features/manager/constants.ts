import type { NavigationItem } from './types';
import { detailsLogo, managementLogo, operationsLogo } from './icons';

export const navigationItems: NavigationItem[] = [
  {
    id: 'barbers',
    label: 'Manage',
    description: 'Add service providers, update schedules, and availability.',
    icon: managementLogo
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Track live queues, walk-ins, and service flow.',
    icon: operationsLogo
  },
  {
    id: 'salon',
    label: 'Details',
    description: 'Update salon details and manager info.',
    icon: detailsLogo
  }
];

export const ALIVE_TIMEOUT_MS = 45 * 60 * 1000;
export const ALIVE_MIN_SCALE = 0.84;
export const ALIVE_MAX_SCALE = 1.05;
