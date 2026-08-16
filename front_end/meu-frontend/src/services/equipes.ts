import { API_URL } from '../config/api';
import type { ErroApi } from './vendas';
import type { Equipe, EquipeFormValues, MembroEquipe, ConviteEquipe, UsuarioBusca } from '../types/equipe';

const token = () => localStorage.getItem('token');
const headers = (bodyJson = true): Record<string, string> =>
{
    const t = token();
    return {
        ...(bodyJson ? { 'Content-Type': 'application/json' } : {}),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
};

export interface RespostaEquipe
{
    mensagem?: string;
    equipe: Equipe;
}

export const listarEquipes = async (): Promise<Equipe[]> =>
{
    const r = await fetch(`${API_URL}/equipes`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao listar equipes.' })); return Promise.reject(j); }
    return r.json() as Promise<Equipe[]>;
};

export const buscarEquipePorId = async (id: number): Promise<Equipe> =>
{
    const r = await fetch(`${API_URL}/equipes/${id}`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (r.status === 404) return Promise.reject({ erro: 'Equipe não encontrada.' });
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao buscar a equipe.' })); return Promise.reject(j); }
    return r.json() as Promise<Equipe>;
};

export const criarEquipe = async (dados: EquipeFormValues): Promise<RespostaEquipe> =>
{
    const r = await fetch(`${API_URL}/equipes`, { method: 'POST', headers: headers(), body: JSON.stringify(dados) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao criar a equipe.' })); return Promise.reject(j); }
    return r.json() as Promise<RespostaEquipe>;
};

export const atualizarEquipe = async (id: number, dados: EquipeFormValues): Promise<RespostaEquipe> =>
{
    const r = await fetch(`${API_URL}/equipes/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(dados) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (r.status === 404) return Promise.reject({ erro: 'Equipe não encontrada.' });
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao atualizar a equipe.' })); return Promise.reject(j); }
    return r.json() as Promise<RespostaEquipe>;
};

export const deletarEquipe = async (id: number): Promise<{ mensagem?: string }> =>
{
    const r = await fetch(`${API_URL}/equipes/${id}`, { method: 'DELETE', headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (r.status === 404) return Promise.reject({ erro: 'Equipe não encontrada.' });
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao excluir a equipe.' })); return Promise.reject(j); }
    return r.json() as Promise<{ mensagem?: string }>;
};

export const listarMembros = async (equipeId: number): Promise<MembroEquipe[]> =>
{
    const r = await fetch(`${API_URL}/equipes/${equipeId}/membros`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao listar membros.' })); return Promise.reject(j); }
    return r.json() as Promise<MembroEquipe[]>;
};

export const buscarUsuariosParaConvite = async (equipeId: number, termo: string): Promise<UsuarioBusca[]> =>
{
    const qs = new URLSearchParams({ termo }).toString();
    const r = await fetch(`${API_URL}/equipes/${equipeId}/membros/buscar?${qs}`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao buscar usuários.' })); return Promise.reject(j); }
    return r.json() as Promise<UsuarioBusca[]>;
};

export const convidarMembro = async (equipeId: number, usuarioId: number): Promise<{ mensagem?: string }> =>
{
    const r = await fetch(`${API_URL}/equipes/${equipeId}/membros`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ usuarioId }),
    });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao convidar usuário.' })); return Promise.reject(j); }
    return r.json() as Promise<{ mensagem?: string }>;
};

export const removerMembro = async (equipeId: number, membroId: number): Promise<{ mensagem?: string }> =>
{
    const r = await fetch(`${API_URL}/equipes/${equipeId}/membros/${membroId}`, { method: 'DELETE', headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao remover membro.' })); return Promise.reject(j); }
    return r.json() as Promise<{ mensagem?: string }>;
};

export const sairDaEquipe = async (equipeId: number): Promise<{ mensagem?: string }> =>
{
    const r = await fetch(`${API_URL}/equipes/${equipeId}/sair`, { method: 'POST', headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao sair da equipe.' })); return Promise.reject(j); }
    return r.json() as Promise<{ mensagem?: string }>;
};

export const listarConvitesPendentes = async (): Promise<ConviteEquipe[]> =>
{
    const r = await fetch(`${API_URL}/equipes/convites`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao listar convites.' })); return Promise.reject(j); }
    return r.json() as Promise<ConviteEquipe[]>;
};

export const responderConvite = async (equipeId: number, aceitar: boolean): Promise<{ mensagem?: string }> =>
{
    const r = await fetch(`${API_URL}/equipes/${equipeId}/convite`, {
        method: 'PUT', headers: headers(), body: JSON.stringify({ aceitar }),
    });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao responder convite.' })); return Promise.reject(j); }
    return r.json() as Promise<{ mensagem?: string }>;
};
