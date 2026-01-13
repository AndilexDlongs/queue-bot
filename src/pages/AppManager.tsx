import React, { useMemo, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { Barber, QueueClient } from '../data/mockData';
import { cn } from '../utils/cn';

type ManagerTab = 'salon' | 'barbers' | 'operations';

const tabs: Array<{ id: ManagerTab; label: string }> = [
  { id: 'salon', label: 'Salon Management' },
  { id: 'barbers', label: 'Barber Management' },
  { id: 'operations', label: 'Barber Operations' }
];

const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={cn('rounded-2xl border border-border/70 bg-white/80 p-6 shadow-sm', className)}>
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
    barbers,
    queue,
    getQueueCount,
    addBarber,
    addWalkIn,
    toggleBarberAvailability,
    updateClientStatus
  } = useQueue();
  const [activeTab, setActiveTab] = useState<ManagerTab>('salon');
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
    averageCutMinutes: 30
  });
  const [walkInNames, setWalkInNames] = useState<Record<string, string>>({});
  const [walkInServices, setWalkInServices] = useState<Record<string, QueueClient['service']>>(
    {}
  );

  const openChat = () => {
    window.location.hash = 'chat';
  };

  const handleAddBarber = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newBarber.name.trim()) return;

    const barber: Barber = {
      id: `barber-${Date.now()}`,
      salonId: salon.id,
      name: newBarber.name.trim(),
      phone: newBarber.phone.trim(),
      email: newBarber.email.trim(),
      startTime: newBarber.startTime,
      endTime: newBarber.endTime,
      lunchStart: newBarber.lunchStart,
      lunchDurationMinutes: Number(newBarber.lunchDurationMinutes),
      averageCutMinutes: Number(newBarber.averageCutMinutes),
      isAvailable: false
    };

    addBarber(barber);
    setNewBarber({
      name: '',
      phone: '',
      email: '',
      startTime: '09:00',
      endTime: '17:00',
      lunchStart: '13:00',
      lunchDurationMinutes: 45,
      averageCutMinutes: 30
    });
  };

  const handleAddWalkIn = (barberId: string) => {
    const name = walkInNames[barberId]?.trim();
    if (!name) return;
    addWalkIn(barberId, name, walkInServices[barberId] ?? 'haircut');
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                App Manager
              </p>
              <h1 className="text-lg font-semibold text-foreground">{salon.name}</h1>
            </div>
            <button
              onClick={openChat}
              className="rounded-full border border-border/70 bg-white/90 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/50"
            >
              Open Client Chat
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-semibold transition',
                  activeTab === tab.id
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-border/70 bg-white/70 text-foreground hover:border-primary/40'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
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
                  label="Average cut time (minutes)"
                  type="number"
                  value={newBarber.averageCutMinutes}
                  onChange={event =>
                    setNewBarber(prev => ({
                      ...prev,
                      averageCutMinutes: Number(event.target.value)
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
                        onClick={() => toggleBarberAvailability(barber.id)}
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
                      <div>Average cut: {barber.averageCutMinutes} min</div>
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
                      value={walkInServices[barber.id] ?? 'haircut'}
                      onChange={event =>
                        setWalkInServices(prev => ({
                          ...prev,
                          [barber.id]: event.target.value as QueueClient['service']
                        }))
                      }
                      className="rounded-lg border border-border/70 bg-white/80 px-3 py-2 text-sm"
                    >
                      <option value="haircut">Haircut</option>
                      <option value="plait">Plaiting</option>
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
                            Service: {client.service === 'haircut' ? 'Haircut' : 'Plaiting'} |{' '}
                            Status: {client.status}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Contact: {client.phone ?? client.email ?? 'No contact'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {client.status === 'waiting' && (
                            <button
                              onClick={() => updateClientStatus(client.id, 'accepted')}
                              className="rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold text-primary"
                            >
                              Accept
                            </button>
                          )}
                          {client.status === 'accepted' && (
                            <button
                              onClick={() => updateClientStatus(client.id, 'in-service')}
                              className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground"
                            >
                              Start
                            </button>
                          )}
                          {client.status === 'in-service' || client.status === 'accepted' ? (
                            <button
                              onClick={() => updateClientStatus(client.id, 'done')}
                              className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                            >
                              Done
                            </button>
                          ) : null}
                          {client.status === 'waiting' && (
                            <button
                              onClick={() => updateClientStatus(client.id, 'declined')}
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
    </div>
  );
};

export default AppManager;
