export type { UsuarioBusca } from './equipe';

export type StatusColaborador = 'pendente' | 'aceito' | 'recusado';

export interface SolicitacaoColaborador
{
    id: number;
    usuarioId: number;
    solicitanteNome: string;
    solicitanteNomeUser: string | null;
    solicitanteCodigo: number | null;
    dataSolicitacao: string;
}

export interface ColaboradorAceito
{
    id: number;
    colaboradorUsuarioId: number;
    nome: string;
    nomeUser: string | null;
    codigo: number | null;
    funcao: string | null;
    dataColaboracao: string;
}
