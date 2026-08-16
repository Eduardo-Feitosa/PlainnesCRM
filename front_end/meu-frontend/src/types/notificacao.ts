export type TipoNotificacao = 'convite_equipe' | 'tarefa_atribuida' | 'lead_dia' | 'solicitacao_colaborador';

export interface Notificacao
{
    id: number;
    usuarioId: number;
    tipo: TipoNotificacao | string;
    mensagem: string;
    link: string | null;
    referenciaId: number | null;
    lida: boolean;
    dataCriacao: string;
}
