import React from 'react';
import type { Barber } from '../../../data/mockData';
import { cn } from '../../../shared/utils/cn';
import type { ManagerTab } from '../types';
import { profileLogo, queueBotLogo, threeStripesLogo } from '../icons';

interface ManagerHeaderProps {
  salonName: string;
  activeTab: ManagerTab;
  barbers: Barber[];
  selectedProviderId: string | null;
  isProviderMenuOpen: boolean;
  onOpenChatClick: () => void;
  onToggleProviderMenu: () => void;
  onSelectProviderFromMenu: (providerId: string) => void;
}

export const ManagerHeader: React.FC<ManagerHeaderProps> = ({
  salonName,
  activeTab,
  barbers,
  selectedProviderId,
  isProviderMenuOpen,
  onOpenChatClick,
  onToggleProviderMenu,
  onSelectProviderFromMenu
}) => (
  <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-md animate-float-in">
    <div className="mx-auto max-w-5xl px-6 py-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenChatClick}
            aria-label="Open client queue bot"
            className="group flex items-center gap-3 rounded-full border border-border/60 bg-white/80 px-3 py-2 shadow-sm transition hover:border-primary/40 hover:bg-white"
          >
            <img src={queueBotLogo} alt="" aria-hidden="true" className="h-8 w-8" />
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
            {salonName}
          </h1>
        </div>
        <div className="flex items-center justify-end">
          {activeTab === 'operations' && (
            <div className="relative">
              <button
                type="button"
                onClick={onToggleProviderMenu}
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
                        onClick={() => onSelectProviderFromMenu(barber.id)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition',
                          selectedProviderId === barber.id
                            ? 'bg-primary/10 text-primary'
                            : 'bg-white/70 text-foreground hover:bg-white'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <img src={profileLogo} alt="" aria-hidden="true" className="h-3 w-3" />
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
);
