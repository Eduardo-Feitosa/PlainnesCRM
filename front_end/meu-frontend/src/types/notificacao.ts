export type TipoNotificacao = 'convite_equipe' | 'convite_aceito' | 'convite_recusado';

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
