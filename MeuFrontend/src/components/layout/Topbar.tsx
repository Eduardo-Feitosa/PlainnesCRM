import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BellIcon, LogOutIcon, MenuIcon, SearchIcon, SettingsIcon } from 'lucide-react';
import { useCrm } from '../../contexts/CrmContext';
import { initials } from '../../utils/format';

interface TopbarProps {
  onToggleSidebar: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function Topbar({ onToggleSidebar, search, onSearchChange }: TopbarProps) {
  const { usuario } = useCrm();
  const navigate = useNavigate();

  return (
    <header className="pl-topbar d-flex align-items-center gap-3 px-3 px-lg-4 py-2">
      <button
        type="button"
        className="btn btn-light-soft d-flex align-items-center p-2"
        onClick={onToggleSidebar}
        aria-label="Alternar menu lateral">
        
        <MenuIcon size={18} />
      </button>

      <div className="position-relative flex-grow-1" style={{ maxWidth: 420 }}>
        <SearchIcon
          size={16}
          className="position-absolute pl-muted"
          style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }}
          aria-hidden="true" />
        
        <input
          type="search"
          className="form-control ps-5"
          placeholder="Buscar clientes, produtos, vendas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Busca global" />
        
      </div>

      <div className="ms-auto d-flex align-items-center gap-2">
        <button type="button" className="btn btn-light-soft position-relative p-2 d-flex" aria-label="Notificações">
          <BellIcon size={18} />
          <span
            className="position-absolute rounded-circle"
            style={{ width: 8, height: 8, backgroundColor: 'var(--pl-coral-dark)', top: 6, right: 7 }}
            aria-hidden="true" />
          
        </button>

        <Dropdown align="end">
          <Dropdown.Toggle variant="link" className="d-flex align-items-center gap-2 text-decoration-none p-1">
            <span className="pl-avatar">{initials(usuario.nome)}</span>
            <span className="d-none d-sm-inline fw-semibold" style={{ color: 'var(--pl-navy)', fontSize: '0.9rem' }}>
              {usuario.nome.split(' ')[0]}
            </span>
          </Dropdown.Toggle>
          <Dropdown.Menu className="pl-card border-0 shadow-sm mt-2">
            <Dropdown.Item onClick={() => navigate('/configuracoes')}>
              <SettingsIcon size={16} className="me-2" />
              Configurações
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => navigate('/cadastro')}>
              <LogOutIcon size={16} className="me-2" />
              Sair
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>);

}