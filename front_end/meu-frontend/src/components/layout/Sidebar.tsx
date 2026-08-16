import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import iconVendas from '../../assets/iconVendas.png';
import productIcon from '../../assets/productIcon.png';

type IconKey = 'dash' | 'clients' | 'task' | 'tarefas' | 'equipes' | 'colaboradores' | 'relatory' | 'settings' | 'logout';

const ICON_COLOR_DEFAULT = 'currentColor';

// ============================================================
// ÍCONES SVG INLINE (carregamento INSTANTÂNEO — 0ms, sem rede)
// Substituem os PNGs que carregavam com ~1s de delay
// ============================================================
const iconSvgs: Record<IconKey, React.ReactNode> = {
  dash: (
    <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR_DEFAULT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR_DEFAULT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  task: (
    <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR_DEFAULT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 12l2.5 2.5L16 9" />
      <path d="M7 4V3M12 4V3M17 4V3" />
    </svg>
  ),
  tarefas: (
    <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR_DEFAULT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      <path d="M3 10h4M3 14h4M3 18h10" />
    </svg>
  ),
  equipes: (
    <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR_DEFAULT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <circle cx="18" cy="13" r="3" />
    </svg>
  ),
  colaboradores: (
    <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR_DEFAULT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
      <path d="M17 11l2 2 4-4" />
    </svg>
  ),
  relatory: (
    <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR_DEFAULT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h6M8 9h3" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR_DEFAULT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR_DEFAULT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};

// ============================================
// STYLED COMPONENTS
// ============================================

const SidebarWrapper = styled.nav<{ $collapsed: boolean }>`
  width: 252px;
  background-color: var(--pl-navy);
  color: #fff;
  position: fixed;
  inset: 0 auto 0 0;
  display: flex;
  flex-direction: column;
  z-index: 1040;
  transition: transform 0.25s ease;
  height: 100vh;
  overflow-y: auto;
  transform: ${({ $collapsed }) => ($collapsed ? 'translateX(-100%)' : 'translateX(0)')};

  @media (max-width: 991.98px) {
    width: 280px;
  }
`;

const Brand = styled.div`
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const BrandText = styled.div`
  font-size: calc(1.15rem + 2px);
  font-weight: 800;
  color: #fff;
  font-family: 'Inter', sans-serif;
  letter-spacing: -0.01em;

  span {
    color: var(--pl-coral);
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Avatar = styled.span<{ $bg?: string }>`
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background-color: ${({ $bg }) => $bg || 'var(--pl-blue)'};
  color: #fff;
  font-size: calc(0.8rem + 2px);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #fff;
  font-size: calc(0.9rem + 2px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.div`
  font-size: calc(0.75rem + 2px);
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserCode = styled.div`
  font-size: calc(0.7rem + 2px);
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Inter', sans-serif;

  strong {
    color: #fff;
  }
`;

const NavSection = styled.div`
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  padding: 1.1rem 1.5rem 0.4rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
`;

const MenuWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0.5rem 0;
`;

// NavBase é a BASE compartilhada por todos os itens de navegação
// (NavLinkStyled e NavButton). Elimina ~40 linhas de CSS duplicado e
// remove o aviso "declarado mas nunca usado" do VS Code.
const NavBase = styled.div<{ $active?: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.9rem;
  margin: 0.15rem 0.75rem;
  border-radius: 0.75rem;
  color: ${({ $active, $danger }) =>
    $active ? '#fff' : $danger ? 'rgba(255,255,255,0.72)' : 'rgba(255, 255, 255, 0.72)'};
  font-size: 0.9rem;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  border: none;
  background: ${({ $active }) => ($active ? 'var(--pl-blue)' : 'transparent')};
  width: calc(100% - 1.5rem);
  text-align: left;

  &:hover {
    background-color: ${({ $active }) => ($active ? 'var(--pl-blue)' : 'rgba(255, 255, 255, 0.08)')};
    color: #fff;
  }
`;

// Usa NavBase como wrapper do NavLink — herda 100% dos estilos,
// só adiciona a classe ".active" do react-router-dom
const NavLinkStyled = styled(NavBase).attrs(() => ({ as: NavLink }))`
  &.active {
    background-color: var(--pl-blue);
    color: #fff;
    font-weight: 600;
  }
`;

const NavSvg = styled.span`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.82);
  transition: color 0.15s ease;

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    image-rendering: auto;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    opacity: 0.82;
    transition: filter 0.15s ease, opacity 0.15s ease;
    filter: grayscale(1) brightness(3.2) contrast(0.95) saturate(0);
    mix-blend-mode: screen;
  }

  .active &,
  &:hover {
    color: #ffffff;

    img {
      opacity: 1;
      filter: grayscale(1) brightness(5) contrast(1.05) saturate(0);
    }
  }
`;

const NavButton = styled(NavBase).attrs(() => ({ as: 'button', type: 'button' }))`
  &:focus-visible {
    outline: 2px solid var(--pl-blue);
    outline-offset: 2px;
  }
`;

const Footer = styled.div`
  padding: 0.75rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: auto;
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

interface SidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onNavigate }) => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <SidebarWrapper $collapsed={collapsed} aria-label="Navegação principal">
      <Brand>
        <BrandText>
          Plainness<span>CRM</span>
        </BrandText>
      </Brand>

      {usuario && (
        <UserSection>
          <Avatar $bg="var(--pl-blue)">{initials(usuario.nome)}</Avatar>
          <UserInfo>
            <UserName>{usuario.nome}</UserName>
            <UserRole>{usuario.funcao || 'Usuário'}</UserRole>
            {usuario.codigo && (
              <UserCode>Código: <strong>{usuario.codigo}</strong></UserCode>
            )}
          </UserInfo>
        </UserSection>
      )}

      <NavSection>Menu</NavSection>
      <MenuWrapper>
        <NavLinkStyled to="/dashboard" end onClick={onNavigate}>
          <NavSvg>{iconSvgs.dash}</NavSvg>
          Dashboard
        </NavLinkStyled>
        <NavLinkStyled to="/clientes" onClick={onNavigate}>
          <NavSvg>{iconSvgs.clients}</NavSvg>
          Clientes
        </NavLinkStyled>
        <NavLinkStyled to="/produtos" onClick={onNavigate}>
          <NavSvg style={{ width: 22, height: 22 }}><img src={productIcon} alt="" aria-hidden="true" /></NavSvg>
          Produtos
        </NavLinkStyled>
        <NavLinkStyled to="/vendas" onClick={onNavigate}>
          <NavSvg style={{ width: 21, height: 21 }}><img src={iconVendas} alt="" aria-hidden="true" /></NavSvg>
          Vendas
        </NavLinkStyled>
        <NavLinkStyled to="/tarefas" onClick={onNavigate}>
          <NavSvg>{iconSvgs.task}</NavSvg>
          Tarefas
        </NavLinkStyled>
        <NavLinkStyled to="/equipes" onClick={onNavigate}>
          <NavSvg>{iconSvgs.equipes}</NavSvg>
          Equipes
        </NavLinkStyled>
        <NavLinkStyled to="/colaboradores" onClick={onNavigate}>
          <NavSvg>{iconSvgs.colaboradores}</NavSvg>
          Colaboradores
        </NavLinkStyled>
        <NavLinkStyled to="/relatorios" onClick={onNavigate}>
          <NavSvg>{iconSvgs.relatory}</NavSvg>
          Relatórios
        </NavLinkStyled>
      </MenuWrapper>

      <Footer>
        <NavLinkStyled to="/configuracoes" onClick={onNavigate}>
          <NavSvg>{iconSvgs.settings}</NavSvg>
          Configurações
        </NavLinkStyled>
        <NavButton type="button" onClick={handleLogout}>
          <NavSvg style={{ color: 'rgba(255,255,255,0.8)' }}>{iconSvgs.logout}</NavSvg>
          Sair
        </NavButton>
      </Footer>
    </SidebarWrapper>
  );
};

export default Sidebar;
