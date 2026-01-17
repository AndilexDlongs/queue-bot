import { useEffect, useMemo, useState } from 'react';
import type { Barber, Salon } from '../../../data/mockData';
import { useQueue } from '../../../context/QueueContext';
import { ALIVE_MAX_SCALE, ALIVE_MIN_SCALE, ALIVE_TIMEOUT_MS, navigationItems } from '../constants';
import type { ManagerTab, ProviderDraft, SalonForm } from '../types';

const buildSalonForm = (salon: Salon): SalonForm => ({
  name: salon.name,
  address: salon.address,
  city: salon.city,
  workingDays: salon.workingDays,
  opensAt: salon.opensAt,
  closesAt: salon.closesAt,
  managerName: salon.managerName,
  managerPhone: salon.managerPhone,
  managerEmail: salon.managerEmail
});

export const useManagerState = () => {
  const {
    salon,
    services,
    barbers,
    queue,
    getQueueCount,
    addBarber,
    updateBarber,
    removeBarber,
    addWalkIn
  } = useQueue();
  const [activeTab, setActiveTab] = useState<ManagerTab>('salon');
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [salonForm, setSalonForm] = useState<SalonForm>(() => buildSalonForm(salon));
  const [openProviderId, setOpenProviderId] = useState<string | null>(null);
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [providerDraft, setProviderDraft] = useState<ProviderDraft | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [providerAddresses, setProviderAddresses] = useState<Record<string, string>>({});
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    barbers[0]?.id ?? null
  );
  const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false);
  const [isQueueListOpen, setIsQueueListOpen] = useState(false);
  const [isWalkInConfirmOpen, setIsWalkInConfirmOpen] = useState(false);
  const [aliveTimestamps, setAliveTimestamps] = useState<Record<string, number>>({});
  const [aliveNow, setAliveNow] = useState(Date.now());
  const [aliveBoost, setAliveBoost] = useState(0);

  const activeItem = useMemo(
    () => navigationItems.find(item => item.id === activeTab) ?? navigationItems[0],
    [activeTab]
  );
  const defaultAddress = `${salon.address}, ${salon.city}`;

  useEffect(() => {
    setSalonForm(buildSalonForm(salon));
  }, [salon.id]);

  useEffect(() => {
    const timer = setInterval(() => setAliveNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (barbers.length === 0) {
      setSelectedProviderId(null);
      return;
    }
    if (!selectedProviderId || !barbers.some(barber => barber.id === selectedProviderId)) {
      setSelectedProviderId(barbers[0].id);
    }
  }, [barbers, selectedProviderId]);

  const openChat = () => {
    window.location.hash = 'chat';
  };

  const handleSelectTab = (nextTab: ManagerTab) => {
    setActiveTab(nextTab);
  };

  const handleOpenChatClick = () => {
    setShowLeaveWarning(true);
  };

  const handleConfirmOpenChat = () => {
    setShowLeaveWarning(false);
    openChat();
  };

  const handleCloseLeaveWarning = () => {
    setShowLeaveWarning(false);
  };

  const handleSalonFormChange = (field: keyof SalonForm, value: string) => {
    setSalonForm(prev => ({ ...prev, [field]: value }));
  };

  const buildProviderDraft = (barber?: Barber): ProviderDraft => ({
    name: barber?.name ?? '',
    phone: barber?.phone ?? '',
    email: barber?.email ?? '',
    startTime: barber?.startTime ?? '',
    endTime: barber?.endTime ?? '',
    lunchStart: barber?.lunchStart ?? '',
    lunchDurationMinutes: barber ? String(barber.lunchDurationMinutes) : '',
    averageServiceMinutes: barber ? String(barber.averageServiceMinutes) : '',
    address: barber ? providerAddresses[barber.id] ?? defaultAddress : ''
  });

  const handleSelectProvider = (barberId: string) => {
    setOpenProviderId(prev => (prev === barberId ? null : barberId));
    setIsEditingProvider(false);
    setIsCreatingProvider(false);
    setProviderDraft(null);
    setDeleteConfirmId(null);
  };

  const handleStartEditingProvider = (barber: Barber) => {
    setOpenProviderId(barber.id);
    setIsEditingProvider(true);
    setIsCreatingProvider(false);
    setProviderDraft(buildProviderDraft(barber));
    setDeleteConfirmId(null);
  };

  const handleStartCreateProvider = () => {
    if (isCreatingProvider) {
      setIsCreatingProvider(false);
      setIsEditingProvider(false);
      setProviderDraft(null);
      return;
    }
    setOpenProviderId(null);
    setIsEditingProvider(true);
    setIsCreatingProvider(true);
    setProviderDraft(buildProviderDraft());
    setDeleteConfirmId(null);
  };

  const handleCancelCreateProvider = () => {
    setIsCreatingProvider(false);
    setIsEditingProvider(false);
    setProviderDraft(null);
  };

  const handleProviderDraftChange = (field: keyof ProviderDraft, value: string) => {
    setProviderDraft(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveProvider = async (event: React.FormEvent, providerId?: string) => {
    event.preventDefault();
    if (!providerDraft) return;

    const payload = {
      name: providerDraft.name.trim(),
      phone: providerDraft.phone.trim(),
      email: providerDraft.email.trim(),
      startTime: providerDraft.startTime.trim(),
      endTime: providerDraft.endTime.trim(),
      lunchStart: providerDraft.lunchStart.trim(),
      lunchDurationMinutes: Number(providerDraft.lunchDurationMinutes),
      averageServiceMinutes: Number(providerDraft.averageServiceMinutes)
    };

    if (
      !payload.name ||
      !payload.phone ||
      !payload.email ||
      !payload.startTime ||
      !payload.endTime ||
      !payload.lunchStart ||
      !providerDraft.lunchDurationMinutes.trim() ||
      !providerDraft.averageServiceMinutes.trim() ||
      !Number.isFinite(payload.lunchDurationMinutes) ||
      !Number.isFinite(payload.averageServiceMinutes)
    ) {
      return;
    }

    if (isCreatingProvider) {
      const newId = await addBarber({
        ...payload,
        isAvailable: false
      });
      if (newId) {
        setProviderAddresses(prev => ({
          ...prev,
          [newId]: providerDraft.address.trim() || defaultAddress
        }));
      }
      setIsCreatingProvider(false);
      setIsEditingProvider(false);
      setProviderDraft(null);
      return;
    }

    if (!providerId) return;
    await updateBarber(providerId, payload);
    setProviderAddresses(prev => ({
      ...prev,
      [providerId]: providerDraft.address.trim() || defaultAddress
    }));
    setIsEditingProvider(false);
    setProviderDraft(null);
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (deleteConfirmId !== providerId) {
      setDeleteConfirmId(providerId);
      return;
    }
    await removeBarber(providerId);
    setProviderAddresses(prev => {
      const { [providerId]: _, ...rest } = prev;
      return rest;
    });
    setDeleteConfirmId(null);
    setOpenProviderId(null);
    setIsEditingProvider(false);
    setProviderDraft(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleToggleDuty = (nextState: boolean) => {
    if (!selectedProviderId) return;
    void updateBarber(
      selectedProviderId,
      nextState
        ? { isAvailable: true, lastSeenAt: new Date().toISOString() }
        : { isAvailable: false }
    );
    if (nextState) {
      setAliveTimestamps(prev => ({ ...prev, [selectedProviderId]: Date.now() }));
    } else {
      setAliveTimestamps(prev => {
        const { [selectedProviderId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleAlivePing = () => {
    if (!selectedProviderId) return;
    const provider = barbers.find(barber => barber.id === selectedProviderId);
    if (!provider?.isAvailable) return;
    const now = Date.now();
    setAliveTimestamps(prev => ({ ...prev, [selectedProviderId]: now }));
    setAliveBoost(0.1);
    setTimeout(() => setAliveBoost(0), 450);
    void updateBarber(selectedProviderId, {
      isAvailable: true,
      lastSeenAt: new Date(now).toISOString()
    });
  };

  const handleToggleQueueList = () => {
    setIsQueueListOpen(prev => !prev);
    setIsWalkInConfirmOpen(false);
  };

  const handleToggleWalkInConfirm = () => {
    setIsWalkInConfirmOpen(prev => !prev);
    setIsQueueListOpen(false);
  };

  const handleConfirmWalkIn = () => {
    if (!selectedProviderId) return;
    void addWalkIn(selectedProviderId, 'Walk-in', services[0]?.key ?? 'haircut');
    setIsWalkInConfirmOpen(false);
  };

  const handleCloseWalkInConfirm = () => {
    setIsWalkInConfirmOpen(false);
  };

  const handleToggleProviderMenu = () => {
    setIsProviderMenuOpen(prev => !prev);
  };

  const handleSelectProviderFromMenu = (providerId: string) => {
    setSelectedProviderId(providerId);
    setIsProviderMenuOpen(false);
    setIsQueueListOpen(false);
    setIsWalkInConfirmOpen(false);
  };

  const activeQueueForBarber = (barberId: string) =>
    queue
      .filter(
        client =>
          client.barberId === barberId && !['done', 'declined', 'left'].includes(client.status)
      )
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

  const getServicedCount = (barberId: string) =>
    queue.filter(client => client.barberId === barberId && client.status === 'done').length;

  const selectedProvider =
    barbers.find(barber => barber.id === selectedProviderId) ?? barbers[0] ?? null;
  const hasProvider = Boolean(selectedProvider);
  const selectedQueue = selectedProvider ? activeQueueForBarber(selectedProvider.id) : [];
  const lastAliveAt = selectedProvider ? aliveTimestamps[selectedProvider.id] : undefined;
  const isOnDuty = selectedProvider?.isAvailable ?? false;
  const timeLeftMs =
    isOnDuty && lastAliveAt ? Math.max(0, ALIVE_TIMEOUT_MS - (aliveNow - lastAliveAt)) : 0;
  const timeRatio = isOnDuty && lastAliveAt ? Math.min(1, timeLeftMs / ALIVE_TIMEOUT_MS) : 0;
  const aliveScale = isOnDuty
    ? Math.min(
        ALIVE_MAX_SCALE + 0.12,
        ALIVE_MIN_SCALE + (ALIVE_MAX_SCALE - ALIVE_MIN_SCALE) * timeRatio + aliveBoost
      )
    : ALIVE_MIN_SCALE;

  useEffect(() => {
    if (!selectedProvider || !selectedProvider.isAvailable) return;
    if (aliveTimestamps[selectedProvider.id]) return;
    setAliveTimestamps(prev => ({ ...prev, [selectedProvider.id]: Date.now() }));
  }, [selectedProvider, aliveTimestamps]);

  useEffect(() => {
    if (!selectedProvider || !selectedProvider.isAvailable) return;
    if (!lastAliveAt) return;
    if (timeLeftMs > 0) return;
    setAliveTimestamps(prev => {
      if (!prev[selectedProvider.id]) return prev;
      const { [selectedProvider.id]: _, ...rest } = prev;
      return rest;
    });
    void updateBarber(selectedProvider.id, { isAvailable: false });
  }, [selectedProvider, lastAliveAt, timeLeftMs, updateBarber]);

  useEffect(() => {
    if (activeTab !== 'operations') {
      setIsProviderMenuOpen(false);
      setIsQueueListOpen(false);
      setIsWalkInConfirmOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setIsQueueListOpen(false);
    setIsWalkInConfirmOpen(false);
  }, [selectedProviderId]);

  return {
    salon,
    services,
    barbers,
    activeTab,
    activeItem,
    showLeaveWarning,
    salonForm,
    openProviderId,
    isEditingProvider,
    isCreatingProvider,
    providerDraft,
    deleteConfirmId,
    providerAddresses,
    selectedProviderId,
    isProviderMenuOpen,
    isQueueListOpen,
    isWalkInConfirmOpen,
    selectedProvider,
    hasProvider,
    selectedQueue,
    isOnDuty,
    timeLeftMs,
    aliveScale,
    defaultAddress,
    getQueueCount,
    getServicedCount,
    handleSelectTab,
    handleOpenChatClick,
    handleConfirmOpenChat,
    handleCloseLeaveWarning,
    handleSalonFormChange,
    handleSelectProvider,
    handleStartEditingProvider,
    handleStartCreateProvider,
    handleCancelCreateProvider,
    handleProviderDraftChange,
    handleSaveProvider,
    handleDeleteProvider,
    handleCancelDelete,
    handleToggleDuty,
    handleAlivePing,
    handleToggleQueueList,
    handleToggleWalkInConfirm,
    handleConfirmWalkIn,
    handleCloseWalkInConfirm,
    handleToggleProviderMenu,
    handleSelectProviderFromMenu
  };
};
