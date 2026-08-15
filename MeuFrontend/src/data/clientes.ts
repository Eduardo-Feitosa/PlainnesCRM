import type { Cliente } from '../types/crm';

export const clientesIniciais: Cliente[] = [
{
  id: 1,
  nome: 'Fernanda Rocha',
  telefone: '(11) 98765-4321',
  email: 'fernanda@techsolve.com.br',
  instagram: '@fernanda.techsolve',
  sexo: 'Feminino',
  estado: 'SP',
  idade: 34,
  descricao: 'Responsável pela área de tecnologia da TechSolve Ltda.',
  status: 'Ativo',
  dataCadastramento: '2026-01-12'
},
{
  id: 2,
  nome: 'Ricardo Alves',
  telefone: '(21) 97654-3210',
  email: 'ricardo@alpha.com.br',
  instagram: '@ricardo.alpha',
  sexo: 'Masculino',
  estado: 'RJ',
  idade: 41,
  descricao: 'Sócio da Construção Alpha, compra trimestralmente.',
  status: 'Ativo',
  dataCadastramento: '2026-02-03'
},
{
  id: 3,
  nome: 'Patrícia Nunes',
  telefone: '(31) 96543-2109',
  email: 'patricia@saudvida.com.br',
  instagram: '@patricia.saudevida',
  sexo: 'Feminino',
  estado: 'MG',
  idade: 38,
  descricao: 'Clínica Saúde & Vida — contrato pausado no último semestre.',
  status: 'Inativo',
  dataCadastramento: '2025-11-27'
},
{
  id: 4,
  nome: 'Gustavo Pinto',
  telefone: '(62) 95432-1098',
  email: 'gustavo@agroprime.com.br',
  instagram: '@gustavo.agroprime',
  sexo: 'Masculino',
  estado: 'GO',
  idade: 46,
  descricao: 'Agro Prime — maior ticket médio da carteira.',
  status: 'Ativo',
  dataCadastramento: '2025-09-15'
},
{
  id: 5,
  nome: 'Camila Faria',
  telefone: '(41) 94321-0987',
  email: 'camila@modatrends.com.br',
  instagram: '@camila.modatrends',
  sexo: 'Feminino',
  estado: 'PR',
  idade: 29,
  descricao: 'Moda Trends — compra anual na coleção de verão.',
  status: 'Inativo',
  dataCadastramento: '2025-08-04'
}];


export const estadosBrasil = [
'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];


export const opcoesSexo = ['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'];