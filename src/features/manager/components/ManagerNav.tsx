import React from 'react';
import { cn } from '../../../shared/utils/cn';
import { navigationItems } from '../constants';
import type { ManagerTab } from '../types';

interface ManagerNavProps {
  activeTab: ManagerTab;
  onSelectTab: (tab: ManagerTab) => void;
}

export const ManagerNav: React.FC<ManagerNavProps> = ({ activeTab, onSelectTab }) => (
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
              onClick={() => onSelectTab(item.id)}
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
);
