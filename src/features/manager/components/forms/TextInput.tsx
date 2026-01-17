import React from 'react';
import { FieldLabel } from './FieldLabel';

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const TextInput: React.FC<TextInputProps> = ({ label, ...props }) => (
  <label className="flex flex-col gap-2 text-sm text-foreground">
    <FieldLabel label={label} />
    <input
      {...props}
      className="rounded-lg border border-border/70 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  </label>
);
