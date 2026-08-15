import React from 'react';

type Tone = 'neutral' | 'success' | 'danger' | 'warning';

interface StatusChipProps {
  label: string;
  tone?: Tone;
  dot?: boolean;
}

export function StatusChip({ label, tone = 'neutral', dot = false }: StatusChipProps) {
  return (
    <span className={`pl-chip pl-chip-${tone}`}>
      {dot && <span className="rounded-circle" style={{ width: 6, height: 6, background: 'currentColor' }} aria-hidden="true" />}
      {label}
    </span>);

}

export function toneForStatus(status: string): Tone {
  switch (status) {
    case 'Ativo':
    case 'Concluída':
      return 'success';
    case 'Inativo':
    case 'Cancelada':
      return 'danger';
    case 'Pendente':
      return 'warning';
    default:
      return 'neutral';
  }
}