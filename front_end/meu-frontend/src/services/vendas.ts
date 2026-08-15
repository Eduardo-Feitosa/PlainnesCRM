import { API_URL } from '../config/api';
import type { Venda, VendaFormValues } from '../types/venda';
import { baixarBlob } from '../utils/masks';

const token = () => localStorage.getItem('token');
const headers = (bodyJson = true): Record<string, string> =>
{
    const t = token();
    return {
        ...(bodyJson ? { 'Content-Type': 'application/json' } : {}),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
};

export interface ErroApi
{
    erro?: string;
    mensagem?: string;
    sessaoInvalida?: boolean;
    contaSemRole?: boolean;
}

export interface RespostaCriarVenda
{
    mensagem?: string;
    venda: Venda;
}

export const listarVendas = async (): Promise<Venda[]> =>
{
    const r = await fetch(`${API_URL}/vendas`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao listar vendas.' })); return Promise.reject(j); }
    return r.json() as Promise<Venda[]>;
};

export const buscarVendaPorId = async (id: number): Promise<Venda> =>
{
    const r = await fetch(`${API_URL}/vendas/${id}`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (r.status === 404) return Promise.reject({ erro: 'Venda não encontrada.' });
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao buscar a venda.' })); return Promise.reject(j); }
    return r.json() as Promise<Venda>;
};

export const criarVenda = async (dados: VendaFormValues): Promise<RespostaCriarVenda> =>
{
    const r = await fetch(`${API_URL}/vendas`, { method: 'POST', headers: headers(), body: JSON.stringify(dados) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao registrar a venda.' })); return Promise.reject(j); }
    return r.json() as Promise<RespostaCriarVenda>;
};

export const atualizarVenda = async (id: number, dados: VendaFormValues): Promise<RespostaCriarVenda> =>
{
    const r = await fetch(`${API_URL}/vendas/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(dados) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (r.status === 404) return Promise.reject({ erro: 'Venda não encontrada.' });
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao atualizar a venda.' })); return Promise.reject(j); }
    return r.json() as Promise<RespostaCriarVenda>;
};

export const deletarVenda = async (id: number): Promise<{ mensagem?: string }> =>
{
    const r = await fetch(`${API_URL}/vendas/${id}`, { method: 'DELETE', headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (r.status === 404) return Promise.reject({ erro: 'Venda não encontrada.' });
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao excluir a venda.' })); return Promise.reject(j); }
    return r.json() as Promise<{ mensagem?: string }>;
};

export interface ExportarCSVFiltros
{
    busca?: string | null | undefined;
    status?: string | null | undefined;
    canal?: string | null | undefined;
    clienteId?: number | string | null | undefined;
    dataInicio?: string | null | undefined;
    dataFim?: string | null | undefined;
    ids?: number[] | null | undefined;
}

export const exportarCSVVendas = async (filtros?: ExportarCSVFiltros): Promise<number> =>
{
    const idsArray = filtros?.ids && Array.isArray(filtros.ids) && filtros.ids.length
        ? filtros.ids.filter((n) => Number.isFinite(n) && n > 0)
        : [];
    const temIds = idsArray.length > 0;

    const params = new URLSearchParams();
    if (filtros && !temIds)
    {
        if (filtros.busca) params.set('busca', String(filtros.busca).trim());
        if (filtros.status) params.set('status', String(filtros.status).trim());
        if (filtros.canal) params.set('canal', String(filtros.canal).trim());
        if (filtros.clienteId) params.set('clienteId', String(filtros.clienteId).trim());
        if (filtros.dataInicio) params.set('dataInicio', String(filtros.dataInicio).trim());
        if (filtros.dataFim) params.set('dataFim', String(filtros.dataFim).trim());
    }
    const qs = params.toString();
    const url = temIds
        ? `${API_URL}/vendas/exportar/filtrados`
        : `${API_URL}/vendas/exportar${qs ? `?${qs}` : ''}`;
    const init: RequestInit = temIds
        ? { method: 'POST', headers: headers(true), body: JSON.stringify({ ids: idsArray }) }
        : { headers: headers(false) };

    const r = await fetch(url, init);
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok)
    {
        const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao exportar CSV de vendas.' }));
        return Promise.reject(j);
    }
    const blob = await r.blob();
    baixarBlob(blob, `vendas_${new Date().toISOString().slice(0, 10)}.csv`, r.headers.get('Content-Disposition'));
    const lengthHeader = r.headers.get('Content-Length');
    const size = lengthHeader ? Number(lengthHeader) | 0 : Number(blob.size) | 0;
    return size > 0 ? size : 1;
};
