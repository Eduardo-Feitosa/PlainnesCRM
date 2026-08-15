import React from 'react';
import styled from 'styled-components';
import type { ClienteStatus } from '../../types/cliente';

// ============================================
// STYLED COMPONENTS
// ============================================

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const Chip = styled.span<{ $tone: Tone; $dot: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ $dot }) => ($dot ? '0.45rem' : '0.25rem')};
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.01em;

  background-color: ${({ $tone }) =>
    $tone === 'success' ? 'rgba(26,153,94,0.10)' :
    $tone === 'warning' ? 'rgba(242,149,52,0.14)' :
    $tone === 'danger' ? 'rgba(221,56,74,0.10)' :
    'rgba(100,98,140,0.12)'};

  color: ${({ $tone }) =>
    $tone === 'success' ? '#168050' :
    $tone === 'warning' ? '#B46A14' :
    $tone === 'danger' ? '#B02A3C' :
    '#515375'};

  white-space: nowrap;
`;

const Dot = styled.span<{ $tone: Tone }>`
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 999px;
  background-color: ${({ $tone }) =>
    $tone === 'success' ? '#1A995E' :
    $tone === 'warning' ? '#F29534' :
    $tone === 'danger' ? '#DD384A' :
    '#6A6D8F'};
`;

// ============================================
// HELPERS
// ============================================

export const toneForStatus = (status: string | null | undefined): Tone =>
{
    if (!status) return 'neutral';
    switch (status)
    {
        case 'Ativo': return 'success';
        case 'Inativo': return 'warning';
        case 'Bloqueado': return 'danger';
        default: return 'neutral';
    }
};

// ============================================
// TIPOS
// ============================================

interface StatusChipProps
{
    label: ClienteStatus | string;
    tone?: Tone;
    dot?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const StatusChip: React.FC<StatusChipProps> = ({ label, tone, dot = true }) =>
{
    const usedTone = tone ?? toneForStatus(label);
    return (
        <Chip $tone={usedTone} $dot={dot}>
            {dot && <Dot $tone={usedTone} />}
            {label}
        </Chip>
    );
};

export default StatusChip;
