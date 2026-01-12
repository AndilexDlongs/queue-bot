import React, { useState } from 'react';
import { useQueue } from '../../context/QueueContext';

export const ChatHeader: React.FC = () => {
  const { salon } = useQueue();
  const [expanded, setExpanded] = useState(false);
  const initials = salon.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-border/50">
      <div className="max-w-lg mx-auto px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="w-full flex flex-col items-center gap-2 text-center"
          aria-expanded={expanded}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="font-semibold text-foreground text-sm">{salon.name}</h1>
            <span className="text-xs text-muted-foreground">
              {expanded ? 'Tap to collapse details' : 'Tap for salon details'}
            </span>
          </div>
        </button>
        {expanded && (
          <div className="mt-3 rounded-xl border border-border/60 bg-white/90 px-4 py-3 text-xs text-muted-foreground shadow-sm">
            <p className="font-semibold text-foreground">{salon.name}</p>
            <p className="mt-1">{salon.address}, {salon.city}</p>
            <p className="mt-1">{salon.workingDays} | {salon.opensAt} - {salon.closesAt}</p>
          </div>
        )}
      </div>
    </div>
  );
};
