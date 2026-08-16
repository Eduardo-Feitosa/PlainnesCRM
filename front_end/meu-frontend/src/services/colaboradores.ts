import { API_URL } from '../config/api';
import type { ErroApi } from './vendas';
import type { UsuarioBusca, SolicitacaoColaborador } from '../types/colaborador';

const token = () => localStorage.getItem('token');
const headers = (bodyJson = true): Record<string, string> =>
{
    const t = token();
    return {
        ...(bodyJson ? { 'Content-Type': 'application/json' } : {}),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
};

export const buscarUsuariosColaborador = async (termo: string): Promise<UsuarioBusca[]> =>
{
    const qs = new URLSearchParams({ termo }).toString();
    const r = await fetch(`${API_URL}/colaboradores/buscar?${qs}`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao buscar usuários.' })); return Promise.reject(j); }
    return r.json() as Promise<UsuarioBusca[]>;
};

export const solicitarColaboracao = async (usuarioId: number): Promise<{ mensagem?: string }> =>
{
    const r = await fetch(`${API_URL}/colaboradores`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ usuarioId }),
    });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao enviar solicitação.' })); return Promise.reject(j); }
    return r.json() as Promise<{ mensagem?: string }>;
};

export const listarSolicitacoesPendentes = async (): Promise<SolicitacaoColaborador[]> =>
{
    const r = await fetch(`${API_URL}/colaboradores/pendentes`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao listar solicitações.' })); return Promise.reject(j); }
    return r.json() as Promise<SolicitacaoColaborador[]>;
};

export const responderSolicitacao = async (id: number, aceitar: boolean): Promise<{ mensagem?: string }> =>
{
    const r = await fetch(`${API_URL}/colaboradores/${id}/responder`, {
        method: 'PUT', headers: headers(), body: JSON.stringify({ aceitar }),
    });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao responder solicitação.' })); return Promise.reject(j); }
    return r.json() as Promise<{ mensagem?: string }>;
};
