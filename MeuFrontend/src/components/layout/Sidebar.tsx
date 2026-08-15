import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3Icon,
  FileTextIcon,
  LayoutGridIcon,
  LogOutIcon,
  PackageIcon,
  SettingsIcon,
  UsersIcon } from
'lucide-react';
import { useCrm } from '../../contexts/CrmContext';
import { initials } from '../../utils/format';

interface SidebarProps {
  collapsed: boolean;
  onNavigate: () => void;
}

const navItems = [
{ to: '/', label: 'Dashboard', icon: LayoutGridIcon, end: true },
{ to: '/clientes', label: 'Clientes', icon: UsersIcon },
{ to: '/produtos', label: 'Produtos', icon: PackageIcon },
{ to: '/vendas', label: 'Vendas', icon: BarChart3Icon },
{ to: '/relatorios', label: 'Relatórios', icon: FileTextIcon }];


export function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const { usuario } = useCrm();

  return (
    <nav className={`pl-sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="Navegação principal">
      <div className="px-4 py-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <span className="fs-5 fw-bold">
          <span className="text-white">Plainness</span>
          <span style={{ color: 'var(--pl-coral)' }}>CRM</span>
        </span>
      </div>

      <div className="d-flex align-items-center gap-3 px-4 py-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <span className="pl-avatar" style={{ backgroundColor: 'var(--pl-blue)' }}>
          {initials(usuario.nome)}
        </span>
        <div className="overflow-hidden">
          <div className="fw-semibold text-white text-truncate" style={{ fontSize: '0.9rem' }}>
            {usuario.nome}
          </div>
          <div className="text-truncate" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
            {usuario.funcao}
          </div>
        </div>
      </div>

      <div className="pl-nav-section">Menu</div>
      <div className="flex-grow-1">
        {navItems.map(({ to, label, icon: Icon, end }) =>
        <NavLink key={to} to={to} end={end} className="pl-nav-link" onClick={onNavigate}>
            <Icon size={18} aria-hidden="true" />
            {label}
          </NavLink>
        )}
      </div>

      <div className="pb-3 pt-2 border-top" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <NavLink to="/configuracoes" className="pl-nav-link" onClick={onNavigate}>
          <SettingsIcon size={18} aria-hidden="true" />
          Configurações
        </NavLink>
        <NavLink to="/cadastro" className="pl-nav-link" onClick={onNavigate}>
          <LogOutIcon size={18} aria-hidden="true" />
          Sair
        </NavLink>
      </div>
    </nav>);

}