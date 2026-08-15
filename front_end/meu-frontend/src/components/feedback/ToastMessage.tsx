import React, { useEffect } from 'react';
import styled from 'styled-components';

// ============================================
// STYLED COMPONENTS
// ============================================

const Toast = styled.div<{ $variant: 'success' | 'error' | 'info'; $show: boolean }>`
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 2000;
  min-width: 280px;
  max-width: 420px;
  padding: 0.9rem 1rem;
  border-radius: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  background-color: ${({ $variant }) =>
    $variant === 'success' ? 'var(--pl-green)' :
    $variant === 'error' ? 'var(--pl-coral-dark)' :
    'var(--pl-blue)'};
  box-shadow: 0 18px 45px -18px rgba(27, 26, 74, 0.45);
  transform: ${({ $show }) => ($show ? 'translateY(0)' : 'translateY(-20px)')};
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  pointer-events: ${({ $show }) => ($show ? 'auto' : 'none')};
  transition: all 0.28s ease;
`;

const Icon = styled.span`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Text = styled.span`
  flex: 1;
  line-height: 1.35;
`;

// ============================================
// TIPOS
// ============================================

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessageProps {
  variant?: ToastVariant;
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ToastMessage: React.FC<ToastMessageProps> = ({
  variant = 'success',
  message,
  visible,
  onClose,
  duration = 3500,
}) =>
{
  useEffect(() =>
  {
    if (!visible) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onClose]);

  const iconSvg =
    variant === 'success' ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : variant === 'error' ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    );

  return (
    <Toast $variant={variant} $show={visible} role="alert">
      <Icon>{iconSvg}</Icon>
      <Text>{message}</Text>
    </Toast>
  );
};

export default ToastMessage;
