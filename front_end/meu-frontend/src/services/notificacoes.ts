import { API_URL } from '../config/api';
import type { ErroApi } from './vendas';
import type { Notificacao } from '../types/notificacao';

const token = () => localStorage.getItem('token');
const headers = (bodyJson = true): Record<string, string> =>
{
    const t = token();
    return {
        ...(bodyJson ? { 'Content-Type': 'application/json' } : {}),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
};

export const listarNotificacoes = async (): Promise<Notificacao[]> =>
{
    const r = await fetch(`${API_URL}/notificacoes`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao listar notificações.' })); return Promise.reject(j); }
    return r.json() as Promise<Notificacao[]>;
};

export const contarNotificacoesNaoLidas = async (): Promise<number> =>
{
    const r = await fetch(`${API_URL}/notificacoes/contagem`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) return 0;
    const j = await r.json() as { total?: number };
    return Number(j.total || 0);
};

export const marcarNotificacaoComoLida = async (id: number): Promise<void> =>
{
    const r = await fetch(`${API_URL}/notificacoes/${id}/lida`, { method: 'PUT', headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao marcar notificação como lida.' })); return Promise.reject(j); }
};
