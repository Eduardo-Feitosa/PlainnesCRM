import React from 'react';
import styled from 'styled-components';

// ============================================
// STYLED COMPONENTS
// ============================================

const Backdrop = styled.div<{ $show: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(27, 26, 74, 0.38);
  backdrop-filter: blur(2px);
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  pointer-events: ${({ $show }) => ($show ? 'auto' : 'none')};
  transition: opacity 0.18s ease;
`;

const Dialog = styled.dialog<{ $show: boolean }>`
  all: unset;
  display: flex;
  width: 100%;
  max-width: 460px;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 24px 70px -36px rgba(27, 26, 74, 0.65);
  padding: 1.75rem 1.75rem 1.5rem;
  flex-direction: column;
  gap: 1rem;
  transform: ${({ $show }) => ($show ? 'translateY(0)' : 'translateY(16px)')};
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.12rem;
  font-weight: 700;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
`;

const CloseButton = styled.button`
  all: unset;
  cursor: pointer;
  color: var(--pl-muted);
  padding: 0.25rem;
  border-radius: 0.5rem;
  line-height: 0;
  transition: all 0.15s ease;

  &:hover { color: var(--pl-navy); background: var(--pl-canvas); }
`;

const Message = styled.p`
  margin: 0;
  color: #4c4a6e;
  font-size: 0.95rem;
  line-height: 1.55;
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.25rem;
`;

const GhostButton = styled.button`
  height: 42px;
  min-width: 110px;
  padding: 0 1.1rem;
  background: transparent;
  border: 1px solid var(--pl-line);
  border-radius: 0.7rem;
  color: var(--pl-navy);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s ease;

  &:hover { background: var(--pl-canvas); border-color: #bbb7d3; }
`;

const DangerButton = styled.button`
  height: 42px;
  min-width: 110px;
  padding: 0 1.1rem;
  background: var(--pl-coral-dark);
  border: 1px solid var(--pl-coral-dark);
  border-radius: 0.7rem;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s ease;

  &:hover { background: #c83448; border-color: #c83448; }
`;

// ============================================
// TIPOS
// ============================================

interface ConfirmDialogProps
{
    show: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onCancel: () => void;
    onConfirm: () => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    show,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onCancel,
    onConfirm,
}) =>
{
    return (
        <Backdrop $show={show} onClick={onCancel}>
            <Dialog $show={show} onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Title>{title}</Title>
                    <CloseButton onClick={onCancel} aria-label="Fechar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </CloseButton>
                </Header>
                <Message>{message}</Message>
                <ButtonsRow>
                    <GhostButton type="button" onClick={onCancel}>{cancelLabel}</GhostButton>
                    <DangerButton type="button" onClick={onConfirm}>{confirmLabel}</DangerButton>
                </ButtonsRow>
            </Dialog>
        </Backdrop>
    );
};

export default ConfirmDialog;
