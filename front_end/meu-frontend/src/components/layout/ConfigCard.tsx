import React from 'react';
import styled from 'styled-components';

// ============================================
// STYLED COMPONENTS
// ============================================

const Card = styled.section`
  background: #fff;
  border: 1px solid var(--pl-line);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 18px 45px -40px rgba(27, 26, 74, 0.55);
  height: fit-content;
`;

const CardHeader = styled.div<{ $noDivider?: boolean }>`
  padding-bottom: ${({ $noDivider }) => ($noDivider ? '0.75rem' : '1.25rem')};
  margin-bottom: 1.25rem;
  border-bottom: ${({ $noDivider }) => ($noDivider ? 'none' : '1px solid var(--pl-line)')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.01em;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

// ============================================
// TIPOS
// ============================================

interface ConfigCardProps {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  noDivider?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ConfigCard: React.FC<ConfigCardProps> = ({
  title,
  children,
  headerRight,
  noDivider,
  className,
  style,
}) =>
{
  return (
    <Card className={className} style={style}>
      <CardHeader $noDivider={noDivider}>
        <CardTitle>{title}</CardTitle>
        {headerRight}
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
};

export default ConfigCard;
