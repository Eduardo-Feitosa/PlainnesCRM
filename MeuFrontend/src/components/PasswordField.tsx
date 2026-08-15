import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, LockIcon } from 'lucide-react';
import { Field, inputClasses } from './Field';
import { passwordLabels, passwordScore } from '../utils/validation';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

const barColors = ['bg-coral-400', 'bg-coral-400', 'bg-amber-400', 'bg-brand-400', 'bg-emerald-500'];

export function PasswordField({ id, label, value, error, onChange, onBlur }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const score = passwordScore(value);

  return (
    <Field
      id={id}
      label={label}
      error={error}
      hint={value ? undefined : 'Mínimo de 8 caracteres, com letras e números.'}>
      
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true">
          <LockIcon className="h-[18px] w-[18px]" />
        </span>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete="new-password"
          placeholder="Crie uma senha segura"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : `${id}-strength`}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`${inputClasses(Boolean(error), true)} pr-12`} />
        
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-muted transition-colors hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-300">
          
          {visible ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {value &&
      <div id={`${id}-strength`} className="mt-1 flex items-center gap-3">
          <div className="flex h-1.5 flex-1 gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) =>
          <span
            key={i}
            className={`h-full flex-1 rounded-full transition-colors ${
            i < score ? barColors[score] : 'bg-surface-line'}`
            } />

          )}
          </div>
          <span className="w-20 text-right text-xs font-semibold text-ink-soft">{passwordLabels[score]}</span>
        </div>
      }
    </Field>);

}