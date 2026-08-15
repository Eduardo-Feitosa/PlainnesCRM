import { API_URL } from '../config/api';
import type { Cliente } from '../types/cliente';
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

export const listarClientes = async (): Promise<Cliente[]> =>
{
    const r = await fetch(`${API_URL}/clientes`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao listar clientes.' })); return Promise.reject(j); }
    return r.json() as Promise<Cliente[]>;
};

export const buscarClientePorId = async (id: number): Promise<Cliente> =>
{
    const r = await fetch(`${API_URL}/clientes/${id}`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (r.status === 404) return Promise.reject({ erro: 'Cliente não encontrado.' });
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao buscar o cliente.' })); return Promise.reject(j); }
    return r.json() as Promise<Cliente>;
};

export interface ExportarCSVFiltrosCliente
{
    busca?: string | null | undefined;
    status?: string | null | undefined;
    sexo?: string | null | undefined;
    estado?: string | null | undefined;
    ids?: number[] | null | undefined;
}

export const exportarCSVClientes = async (filtros?: ExportarCSVFiltrosCliente): Promise<number> =>
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
        if (filtros.sexo) params.set('sexo', String(filtros.sexo).trim());
        if (filtros.estado) params.set('estado', String(filtros.estado).trim());
    }
    const qs = params.toString();
    const url = temIds
        ? `${API_URL}/clientes/exportar/filtrados`
        : `${API_URL}/clientes/exportar${qs ? `?${qs}` : ''}`;
    const init: RequestInit = temIds
        ? { method: 'POST', headers: headers(true), body: JSON.stringify({ ids: idsArray }) }
        : { headers: headers(false) };

    const r = await fetch(url, init);
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok)
    {
        const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao exportar CSV de clientes.' }));
        return Promise.reject(j);
    }
    const blob = await r.blob();
    baixarBlob(blob, `clientes_${new Date().toISOString().slice(0, 10)}.csv`, r.headers.get('Content-Disposition'));
    const lengthHeader = r.headers.get('Content-Length');
    const size = lengthHeader ? Number(lengthHeader) | 0 : Number(blob.size) | 0;
    return size > 0 ? size : 1;
};
