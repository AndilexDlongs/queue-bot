import React, { createContext, useContext, useMemo, useState } from 'react';
import { Barber, QueueClient, QueueStatus, Salon, barbersData, queueData, salonData } from '../data/mockData';

interface QueueContextValue {
  salon: Salon;
  barbers: Barber[];
  queue: QueueClient[];
  getQueueCount: (barberId: string) => number;
  getEstimatedWaitTime: (barberId: string) => number;
  getQueueForBarber: (barberId: string) => QueueClient[];
  addToQueue: (client: QueueClient) => void;
  addWalkIn: (barberId: string, name: string, service: QueueClient['service']) => void;
  updateClientStatus: (clientId: string, status: QueueStatus) => void;
  removeClient: (clientId: string) => void;
  toggleBarberAvailability: (barberId: string) => void;
  addBarber: (barber: Barber) => void;
}

const QueueContext = createContext<QueueContextValue | undefined>(undefined);

const isActiveStatus = (status: QueueStatus) =>
  status === 'waiting' || status === 'accepted' || status === 'in-service';

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [barbers, setBarbers] = useState<Barber[]>(barbersData);
  const [queue, setQueue] = useState<QueueClient[]>(queueData);

  const getQueueForBarber = (barberId: string) =>
    queue.filter(client => client.barberId === barberId && isActiveStatus(client.status));

  const getQueueCount = (barberId: string) => getQueueForBarber(barberId).length;

  const getEstimatedWaitTime = (barberId: string) => {
    const barber = barbers.find(item => item.id === barberId);
    const base = barber?.averageCutMinutes ?? 30;
    return Math.max(10, getQueueCount(barberId) * base);
  };

  const addToQueue = (client: QueueClient) => {
    setQueue(prev => [...prev, client]);
  };

  const addWalkIn = (barberId: string, name: string, service: QueueClient['service']) => {
    const position = getQueueCount(barberId) + 1;
    const waitMinutes = getEstimatedWaitTime(barberId);
    const newClient: QueueClient = {
      id: `walkin-${Date.now()}`,
      visibleId: position,
      name,
      barberId,
      joinedAt: new Date(),
      estimatedTime: new Date(Date.now() + waitMinutes * 60000),
      status: 'waiting',
      notificationSent: false,
      service,
      isWalkIn: true
    };
    setQueue(prev => [...prev, newClient]);
  };

  const updateClientStatus = (clientId: string, status: QueueStatus) => {
    setQueue(prev =>
      prev.map(client => (client.id === clientId ? { ...client, status } : client))
    );
  };

  const removeClient = (clientId: string) => {
    setQueue(prev => prev.filter(client => client.id !== clientId));
  };

  const toggleBarberAvailability = (barberId: string) => {
    setBarbers(prev =>
      prev.map(barber =>
        barber.id === barberId ? { ...barber, isAvailable: !barber.isAvailable } : barber
      )
    );
  };

  const addBarber = (barber: Barber) => {
    setBarbers(prev => [...prev, barber]);
  };

  const value = useMemo(
    () => ({
      salon: salonData,
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
      addBarber
    }),
    [barbers, queue]
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
