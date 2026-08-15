import React from 'react';
import { CheckIcon } from 'lucide-react';
import { Logo } from './Logo';

const benefits = [
'Cadastro em menos de 2 minutos',
'Seus contatos e negócios em um só lugar',
'Dados protegidos conforme a LGPD'];


export function BrandPanel() {
  return (
    <aside className="relative hidden shrink-0 flex-col justify-between overflow-hidden bg-brand-800 px-10 py-10 lg:flex lg:w-[42%] xl:w-[38%]">
      <div
        aria-hidden="true"
        className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl" />
      
      <div aria-hidden="true" className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-coral-400/20 blur-3xl" />

      <div className="relative">
        <Logo className="text-[28px]" onLight={false} />
      </div>

      <div className="relative flex flex-1 items-center justify-center py-8">
        <div className="rounded-[2rem] bg-white p-4 shadow-card">
          <img
            src="/f4a0116f-dd9b-4ca4-9a2e-6ee46d824072.jpg"
            alt="Ilustração de um profissional comemorando com um notebook nas mãos"
            className="max-h-[320px] w-auto rounded-[1.5rem]" />
          
        </div>
      </div>

      <div className="relative">
        <h2 className="text-2xl font-bold leading-snug text-white">
          Organize seus clientes
          <br />
          <span className="text-coral-400">sem complicação.</span>
        </h2>
        <ul className="mt-5 space-y-3">
          {benefits.map((benefit) =>
          <li key={benefit} className="flex items-start gap-3 text-sm text-white/80">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                <CheckIcon className="h-3 w-3 text-coral-300" aria-hidden="true" />
              </span>
              {benefit}
            </li>
          )}
        </ul>
      </div>
    </aside>);

}