import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { clientesIniciais } from '../data/clientes';
import { produtosIniciais } from '../data/produtos';
import { vendasIniciais } from '../data/vendas';
import { usuarioInicial } from '../data/usuario';
import type { Cliente, Produto, Usuario, Venda } from '../types/crm';

interface CrmContextValue {
  clientes: Cliente[];
  produtos: Produto[];
  vendas: Venda[];
  usuario: Usuario;
  addCliente: (cliente: Omit<Cliente, 'id'>) => void;
  updateCliente: (id: number, cliente: Omit<Cliente, 'id'>) => void;
  removeCliente: (id: number) => void;
  addProduto: (produto: Omit<Produto, 'id'>) => void;
  updateProduto: (id: number, produto: Omit<Produto, 'id'>) => void;
  removeProduto: (id: number) => void;
  addVenda: (venda: Omit<Venda, 'id'>) => void;
  updateVenda: (id: number, venda: Omit<Venda, 'id'>) => void;
  removeVenda: (id: number) => void;
  updateUsuario: (usuario: Usuario) => void;
}

const CrmContext = createContext<CrmContextValue | undefined>(undefined);

const nextId = (items: {id: number;}[]) => items.reduce((max, item) => Math.max(max, item.id), 0) + 1;

export function CrmProvider({ children }: {children: React.ReactNode;}) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais);
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [vendas, setVendas] = useState<Venda[]>(vendasIniciais);
  const [usuario, setUsuario] = useState<Usuario>(usuarioInicial);

  const addCliente = useCallback((cliente: Omit<Cliente, 'id'>) => {
    setClientes((prev) => [{ ...cliente, id: nextId(prev) }, ...prev]);
  }, []);

  const updateCliente = useCallback((id: number, cliente: Omit<Cliente, 'id'>) => {
    setClientes((prev) => prev.map((item) => item.id === id ? { ...cliente, id } : item));
  }, []);

  const removeCliente = useCallback((id: number) => {
    setClientes((prev) => prev.filter((item) => item.id !== id));
    setVendas((prev) => prev.filter((venda) => venda.clienteId !== id));
  }, []);

  const addProduto = useCallback((produto: Omit<Produto, 'id'>) => {
    setProdutos((prev) => [{ ...produto, id: nextId(prev) }, ...prev]);
  }, []);

  const updateProduto = useCallback((id: number, produto: Omit<Produto, 'id'>) => {
    setProdutos((prev) => prev.map((item) => item.id === id ? { ...produto, id } : item));
  }, []);

  const removeProduto = useCallback((id: number) => {
    setProdutos((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addVenda = useCallback((venda: Omit<Venda, 'id'>) => {
    setVendas((prev) => [{ ...venda, id: nextId(prev) }, ...prev]);
  }, []);

  const updateVenda = useCallback((id: number, venda: Omit<Venda, 'id'>) => {
    setVendas((prev) => prev.map((item) => item.id === id ? { ...venda, id } : item));
  }, []);

  const removeVenda = useCallback((id: number) => {
    setVendas((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateUsuario = useCallback((next: Usuario) => setUsuario(next), []);

  const value = useMemo<CrmContextValue>(
    () => ({
      clientes,
      produtos,
      vendas,
      usuario,
      addCliente,
      updateCliente,
      removeCliente,
      addProduto,
      updateProduto,
      removeProduto,
      addVenda,
      updateVenda,
      removeVenda,
      updateUsuario
    }),
    [
    clientes,
    produtos,
    vendas,
    usuario,
    addCliente,
    updateCliente,
    removeCliente,
    addProduto,
    updateProduto,
    removeProduto,
    addVenda,
    updateVenda,
    removeVenda,
    updateUsuario]

  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const context = useContext(CrmContext);
  if (!context) throw new Error('useCrm deve ser usado dentro de CrmProvider');
  return context;
}