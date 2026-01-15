import React, { useEffect, useState } from 'react';
import type { Barber } from '../data/mockData';
import { useQueue } from '../context/QueueContext';
import { cn } from '../utils/cn';

const queueBotLogo = new URL('../assets/logos/queue-bot.svg', import.meta.url).href;
const operationsLogo = new URL('../assets/logos/operations.svg', import.meta.url).href;
const managementLogo = new URL('../assets/logos/management.svg', import.meta.url).href;
const detailsLogo = new URL('../assets/logos/details.svg', import.meta.url).href;
const addProfileLogo = new URL('../assets/logos/add-profile.svg', import.meta.url).href;
const phoneLogo = new URL('../assets/logos/phone.svg', import.meta.url).href;
const profileLogo = new URL('../assets/logos/profile.svg', import.meta.url).href;
const queueLogo = new URL('../assets/logos/queue.svg', import.meta.url).href;
const servicedLogo = new URL('../assets/logos/serviced.svg', import.meta.url).href;
const walkInLogo = new URL('../assets/logos/walk-in.svg', import.meta.url).href;
const threeStripesLogo = new URL('../assets/logos/three_stripes.svg', import.meta.url).href;
const deleteLogo = new URL('../assets/logos/delete.svg', import.meta.url).href;
const editLogo = new URL('../assets/logos/edit.svg', import.meta.url).href;
const saveLogo = new URL('../assets/logos/save.svg', import.meta.url).href;

type ManagerTab = 'salon' | 'barbers' | 'operations';

const navigationItems: Array<{
  id: ManagerTab;
  label: string;
  description: string;
  icon: string;
}> = [
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

const ALIVE_TIMEOUT_MS = 45 * 60 * 1000;
const ALIVE_MIN_SCALE = 0.84;
const ALIVE_MAX_SCALE = 1.05;

const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={cn('rounded-3xl border border-border/70 bg-white/80 p-6 shadow-sm', className)}>
    {children}
  </div>
);

const FieldLabel: React.FC<{ label: string }> = ({ label }) => (
  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
);

const TextInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
> = ({ label, ...props }) => (
  <label className="flex flex-col gap-2 text-sm text-foreground">
    <FieldLabel label={label} />
    <input
      {...props}
      className="rounded-lg border border-border/70 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  </label>
);

type ProviderDraft = {
  name: string;
  phone: string;
  email: string;
  startTime: string;
  endTime: string;
  lunchStart: string;
  lunchDurationMinutes: string;
  averageServiceMinutes: string;
  address: string;
};

const ProviderInput: React.FC<{
  label: string;
  icon?: string;
  type?: string;
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
}> = ({ label, icon, type = 'text', value, placeholder, className, onChange }) => (
  <label className={cn('flex flex-col gap-2 text-sm text-foreground', className)}>
    <FieldLabel label={label} />
    <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-white/80 px-3 py-2 shadow-sm transition focus-within:border-primary/40">
      {icon && <img src={icon} alt="" aria-hidden="true" className="h-4 w-4 opacity-70" />}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
      />
    </div>
  </label>
);

const AppManager: React.FC = () => {
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
  const [salonForm, setSalonForm] = useState({
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

  const activeItem = navigationItems.find(item => item.id === activeTab) ?? navigationItems[0];

  useEffect(() => {
    setSalonForm({
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

  const defaultAddress = `${salon.address}, ${salon.city}`;

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

  const handleProviderDraftChange = (field: keyof ProviderDraft, value: string) => {
    setProviderDraft(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveProvider = async (
    event: React.FormEvent,
    providerId?: string
  ) => {
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
          client.barberId === barberId &&
          !['done', 'declined', 'left'].includes(client.status)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50 to-sky-50 pb-28">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-md animate-float-in">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenChatClick}
                aria-label="Open client queue bot"
                className="group flex items-center gap-3 rounded-full border border-border/60 bg-white/80 px-3 py-2 shadow-sm transition hover:border-primary/40 hover:bg-white"
              >
                <img
                  src={queueBotLogo}
                  alt=""
                  aria-hidden="true"
                  className="h-8 w-8"
                />
                <div className="hidden text-left leading-tight sm:block">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Open Client Queue Bot
                  </p>
                  <p className="text-xs font-semibold text-foreground">Client view</p>
                </div>
              </button>
            </div>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-foreground font-serif tracking-tight sm:text-xl md:text-2xl">
                {salon.name}
              </h1>
            </div>
            <div className="flex items-center justify-end">
              {activeTab === 'operations' && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleToggleProviderMenu}
                    aria-label="Open provider list"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white/80 shadow-sm transition hover:border-primary/40"
                  >
                    <img src={threeStripesLogo} alt="" aria-hidden="true" className="h-5 w-5" />
                  </button>
                  {isProviderMenuOpen && (
                    <div className="absolute right-0 z-50 mt-3 w-[min(14rem,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-white/95 p-3 shadow-xl backdrop-blur animate-float-in">
                      <p className="text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        Providers
                      </p>
                      <div className="mt-3 space-y-2">
                        {barbers.map(barber => (
                          <button
                            key={barber.id}
                            type="button"
                            onClick={() => handleSelectProviderFromMenu(barber.id)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition',
                              selectedProvider?.id === barber.id
                                ? 'bg-primary/10 text-primary'
                                : 'bg-white/70 text-foreground hover:bg-white'
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <img
                                src={profileLogo}
                                alt=""
                                aria-hidden="true"
                                className="h-3 w-3"
                              />
                              {barber.name}
                            </span>
                            <span
                              className={cn(
                                'h-2 w-2 rounded-full border',
                                barber.isAvailable
                                  ? 'bg-emerald-400 border-emerald-200'
                                  : 'bg-slate-300 border-slate-200'
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showLeaveWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close warning"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowLeaveWarning(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border/60 bg-background px-5 py-4 shadow-xl">
            <p className="text-sm font-semibold text-foreground">Leave the manager view?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You will not be able to redirect back once you open the client queue bot.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLeaveWarning(false)}
                className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-foreground hover:border-primary/40"
              >
                Stay here
              </button>
              <button
                type="button"
                onClick={handleConfirmOpenChat}
                className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Open Client Queue Bot
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="mx-auto max-w-5xl px-6 py-8 pb-32 animate-rise-in"
        style={{ animationDelay: '120ms' }}
      >
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-border/60 bg-white/80 px-6 py-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-white shadow-sm">
              <img src={activeItem.icon} alt="" aria-hidden="true" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Manager
              </p>
              <h2 className="text-lg font-semibold text-foreground">{activeItem.label}</h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground sm:max-w-xs">
            {activeItem.description}
          </p>
        </div>
        {activeTab === 'salon' && (
          <SectionCard>
            <div className="grid gap-6 md:grid-cols-2">
              <TextInput
                label="Salon name"
                value={salonForm.name}
                onChange={event => setSalonForm(prev => ({ ...prev, name: event.target.value }))}
              />
              <TextInput
                label="Address"
                value={salonForm.address}
                onChange={event => setSalonForm(prev => ({ ...prev, address: event.target.value }))}
              />
              <TextInput
                label="City"
                value={salonForm.city}
                onChange={event => setSalonForm(prev => ({ ...prev, city: event.target.value }))}
              />
              <TextInput
                label="Working days"
                value={salonForm.workingDays}
                onChange={event =>
                  setSalonForm(prev => ({ ...prev, workingDays: event.target.value }))
                }
              />
              <TextInput
                label="Opens at"
                type="time"
                value={salonForm.opensAt}
                onChange={event => setSalonForm(prev => ({ ...prev, opensAt: event.target.value }))}
              />
              <TextInput
                label="Closes at"
                type="time"
                value={salonForm.closesAt}
                onChange={event => setSalonForm(prev => ({ ...prev, closesAt: event.target.value }))}
              />
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <TextInput
                label="Manager name"
                value={salonForm.managerName}
                onChange={event =>
                  setSalonForm(prev => ({ ...prev, managerName: event.target.value }))
                }
              />
              <TextInput
                label="Manager phone"
                value={salonForm.managerPhone}
                onChange={event =>
                  setSalonForm(prev => ({ ...prev, managerPhone: event.target.value }))
                }
              />
              <TextInput
                label="Manager email"
                type="email"
                value={salonForm.managerEmail}
                onChange={event =>
                  setSalonForm(prev => ({ ...prev, managerEmail: event.target.value }))
                }
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                Save changes
              </button>
            </div>
          </SectionCard>
        )}

        {activeTab === 'barbers' && (
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Service Providers
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Monitor daily flow and jump into provider details.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartCreateProvider}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-white"
              >
                <img src={addProfileLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                Add Service Providers
              </button>
            </div>

            {isCreatingProvider && providerDraft && (
              <div className="rounded-3xl border border-border/60 bg-white/90 p-6 shadow-lg backdrop-blur animate-float-in">
                <form className="grid gap-4 sm:grid-cols-2" onSubmit={event => handleSaveProvider(event)}>
                  <ProviderInput
                    label="Name"
                    icon={profileLogo}
                    value={providerDraft.name}
                    placeholder="Jordan Blake"
                    onChange={value => handleProviderDraftChange('name', value)}
                  />
                  <ProviderInput
                    label="Email"
                    type="email"
                    value={providerDraft.email}
                    placeholder="jordan@company.com"
                    onChange={value => handleProviderDraftChange('email', value)}
                  />
                  <ProviderInput
                    label="Phone"
                    type="tel"
                    icon={phoneLogo}
                    value={providerDraft.phone}
                    placeholder="079 863 9512"
                    onChange={value => handleProviderDraftChange('phone', value)}
                  />
                  <ProviderInput
                    label="Start time"
                    value={providerDraft.startTime}
                    placeholder="09:00"
                    onChange={value => handleProviderDraftChange('startTime', value)}
                  />
                  <ProviderInput
                    label="End time"
                    value={providerDraft.endTime}
                    placeholder="17:00"
                    onChange={value => handleProviderDraftChange('endTime', value)}
                  />
                  <ProviderInput
                    label="Lunch start"
                    value={providerDraft.lunchStart}
                    placeholder="13:00"
                    onChange={value => handleProviderDraftChange('lunchStart', value)}
                  />
                  <ProviderInput
                    label="Lunch duration (minutes)"
                    type="number"
                    value={providerDraft.lunchDurationMinutes}
                    placeholder="45"
                    onChange={value => handleProviderDraftChange('lunchDurationMinutes', value)}
                  />
                  <ProviderInput
                    label="Average service (minutes)"
                    type="number"
                    value={providerDraft.averageServiceMinutes}
                    placeholder="30"
                    onChange={value => handleProviderDraftChange('averageServiceMinutes', value)}
                  />
                  <ProviderInput
                    label="Address"
                    value={providerDraft.address}
                    placeholder={defaultAddress}
                    className="sm:col-span-2"
                    onChange={value => handleProviderDraftChange('address', value)}
                  />
                  <div className="sm:col-span-2 flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingProvider(false);
                        setIsEditingProvider(false);
                        setProviderDraft(null);
                      }}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      <img src={saveLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                      Save changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="rounded-[32px] border border-border/60 bg-white/80 p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                {barbers.map(barber => {
                  const queueCount = getQueueCount(barber.id);
                  const servicedCount = getServicedCount(barber.id);
                  const isOpen = openProviderId === barber.id;
                  const showEditor = isOpen && isEditingProvider && providerDraft;
                  const showDetails = isOpen && !isEditingProvider;
                  const address =
                    providerAddresses[barber.id] ?? `${salon.address}, ${salon.city}`;

                  return (
                    <div key={barber.id} className="relative">
                      <button
                        type="button"
                        onClick={() => handleSelectProvider(barber.id)}
                        className="group relative w-full rounded-3xl border border-border/60 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                      >
                        <span
                          className={cn(
                            'absolute right-4 top-4 h-3 w-3 rounded-full border',
                            barber.isAvailable
                              ? 'bg-emerald-400 border-emerald-200'
                              : 'bg-slate-300 border-slate-200'
                          )}
                        />
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <img src={profileLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                          {barber.name}
                        </div>
                        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <img src={servicedLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                            <span>Serviced</span>
                            <span className="font-semibold text-foreground">{servicedCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={queueLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                            <span>In Queue</span>
                            <span className="font-semibold text-foreground">{queueCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={phoneLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                            <span className="font-semibold text-foreground">{barber.phone}</span>
                          </div>
                        </div>
                      </button>

                      {showDetails && (
                        <div className="absolute left-1/2 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-border/60 bg-white/95 p-4 shadow-xl backdrop-blur animate-float-in">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={profileLogo}
                                alt=""
                                aria-hidden="true"
                                className="h-5 w-5"
                              />
                              <div>
                                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                  Service Provider
                                </p>
                                <p className="text-sm font-semibold text-foreground">{barber.name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <img
                                src={phoneLogo}
                                alt=""
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                              <span className="font-semibold text-foreground">{barber.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Email
                              </span>
                              <span className="font-semibold text-foreground">{barber.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Shift
                              </span>
                              <span className="font-semibold text-foreground">
                                {barber.startTime} - {barber.endTime}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Address
                              </span>
                              <span className="font-semibold text-foreground">{address}</span>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleStartEditingProvider(barber)}
                              className="flex items-center gap-2 rounded-full border border-border/60 bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:border-primary/40"
                            >
                              <img src={editLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                              Edit
                            </button>
                          </div>
                        </div>
                      )}

                      {showEditor && providerDraft && (
                        <div className="absolute left-1/2 top-full z-50 mt-3 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-border/60 bg-white/95 p-4 shadow-xl backdrop-blur animate-float-in">
                          <form
                            className="grid gap-3 sm:grid-cols-2"
                            onSubmit={event => handleSaveProvider(event, barber.id)}
                          >
                            <ProviderInput
                              label="Name"
                              icon={profileLogo}
                              value={providerDraft.name}
                              placeholder="Jordan Blake"
                              onChange={value => handleProviderDraftChange('name', value)}
                            />
                            <ProviderInput
                              label="Email"
                              type="email"
                              value={providerDraft.email}
                              placeholder="jordan@company.com"
                              onChange={value => handleProviderDraftChange('email', value)}
                            />
                            <ProviderInput
                              label="Phone"
                              type="tel"
                              icon={phoneLogo}
                              value={providerDraft.phone}
                              placeholder="079 863 9512"
                              onChange={value => handleProviderDraftChange('phone', value)}
                            />
                            <ProviderInput
                              label="Start time"
                              value={providerDraft.startTime}
                              placeholder="09:00"
                              onChange={value => handleProviderDraftChange('startTime', value)}
                            />
                            <ProviderInput
                              label="End time"
                              value={providerDraft.endTime}
                              placeholder="17:00"
                              onChange={value => handleProviderDraftChange('endTime', value)}
                            />
                            <ProviderInput
                              label="Lunch start"
                              value={providerDraft.lunchStart}
                              placeholder="13:00"
                              onChange={value => handleProviderDraftChange('lunchStart', value)}
                            />
                            <ProviderInput
                              label="Lunch duration (minutes)"
                              type="number"
                              value={providerDraft.lunchDurationMinutes}
                              placeholder="45"
                              onChange={value => handleProviderDraftChange('lunchDurationMinutes', value)}
                            />
                            <ProviderInput
                              label="Average service (minutes)"
                              type="number"
                              value={providerDraft.averageServiceMinutes}
                              placeholder="30"
                              onChange={value => handleProviderDraftChange('averageServiceMinutes', value)}
                            />
                            <ProviderInput
                              label="Address"
                              value={providerDraft.address}
                              placeholder={address}
                              className="sm:col-span-2"
                              onChange={value => handleProviderDraftChange('address', value)}
                            />
                            <div className="sm:col-span-2 flex items-center justify-between pt-2">
                              <div className="relative">
                                {deleteConfirmId === barber.id && (
                                  <div className="absolute -top-12 left-0 w-max rounded-2xl border border-border/60 bg-white px-3 py-2 text-[0.6rem] font-semibold text-foreground shadow-md">
                                    Are you sure?
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProvider(barber.id)}
                                  className="flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-500"
                                >
                                  <img src={deleteLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                                  Delete service provider
                                </button>
                                {deleteConfirmId === barber.id && (
                                  <button
                                    type="button"
                                    onClick={handleCancelDelete}
                                    className="absolute -bottom-6 left-1 text-[0.6rem] font-semibold text-muted-foreground hover:text-foreground"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                              <button
                                type="submit"
                                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                              >
                                <img src={saveLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                                Save changes
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="grid gap-8">
            <div className="flex w-full flex-wrap items-center justify-center gap-3 rounded-full border border-border/60 bg-white/80 p-3 shadow-sm">
              <div>
                <div
                  className={cn(
                    'flex rounded-full border border-border/60 bg-white/80 p-1 shadow-sm',
                    !hasProvider && 'opacity-50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleDuty(false)}
                    aria-pressed={!isOnDuty}
                    disabled={!hasProvider}
                    className={cn(
                      'rounded-full px-4 py-2 text-xs font-semibold transition',
                      !isOnDuty
                        ? 'bg-slate-200 text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Off
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleDuty(true)}
                    aria-pressed={isOnDuty}
                    disabled={!hasProvider}
                    className={cn(
                      'rounded-full px-4 py-2 text-xs font-semibold transition',
                      isOnDuty
                        ? 'bg-emerald-200 text-emerald-900 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    On
                  </button>
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={handleToggleQueueList}
                  disabled={!hasProvider}
                  className={cn(
                    'flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-5 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/40',
                    !hasProvider && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <img src={queueLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                  Queue
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                    {selectedQueue.length}
                  </span>
                </button>
                {isQueueListOpen && (
                  <div className="absolute left-1/2 top-full z-50 mt-3 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-border/60 bg-white/95 p-4 shadow-xl backdrop-blur animate-float-in">
                    <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                      {selectedQueue.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No one is in the queue yet.</p>
                      ) : (
                        selectedQueue.map(client => (
                          <div
                            key={client.id}
                            className="flex items-center justify-between rounded-2xl border border-border/40 bg-white/80 px-3 py-2 text-xs"
                          >
                            <span className="font-semibold text-foreground">{client.name}</span>
                            {client.isWalkIn && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-semibold text-emerald-700">
                                Walk-in
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mx-2 mt-4 border-t border-border/60 pt-3 text-center text-xs font-semibold text-foreground">
                      {selectedQueue.length}{' '}
                      {selectedQueue.length === 1 ? 'Person' : 'People'} In Queue
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={handleToggleWalkInConfirm}
                  disabled={!hasProvider}
                  className={cn(
                    'flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-5 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/40',
                    !hasProvider && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <img src={walkInLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                  Walk-in
                </button>
                {isWalkInConfirmOpen && (
                  <div className="absolute right-0 top-full z-50 mt-3 w-[min(11rem,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-white/95 p-3 shadow-xl backdrop-blur animate-float-in">
                    <p className="text-xs font-semibold text-foreground">Confirm Walk-in</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmWalkIn}
                        className="flex-1 rounded-full bg-emerald-500 px-3 py-1 text-[0.65rem] font-semibold text-white shadow-sm hover:bg-emerald-600"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsWalkInConfirmOpen(false)}
                        className="flex-1 rounded-full border border-border/60 px-3 py-1 text-[0.65rem] font-semibold text-foreground hover:border-primary/40"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <button
                type="button"
                onClick={handleAlivePing}
                disabled={!isOnDuty || !selectedProvider}
                style={{ transform: `scale(${aliveScale})` }}
                className={cn(
                  'relative flex h-56 w-56 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-400/90 text-foreground shadow-2xl transition-transform duration-500',
                  isOnDuty && 'alive-breathe',
                  !isOnDuty && 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500',
                  !selectedProvider && 'opacity-50'
                )}
              >
                <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border border-emerald-500/60 bg-emerald-200/90 text-center">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-emerald-900">
                    Stay Alive
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-900">
                    {isOnDuty ? Math.max(0, Math.ceil(timeLeftMs / 60000)) : '--'}
                  </p>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-emerald-900">
                    Minutes
                  </p>
                </div>
              </button>
              <p className="text-xs text-muted-foreground">
                {isOnDuty
                  ? 'Tap every 45 minutes to stay on duty.'
                  : 'Toggle on to start your shift.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <nav
        aria-label="Manager sections"
        className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 animate-float-in"
        style={{ animationDelay: '200ms' }}
      >
        <div className="w-full max-w-sm rounded-full border border-border/60 bg-white/80 p-2 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-3 gap-2">
            {navigationItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  aria-pressed={isActive}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[0.65rem] font-semibold transition',
                    isActive
                      ? 'bg-white text-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <img
                    src={item.icon}
                    alt=""
                    aria-hidden="true"
                    className={cn('h-6 w-6', isActive ? 'opacity-100' : 'opacity-60')}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default AppManager;
