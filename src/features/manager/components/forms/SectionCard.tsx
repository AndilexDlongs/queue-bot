import React from 'react';
import { cn } from '../../../../shared/utils/cn';

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ children, className }) => (
  <div className={cn('rounded-3xl border border-border/70 bg-white/80 p-6 shadow-sm', className)}>
    {children}
  </div>
);
