import type { Venda } from '../types/crm';

export const vendasIniciais: Venda[] = [
{
  id: 1,
  clienteId: 1,
  dataVenda: '2026-07-08',
  avaliacao: 5,
  valorTotal: 54400,
  canal: 'Indicação',
  status: 'Concluída',
  itens: [
  { produtoId: 1, quantidade: 1, valorUnitario: 48000 },
  { produtoId: 6, quantidade: 1, valorUnitario: 6400 }]

},
{
  id: 2,
  clienteId: 2,
  dataVenda: '2026-06-22',
  avaliacao: 4,
  valorTotal: 120000,
  canal: 'Comercial interno',
  status: 'Concluída',
  itens: [{ produtoId: 2, quantidade: 1, valorUnitario: 120000 }]
},
{
  id: 3,
  clienteId: 4,
  dataVenda: '2026-07-02',
  avaliacao: 5,
  valorTotal: 37000,
  canal: 'Site',
  status: 'Pendente',
  itens: [{ produtoId: 4, quantidade: 2, valorUnitario: 18500 }]
},
{
  id: 4,
  clienteId: 3,
  dataVenda: '2026-05-14',
  avaliacao: 3,
  valorTotal: 35000,
  canal: 'Telefone',
  status: 'Cancelada',
  itens: [{ produtoId: 3, quantidade: 1, valorUnitario: 35000 }]
},
{
  id: 5,
  clienteId: 5,
  dataVenda: '2026-07-11',
  avaliacao: 4,
  valorTotal: 19600,
  canal: 'Instagram',
  status: 'Concluída',
  itens: [{ produtoId: 5, quantidade: 2, valorUnitario: 9800 }]
}];


export const canaisVenda = ['Comercial interno', 'Site', 'Instagram', 'Indicação', 'Telefone', 'Evento'];