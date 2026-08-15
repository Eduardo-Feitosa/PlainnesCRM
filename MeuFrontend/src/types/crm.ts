export type ClienteStatus = 'Ativo' | 'Inativo';

export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  instagram: string;
  sexo: string;
  estado: string;
  idade: number | '';
  descricao: string;
  status: ClienteStatus;
  dataCadastramento: string;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  nicho: string;
  valor: number;
}

export interface ItemVenda {
  produtoId: number;
  quantidade: number;
  valorUnitario: number;
}

export type VendaStatus = 'Concluída' | 'Pendente' | 'Cancelada';

export interface Venda {
  id: number;
  clienteId: number;
  dataVenda: string;
  avaliacao: number;
  valorTotal: number;
  canal: string;
  status: VendaStatus;
  itens: ItemVenda[];
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: 'pf' | 'pj';
  telefone: string;
  setor: string;
  cpf: string;
  cnpj: string;
  dataNascimento: string;
  funcao: string;
  dataCadastro: string;
}