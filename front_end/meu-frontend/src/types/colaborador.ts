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
