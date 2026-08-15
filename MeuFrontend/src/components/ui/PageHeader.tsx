import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        {eyebrow && <div className="pl-eyebrow mb-1">{eyebrow}</div>}
        <h1 className="pl-page-title">{title}</h1>
        {subtitle && <p className="pl-muted mb-0 mt-1" style={{ fontSize: '0.9rem' }}>{subtitle}</p>}
      </div>
      {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
    </div>);

}