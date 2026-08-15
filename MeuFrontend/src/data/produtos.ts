import type { Produto } from '../types/crm';

export const produtosIniciais: Produto[] = [
{
  id: 1,
  nome: 'Licença Enterprise',
  descricao: 'Licença anual da plataforma com usuários ilimitados e suporte dedicado.',
  nicho: 'Tecnologia',
  valor: 48000
},
{
  id: 2,
  nome: 'Contrato Anual de Obra',
  descricao: 'Acompanhamento e gestão de obras com relatórios mensais.',
  nicho: 'Construção',
  valor: 120000
},
{
  id: 3,
  nome: 'Plano Saúde Corporativo',
  descricao: 'Plano Plus para equipes de até 100 colaboradores.',
  nicho: 'Saúde',
  valor: 35000
},
{
  id: 4,
  nome: 'Consultoria Agro',
  descricao: 'Diagnóstico de produtividade e plano de safra.',
  nicho: 'Agronegócio',
  valor: 18500
},
{
  id: 5,
  nome: 'Coleção Verão',
  descricao: 'Pacote de peças da coleção de verão para revenda.',
  nicho: 'Moda',
  valor: 9800
},
{
  id: 6,
  nome: 'Onboarding Premium',
  descricao: 'Implantação assistida com treinamento das equipes.',
  nicho: 'Serviços',
  valor: 6400
}];


export const nichos = [
'Tecnologia',
'Construção',
'Saúde',
'Agronegócio',
'Moda',
'Serviços',
'Educação',
'Financeiro'];