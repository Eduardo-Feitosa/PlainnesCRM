import { API_URL } from '../config/api';
import type { Produto } from '../types/produto';
import type { ErroApi } from './vendas';
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

export const listarProdutos = async (): Promise<Produto[]> =>
{
    const r = await fetch(`${API_URL}/produtos`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao listar produtos.' })); return Promise.reject(j); }
    return r.json() as Promise<Produto[]>;
};

export const buscarProdutoPorId = async (id: number): Promise<Produto> =>
{
    const r = await fetch(`${API_URL}/produtos/${id}`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (r.status === 404) return Promise.reject({ erro: 'Produto não encontrado.' });
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao buscar o produto.' })); return Promise.reject(j); }
    return r.json() as Promise<Produto>;
};

export interface ExportarCSVFiltrosProduto
{
    busca?: string | null | undefined;
    classificacao?: string | null | undefined;
    nicho?: string | null | undefined;
    ids?: number[] | null | undefined;
}

export const exportarCSVProdutos = async (filtros?: ExportarCSVFiltrosProduto): Promise<number> =>
{
    const idsArray = filtros?.ids && Array.isArray(filtros.ids) && filtros.ids.length
        ? filtros.ids.filter((n) => Number.isFinite(n) && n > 0)
        : [];
    const temIds = idsArray.length > 0;

    const params = new URLSearchParams();
    if (filtros && !temIds)
    {
        if (filtros.busca) params.set('busca', String(filtros.busca).trim());
        if (filtros.classificacao) params.set('classificacao', String(filtros.classificacao).trim());
        if (filtros.nicho) params.set('nicho', String(filtros.nicho).trim());
    }
    const qs = params.toString();
    const url = temIds
        ? `${API_URL}/produtos/exportar/filtrados`
        : `${API_URL}/produtos/exportar${qs ? `?${qs}` : ''}`;
    const init: RequestInit = temIds
        ? { method: 'POST', headers: headers(true), body: JSON.stringify({ ids: idsArray }) }
        : { headers: headers(false) };

    const r = await fetch(url, init);
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok)
    {
        const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao exportar CSV de produtos.' }));
        return Promise.reject(j);
    }
    const blob = await r.blob();
    baixarBlob(blob, `produtos_${new Date().toISOString().slice(0, 10)}.csv`, r.headers.get('Content-Disposition'));
    const lengthHeader = r.headers.get('Content-Length');
    const size = lengthHeader ? Number(lengthHeader) | 0 : Number(blob.size) | 0;
    return size > 0 ? size : 1;
};
