import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import searchIcon from '../../assets/search.png';
import settingsIcon from '../../assets/settingsIcon.png';
import logoutIcon from '../../assets/logoutIcon.png';

// ============================================
// STYLED COMPONENTS
// ============================================

const AppWrapper = styled.div`
  min-height: 100vh;
  background-color: var(--pl-canvas);
  display: flex;
`;

const SidebarOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(27, 26, 74, 0.4);
  z-index: 1035;
`;

const MainWrapper = styled.main<{ $sidebarCollapsed: boolean }>`
  margin-left: ${({ $sidebarCollapsed }) => ($sidebarCollapsed ? '0' : '252px')};
  min-height: 100vh;
  transition: margin-left 0.25s ease;
  width: 100%;
  display: flex;
  flex-direction: column;

  @media (max-width: 991.98px) {
    margin-left: 0;
  }
`;

const Topbar = styled.div`
  background-color: #fff;
  border-bottom: 1px solid var(--pl-line);
  position: sticky;
  top: 0;
  z-index: 1030;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const MenuButton = styled.button`
  border: 1px solid var(--pl-line);
  background: transparent;
  border-radius: 0.6rem;
  padding: 0.5rem 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pl-navy);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--pl-blue-soft);
  }
`;

const SearchWrapper = styled.div`
  flex: 1;
  max-width: 500px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border: 1px solid var(--pl-line);
  border-radius: 0.75rem;
  background-color: #f7f7fc;
  font-size: 0.925rem;
  font-family: 'Inter', sans-serif;
  color: var(--pl-navy);
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    background-color: #fff;
    border-color: var(--pl-blue);
    box-shadow: 0 0 0 0.2rem rgba(59, 46, 232, 0.14);
  }
`;

const SearchIcon = styled.img`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  opacity: 0.6;
`;

const TopbarRight = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const UserTrigger = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.6rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  position: relative;

  &:hover {
    background-color: var(--pl-blue-soft);
  }
`;

const Avatar = styled.span<{ $bg?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background-color: ${({ $bg }) => $bg || 'var(--pl-navy)'};
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
`;

const Username = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
`;

const Chevron = styled.span`
  color: var(--pl-muted);
  margin-left: 0.25rem;
  display: inline-flex;
  align-items: center;
`;

const UserMenu = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  background: #fff;
  border: 1px solid var(--pl-line);
  border-radius: 0.75rem;
  box-shadow: 0 10px 30px -15px rgba(27, 26, 74, 0.3);
  min-width: 200px;
  overflow: hidden;
  z-index: 1050;
`;

const UserMenuItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: ${({ $danger }) => ($danger ? 'var(--pl-coral-dark)' : 'var(--pl-navy)')};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-family: 'Inter', sans-serif;

  &:hover {
    background-color: ${({ $danger }) => ($danger ? '#ffe9ec' : 'var(--pl-blue-soft)')};
  }
`;

const UserMenuIcon = styled.img`
  width: 16px;
  height: 16px;
  opacity: 0.7;
`;

const ContentWrapper = styled.div`
  padding: 1.5rem 2rem;
  flex: 1;

  @media (max-width: 575.98px) {
    padding: 1rem;
  }
`;

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function initials(nome: string): string {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 992
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSidebar = () => setCollapsed((v) => !v);

  const handleNavigate = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setCollapsed(true);
    }
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const goToConfiguracoes = () => {
    setUserMenuOpen(false);
    navigate('/configuracoes');
  };

  const isMobileOpen = !collapsed && typeof window !== 'undefined' && window.innerWidth < 992;

  return (
    <AppWrapper>
      <Sidebar collapsed={collapsed} onNavigate={handleNavigate} />

      {isMobileOpen && <SidebarOverlay onClick={() => setCollapsed(true)} />}

      <MainWrapper $sidebarCollapsed={collapsed}>
        <Topbar>
          <MenuButton
            type="button"
            aria-label="Alternar menu lateral"
            onClick={handleToggleSidebar}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </MenuButton>

          <SearchWrapper>
            <SearchIcon src={searchIcon} alt="Buscar" />
            <SearchInput type="text" placeholder="Buscar clientes, produtos, vendas..." aria-label="Buscar" />
          </SearchWrapper>

          <TopbarRight>
            <NotificationBell />
            <UserTrigger
              ref={userMenuRef}
              onClick={() => setUserMenuOpen((v) => !v)}
              role="button"
              tabIndex={0}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <Avatar $bg="var(--pl-navy)">
                {usuario ? initials(usuario.nome) : '?'}
              </Avatar>
              <Username>{usuario ? usuario.nome : 'Usuário'}</Username>
              <Chevron>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </Chevron>

              {userMenuOpen && (
                <UserMenu role="menu">
                  <UserMenuItem type="button" onClick={goToConfiguracoes} role="menuitem">
                    <UserMenuIcon src={settingsIcon} alt="" />
                    Configurações
                  </UserMenuItem>
                  <UserMenuItem type="button" $danger onClick={handleLogout} role="menuitem">
                    <UserMenuIcon src={logoutIcon} alt="" />
                    Sair
                  </UserMenuItem>
                </UserMenu>
              )}
            </UserTrigger>
          </TopbarRight>
        </Topbar>

        <ContentWrapper>
          <Outlet />
        </ContentWrapper>
      </MainWrapper>
    </AppWrapper>
  );
};

export default AppLayout;
