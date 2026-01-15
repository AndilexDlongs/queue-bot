import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Barber,
  QueueClient,
  QueueStatus,
  Salon,
  ServiceOption,
  getMockBusinessData
} from '../data/mockData';

interface QueueJoinPayload {
  barberId: string;
  service: string;
  name: string;
  phone?: string;
  email?: string;
  isWalkIn?: boolean;
}

interface NewBarberPayload {
  name: string;
  phone: string;
  email: string;
  startTime: string;
  endTime: string;
  lunchStart: string;
  lunchDurationMinutes: number;
  averageServiceMinutes: number;
  isAvailable?: boolean;
  serviceKeys?: string[];
}

type UpdateBarberPayload = Partial<NewBarberPayload> & {
  isAvailable?: boolean;
  lastSeenAt?: string;
};

type QueueEntryResponse = Omit<QueueClient, 'joinedAt' | 'estimatedTime'> & {
  joinedAt: string;
  estimatedTime: string;
};

interface QueueContextValue {
  salon: Salon;
  services: ServiceOption[];
  barbers: Barber[];
  queue: QueueClient[];
  getQueueCount: (barberId: string) => number;
  getEstimatedWaitTime: (barberId: string) => number;
  getQueueForBarber: (barberId: string) => QueueClient[];
  addToQueue: (client: QueueJoinPayload) => Promise<string | null>;
  addWalkIn: (barberId: string, name: string, service: string) => Promise<void>;
  updateClientStatus: (clientId: string, status: QueueStatus) => Promise<void>;
  removeClient: (clientId: string) => Promise<void>;
  toggleBarberAvailability: (barberId: string) => Promise<void>;
  addBarber: (barber: NewBarberPayload) => Promise<string | null>;
  updateBarber: (barberId: string, updates: UpdateBarberPayload) => Promise<void>;
  removeBarber: (barberId: string) => Promise<void>;
}

const QueueContext = createContext<QueueContextValue | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const DEFAULT_BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID ?? 'business-1';

const isActiveStatus = (status: QueueStatus) =>
  status === 'waiting' || status === 'accepted' || status === 'in-service';

const fetchJson = async <T,>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const mapProvider = (provider: Barber & { businessId?: string }) => {
  const { businessId, ...rest } = provider;
  return {
    ...rest,
    salonId: businessId ?? provider.salonId
  };
};

const mapQueueEntry = (entry: QueueEntryResponse) => ({
  ...entry,
  joinedAt: new Date(entry.joinedAt),
  estimatedTime: new Date(entry.estimatedTime)
});

export const QueueProvider: React.FC<{ children: React.ReactNode; businessId?: string }> = ({
  children,
  businessId
}) => {
  const activeBusinessId = businessId ?? DEFAULT_BUSINESS_ID;
  const fallbackData = getMockBusinessData(activeBusinessId);
  const [salon, setSalon] = useState<Salon>(fallbackData.business);
  const [services, setServices] = useState<ServiceOption[]>(fallbackData.services);
  const [barbers, setBarbers] = useState<Barber[]>(fallbackData.barbers);
  const [queue, setQueue] = useState<QueueClient[]>(fallbackData.queue);

  const refreshData = useCallback(async () => {
    try {
      const data = await fetchJson<{
        business: Salon;
        services: ServiceOption[];
        providers: Barber[];
        queue: QueueEntryResponse[];
      }>(`/api/businesses/${activeBusinessId}/summary`);

      if (data.business) {
        setSalon(data.business);
      }
      setServices(data.services ?? []);
      setBarbers((data.providers ?? []).map(mapProvider));
      setQueue((data.queue ?? []).map(mapQueueEntry));
    } catch (error) {
      const fallback = getMockBusinessData(activeBusinessId);
      setSalon(fallback.business);
      setServices(fallback.services);
      setBarbers(fallback.barbers);
      setQueue(fallback.queue);
      console.error('Failed to load queue data.', error);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    const fallback = getMockBusinessData(activeBusinessId);
    setSalon(fallback.business);
    setServices(fallback.services);
    setBarbers(fallback.barbers);
    setQueue(fallback.queue);
    void refreshData();
  }, [activeBusinessId, refreshData]);

  const getQueueForBarber = (barberId: string) =>
    queue.filter(client => client.barberId === barberId && isActiveStatus(client.status));

  const getQueueCount = (barberId: string) => getQueueForBarber(barberId).length;

  const getEstimatedWaitTime = (barberId: string) => {
    const barber = barbers.find(item => item.id === barberId);
    const base = barber?.averageServiceMinutes ?? 30;
    return Math.max(10, getQueueCount(barberId) * base);
  };

  const addToQueue = async (client: QueueJoinPayload) => {
    try {
      const response = await fetchJson<{ id?: string }>(
        `/api/businesses/${activeBusinessId}/queue`,
        {
          method: 'POST',
          body: JSON.stringify(client)
        }
      );
      await refreshData();
      return response?.id ?? null;
    } catch (error) {
      console.error('Failed to add client to the queue.', error);
      return null;
    }
  };

  const addWalkIn = async (barberId: string, name: string, service: string) => {
    await addToQueue({ barberId, name, service, isWalkIn: true });
  };

  const updateClientStatus = async (clientId: string, status: QueueStatus) => {
    try {
      await fetchJson(`/api/queue/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to update client status.', error);
    }
  };

  const removeClient = async (clientId: string) => {
    try {
      await fetchJson(`/api/queue/${clientId}`, { method: 'DELETE' });
      await refreshData();
    } catch (error) {
      console.error('Failed to remove client.', error);
    }
  };

  const toggleBarberAvailability = async (barberId: string) => {
    const barber = barbers.find(item => item.id === barberId);
    if (!barber) return;
    try {
      await fetchJson(`/api/providers/${barberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !barber.isAvailable })
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to update provider availability.', error);
    }
  };

  const addBarber = async (barber: NewBarberPayload) => {
    try {
      const response = await fetchJson<{ id?: string }>(
        `/api/businesses/${activeBusinessId}/providers`,
        {
          method: 'POST',
          body: JSON.stringify(barber)
        }
      );
      await refreshData();
      return response?.id ?? null;
    } catch (error) {
      console.error('Failed to add provider.', error);
      return null;
    }
  };

  const updateBarber = async (barberId: string, updates: UpdateBarberPayload) => {
    try {
      await fetchJson(`/api/providers/${barberId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to update provider.', error);
    }
  };

  const removeBarber = async (barberId: string) => {
    try {
      await fetchJson(`/api/providers/${barberId}`, { method: 'DELETE' });
      await refreshData();
    } catch (error) {
      console.error('Failed to remove provider.', error);
    }
  };

  const value = useMemo(
    () => ({
      salon,
      services,
      barbers,
      queue,
      getQueueCount,
      getEstimatedWaitTime,
      getQueueForBarber,
      addToQueue,
      addWalkIn,
      updateClientStatus,
      removeClient,
      toggleBarberAvailability,
      addBarber,
      updateBarber,
      removeBarber
    }),
    [salon, services, barbers, queue]
  );

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
