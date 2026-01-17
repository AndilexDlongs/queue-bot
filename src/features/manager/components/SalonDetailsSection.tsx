import React from 'react';
import type { SalonForm } from '../types';
import { SectionCard } from './forms/SectionCard';
import { TextInput } from './forms/TextInput';

interface SalonDetailsSectionProps {
  salonForm: SalonForm;
  onFieldChange: (field: keyof SalonForm, value: string) => void;
}

export const SalonDetailsSection: React.FC<SalonDetailsSectionProps> = ({
  salonForm,
  onFieldChange
}) => (
  <SectionCard>
    <div className="grid gap-6 md:grid-cols-2">
      <TextInput
        label="Salon name"
        value={salonForm.name}
        onChange={event => onFieldChange('name', event.target.value)}
      />
      <TextInput
        label="Address"
        value={salonForm.address}
        onChange={event => onFieldChange('address', event.target.value)}
      />
      <TextInput
        label="City"
        value={salonForm.city}
        onChange={event => onFieldChange('city', event.target.value)}
      />
      <TextInput
        label="Working days"
        value={salonForm.workingDays}
        onChange={event => onFieldChange('workingDays', event.target.value)}
      />
      <TextInput
        label="Opens at"
        type="time"
        value={salonForm.opensAt}
        onChange={event => onFieldChange('opensAt', event.target.value)}
      />
      <TextInput
        label="Closes at"
        type="time"
        value={salonForm.closesAt}
        onChange={event => onFieldChange('closesAt', event.target.value)}
      />
    </div>

    <div className="mt-8 grid gap-6 md:grid-cols-3">
      <TextInput
        label="Manager name"
        value={salonForm.managerName}
        onChange={event => onFieldChange('managerName', event.target.value)}
      />
      <TextInput
        label="Manager phone"
        value={salonForm.managerPhone}
        onChange={event => onFieldChange('managerPhone', event.target.value)}
      />
      <TextInput
        label="Manager email"
        type="email"
        value={salonForm.managerEmail}
        onChange={event => onFieldChange('managerEmail', event.target.value)}
      />
    </div>

    <div className="mt-6 flex justify-end">
      <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
        Save changes
      </button>
    </div>
  </SectionCard>
);
