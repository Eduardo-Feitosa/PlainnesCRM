import React from 'react';
import styled from 'styled-components';

// ============================================
// STYLED COMPONENTS
// ============================================

const Wrapper = styled.div`
  padding: 3.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
`;

const IconCircle = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 999px;
  background-color: var(--pl-canvas);
  color: var(--pl-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
`;

const Description = styled.p`
  margin: 0;
  color: var(--pl-muted);
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
`;

// ============================================
// TIPOS
// ============================================

interface EmptyStateProps
{
    icon?: React.ReactNode;
    title: string;
    description?: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) =>
{
    const defaultIcon = (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );

    return (
        <Wrapper>
            <IconCircle>{icon ?? defaultIcon}</IconCircle>
            <Title>{title}</Title>
            {description && <Description>{description}</Description>}
        </Wrapper>
    );
};

export default EmptyState;
