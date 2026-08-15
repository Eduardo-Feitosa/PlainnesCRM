import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="pl-empty">
      <div className="mb-2 d-flex justify-content-center" aria-hidden="true">
        {icon}
      </div>
      <div className="fw-semibold" style={{ color: 'var(--pl-navy)' }}>
        {title}
      </div>
      {description && <div style={{ fontSize: '0.85rem' }}>{description}</div>}
    </div>);

}