import React from 'react';
import styled from 'styled-components';

// ============================================
// STYLED COMPONENTS
// ============================================

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.25rem 0;
`;

const Avatar = styled.span<{ $bg?: string; $size?: 'sm' | 'md' | 'lg' }>`
  width: ${({ $size }) => ($size === 'sm' ? '36px' : $size === 'lg' ? '68px' : '48px')};
  height: ${({ $size }) => ($size === 'sm' ? '36px' : $size === 'lg' ? '68px' : '48px')};
  border-radius: 999px;
  background-color: ${({ $bg }) => $bg || 'var(--pl-navy)'};
  color: #fff;
  font-size: ${({ $size }) => ($size === 'sm' ? '0.75rem' : $size === 'lg' ? '1.5rem' : '1rem')};
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.01em;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
`;

const Nome = styled.div`
  font-weight: 700;
  font-size: 1rem;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SubInfo = styled.div`
  font-size: 0.8rem;
  color: var(--pl-muted);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
`;

// ============================================
// AUXILIARES
// ============================================

function initials(nome: string): string
{
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// ============================================
// TIPOS
// ============================================

interface AvatarDisplayProps {
  nome: string;
  subInfo?: string;
  bg?: string;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  nome,
  subInfo,
  bg,
  size = 'md',
}) =>
{
  return (
    <Wrapper>
      <Avatar $bg={bg} $size={size}>
        {initials(nome)}
      </Avatar>
      {subInfo && (
        <Info>
          <Nome>{nome}</Nome>
          <SubInfo>{subInfo}</SubInfo>
        </Info>
      )}
    </Wrapper>
  );
};

export default AvatarDisplay;
