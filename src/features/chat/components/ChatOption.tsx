import React from 'react';
import { cn } from '../../../shared/utils/cn';

interface ChatOptionProps {
  label: string;
  sublabel?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'barber';
}

export const ChatOption: React.FC<ChatOptionProps> = ({
  label,
  sublabel,
  onClick,
  disabled = false,
  variant = 'default'
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left px-4 py-3 rounded-xl transition-all duration-200',
        'border border-border/60 bg-white/80 backdrop-blur-sm',
        'hover:bg-white hover:border-primary/40 hover:shadow-md',
        'active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/80'
      )}
    >
      <div className={cn('flex gap-3', variant === 'barber' ? 'items-start' : 'items-center')}>
        <span className="mt-1 h-3 w-3 rounded-full border border-border/70 bg-white/70" />
        <div className={cn('flex-1', variant === 'barber' && 'flex flex-col gap-1')}>
          <span className="text-sm font-medium text-foreground">{label}</span>
          {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
        </div>
      </div>
    </button>
  );
};
