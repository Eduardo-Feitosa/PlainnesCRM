import React from 'react';

interface LogoProps {
  className?: string;
  onLight?: boolean;
}

export function Logo({ className = '', onLight = true }: LogoProps) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      <span className={onLight ? 'text-brand-800' : 'text-white'}>Plainness</span>
      <span className="text-coral-400">CRM</span>
    </span>);

}