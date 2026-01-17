import React from 'react';
import type { Barber } from '../../../data/mockData';
import { cn } from '../../../shared/utils/cn';
import type { ProviderDraft } from '../types';
import {
  addProfileLogo,
  deleteLogo,
  editLogo,
  phoneLogo,
  profileLogo,
  queueLogo,
  saveLogo,
  servicedLogo
} from '../icons';
import { ProviderInput } from './forms/ProviderInput';

interface ProviderManagementSectionProps {
  barbers: Barber[];
  defaultAddress: string;
  openProviderId: string | null;
  isEditingProvider: boolean;
  isCreatingProvider: boolean;
  providerDraft: ProviderDraft | null;
  deleteConfirmId: string | null;
  providerAddresses: Record<string, string>;
  onStartCreateProvider: () => void;
  onCancelCreateProvider: () => void;
  onSelectProvider: (barberId: string) => void;
  onStartEditingProvider: (barber: Barber) => void;
  onProviderDraftChange: (field: keyof ProviderDraft, value: string) => void;
  onSaveProvider: (event: React.FormEvent, providerId?: string) => void;
  onDeleteProvider: (providerId: string) => void;
  onCancelDelete: () => void;
  getQueueCount: (barberId: string) => number;
  getServicedCount: (barberId: string) => number;
}

export const ProviderManagementSection: React.FC<ProviderManagementSectionProps> = ({
  barbers,
  defaultAddress,
  openProviderId,
  isEditingProvider,
  isCreatingProvider,
  providerDraft,
  deleteConfirmId,
  providerAddresses,
  onStartCreateProvider,
  onCancelCreateProvider,
  onSelectProvider,
  onStartEditingProvider,
  onProviderDraftChange,
  onSaveProvider,
  onDeleteProvider,
  onCancelDelete,
  getQueueCount,
  getServicedCount
}) => (
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
        onClick={onStartCreateProvider}
        className="flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-white"
      >
        <img src={addProfileLogo} alt="" aria-hidden="true" className="h-4 w-4" />
        Add Service Providers
      </button>
    </div>

    {isCreatingProvider && providerDraft && (
      <div className="rounded-3xl border border-border/60 bg-white/90 p-6 shadow-lg backdrop-blur animate-float-in">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={event => onSaveProvider(event)}>
          <ProviderInput
            label="Name"
            icon={profileLogo}
            value={providerDraft.name}
            placeholder="Jordan Blake"
            onChange={value => onProviderDraftChange('name', value)}
          />
          <ProviderInput
            label="Email"
            type="email"
            value={providerDraft.email}
            placeholder="jordan@company.com"
            onChange={value => onProviderDraftChange('email', value)}
          />
          <ProviderInput
            label="Phone"
            type="tel"
            icon={phoneLogo}
            value={providerDraft.phone}
            placeholder="079 863 9512"
            onChange={value => onProviderDraftChange('phone', value)}
          />
          <ProviderInput
            label="Start time"
            value={providerDraft.startTime}
            placeholder="09:00"
            onChange={value => onProviderDraftChange('startTime', value)}
          />
          <ProviderInput
            label="End time"
            value={providerDraft.endTime}
            placeholder="17:00"
            onChange={value => onProviderDraftChange('endTime', value)}
          />
          <ProviderInput
            label="Lunch start"
            value={providerDraft.lunchStart}
            placeholder="13:00"
            onChange={value => onProviderDraftChange('lunchStart', value)}
          />
          <ProviderInput
            label="Lunch duration (minutes)"
            type="number"
            value={providerDraft.lunchDurationMinutes}
            placeholder="45"
            onChange={value => onProviderDraftChange('lunchDurationMinutes', value)}
          />
          <ProviderInput
            label="Average service (minutes)"
            type="number"
            value={providerDraft.averageServiceMinutes}
            placeholder="30"
            onChange={value => onProviderDraftChange('averageServiceMinutes', value)}
          />
          <ProviderInput
            label="Address"
            value={providerDraft.address}
            placeholder={defaultAddress}
            className="sm:col-span-2"
            onChange={value => onProviderDraftChange('address', value)}
          />
          <div className="sm:col-span-2 flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onCancelCreateProvider}
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
          const address = providerAddresses[barber.id] ?? defaultAddress;

          return (
            <div key={barber.id} className="relative">
              <button
                type="button"
                onClick={() => onSelectProvider(barber.id)}
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
                      <img src={profileLogo} alt="" aria-hidden="true" className="h-5 w-5" />
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
                      <img src={phoneLogo} alt="" aria-hidden="true" className="h-4 w-4" />
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
                      onClick={() => onStartEditingProvider(barber)}
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
                    onSubmit={event => onSaveProvider(event, barber.id)}
                  >
                    <ProviderInput
                      label="Name"
                      icon={profileLogo}
                      value={providerDraft.name}
                      placeholder="Jordan Blake"
                      onChange={value => onProviderDraftChange('name', value)}
                    />
                    <ProviderInput
                      label="Email"
                      type="email"
                      value={providerDraft.email}
                      placeholder="jordan@company.com"
                      onChange={value => onProviderDraftChange('email', value)}
                    />
                    <ProviderInput
                      label="Phone"
                      type="tel"
                      icon={phoneLogo}
                      value={providerDraft.phone}
                      placeholder="079 863 9512"
                      onChange={value => onProviderDraftChange('phone', value)}
                    />
                    <ProviderInput
                      label="Start time"
                      value={providerDraft.startTime}
                      placeholder="09:00"
                      onChange={value => onProviderDraftChange('startTime', value)}
                    />
                    <ProviderInput
                      label="End time"
                      value={providerDraft.endTime}
                      placeholder="17:00"
                      onChange={value => onProviderDraftChange('endTime', value)}
                    />
                    <ProviderInput
                      label="Lunch start"
                      value={providerDraft.lunchStart}
                      placeholder="13:00"
                      onChange={value => onProviderDraftChange('lunchStart', value)}
                    />
                    <ProviderInput
                      label="Lunch duration (minutes)"
                      type="number"
                      value={providerDraft.lunchDurationMinutes}
                      placeholder="45"
                      onChange={value => onProviderDraftChange('lunchDurationMinutes', value)}
                    />
                    <ProviderInput
                      label="Average service (minutes)"
                      type="number"
                      value={providerDraft.averageServiceMinutes}
                      placeholder="30"
                      onChange={value => onProviderDraftChange('averageServiceMinutes', value)}
                    />
                    <ProviderInput
                      label="Address"
                      value={providerDraft.address}
                      placeholder={address}
                      className="sm:col-span-2"
                      onChange={value => onProviderDraftChange('address', value)}
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
                          onClick={() => onDeleteProvider(barber.id)}
                          className="flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-500"
                        >
                          <img src={deleteLogo} alt="" aria-hidden="true" className="h-4 w-4" />
                          Delete service provider
                        </button>
                        {deleteConfirmId === barber.id && (
                          <button
                            type="button"
                            onClick={onCancelDelete}
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
);
