import React from 'react';
import { cn } from '../../../../shared/utils/cn';
import { FieldLabel } from './FieldLabel';

interface ProviderInputProps {
  label: string;
  icon?: string;
  type?: string;
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
}

export const ProviderInput: React.FC<ProviderInputProps> = ({
  label,
  icon,
  type = 'text',
  value,
  placeholder,
  className,
  onChange
}) => (
  <label className={cn('flex flex-col gap-2 text-sm text-foreground', className)}>
    <FieldLabel label={label} />
    <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-white/80 px-3 py-2 shadow-sm transition focus-within:border-primary/40">
      {icon && <img src={icon} alt="" aria-hidden="true" className="h-4 w-4 opacity-70" />}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
      />
    </div>
  </label>
);
