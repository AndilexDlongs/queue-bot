import React from 'react';
import { useQueue } from '../../context/QueueContext';

export const ChatHeader: React.FC = () => {
  const { salon } = useQueue();
  const initials = salon.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-border/50">
      <div className="max-w-lg mx-auto flex flex-col items-center gap-2 px-4 py-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
          {initials}
        </div>
        <div className="flex flex-col items-center text-center">
          <h1 className="font-semibold text-foreground text-sm">{salon.name}</h1>
          <span className="text-xs text-muted-foreground">Virtual Queue</span>
        </div>
      </div>
    </div>
  );
};
