import { API_URL } from '../config/api';
import type { ErroApi } from './vendas';

const token = () => localStorage.getItem('token');
const headers = (bodyJson = true): Record<string, string> =>
{
    const t = token();
    return {
        ...(bodyJson ? { 'Content-Type': 'application/json' } : {}),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
};

export interface DashboardMetrics
{
    totalClientes: number;
    totalProdutos: number;
    totalVendas: number;
    totalFaturado: number;
}

export const buscarMetricsDashboard = async (): Promise<DashboardMetrics> =>
{
    const r = await fetch(`${API_URL}/dashboard/metrics`, { headers: headers(false) });
    if (r.status === 401) { const j: ErroApi = await r.json().catch(() => ({})); return Promise.reject(j); }
    if (!r.ok) { const j: ErroApi = await r.json().catch(() => ({ erro: 'Falha ao carregar métricas do dashboard.' })); return Promise.reject(j); }
    const raw = await r.json();
    return {
        totalClientes: Number(raw?.totalClientes ?? 0) || 0,
        totalProdutos: Number(raw?.totalProdutos ?? 0) || 0,
        totalVendas:   Number(raw?.totalVendas ?? 0) || 0,
        totalFaturado: Number(raw?.totalFaturado ?? 0) || 0,
    };
};
