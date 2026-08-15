import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfigCard } from '../components/layout/ConfigCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ToastMessage, type ToastVariant } from '../components/feedback/ToastMessage';
import { StatusChip } from '../components/ui/StatusChip';
import { VendaForm } from '../components/vendas/VendaForm';
import { formatMoneyBR, formatDateBR } from '../utils/masks';
import { exportarCSVVendas } from '../services/vendas';
import {
    atualizarVenda,
    buscarVendaPorId,
    criarVenda,
    deletarVenda,
    listarVendas,
    type ErroApi,
} from '../services/vendas';
import {
    STATUS_VENDA_FILTRO,
    type ItemVenda,
    type Venda,
} from '../types/venda';

// ============================================
// HELPERS
// ============================================

const mensagemErroApi = (data: ErroApi | any, fallback: string): string =>
{
    if (data && typeof data === 'object')
    {
        if (typeof data.erro === 'string' && data.erro.trim()) return data.erro;
        if (typeof data.mensagem === 'string' && data.mensagem.trim()) return data.mensagem;
        if (typeof data.message === 'string' && data.message.trim()) return data.message;
        if (typeof data.error === 'string' && data.error.trim()) return data.error;
    }
    return fallback;
};

const normalizarVenda = (x: any): Venda =>
{
    const raw = x && typeof x === 'object' ? x : ({} as any);
    const itensRaw = Array.isArray(raw.itens) ? raw.itens.filter((it: any) => !!it && it.produtoId != null) : [];
    return {
        id: Number(raw.id) | 0,
        usuarioId: typeof raw.usuarioId !== 'undefined' ? Number(raw.usuarioId) : undefined,
        clienteId: raw.clienteId ? Number(raw.clienteId) : null,
        clienteNome: raw.clienteNome ?? null,
        clienteTelefone: raw.clienteTelefone ?? null,
        clienteEmail: raw.clienteEmail ?? null,
        dataVenda: raw.dataVenda ? String(raw.dataVenda) : '',
        avaliacao: raw.avaliacao ?? null,
        observacao: raw.observacao ?? null,
        valorTotal: Number(raw.valorTotal ?? 0) || 0,
        quantidade: Number(raw.quantidade ?? itensRaw.length) | 0,
        canal: raw.canal ?? null,
        statusVenda: raw.statusVenda || 'Pendente',
        itens: itensRaw.map((it: any): ItemVenda => ({
            id: typeof it.id !== 'undefined' ? Number(it.id) : undefined,
            vendaId: typeof it.vendaId !== 'undefined' ? Number(it.vendaId) : undefined,
            produtoId: Number(it.produtoId) | 0,
            quantidade: 1,
            precoUnitario: Number(it.precoUnitario ?? 0) || 0,
            produtoNome: String(it.produtoNome || '').trim() || '(produto sem nome)',
            subtotal: typeof it.subtotal !== 'undefined' ? Number(it.subtotal) : Number(it.precoUnitario ?? 0),
        })),
    };
};

const toneStatusVenda = (s: string | null | undefined) =>
{
    if (!s) return 'neutral';
    const v = s.toLowerCase();
    if (v.includes('conclu')) return 'success';
    if (v.includes('cancel')) return 'danger';
    if (v.includes('andamento') || v.includes('pend')) return 'warning';
    return 'neutral';
};

// ============================================
// STYLED COMPONENTS
// ============================================

const ToolbarRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
`;

const SearchWrap = styled.label`
  position: relative;
  flex: 1 1 280px;
  max-width: 420px;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid var(--pl-line);
  border-radius: 0.85rem;
  padding: 0 0.85rem 0 2.25rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus-within {
    border-color: var(--pl-blue);
    box-shadow: 0 0 0 3px rgba(88, 87, 246, 0.15);
  }

  & > svg {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--pl-muted);
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 42px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  color: var(--pl-navy);
  &::placeholder { color: var(--pl-muted); }
`;

const PrimaryButton = styled.button`
  min-width: 170px;
  height: 44px;
  padding: 0 1.1rem;
  background: var(--pl-blue);
  color: #fff;
  border: 1px solid var(--pl-blue);
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: 'Inter', sans-serif;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;

  &:hover { background: var(--pl-blue-dark); border-color: var(--pl-blue-dark); }
  &:active { transform: translateY(1px); }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
`;

const ExportCSVButton = styled.button`
  min-width: 170px;
  height: 44px;
  padding: 0 1.1rem;
  background: #198754;
  color: #fff;
  border: 1px solid #198754;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: 'Inter', sans-serif;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;

  &:hover:not(:disabled) { background: #157347; border-color: #146c43; }
  &:active { transform: translateY(1px); }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
`;

const StatusFilter = styled.select`
  min-width: 170px;
  height: 44px;
  padding: 0 1rem;
  background: #fff;
  border: 1px solid var(--pl-line);
  border-radius: 0.75rem;
  color: var(--pl-navy);
  font-size: 0.88rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: all 0.15s ease;
  cursor: pointer;

  &:hover { border-color: #a49dd3; }
  &:focus { border-color: var(--pl-blue); box-shadow: 0 0 0 0.2rem rgba(59,46,232,0.10); }
`;

const FormCard = styled(ConfigCard)`
  margin-top: 1.5rem;
`;

const BadgeCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: #eee9ff;
  color: var(--pl-blue);
  font-family: Arial, 'Arial', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  user-select: none;
  white-space: nowrap;
`;

const SpinnerRow = styled.div`
  padding: 2rem 1rem;
  text-align: center;
  color: var(--pl-muted);
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
`;

const ListTable = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1400px;
  table-layout: auto;
`;

const Thead = styled.thead``;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pl-muted);
  font-family: 'Inter', sans-serif;
  border-bottom: 1px solid var(--pl-line);
  white-space: nowrap;

  &:nth-child(1) { width: 220px; min-width: 220px; }   /* Cliente */
  &:nth-child(2) { width: 220px; min-width: 220px; }   /* Produtos (mesma largura do Cliente) */
  &:nth-child(3) { width: 110px; min-width: 100px; }   /* Qtd. itens */
  &:nth-child(4) { width: 150px; min-width: 130px; }   /* Valor total */
  &:nth-child(5) { width: 130px; min-width: 120px; }   /* Data */
  &:nth-child(6) { width: 130px; min-width: 120px; }   /* Canal */
  &:nth-child(7) { width: 150px; min-width: 140px; }   /* Status */
  &:nth-child(8) { width: 130px; min-width: 110px; }   /* Avaliação */
  &:last-child { width: 150px; min-width: 150px; }     /* Ações */
`;

const ProdutosCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #3e3c65;
  font-family: 'Inter', sans-serif;
  line-height: 1.35;
  max-height: 160px;
  overflow-y: auto;
  word-break: break-word;
  overflow-wrap: anywhere;
`;

const ProdutoNome = styled.span`
  padding: 0.15rem 0;
  border-bottom: 1px dashed #ecebf5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  &:last-child { border-bottom: 0; }
`;

const Td = styled.td`
  padding: 0.9rem 1rem;
  font-size: 0.88rem;
  color: #3e3c65;
  font-family: 'Inter', sans-serif;
  vertical-align: middle;
  border-bottom: 1px solid #f1eef9;
  overflow-wrap: anywhere;
  word-wrap: break-word;
  word-break: break-word;
`;

const TdActions = styled.td`
  padding: 0.9rem 1rem;
  text-align: right;
  vertical-align: middle;
  border-bottom: 1px solid #f1eef9;
  white-space: nowrap;
`;

const ValorCell = styled.span`
  font-size: 0.94rem;
  font-weight: 700;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
`;

const MutedCell = styled.span`
  font-size: 0.84rem;
  color: var(--pl-muted);
  font-style: italic;
`;

const ClientCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const ClientName = styled.div`
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
`;

const ClientSmall = styled.span`
  font-size: 0.78rem;
  color: var(--pl-muted);
  font-family: 'Inter', sans-serif;
`;

const QtdChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  background: #f0efff;
  color: #4b47a8;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
`;

const ActionsGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const IconButton = styled.button<{ $tone: 'view' | 'edit' | 'delete' }>`
  width: 34px;
  height: 34px;
  border-radius: 0.65rem;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: ${({ $tone }) => $tone === 'edit' ? '#eef1ff' : $tone === 'delete' ? '#ffe9ec' : '#eefaf1'};
  color: ${({ $tone }) => $tone === 'edit' ? '#4b57d8' : $tone === 'delete' ? '#d84b60' : '#1b8a5b'};
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;

  &:hover {
    background: ${({ $tone }) => $tone === 'edit' ? '#e2e7ff' : $tone === 'delete' ? '#ffd5da' : '#d7f1df'};
    transform: translateY(-1px);
  }
`;

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const DetailsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #faf9ff;
  border: 1px solid #ecebf5;
  border-radius: 0.6rem;
  font-size: 1rem;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  gap: 0.75rem;

  strong { color: var(--pl-blue); font-weight: 700; white-space: nowrap; font-size: 1rem; }
`;

const DetailsSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.1rem;
  background: linear-gradient(135deg, #6a62d2 0%, #8a83ee 100%);
  color: #fff;
  border-radius: 0.75rem;
  margin-top: 0.9rem;

  span { font-size: 1rem; font-weight: 600; opacity: 0.96; }
  strong { font-size: 1.35rem; font-weight: 700; }
`;

const ObservacoesBox = styled.div`
  margin-top: 0.9rem;
  padding: 0.9rem 1rem;
  background: #f7f6ff;
  border: 1px solid #ddd7ff;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const ObservacoesLabel = styled.div`
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--pl-muted);
`;

const ObservacoesTexto = styled.div`
  font-size: 1rem;
  line-height: 1.45;
  color: var(--pl-navy);
  font-weight: 500;
  white-space: pre-wrap;
  word-break: break-word;
`;

const CloseDetails = styled.button`
  margin-top: 1.1rem;
  height: 46px;
  padding: 0 1.2rem;
  background: transparent;
  color: var(--pl-navy);
  border: 1px solid #c6c3da;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  transition: all 0.15s ease;
  width: 100%;

  &:hover { background: var(--pl-canvas); color: var(--pl-blue); border-color: var(--pl-blue); }
`;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const VendasPage: React.FC = () =>
{
    const { logout } = useAuth();

    const [vendas, setVendas] = useState<Venda[]>([]);
    const [carregando, setCarregando] = useState<boolean>(true);

    const [mostrarForm, setMostrarForm] = useState<boolean>(false);
    const [editando, setEditando] = useState<Venda | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [paraExcluir, setParaExcluir] = useState<Venda | null>(null);
    const [excluindo, setExcluindo] = useState<boolean>(false);

    const [verDetalhes, setVerDetalhes] = useState<Venda | null>(null);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState<boolean>(false);

    const [busca, setBusca] = useState<string>('');
    const [statusFiltro, setStatusFiltro] = useState<string>('');

    const [toast, setToast] = useState<{ variant: ToastVariant; message: string; visible: boolean }>({
        variant: 'success', message: '', visible: false,
    });

    const exibirToast = useCallback((variant: ToastVariant, message: string) =>
    {
        setToast({ variant, message, visible: true });
    }, []);

    const tratarErro401 = useCallback((d: any) =>
    {
        if (d && typeof d === 'object' && (d.sessaoInvalida === true || d.contaSemRole === true))
        {
            logout();
            return true;
        }
        return false;
    }, [logout]);

    // ============================================
    // CARREGAR LISTA
    // ============================================
    const carregarVendas = useCallback(async () =>
    {
        setCarregando(true);
        try
        {
            const lista = await listarVendas();
            setVendas((lista || []).map((x) => normalizarVenda(x)));
        }
        catch (err: any)
        {
            tratarErro401(err);
            console.error(err);
            setVendas([]);
            exibirToast('error', mensagemErroApi(err, 'Erro ao carregar vendas. Verifique o backend.'));
        }
        finally
        {
            setCarregando(false);
        }
    }, [exibirToast, tratarErro401]);

    useEffect(() => { carregarVendas(); }, [carregarVendas]);

    // ============================================
    // FILTRAR (blindado contra valores ruins que causam tela branca)
    // ============================================
    const filtrados = useMemo(() =>
    {
        try
        {
            const b = String(busca ?? '').trim().toLowerCase();
            return vendas.filter((v) =>
            {
                if (!v || typeof v !== 'object') return false;

                if (statusFiltro && String(v.statusVenda || '') !== String(statusFiltro)) return false;
                if (!b) return true;

                const cliente = String(v.clienteNome || '').toLowerCase();
                const canal = String(v.canal || '').toLowerCase();
                const status = String(v.statusVenda || '').toLowerCase();
                const data = formatDateBR(v.dataVenda).toLowerCase();
                const valor = formatMoneyBR(v.valorTotal).toLowerCase();
                const avaliacao = String(v.avaliacao || '').toLowerCase();
                const produtosNomes = Array.isArray(v.itens)
                    ? v.itens.map((i: any) => String((i && i.produtoNome) || '').toLowerCase()).join(' ')
                    : '';

                return (
                    cliente.includes(b) ||
                    canal.includes(b) ||
                    status.includes(b) ||
                    data.includes(b) ||
                    valor.includes(b) ||
                    avaliacao.includes(b) ||
                    (!!produtosNomes && produtosNomes.includes(b))
                );
            });
        }
        catch (_err)
        {
            // Se algo explodir no filtro, retorna lista crua sem filtrar (nunca tela branca)
            console.warn('[Vendas] filtro com erro, retornando lista original.', _err);
            return vendas.filter((v) =>
                !statusFiltro || String(v.statusVenda || '') === String(statusFiltro)
            );
        }
    }, [busca, vendas, statusFiltro]);

    // ============================================
    // AÇÃO EXPORTAR CSV (via backend)
    // ============================================
    const [exportandoCSV, setExportandoCSV] = useState(false);
    const exportarCSV = useCallback(async () =>
    {
        try
        {
            setExportandoCSV(true);
            await exportarCSVVendas({
                ids: filtrados
                    .map((v) => (typeof v.id === 'number' ? v.id : Number(v.id)))
                    .filter((n): n is number => Number.isFinite(n) && n > 0),
            });
            exibirToast('success', 'CSV de vendas gerado com sucesso.');
        }
        catch (err: any)
        {
            if (err?.sessaoInvalida || (err?.erro && /sessão inválida/i.test(String(err.erro))))
            {
                exibirToast('error', err?.erro || 'Sessão inválida. Saia e entre novamente.');
                try { logout(); } catch (_) { /* ignore */ }
                return;
            }
            console.error(err);
            exibirToast('error', err?.erro || 'Erro ao exportar CSV.');
        }
        finally
        {
            setExportandoCSV(false);
        }
    }, [exportarCSVVendas, exibirToast, logout, filtrados]);

    // ============================================
    // AÇÕES CRUD
    // ============================================
    const handleSubmit = useCallback(async (payload: Record<string, unknown>) =>
    {
        setSubmitting(true);
        try
        {
            if (editando)
            {
                const res = await atualizarVenda(editando.id, payload as any);
                tratarErro401(res);
                exibirToast('success', res.mensagem || 'Venda atualizada com sucesso.');
            }
            else
            {
                const res = await criarVenda(payload as any);
                tratarErro401(res);
                exibirToast('success', res.mensagem || 'Venda registrada com sucesso.');
            }
            await carregarVendas();
            setEditando(null);
            setMostrarForm(false);
        }
        catch (err: any)
        {
            tratarErro401(err);
            console.error(err);
            exibirToast('error', mensagemErroApi(err, editando ? 'Erro ao atualizar a venda.' : 'Erro ao registrar a venda.'));
        }
        finally
        {
            setSubmitting(false);
        }
    }, [editando, carregarVendas, tratarErro401, exibirToast]);

    const iniciarEdicao = useCallback(async (v: Venda) =>
    {
        try
        {
            const detalhada = await buscarVendaPorId(v.id);
            const norm = normalizarVenda(detalhada);
            setEditando(norm);
            setMostrarForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        catch (err: any)
        {
            tratarErro401(err);
            console.error(err);
            exibirToast('error', mensagemErroApi(err, 'Erro ao carregar detalhes da venda para editar.'));
        }
    }, [tratarErro401, exibirToast]);

    const alternarForm = useCallback(() =>
    {
        if (mostrarForm) { setEditando(null); setMostrarForm(false); }
        else { setEditando(null); setMostrarForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    }, [mostrarForm]);

    const confirmarExcluir = useCallback(async () =>
    {
        if (!paraExcluir) return;
        setExcluindo(true);
        try
        {
            const res = await deletarVenda(paraExcluir.id);
            exibirToast('success', (res && res.mensagem) || 'Venda excluída.');
            await carregarVendas();
            setParaExcluir(null);
        }
        catch (err: any)
        {
            tratarErro401(err);
            console.error(err);
            exibirToast('error', mensagemErroApi(err, 'Erro ao excluir a venda.'));
        }
        finally
        {
            setExcluindo(false);
        }
    }, [paraExcluir, carregarVendas, tratarErro401, exibirToast]);

    const abrirDetalhes = useCallback(async (v: Venda) =>
    {
        setCarregandoDetalhes(true);
        try
        {
            if (v.itens && v.itens.length) setVerDetalhes(v);
            else
            {
                const detalhada = await buscarVendaPorId(v.id);
                setVerDetalhes(normalizarVenda(detalhada));
            }
        }
        catch (err: any)
        {
            tratarErro401(err);
            console.error(err);
            exibirToast('error', mensagemErroApi(err, 'Erro ao carregar detalhes da venda.'));
        }
        finally
        {
            setCarregandoDetalhes(false);
        }
    }, [tratarErro401, exibirToast]);

    // ============================================
    // RENDER
    // ============================================
    return (
        <>
            <PageHeader
                eyebrow="Vendas"
                title="Vendas"
                subtitle="Registre e acompanhe suas vendas, itens incluídos e o valor total calculado automaticamente."
                actions={
                    <ToolbarRow>
                        <SearchWrap htmlFor="search-venda">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <SearchInput
                                id="search-venda"
                                placeholder="Buscar cliente, canal, status, data, valor, avaliação..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
                        </SearchWrap>
                        <StatusFilter
                            value={statusFiltro}
                            onChange={(e) => setStatusFiltro(e.target.value)}
                        >
                            {STATUS_VENDA_FILTRO.map((opt) => (
                                <option key={opt.label} value={opt.value}>{opt.label}</option>
                            ))}
                        </StatusFilter>
                        <ExportCSVButton
                            type="button"
                            onClick={exportarCSV}
                            disabled={exportandoCSV || carregando || vendas.length === 0}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Exportar para csv
                        </ExportCSVButton>
                        <PrimaryButton type="button" onClick={alternarForm}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                {mostrarForm ? (
                                    <>
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </>
                                ) : (
                                    <>
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </>
                                )}
                            </svg>
                            {mostrarForm ? 'Fechar formulário' : 'Nova venda'}
                        </PrimaryButton>
                    </ToolbarRow>
                }
            />

            {mostrarForm && (
                <FormCard
                    title={editando ? `Editar venda — Nº ${editando.id}` : 'Registrar nova venda'}
                >
                    <VendaForm
                        initialValue={editando}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        onCancel={() => { setEditando(null); setMostrarForm(false); }}
                    />
                </FormCard>
            )}

            {verDetalhes && (
                <FormCard
                    title={`Detalhes da venda — Nº ${verDetalhes.id}`}
                    style={{ marginTop: '1.5rem' }}
                >
                    {carregandoDetalhes ? (
                        <SpinnerRow>Carregando detalhes...</SpinnerRow>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem 1.1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.08, color: 'var(--pl-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Cliente</div>
                                    <div style={{ fontSize: 16, color: 'var(--pl-navy)', fontWeight: 600 }}>
                                        {verDetalhes.clienteNome || <MutedCell>não informado</MutedCell>}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.08, color: 'var(--pl-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Data</div>
                                    <div style={{ fontSize: 16, color: 'var(--pl-navy)', fontWeight: 600 }}>
                                        {verDetalhes.dataVenda ? formatDateBR(verDetalhes.dataVenda) : <MutedCell>não informada</MutedCell>}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.08, color: 'var(--pl-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Canal</div>
                                    <div style={{ fontSize: 16, color: 'var(--pl-navy)', fontWeight: 600 }}>
                                        {verDetalhes.canal || <MutedCell>não informado</MutedCell>}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.08, color: 'var(--pl-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Status</div>
                                    <StatusChip label={verDetalhes.statusVenda || 'Pendente'} tone={toneStatusVenda(verDetalhes.statusVenda)} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.08, color: 'var(--pl-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Avaliação</div>
                                    <div style={{ fontSize: 16, color: 'var(--pl-navy)', fontWeight: 600 }}>
                                        {verDetalhes.avaliacao || <MutedCell>sem avaliação</MutedCell>}
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--pl-navy)', marginBottom: 10 }}>
                                Itens da venda ({verDetalhes.itens?.length ?? 0})
                            </div>
                            <DetailsList>
                                {(verDetalhes.itens || []).length === 0 ? (
                                    <EmptyState
                                        title="Nenhum item registrado"
                                        description="Os itens não foram carregados."
                                    />
                                ) : (
                                    (verDetalhes.itens || []).map((it, idx) => (
                                        <DetailsRow key={it.id || idx}>
                                            <span>
                                                Produto {it.produtoNome || '(produto)'} 1x valor: {formatMoneyBR(it.precoUnitario)}
                                            </span>
                                            <strong>{formatMoneyBR(it.subtotal ?? it.precoUnitario)}</strong>
                                        </DetailsRow>
                                    ))
                                )}
                            </DetailsList>

                            {(verDetalhes as any).observacao && String((verDetalhes as any).observacao).trim() && (
                                <ObservacoesBox>
                                    <ObservacoesLabel>Observações / Informações adicionais</ObservacoesLabel>
                                    <ObservacoesTexto>{String((verDetalhes as any).observacao)}</ObservacoesTexto>
                                </ObservacoesBox>
                            )}

                            <DetailsSummary>
                                <span>Total ({(verDetalhes.itens || []).length} itens)</span>
                                <strong>{formatMoneyBR(verDetalhes.valorTotal)}</strong>
                            </DetailsSummary>
                            <CloseDetails type="button" onClick={() => setVerDetalhes(null)}>
                                Fechar detalhes
                            </CloseDetails>
                        </>
                    )}
                </FormCard>
            )}

            <ConfigCard
                title="Lista de vendas"
                headerRight={<BadgeCount>Total vendas: {filtrados.length}</BadgeCount>}
                style={{ marginTop: '1.5rem' }}
            >
                {carregando ? (
                    <SpinnerRow>Carregando vendas...</SpinnerRow>
                ) : filtrados.length === 0 ? (
                    <EmptyState
                        title={busca.trim() || statusFiltro ? 'Nenhuma venda encontrada.' : 'Nenhuma venda registrada ainda.'}
                        description={busca.trim() || statusFiltro
                            ? 'Tente ajustar os filtros de busca ou status.'
                            : 'Clique em "Nova venda" para registrar sua primeira venda.'}
                    />
                ) : (
                    <ListTable>
                        <StyledTable>
                            <Thead>
                                <tr>
                                    <Th>Cliente</Th>
                                    <Th>Produtos</Th>
                                    <Th>Qtd. itens</Th>
                                    <Th>Valor total</Th>
                                    <Th>Data</Th>
                                    <Th>Canal</Th>
                                    <Th>Status</Th>
                                    <Th>Avaliação</Th>
                                    <Th style={{ textAlign: 'right' }}>Ações</Th>
                                </tr>
                            </Thead>
                            <tbody>
                                {filtrados.map((v) => (
                                    <tr key={v.id}>
                                        <Td>
                                            <ClientCell>
                                                <ClientName>
                                                    {v.clienteNome || <MutedCell>venda sem cliente</MutedCell>}
                                                </ClientName>
                                                {(v.clienteEmail || v.clienteTelefone) && (
                                                    <ClientSmall>
                                                        {[v.clienteEmail, v.clienteTelefone].filter(Boolean).join(' · ')}
                                                    </ClientSmall>
                                                )}
                                            </ClientCell>
                                        </Td>
                                        <Td>
                                            {(function renderProdutos()
                                            {
                                                try
                                                {
                                                    const itens = Array.isArray(v.itens) ? v.itens.filter((i) => !!i && (i as any).produtoNome) : [];
                                                    if (!itens.length) return <MutedCell>sem itens</MutedCell>;
                                                    return (
                                                        <ProdutosCell>
                                                            {itens.slice(0, 4).map((it, idx) =>
                                                            {
                                                                const pk = (it as any).id != null ? String((it as any).id) : `it-${idx}`;
                                                                return (
                                                                    <ProdutoNome key={pk}>
                                                                        · {String((it as any).produtoNome || '(produto)')}
                                                                    </ProdutoNome>
                                                                );
                                                            })}
                                                            {itens.length > 4 && (
                                                                <ProdutoNome style={{ color: 'var(--pl-muted)', fontWeight: 600 }}>
                                                                    + mais {itens.length - 4}
                                                                </ProdutoNome>
                                                            )}
                                                        </ProdutosCell>
                                                    );
                                                }
                                                catch (_)
                                                {
                                                    return <MutedCell>sem itens</MutedCell>;
                                                }
                                            })()}
                                        </Td>
                                        <Td>
                                            <QtdChip>
                                                {Number(v.quantidade ?? (v.itens ? v.itens.length : 0)) | 0} itens
                                            </QtdChip>
                                        </Td>
                                        <Td>
                                            <ValorCell>{formatMoneyBR(v.valorTotal)}</ValorCell>
                                        </Td>
                                        <Td>
                                            {v.dataVenda ? formatDateBR(v.dataVenda) : <MutedCell>—</MutedCell>}
                                        </Td>
                                        <Td>
                                            {v.canal || <MutedCell>não informado</MutedCell>}
                                        </Td>
                                        <Td>
                                            <StatusChip label={v.statusVenda || 'Pendente'} tone={toneStatusVenda(v.statusVenda)} />
                                        </Td>
                                        <Td>
                                            {v.avaliacao || <MutedCell>sem avaliação</MutedCell>}
                                        </Td>
                                        <TdActions>
                                            <ActionsGroup>
                                                <IconButton
                                                    $tone="view"
                                                    title="Ver itens da venda"
                                                    aria-label="Ver itens da venda"
                                                    onClick={() => abrirDetalhes(v)}
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </IconButton>
                                                <IconButton
                                                    $tone="edit"
                                                    title="Editar venda"
                                                    aria-label="Editar venda"
                                                    onClick={() => iniciarEdicao(v)}
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </IconButton>
                                                <IconButton
                                                    $tone="delete"
                                                    title="Excluir venda"
                                                    aria-label="Excluir venda"
                                                    onClick={() => setParaExcluir(v)}
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                                                        <path d="M10 11v6" />
                                                        <path d="M14 11v6" />
                                                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </IconButton>
                                            </ActionsGroup>
                                        </TdActions>
                                    </tr>
                                ))}
                            </tbody>
                        </StyledTable>
                    </ListTable>
                )}
            </ConfigCard>

            <ConfirmDialog
                show={Boolean(paraExcluir)}
                title={excluindo ? 'Excluindo...' : paraExcluir ? `Excluir venda Nº ${paraExcluir.id}?` : 'Excluir venda'}
                message={paraExcluir
                    ? `Tem certeza que deseja remover esta venda (valor ${formatMoneyBR(paraExcluir.valorTotal)}) e todos os seus itens? Essa ação não pode ser desfeita.`
                    : ''}
                confirmLabel={excluindo ? 'Excluindo...' : 'Sim, excluir'}
                cancelLabel="Cancelar"
                onCancel={() => { if (!excluindo) setParaExcluir(null); }}
                onConfirm={confirmarExcluir}
            />

            <ToastMessage
                variant={toast.variant}
                message={toast.message}
                visible={toast.visible}
                onClose={() => setToast((t) => ({ ...t, visible: false }))}
            />
        </>
    );
};

export default VendasPage;
