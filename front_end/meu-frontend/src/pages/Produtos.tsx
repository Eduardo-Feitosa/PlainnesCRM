import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfigCard } from '../components/layout/ConfigCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ToastMessage } from '../components/feedback/ToastMessage';
import { ProdutoForm } from '../components/produtos/ProdutoForm';
import { formatMoneyBR } from '../utils/masks';
import { API_URL } from '../config/api';
import { exportarCSVProdutos } from '../services/produtos';
import { rotuloClassificacaoPreco } from '../types/produto';
import type { Produto, ClassificacaoPreco } from '../types/produto';

type ToastVariant = 'success' | 'error' | 'info';

// ============================================
// HELPERS
// ============================================

const mensagemErroApi = (data: any, fallback: string): string =>
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

const normalizarProduto = (c: any): Produto => ({
    id: Number(c.id),
    usuarioId: typeof c.usuarioId !== 'undefined' ? Number(c.usuarioId) : undefined,
    nome: String(c.nome ?? ''),
    descricao: c.descricao ?? null,
    nicho: c.nicho ?? null,
    valor: Number(c.valor ?? 0),
    investimento: c.investimento === null || c.investimento === undefined ? null : Number(c.investimento),
    classificacaoPorPreco: (c.classificacaoPorPreco as ClassificacaoPreco) ?? null,
});

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

  &::placeholder {
    color: var(--pl-muted);
  }
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

  &:hover {
    background: var(--pl-blue-dark);
    border-color: var(--pl-blue-dark);
  }

  &:active { transform: translateY(1px); }
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

const ClassifFilter = styled.select`
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
  min-width: 1440px;
  table-layout: fixed;
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
  overflow: hidden;

  &:first-child { width: 260px; }
  &:nth-child(2) { width: 170px; }
  &:nth-child(3) { width: 150px; }
  &:nth-child(4) { width: 150px; }
  &:nth-child(5) { width: 150px; }
  &:nth-child(6) { width: auto; min-width: 280px; }
  &:last-child { width: 110px; min-width: 110px; }
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
  hyphens: auto;
`;

const TdActions = styled.td`
  padding: 0.9rem 1rem;
  text-align: right;
  vertical-align: middle;
  border-bottom: 1px solid #f1eef9;
  white-space: nowrap;
`;

const ProductCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const ProductName = styled.div`
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
`;

const ProductNichoSmall = styled.span`
  font-size: 0.78rem;
  color: var(--pl-muted);
  font-family: 'Inter', sans-serif;
`;

const NichoTag = styled.span`
  display: inline-block;
  background: #eee9ff;
  color: var(--pl-blue);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const NichoMuted = styled.span`
  color: var(--pl-muted);
  font-size: 0.82rem;
  font-style: italic;
`;

const ValorCell = styled.span`
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
`;

const InvestimentoCell = styled.span`
  font-size: 0.88rem;
  font-weight: 600;
  color: #5b5885;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
`;

const InvestimentoVazio = styled.span`
  color: var(--pl-muted);
  font-size: 0.8rem;
  font-style: italic;
`;

const ClassifChip = styled.span<{ $tone: 'baixo' | 'medio' | 'alto' | 'vazio' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.28rem 0.75rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  letter-spacing: 0.02em;
  line-height: 1.2;

  background: ${({ $tone }) =>
    $tone === 'baixo' ? '#e4f7ef' :
    $tone === 'medio' ? '#fff3d8' :
    $tone === 'alto' ? '#ffe4e7' :
    '#f2effb'};

  color: ${({ $tone }) =>
    $tone === 'baixo' ? '#127f56' :
    $tone === 'medio' ? '#a47310' :
    $tone === 'alto' ? '#b13850' :
    '#7a75a3'};
`;

const ClassifVazia = styled.span`
  color: var(--pl-muted);
  font-size: 0.8rem;
  font-style: italic;
`;

const DescricaoCell = styled.div`
  font-size: 0.82rem;
  line-height: 1.45;
  color: #5b5885;
  font-family: 'Inter', sans-serif;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DescricaoVazia = styled.span`
  color: var(--pl-muted);
  font-size: 0.8rem;
  font-style: italic;
`;

const ActionsGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const IconButton = styled.button<{ $tone: 'edit' | 'delete' }>`
  width: 34px;
  height: 34px;
  border-radius: 0.65rem;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: ${({ $tone }) => ($tone === 'edit' ? '#eef1ff' : '#ffe9ec')};
  color: ${({ $tone }) => ($tone === 'edit' ? '#4b57d8' : '#d84b60')};
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;

  &:hover {
    background: ${({ $tone }) => ($tone === 'edit' ? '#e2e7ff' : '#ffd5da')};
    transform: translateY(-1px);
  }
`;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ProdutosPage: React.FC = () =>
{
    const { token, logout } = useAuth();

    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [carregando, setCarregando] = useState<boolean>(true);

    const [mostrarForm, setMostrarForm] = useState<boolean>(false);
    const [editando, setEditando] = useState<Produto | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [paraExcluir, setParaExcluir] = useState<Produto | null>(null);
    const [excluindo, setExcluindo] = useState<boolean>(false);

    const [busca, setBusca] = useState<string>('');
    const [classifFiltro, setClassifFiltro] = useState<'Todos' | 'baixo' | 'medio' | 'alto'>('Todos');

    const [toast, setToast] = useState<{ variant: ToastVariant; message: string; visible: boolean }>({
        variant: 'success', message: '', visible: false,
    });

    const exibirToast = useCallback((variant: ToastVariant, message: string) =>
    {
        setToast({ variant, message, visible: true });
    }, []);

    const headersAutenticados = useCallback((): Record<string, string> => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token ?? ''}`,
    }), [token]);

    const tratarRespostaErro = useCallback(async (res: Response, fallback: string): Promise<string> =>
    {
        let msg = fallback;
        let sessaoInvalida = false;
        try
        {
            const d = await res.json();
            msg = mensagemErroApi(d, fallback);
            if (d && typeof d === 'object' && d.sessaoInvalida === true) sessaoInvalida = true;
        }
        catch
        {
            /* ignore */
        }
        if (res.status === 401 || sessaoInvalida)
        {
            logout();
        }
        return msg;
    }, [logout]);

    // ============================================
    // CARREGAR LISTA
    // ============================================
    const carregarProdutos = useCallback(async () =>
    {
        setCarregando(true);
        try
        {
            const res = await fetch(`${API_URL}/produtos`, {
                method: 'GET',
                headers: headersAutenticados(),
            });

            if (!res.ok)
            {
                const msg = await tratarRespostaErro(res, 'Erro ao carregar produtos');
                exibirToast('error', msg);
                setProdutos([]);
                return;
            }

            const data = await res.json();
            if (Array.isArray(data)) setProdutos(data.map((x) => normalizarProduto(x)));
            else setProdutos([]);
        }
        catch (err)
        {
            console.error(err);
            setProdutos([]);
            exibirToast('error', 'NetworkError ao tentar carregar produtos. Verifique o backend.');
        }
        finally
        {
            setCarregando(false);
        }
    }, [headersAutenticados, exibirToast, tratarRespostaErro]);

    useEffect(() =>
    {
        carregarProdutos();
    }, [carregarProdutos]);

    // ============================================
    // FILTRO (BUSCA)
    // ============================================
    const filtrados = useMemo(() =>
    {
        const b = busca.trim().toLowerCase();
        return produtos.filter((p) =>
        {
            const matchClassif = classifFiltro === 'Todos'
                ? true
                : (p.classificacaoPorPreco ?? '').toString().toLowerCase() === classifFiltro;
            if (!matchClassif) return false;

            if (!b) return true;

            const nome = (p.nome ?? '').toLowerCase();
            const nicho = (p.nicho ?? '').toLowerCase();
            const desc = (p.descricao ?? '').toLowerCase();
            const valorStr = formatMoneyBR(p.valor).toLowerCase();
            const investStr = p.investimento !== null && p.investimento !== undefined
                ? formatMoneyBR(p.investimento).toLowerCase()
                : '';
            const classifStr = rotuloClassificacaoPreco(p.classificacaoPorPreco).toLowerCase();
            return (
                nome.includes(b) ||
                nicho.includes(b) ||
                desc.includes(b) ||
                valorStr.includes(b) ||
                investStr.includes(b) ||
                classifStr.includes(b)
            );
        });
    }, [busca, produtos, classifFiltro]);

    // ============================================
    // AÇÃO EXPORTAR CSV (via backend)
    // ============================================
    const [exportandoCSV, setExportandoCSV] = useState(false);
    const exportarCSV = useCallback(async () =>
    {
        try
        {
            setExportandoCSV(true);
            await exportarCSVProdutos({
                ids: filtrados
                    .map((p) => (typeof p.id === 'number' ? p.id : Number(p.id)))
                    .filter((n): n is number => Number.isFinite(n) && n > 0),
            });
            exibirToast('success', 'CSV de produtos gerado com sucesso.');
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
    }, [exportarCSVProdutos, exibirToast, logout, filtrados]);

    // ============================================
    // AÇÕES CRUD
    // ============================================

    const handleSubmit = useCallback(async (payload: Record<string, unknown>) =>
    {
        if (!token) return;
        setSubmitting(true);
        try
        {
            const url = editando
                ? `${API_URL}/produtos/${editando.id}`
                : `${API_URL}/produtos`;

            const res = await fetch(url, {
                method: editando ? 'PUT' : 'POST',
                headers: headersAutenticados(),
                body: JSON.stringify(payload),
            });

            let data: any = null;
            try { data = await res.json(); } catch { /* ignore */ }

            if (!res.ok)
            {
                const fallback = editando ? 'Erro ao atualizar produto' : 'Erro ao cadastrar produto';
                const msg = data ? mensagemErroApi(data, fallback) : fallback;
                if (res.status === 401 || (data && typeof data === 'object' && data.sessaoInvalida === true))
                {
                    logout();
                }
                exibirToast('error', msg);
                return;
            }

            exibirToast(
                'success',
                editando
                    ? `Produto ${payload.nome} atualizado com sucesso.`
                    : `Produto ${payload.nome} cadastrado com sucesso.`
            );

            await carregarProdutos();
            setEditando(null);
            setMostrarForm(false);
        }
        catch (err)
        {
            console.error(err);
            exibirToast('error', 'NetworkError ao tentar salvar produto. Verifique o backend.');
        }
        finally
        {
            setSubmitting(false);
        }
    }, [token, editando, headersAutenticados, exibirToast, carregarProdutos, logout]);

    const iniciarEdicao = useCallback((p: Produto) =>
    {
        setEditando(p);
        setMostrarForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const alternarForm = useCallback(() =>
    {
        if (mostrarForm)
        {
            setEditando(null);
            setMostrarForm(false);
        }
        else
        {
            setEditando(null);
            setMostrarForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [mostrarForm]);

    const confirmarExcluir = useCallback(async () =>
    {
        if (!paraExcluir || !token) return;
        setExcluindo(true);
        try
        {
            const res = await fetch(`${API_URL}/produtos/${paraExcluir.id}`, {
                method: 'DELETE',
                headers: headersAutenticados(),
            });

            let data: any = null;
            try { data = await res.json(); } catch { /* ignore */ }

            if (!res.ok)
            {
                const msg = mensagemErroApi(data, 'Erro ao excluir produto');
                if (res.status === 401 || (data && typeof data === 'object' && data.sessaoInvalida === true))
                {
                    logout();
                }
                exibirToast('error', msg);
                return;
            }

            exibirToast('success', `Produto ${paraExcluir.nome} excluído.`);
            await carregarProdutos();
            setParaExcluir(null);
        }
        catch (err)
        {
            console.error(err);
            exibirToast('error', 'NetworkError ao tentar excluir produto. Verifique o backend.');
        }
        finally
        {
            setExcluindo(false);
        }
    }, [paraExcluir, token, headersAutenticados, exibirToast, carregarProdutos, logout]);

    // ============================================
    // RENDER
    // ============================================
    return (
        <>
            <PageHeader
                eyebrow="Cadastros"
                title="Produtos"
                subtitle="Cadastre e administre seu catálogo de produtos e serviços."
                actions={
                    <ToolbarRow>
                        <SearchWrap htmlFor="search-produto">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <SearchInput
                                id="search-produto"
                                placeholder="Buscar nome, nicho, valor unitário, investimento, classificação..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
                        </SearchWrap>
                        <ClassifFilter
                            value={classifFiltro}
                            onChange={(e) => setClassifFiltro(e.target.value as 'Todos' | 'baixo' | 'medio' | 'alto')}
                        >
                            <option value="Todos">Classificação: Todos</option>
                            <option value="baixo">Baixo</option>
                            <option value="medio">Médio</option>
                            <option value="alto">Alto</option>
                        </ClassifFilter>
                        <ExportCSVButton
                            type="button"
                            onClick={exportarCSV}
                            disabled={exportandoCSV || carregando || produtos.length === 0}
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
                            {mostrarForm ? 'Fechar formulário' : 'Novo produto'}
                        </PrimaryButton>
                    </ToolbarRow>
                }
            />

            {mostrarForm && (
                <FormCard
                    title={editando ? `Editar produto — ${editando.nome}` : 'Cadastrar novo produto'}
                >
                    <ProdutoForm
                        initialValue={editando}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        onCancel={() => { setEditando(null); setMostrarForm(false); }}
                    />
                </FormCard>
            )}

            <ConfigCard
                title="Lista de produtos"
                headerRight={<BadgeCount>Total produtos: {filtrados.length}</BadgeCount>}
                style={{ marginTop: '1.5rem' }}
            >
                {carregando ? (
                    <SpinnerRow>Carregando produtos...</SpinnerRow>
                ) : filtrados.length === 0 ? (
                    <EmptyState
                        title={
                            busca.trim()
                                ? 'Nenhum produto encontrado para sua busca.'
                                : 'Nenhum produto cadastrado ainda.'
                        }
                        description={
                            busca.trim()
                                ? 'Tente termos diferentes ou limpe a busca.'
                                : 'Clique em "Novo produto" para cadastrar o primeiro item do catálogo.'
                        }
                    />
                ) : (
                    <ListTable>
                        <StyledTable>
                            <Thead>
                                <tr>
                                    <Th>Produto</Th>
                                    <Th>Nicho</Th>
                                    <Th>Vlr. unitário</Th>
                                    <Th>Investimento</Th>
                                    <Th>Classificação</Th>
                                    <Th>Descrição</Th>
                                    <Th style={{ textAlign: 'right' }}>Ações</Th>
                                </tr>
                            </Thead>
                            <tbody>
                                {filtrados.map((produto) => (
                                    <tr key={produto.id}>
                                        <Td>
                                            <ProductCell>
                                                <ProductName>{produto.nome}</ProductName>
                                                {produto.nicho ? (
                                                    <ProductNichoSmall>{produto.nicho}</ProductNichoSmall>
                                                ) : null}
                                            </ProductCell>
                                        </Td>
                                        <Td>
                                            {produto.nicho ? (
                                                <NichoTag>{produto.nicho}</NichoTag>
                                            ) : (<NichoMuted>sem nicho</NichoMuted>)}
                                        </Td>
                                        <Td>
                                            <ValorCell>{formatMoneyBR(produto.valor)}</ValorCell>
                                        </Td>
                                        <Td>
                                            {produto.investimento !== null && produto.investimento !== undefined
                                                ? (<InvestimentoCell>{formatMoneyBR(produto.investimento)}</InvestimentoCell>)
                                                : (<InvestimentoVazio>não informado</InvestimentoVazio>)}
                                        </Td>
                                        <Td>
                                            {produto.classificacaoPorPreco === 'baixo' || produto.classificacaoPorPreco === 'medio' || produto.classificacaoPorPreco === 'alto'
                                                ? (
                                                    <ClassifChip $tone={produto.classificacaoPorPreco}>
                                                        {rotuloClassificacaoPreco(produto.classificacaoPorPreco)}
                                                    </ClassifChip>
                                                )
                                                : (<ClassifVazia>não classificado</ClassifVazia>)}
                                        </Td>
                                        <Td>
                                            {produto.descricao ? (
                                                <DescricaoCell>{produto.descricao}</DescricaoCell>
                                            ) : (<DescricaoVazia>sem descrição</DescricaoVazia>)}
                                        </Td>
                                        <TdActions>
                                            <ActionsGroup>
                                                <IconButton
                                                    $tone="edit"
                                                    title={`Editar ${produto.nome}`}
                                                    aria-label={`Editar ${produto.nome}`}
                                                    onClick={() => iniciarEdicao(produto)}>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </IconButton>
                                                <IconButton
                                                    $tone="delete"
                                                    title={`Excluir ${produto.nome}`}
                                                    aria-label={`Excluir ${produto.nome}`}
                                                    onClick={() => setParaExcluir(produto)}>
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
                title={excluindo ? 'Excluindo...' : paraExcluir ? `Excluir "${paraExcluir.nome}"?` : 'Excluir produto'}
                message={paraExcluir
                    ? `Tem certeza que deseja remover "${paraExcluir.nome}" do seu catálogo? Essa ação não pode ser desfeita.`
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

export default ProdutosPage;