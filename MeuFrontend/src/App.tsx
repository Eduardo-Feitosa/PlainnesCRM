import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { CrmProvider } from './contexts/CrmContext';
import { Cadastro } from './pages/Cadastro';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { Produtos } from './pages/Produtos';
import { Vendas } from './pages/Vendas';
import { Relatorios } from './pages/Relatorios';
import { Configuracoes } from './pages/Configuracoes';

export function App() {
  return (
    <CrmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="vendas" element={<Vendas />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CrmProvider>);

}