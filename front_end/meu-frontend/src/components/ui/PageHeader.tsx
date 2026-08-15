import React from 'react';
import styled from 'styled-components';

// ============================================
// STYLED COMPONENTS
// ============================================

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const Eyebrow = styled.div`
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--pl-muted);
  font-family: 'Inter', sans-serif;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--pl-navy);
  margin: 0;
  font-family: 'Inter', sans-serif;
`;

const Subtitle = styled.p`
  color: var(--pl-muted);
  font-size: 0.92rem;
  margin: 0;
  margin-top: 0.15rem;
  font-family: 'Inter', sans-serif;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: flex-end;
`;

// ============================================
// TIPOS
// ============================================

interface PageHeaderProps
{
    eyebrow?: string;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, subtitle, actions }) =>
{
    return (
        <Wrapper>
            <Info>
                {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
                <Title>{title}</Title>
                {subtitle && <Subtitle>{subtitle}</Subtitle>}
            </Info>
            {actions && <Actions>{actions}</Actions>}
        </Wrapper>
    );
};

export default PageHeader;
