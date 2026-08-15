import PaginaPrincipal from './pages/PaginaPrincipal';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos';
import Vendas from './pages/Vendas';
import Relatorios from './pages/Relatorios';
import Tarefas from './pages/Tarefas';
import Equipes from './pages/Equipes';
import Configuracoes from './pages/Configuracoes';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/layout/AppLayout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PaginaPrincipal />} />

          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/tarefas" element={<Tarefas />} />
            <Route path="/equipes" element={<Equipes />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>

          <Route path="*" element={<h1 style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>Página não encontrada</h1>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
