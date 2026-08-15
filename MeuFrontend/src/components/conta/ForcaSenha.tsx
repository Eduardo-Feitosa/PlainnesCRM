import React from 'react';
import { passwordLabels, passwordScore } from '../../utils/validation';

const colors = ['#F4536A', '#F4536A', '#F0B429', '#6E63F5', '#12A06A'];

export function ForcaSenha({ senha }: {senha: string;}) {
  if (!senha) return null;
  const score = passwordScore(senha);

  return (
    <div className="mb-3">
      <div className="pl-strength-bar" aria-hidden="true">
        <span style={{ width: `${Math.max(10, score / 4 * 100)}%`, backgroundColor: colors[score] }} />
      </div>
      <small className="d-block mt-1 fw-semibold pl-muted">Força da senha: {passwordLabels[score]}</small>
    </div>);

}