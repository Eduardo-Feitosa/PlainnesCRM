import React from 'react';
import { motion } from 'framer-motion';
import { BuildingIcon, UserIcon } from 'lucide-react';
import type { PersonType } from '../utils/validation';

interface PersonTypeToggleProps {
  value: PersonType;
  onChange: (value: PersonType) => void;
}

const options: {id: PersonType;label: string;icon: React.ReactNode;}[] = [
{ id: 'pf', label: 'Pessoa Física', icon: <UserIcon className="h-4 w-4" /> },
{ id: 'pj', label: 'Pessoa Jurídica', icon: <BuildingIcon className="h-4 w-4" /> }];


export function PersonTypeToggle({ value, onChange }: PersonTypeToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink" id="tipo-label">
        Tipo de cadastro
      </span>
      <div
        role="radiogroup"
        aria-labelledby="tipo-label"
        className="grid grid-cols-2 gap-1 rounded-xl border border-surface-line bg-surface-sunken p-1">
        
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.id)}
              className={`relative flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              active ? 'text-white' : 'text-ink-soft hover:text-ink'}`
              }>
              
              {active &&
              <motion.span
                layoutId="person-type-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-lg bg-brand-600" />

              }
              <span className="relative flex items-center gap-2">
                {option.icon}
                {option.label}
              </span>
            </button>);

        })}
      </div>
    </div>);

}