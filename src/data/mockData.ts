export type QueueStatus = 'waiting' | 'accepted' | 'in-service' | 'done' | 'declined' | 'left';

export interface ServiceOption {
  id: string;
  key: string;
  name: string;
  ctaLabel: string;
  defaultDurationMinutes: number;
}

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
  businessType: string;
  flowTemplateId?: string;
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
  averageServiceMinutes: number;
  services?: string[];
  isAvailable: boolean;
  lastSeenAt?: string;
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
  service: string;
  isWalkIn?: boolean;
}

export interface BusinessMockData {
  business: Salon;
  services: ServiceOption[];
  barbers: Barber[];
  queue: QueueClient[];
}

const now = new Date();

const businessOne: BusinessMockData = {
  business: {
    id: 'business-1',
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
    managerEmail: 'tara@northbankcuts.com',
    businessType: 'barbershop',
    flowTemplateId: 'flow-barbershop-v1'
  },
  services: [
    {
      id: 'service-haircut',
      key: 'haircut',
      name: 'Haircut',
      ctaLabel: 'Get a haircut',
      defaultDurationMinutes: 30
    },
    {
      id: 'service-plait',
      key: 'plait',
      name: 'Plaiting',
      ctaLabel: 'Plait or braid hair',
      defaultDurationMinutes: 45
    }
  ],
  barbers: [
    {
      id: 'provider-1',
      salonId: 'business-1',
      name: 'Maya Lewis',
      phone: '555-0110',
      email: 'maya@northbankcuts.com',
      startTime: '09:00',
      endTime: '17:30',
      lunchStart: '13:00',
      lunchDurationMinutes: 45,
      averageServiceMinutes: 35,
      services: ['haircut'],
      isAvailable: true
    },
    {
      id: 'provider-2',
      salonId: 'business-1',
      name: 'Darnell Reed',
      phone: '555-0112',
      email: 'darnell@northbankcuts.com',
      startTime: '10:00',
      endTime: '19:00',
      lunchStart: '14:00',
      lunchDurationMinutes: 45,
      averageServiceMinutes: 30,
      services: ['haircut', 'plait'],
      isAvailable: true
    },
    {
      id: 'provider-3',
      salonId: 'business-1',
      name: 'Ifeoma Okoro',
      phone: '555-0114',
      email: 'ifeoma@northbankcuts.com',
      startTime: '08:30',
      endTime: '16:30',
      lunchStart: '12:30',
      lunchDurationMinutes: 60,
      averageServiceMinutes: 40,
      services: ['haircut', 'plait'],
      isAvailable: true
    },
    {
      id: 'provider-4',
      salonId: 'business-1',
      name: 'Rafael Torres',
      phone: '555-0116',
      email: 'rafael@northbankcuts.com',
      startTime: '11:00',
      endTime: '20:00',
      lunchStart: '15:00',
      lunchDurationMinutes: 30,
      averageServiceMinutes: 25,
      services: ['haircut'],
      isAvailable: false
    },
    {
      id: 'provider-5',
      salonId: 'business-1',
      name: 'Chloe Park',
      phone: '555-0118',
      email: 'chloe@northbankcuts.com',
      startTime: '09:30',
      endTime: '18:00',
      lunchStart: '13:30',
      lunchDurationMinutes: 45,
      averageServiceMinutes: 50,
      services: ['haircut'],
      isAvailable: true
    }
  ],
  queue: [
    {
      id: 'client-1001',
      visibleId: 1,
      name: 'Jordan P',
      phone: '555-0201',
      barberId: 'provider-2',
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
      barberId: 'provider-2',
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
      barberId: 'provider-2',
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
      barberId: 'provider-3',
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
      barberId: 'provider-3',
      joinedAt: new Date(now.getTime() - 20 * 60000),
      estimatedTime: new Date(now.getTime() + 50 * 60000),
      status: 'waiting',
      notificationSent: false,
      service: 'plait'
    }
  ]
};

const businessTwo: BusinessMockData = {
  business: {
    id: 'business-2',
    name: 'Lakeside Family Practice',
    address: '14 Meadow Avenue',
    city: 'Riverton',
    phone: '555-0321',
    email: 'hello@lakesidefamilypractice.com',
    opensAt: '08:00',
    closesAt: '17:00',
    workingDays: 'Mon-Fri',
    managerName: 'Naledi Khumalo',
    managerPhone: '555-0324',
    managerEmail: 'naledi@lakesidefamilypractice.com',
    businessType: 'general_practitioner',
    flowTemplateId: 'flow-gp-v1'
  },
  services: [
    {
      id: 'service-consultation',
      key: 'consultation',
      name: 'Consultation',
      ctaLabel: 'Book a GP consultation',
      defaultDurationMinutes: 20
    }
  ],
  barbers: [
    {
      id: 'provider-gp-1',
      salonId: 'business-2',
      name: 'Dr. Samuela Kofi',
      phone: '555-0402',
      email: 'dr.kofi@lakesidefamilypractice.com',
      startTime: '08:00',
      endTime: '17:00',
      lunchStart: '12:30',
      lunchDurationMinutes: 30,
      averageServiceMinutes: 20,
      services: ['consultation'],
      isAvailable: true
    }
  ],
  queue: [
    {
      id: 'client-gp-1',
      visibleId: 1,
      name: 'Amara K',
      phone: '555-0408',
      barberId: 'provider-gp-1',
      joinedAt: new Date(now.getTime() - 25 * 60000),
      estimatedTime: new Date(now.getTime() + 15 * 60000),
      status: 'waiting',
      notificationSent: false,
      service: 'consultation'
    },
    {
      id: 'client-gp-2',
      visibleId: 2,
      name: 'Simon L',
      email: 'simon.l@example.com',
      barberId: 'provider-gp-1',
      joinedAt: new Date(now.getTime() - 10 * 60000),
      estimatedTime: new Date(now.getTime() + 35 * 60000),
      status: 'waiting',
      notificationSent: false,
      service: 'consultation'
    }
  ]
};

export const mockBusinessData: Record<string, BusinessMockData> = {
  'business-1': businessOne,
  'business-2': businessTwo
};

export const getMockBusinessData = (businessId: string): BusinessMockData =>
  mockBusinessData[businessId] ?? mockBusinessData['business-1'];
