import React from 'react';

interface FieldLabelProps {
  label: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({ label }) => (
  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    {label}
  </span>
);
