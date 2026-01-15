import React, { useEffect, useMemo, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { cn } from '../utils/cn';

const queueBotLogo = new URL('../assets/logos/queue-bot.svg', import.meta.url).href;
const operationsLogo = new URL('../assets/logos/operations.svg', import.meta.url).href;
const managementLogo = new URL('../assets/logos/management.svg', import.meta.url).href;
const detailsLogo = new URL('../assets/logos/details.svg', import.meta.url).href;

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
    description: 'Add barbers, update schedules, and availability.',
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

const AppManager: React.FC = () => {
  const {
    salon,
    services,
    barbers,
    queue,
    getQueueCount,
    addBarber,
    addWalkIn,
    toggleBarberAvailability,
    updateClientStatus
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
  const [newBarber, setNewBarber] = useState({
    name: '',
    phone: '',
    email: '',
    startTime: '09:00',
    endTime: '17:00',
    lunchStart: '13:00',
    lunchDurationMinutes: 45,
    averageServiceMinutes: 30
  });
  const [walkInNames, setWalkInNames] = useState<Record<string, string>>({});
  const [walkInServices, setWalkInServices] = useState<Record<string, string>>({});

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

  const handleAddBarber = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newBarber.name.trim()) return;

    await addBarber({
      name: newBarber.name.trim(),
      phone: newBarber.phone.trim(),
      email: newBarber.email.trim(),
      startTime: newBarber.startTime,
      endTime: newBarber.endTime,
      lunchStart: newBarber.lunchStart,
      lunchDurationMinutes: Number(newBarber.lunchDurationMinutes),
      averageServiceMinutes: Number(newBarber.averageServiceMinutes),
      isAvailable: false
    });
    setNewBarber({
      name: '',
      phone: '',
      email: '',
      startTime: '09:00',
      endTime: '17:00',
      lunchStart: '13:00',
      lunchDurationMinutes: 45,
      averageServiceMinutes: 30
    });
  };

  const handleAddWalkIn = (barberId: string) => {
    const name = walkInNames[barberId]?.trim();
    if (!name) return;
    void addWalkIn(barberId, name, walkInServices[barberId] ?? services[0]?.key ?? 'haircut');
    setWalkInNames(prev => ({ ...prev, [barberId]: '' }));
  };

  const activeQueueForBarber = (barberId: string) =>
    queue
      .filter(
        client =>
          client.barberId === barberId &&
          !['done', 'declined', 'left'].includes(client.status)
      )
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

  const queueSummary = useMemo(
    () =>
      barbers.map(barber => ({
        barber,
        activeQueue: activeQueueForBarber(barber.id)
      })),
    [barbers, queue]
  );

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
            <div className="flex items-center justify-end" />
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
            <SectionCard>
              <h2 className="text-lg font-semibold text-foreground">Add a barber</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Register a new barber or hairdresser for this salon.
              </p>
              <form className="mt-6 grid gap-4 md:grid-cols-3" onSubmit={handleAddBarber}>
                <TextInput
                  label="Name"
                  value={newBarber.name}
                  onChange={event => setNewBarber(prev => ({ ...prev, name: event.target.value }))}
                />
                <TextInput
                  label="Phone"
                  value={newBarber.phone}
                  onChange={event => setNewBarber(prev => ({ ...prev, phone: event.target.value }))}
                />
                <TextInput
                  label="Email"
                  type="email"
                  value={newBarber.email}
                  onChange={event => setNewBarber(prev => ({ ...prev, email: event.target.value }))}
                />
                <TextInput
                  label="Start time"
                  type="time"
                  value={newBarber.startTime}
                  onChange={event =>
                    setNewBarber(prev => ({ ...prev, startTime: event.target.value }))
                  }
                />
                <TextInput
                  label="End time"
                  type="time"
                  value={newBarber.endTime}
                  onChange={event =>
                    setNewBarber(prev => ({ ...prev, endTime: event.target.value }))
                  }
                />
                <TextInput
                  label="Lunch start"
                  type="time"
                  value={newBarber.lunchStart}
                  onChange={event =>
                    setNewBarber(prev => ({ ...prev, lunchStart: event.target.value }))
                  }
                />
                <TextInput
                  label="Lunch duration (minutes)"
                  type="number"
                  value={newBarber.lunchDurationMinutes}
                  onChange={event =>
                    setNewBarber(prev => ({
                      ...prev,
                      lunchDurationMinutes: Number(event.target.value)
                    }))
                  }
                />
                <TextInput
                  label="Average service time (minutes)"
                  type="number"
                  value={newBarber.averageServiceMinutes}
                  onChange={event =>
                    setNewBarber(prev => ({
                      ...prev,
                      averageServiceMinutes: Number(event.target.value)
                    }))
                  }
                />
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                  >
                    Add barber
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard>
              <h2 className="text-lg font-semibold text-foreground">Current barbers</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {barbers.map(barber => (
                  <div
                    key={barber.id}
                    className="rounded-xl border border-border/60 bg-white/80 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{barber.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {barber.startTime} - {barber.endTime} | Lunch {barber.lunchStart} (
                          {barber.lunchDurationMinutes} min)
                        </p>
                      </div>
                      <button
                        onClick={() => void toggleBarberAvailability(barber.id)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold',
                          barber.isAvailable
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {barber.isAvailable ? 'Available' : 'Off duty'}
                      </button>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      <div>Phone: {barber.phone}</div>
                      <div>Email: {barber.email}</div>
                      <div>Average service: {barber.averageServiceMinutes} min</div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="grid gap-6">
            {queueSummary.map(({ barber, activeQueue }) => (
              <SectionCard key={barber.id}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{barber.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {getQueueCount(barber.id)} active clients
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      placeholder="Walk-in name"
                      value={walkInNames[barber.id] ?? ''}
                      onChange={event =>
                        setWalkInNames(prev => ({ ...prev, [barber.id]: event.target.value }))
                      }
                      className="rounded-lg border border-border/70 bg-white/80 px-3 py-2 text-sm"
                    />
                    <select
                      value={walkInServices[barber.id] ?? services[0]?.key ?? ''}
                      onChange={event =>
                        setWalkInServices(prev => ({
                          ...prev,
                          [barber.id]: event.target.value
                        }))
                      }
                      className="rounded-lg border border-border/70 bg-white/80 px-3 py-2 text-sm"
                    >
                      {services.map(service => (
                        <option key={service.key} value={service.key}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddWalkIn(barber.id)}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      Add walk-in
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {activeQueue.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No active clients in the queue yet.
                    </p>
                  ) : (
                    activeQueue.map(client => (
                      <div
                        key={client.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-white/80 p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {client.name}
                            {client.isWalkIn ? ' (Walk-in)' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Service: {services.find(service => service.key === client.service)?.name ?? client.service} |{' '}
                            Status: {client.status}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Contact: {client.phone ?? client.email ?? 'No contact'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {client.status === 'waiting' && (
                            <button
                              onClick={() => void updateClientStatus(client.id, 'accepted')}
                              className="rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold text-primary"
                            >
                              Accept
                            </button>
                          )}
                          {client.status === 'accepted' && (
                            <button
                              onClick={() => void updateClientStatus(client.id, 'in-service')}
                              className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground"
                            >
                              Start
                            </button>
                          )}
                          {client.status === 'in-service' || client.status === 'accepted' ? (
                            <button
                              onClick={() => void updateClientStatus(client.id, 'done')}
                              className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                            >
                              Done
                            </button>
                          ) : null}
                          {client.status === 'waiting' && (
                            <button
                              onClick={() => void updateClientStatus(client.id, 'declined')}
                              className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
                            >
                              Decline
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            ))}
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
