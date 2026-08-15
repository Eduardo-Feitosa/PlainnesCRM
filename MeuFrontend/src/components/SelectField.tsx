import React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { Field, inputClasses } from './Field';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  placeholder: string;
  options: string[];
}

export function SelectField({ id, label, error, hint, placeholder, options, value, ...selectProps }: SelectFieldProps) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <select
          id={id}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`${inputClasses(Boolean(error), false)} appearance-none pr-11 ${
          value ? 'text-ink' : 'text-ink-muted/70'}`
          }
          {...selectProps}>
          
          <option value="">{placeholder}</option>
          {options.map((option) =>
          <option key={option} value={option} className="text-ink">
              {option}
            </option>
          )}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted"
          aria-hidden="true" />
        
      </div>
    </Field>);

}