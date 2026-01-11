export type QueueStatus = 'waiting' | 'accepted' | 'in-service' | 'done' | 'declined' | 'left';

export interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  opensAt: string;
  closesAt: string;
  workingDays: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
}

export interface Barber {
  id: string;
  salonId: string;
  name: string;
  phone: string;
  email: string;
  startTime: string;
  endTime: string;
  lunchStart: string;
  lunchDurationMinutes: number;
  averageCutMinutes: number;
  isAvailable: boolean;
}

export interface QueueClient {
  id: string;
  visibleId: number;
  name: string;
  phone?: string;
  email?: string;
  barberId: string;
  joinedAt: Date;
  estimatedTime: Date;
  status: QueueStatus;
  notificationSent: boolean;
  service: 'haircut' | 'plait';
  isWalkIn?: boolean;
}

export const salonData: Salon = {
  id: 'salon-1',
  name: 'Northbank Cuts & Plaits',
  address: '45 Market Street',
  city: 'Brookline',
  phone: '555-0102',
  email: 'hello@northbankcuts.com',
  opensAt: '08:30',
  closesAt: '19:30',
  workingDays: 'Mon-Sat',
  managerName: 'Tara Ndlovu',
  managerPhone: '555-0163',
  managerEmail: 'tara@northbankcuts.com'
};

export const barbersData: Barber[] = [
  {
    id: 'barber-1',
    salonId: 'salon-1',
    name: 'Maya Lewis',
    phone: '555-0110',
    email: 'maya@northbankcuts.com',
    startTime: '09:00',
    endTime: '17:30',
    lunchStart: '13:00',
    lunchDurationMinutes: 45,
    averageCutMinutes: 35,
    isAvailable: true
  },
  {
    id: 'barber-2',
    salonId: 'salon-1',
    name: 'Darnell Reed',
    phone: '555-0112',
    email: 'darnell@northbankcuts.com',
    startTime: '10:00',
    endTime: '19:00',
    lunchStart: '14:00',
    lunchDurationMinutes: 45,
    averageCutMinutes: 30,
    isAvailable: true
  },
  {
    id: 'barber-3',
    salonId: 'salon-1',
    name: 'Ifeoma Okoro',
    phone: '555-0114',
    email: 'ifeoma@northbankcuts.com',
    startTime: '08:30',
    endTime: '16:30',
    lunchStart: '12:30',
    lunchDurationMinutes: 60,
    averageCutMinutes: 40,
    isAvailable: true
  },
  {
    id: 'barber-4',
    salonId: 'salon-1',
    name: 'Rafael Torres',
    phone: '555-0116',
    email: 'rafael@northbankcuts.com',
    startTime: '11:00',
    endTime: '20:00',
    lunchStart: '15:00',
    lunchDurationMinutes: 30,
    averageCutMinutes: 25,
    isAvailable: false
  },
  {
    id: 'barber-5',
    salonId: 'salon-1',
    name: 'Chloe Park',
    phone: '555-0118',
    email: 'chloe@northbankcuts.com',
    startTime: '09:30',
    endTime: '18:00',
    lunchStart: '13:30',
    lunchDurationMinutes: 45,
    averageCutMinutes: 50,
    isAvailable: true
  }
];

const now = new Date();

export const queueData: QueueClient[] = [
  {
    id: 'client-1001',
    visibleId: 1,
    name: 'Jordan P',
    phone: '555-0201',
    barberId: 'barber-2',
    joinedAt: new Date(now.getTime() - 42 * 60000),
    estimatedTime: new Date(now.getTime() + 18 * 60000),
    status: 'waiting',
    notificationSent: false,
    service: 'haircut'
  },
  {
    id: 'client-1002',
    visibleId: 2,
    name: 'Mina S',
    phone: '555-0203',
    barberId: 'barber-2',
    joinedAt: new Date(now.getTime() - 30 * 60000),
    estimatedTime: new Date(now.getTime() + 48 * 60000),
    status: 'waiting',
    notificationSent: false,
    service: 'plait'
  },
  {
    id: 'client-1003',
    visibleId: 3,
    name: 'Leo J',
    email: 'leo.j@example.com',
    barberId: 'barber-2',
    joinedAt: new Date(now.getTime() - 18 * 60000),
    estimatedTime: new Date(now.getTime() + 78 * 60000),
    status: 'waiting',
    notificationSent: false,
    service: 'haircut'
  },
  {
    id: 'client-2001',
    visibleId: 1,
    name: 'Ava K',
    email: 'ava.k@example.com',
    barberId: 'barber-3',
    joinedAt: new Date(now.getTime() - 50 * 60000),
    estimatedTime: new Date(now.getTime() + 10 * 60000),
    status: 'waiting',
    notificationSent: false,
    service: 'haircut'
  },
  {
    id: 'client-2002',
    visibleId: 2,
    name: 'Sam R',
    phone: '555-0209',
    barberId: 'barber-3',
    joinedAt: new Date(now.getTime() - 20 * 60000),
    estimatedTime: new Date(now.getTime() + 50 * 60000),
    status: 'waiting',
    notificationSent: false,
    service: 'plait'
  }
];
