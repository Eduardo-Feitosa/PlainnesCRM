import React from 'react';
import { Field, inputClasses } from './Field';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  icon?: React.ReactNode;
}

export function TextField({ id, label, error, hint, optional, icon, ...inputProps }: TextFieldProps) {
  return (
    <Field id={id} label={label} error={error} hint={hint} optional={optional}>
      <div className="relative">
        {icon &&
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true">
            {icon}
          </span>
        }
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={inputClasses(Boolean(error), Boolean(icon))}
          {...inputProps} />
        
      </div>
    </Field>);

}