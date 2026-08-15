import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { AlertTriangleIcon } from 'lucide-react';

interface ConfirmDialogProps {
  show: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  show,
  title,
  message,
  confirmLabel = 'Excluir',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Body className="p-4 text-center">
        <span
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{ width: 52, height: 52, backgroundColor: '#ffe9ec', color: 'var(--pl-coral-dark)' }}
          aria-hidden="true">
          
          <AlertTriangleIcon size={24} />
        </span>
        <h2 className="fs-5 fw-bold mb-2" style={{ color: 'var(--pl-navy)' }}>
          {title}
        </h2>
        <p className="pl-muted mb-4" style={{ fontSize: '0.9rem' }}>
          {message}
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <Button variant="outline-secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="btn-danger-soft border-0" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </Modal.Body>
    </Modal>);

}