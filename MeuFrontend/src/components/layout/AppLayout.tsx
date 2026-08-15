import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { SearchProvider } from '../../contexts/SearchContext';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 992);
  const [search, setSearch] = useState('');

  return (
    <div className="pl-app">
      <Sidebar collapsed={collapsed} onNavigate={() => {if (window.innerWidth < 992) setCollapsed(true);}} />

      {!collapsed &&
      <button
        type="button"
        className="d-lg-none position-fixed top-0 start-0 w-100 h-100 border-0"
        style={{ background: 'rgba(27,26,74,0.4)', zIndex: 1035 }}
        aria-label="Fechar menu"
        onClick={() => setCollapsed(true)} />

      }

      <div className={`pl-main ${collapsed ? 'is-wide' : ''}`}>
        <SearchProvider value={search}>
          <Topbar onToggleSidebar={() => setCollapsed((v) => !v)} search={search} onSearchChange={setSearch} />
          <main className="p-3 p-lg-4">
            <Outlet />
          </main>
        </SearchProvider>
      </div>
    </div>);

}