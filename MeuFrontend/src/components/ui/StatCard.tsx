import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent?: 'blue' | 'coral' | 'green';
}

const accents: Record<string, {bg: string;color: string;}> = {
  blue: { bg: 'var(--pl-blue-soft)', color: 'var(--pl-blue)' },
  coral: { bg: '#ffe9ec', color: 'var(--pl-coral-dark)' },
  green: { bg: '#e3f7ef', color: 'var(--pl-green)' }
};

export function StatCard({ icon, value, label, accent = 'blue' }: StatCardProps) {
  const style = accents[accent];
  return (
    <div className="pl-card h-100 p-3">
      <span className="pl-stat-icon" style={{ backgroundColor: style.bg, color: style.color }} aria-hidden="true">
        {icon}
      </span>
      <div className="fs-4 fw-bold mt-3" style={{ color: 'var(--pl-navy)' }}>
        {value}
      </div>
      <div className="pl-muted" style={{ fontSize: '0.82rem' }}>
        {label}
      </div>
    </div>);

}