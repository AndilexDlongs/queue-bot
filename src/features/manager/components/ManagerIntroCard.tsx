import React from 'react';
import type { NavigationItem } from '../types';

interface ManagerIntroCardProps {
  activeItem: NavigationItem;
}

export const ManagerIntroCard: React.FC<ManagerIntroCardProps> = ({ activeItem }) => (
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
    <p className="text-sm text-muted-foreground sm:max-w-xs">{activeItem.description}</p>
  </div>
);
