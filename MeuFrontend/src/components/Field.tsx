import React from 'react';
import { AlertCircleIcon } from 'lucide-react';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}

export function Field({ id, label, error, hint, optional, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 font-medium text-ink-muted">(opcional)</span>}
      </label>
      {children}
      {error ?
      <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-coral-500">
          <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p> :
      hint ?
      <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p> :
      null}
    </div>);

}

export const inputClasses = (hasError: boolean, hasIcon: boolean) =>
[
'w-full rounded-xl border bg-surface-sunken text-[15px] text-ink placeholder:text-ink-muted/70',
'py-3 pr-4 transition-colors outline-none',
hasIcon ? 'pl-11' : 'pl-4',
hasError ?
'border-coral-400 focus:border-coral-500 focus:ring-4 focus:ring-coral-200/60' :
'border-surface-line hover:border-brand-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100'].
join(' ');