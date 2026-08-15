import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusChip, toneForStatus } from '../components/ui/StatusChip';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfigCard } from '../components/layout/ConfigCard';
import { ClienteForm } from '../components/clientes/ClienteForm';
import { ToastMessage, type ToastVariant } from '../components/feedback/ToastMessage';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { formatDateBR, initials } from '../utils/masks';
import { exportarCSVClientes } from '../services/clientes';
import type { Cliente, ClienteStatus } from '../types/cliente';

// ============================================
// STYLED COMPONENTS
// ============================================

const PrimaryButton = styled.button<{ $variant?: 'primary' | 'ghost' }>`
  min-width: 170px;
  height: 44px;
  padding: 0 1.1rem;
  background-color: ${({ $variant }) =>
    $variant === 'ghost' ? 'transparent' : 'var(--pl-blue)'};
  color: ${({ $variant }) => ($variant === 'ghost' ? 'var(--pl-navy)' : '#fff')};
  border: 1px solid ${({ $variant }) =>
    $variant === 'ghost' ? '#c6c3da' : 'var(--pl-blue)'};
  border-radius: 0.75rem;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background-color: ${({ $variant }) =>
      $variant === 'ghost' ? 'var(--pl-blue-soft)' : 'var(--pl-blue-dark)'};
    border-color: ${({ $variant }) =>
      $variant === 'ghost' ? 'var(--pl-blue)' : 'var(--pl-blue-dark)'};
    color: ${({ $variant }) => ($variant === 'ghost' ? 'var(--pl-blue)' : '#fff')};
  }

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

const SearchBar = styled.div`
  position: relative;
  width: 100%;
  max-width: 360px;
  min-width: 220px;

  & > svg {
    position: absolute;
    top: 50%;
    left: 16px;
    transform: translateY(-50%);
    color: var(--pl-muted);
    pointer-events: none;
  }

  & > input {
    width: 100%;
    height: 42px;
    padding-left: 44px;
    padding-right: 18px;
    background-color: #f7f7fc;
    border: 1px solid transparent;
    border-radius: 0.7rem;
    font-size: 0.88rem;
    font-family: 'Inter', sans-serif;
    color: var(--pl-navy);
    outline: none;
    transition: all 0.15s ease;

    &::placeholder { color: var(--pl-muted); }

    &:focus {
      background-color: #fff;
      border-color: var(--pl-blue);
      box-shadow: 0 0 0 0.2rem rgba(59, 46, 232, 0.12);
    }
  }
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

const ListTable = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1280px;
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

  &:first-child { width: 210px; } /* Cliente */
  &:nth-child(2) { width: 210px; } /* Contato */
  &:nth-child(3) { width: 150px; } /* Instagram */
  &:nth-child(4) { width: 110px; } /* Estado */
  &:nth-child(5) { width: 130px; } /* Nascimento */
  &:nth-child(6) { width: 110px; } /* Cadastro */
  &:nth-child(7) { width: 130px; } /* Status */
  &:nth-child(8) { width: auto; min-width: 240px; } /* Descrição */
  &:last-child { width: 110px; min-width: 110px; } /* Ações */
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

const ClientCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 220px;
`;

const Avatar = styled.span`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: var(--pl-canvas);
  color: var(--pl-blue);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.02em;
  flex-shrink: 0;
`;

const ClientName = styled.div`
  font-weight: 600;
  color: var(--pl-navy);
  font-size: 0.92rem;
`;

const ClientHandle = styled.div`
  font-size: 0.75rem;
  color: var(--pl-muted);
  margin-top: 0.1rem;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #4d4a75;
`;

const ActionsGroup = styled.div`
  display: inline-flex;
  gap: 0.45rem;
`;

const IconButton = styled.button<{ $tone?: 'edit' | 'delete' }>`
  all: unset;
  cursor: pointer;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.55rem;
  transition: all 0.15s ease;
  color: ${({ $tone }) => ($tone === 'delete' ? '#B02A3C' : 'var(--pl-navy-soft)')};
  background: ${({ $tone }) =>
    $tone === 'delete' ? 'rgba(221,56,74,0.08)' : 'rgba(105,100,160,0.09)'};

  &:hover {
    transform: translateY(-1px);
    color: #fff;
    background: ${({ $tone }) => ($tone === 'delete' ? 'var(--pl-coral-dark)' : 'var(--pl-blue)')};
  }
`;

const CountBadge = styled.span`
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

const FormCard = styled(ConfigCard)`
  margin-bottom: 1.5rem;
  @media (max-width: 767.98px) { margin-bottom: 1.25rem; }
`;

const MutedText = styled.span`
  color: var(--pl-muted);
  font-size: 0.85rem;
`;

const NascLabel = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
`;

const NascIdade = styled.span`
  font-size: 0.72rem;
  color: var(--pl-muted);
  font-weight: 500;
`;

const InstagramCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #3e3c65;
  font-size: 0.84rem;
  font-weight: 500;

  & > svg { color: var(--pl-muted); }
`;

const InstagramMuted = styled.span`
  color: var(--pl-muted);
  font-style: italic;
  font-size: 0.82rem;
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

// ============================================
// HELPERS
// ============================================

type StatusFiltro = 'Todos' | 'Ativo' | 'Inativo' | 'Bloqueado';

const normalizarCliente = (raw: any): Cliente =>
{
    const status: ClienteStatus = (raw.statusCliente ?? raw.status ?? 'Ativo') as ClienteStatus;
    return {
        id: Number(raw.id),
        usuarioId: raw.usuarioId !== undefined ? Number(raw.usuarioId) : undefined,
        nome: raw.nome ?? '',
        telefone: raw.telefone ?? '',
        email: raw.email ?? '',
        instagram: raw.instagram ?? null,
        sexo: raw.sexo ?? null,
        estado: raw.estado ?? null,
        dataNascimento: raw.dataNascimento ?? null,
        descricao: raw.descricao ?? null,
        status,
        statusCliente: status,
        dataCadastramento: raw.dataCadastramento ?? null,
    };
};

const calcularIdade = (dataNascStr: string | null | undefined): number | null =>
{
    if (!dataNascStr) return null;
    const d = new Date(dataNascStr);
    if (Number.isNaN(d.getTime())) return null;
    const hj = new Date();
    let idade = hj.getFullYear() - d.getFullYear();
    const m = hj.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && hj.getDate() < d.getDate())) idade--;
    return idade;
};

const mensagemErroApi = (data: any, fallback: string): string =>
{
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (typeof data.erro === 'string') return data.erro;
    if (typeof data.mensagem === 'string') return data.mensagem;
    if (typeof data.message === 'string') return data.message;
    return fallback;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ClientesPage: React.FC = () =>
{
    const { token, logout } = useAuth();

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [carregando, setCarregando] = useState<boolean>(true);

    const [mostrarForm, setMostrarForm] = useState<boolean>(false);
    const [editando, setEditando] = useState<Cliente | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const [paraExcluir, setParaExcluir] = useState<Cliente | null>(null);
    const [excluindo, setExcluindo] = useState<boolean>(false);

    const [busca, setBusca] = useState<string>('');
    const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('Todos');

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
    const carregarClientes = useCallback(async () =>
    {
        setCarregando(true);
        try
        {
            const res = await fetch(`${API_URL}/clientes`, {
                method: 'GET',
                headers: headersAutenticados(),
            });

            if (!res.ok)
            {
                const msg = await tratarRespostaErro(res, 'Erro ao carregar clientes');
                exibirToast('error', msg);
                setClientes([]);
                return;
            }

            const data = await res.json();
            if (Array.isArray(data)) setClientes(data.map((x) => normalizarCliente(x)));
            else setClientes([]);
        }
        catch (err)
        {
            console.error(err);
            setClientes([]);
            exibirToast('error', 'NetworkError ao tentar carregar clientes. Verifique o backend.');
        }
        finally
        {
            setCarregando(false);
        }
    }, [headersAutenticados, exibirToast, tratarRespostaErro]);

    useEffect(() =>
    {
        carregarClientes();
    }, [carregarClientes]);

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
                ? `${API_URL}/clientes/${editando.id}`
                : `${API_URL}/clientes`;

            const res = await fetch(url, {
                method: editando ? 'PUT' : 'POST',
                headers: headersAutenticados(),
                body: JSON.stringify(payload),
            });

            let data: any = null;
            try { data = await res.json(); } catch { /* ignore */ }

            if (!res.ok)
            {
                const fallback = editando ? 'Erro ao atualizar cliente' : 'Erro ao cadastrar cliente';
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
                    ? `Cliente ${payload.nome} atualizado com sucesso.`
                    : `Cliente ${payload.nome} cadastrado com sucesso.`
            );

            await carregarClientes();
            setEditando(null);
            setMostrarForm(false);
        }
        catch (err)
        {
            console.error(err);
            exibirToast('error', 'NetworkError ao tentar salvar cliente. Verifique o backend.');
        }
        finally
        {
            setSubmitting(false);
        }
    }, [token, editando, headersAutenticados, exibirToast, carregarClientes, logout]);

    const iniciarEdicao = useCallback((c: Cliente) =>
    {
        setEditando(c);
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
            const res = await fetch(`${API_URL}/clientes/${paraExcluir.id}`, {
                method: 'DELETE',
                headers: headersAutenticados(),
            });

            let data: any = null;
            try { data = await res.json(); } catch { /* ignore */ }

            if (!res.ok)
            {
                const msg = mensagemErroApi(data, 'Erro ao excluir cliente');
                if (res.status === 401 || (data && typeof data === 'object' && data.sessaoInvalida === true))
                {
                    logout();
                }
                exibirToast('error', msg);
                return;
            }

            exibirToast('success', `Cliente ${paraExcluir.nome} excluído.`);
            await carregarClientes();
            setParaExcluir(null);
        }
        catch (err)
        {
            console.error(err);
            exibirToast('error', 'NetworkError ao tentar excluir cliente. Verifique o backend.');
        }
        finally
        {
            setExcluindo(false);
        }
    }, [paraExcluir, token, headersAutenticados, exibirToast, carregarClientes, logout]);

    // ============================================
    // FILTROS
    // ============================================
    const filtrados = useMemo<Cliente[]>(() =>
    {
        const termo = busca.trim().toLowerCase();
        return clientes.filter((c) =>
        {
            const matchStatus = statusFiltro === 'Todos' ? true : c.status === statusFiltro;
            if (!matchStatus) return false;

            if (!termo) return true;
            const haystack = [
                c.nome, c.email, c.telefone, c.estado,
                c.instagram ?? '', c.sexo ?? '', c.descricao ?? '',
            ].join(' ').toLowerCase();
            return haystack.includes(termo);
        });
    }, [clientes, busca, statusFiltro]);

    const totalClientes = clientes.length;

    // ============================================
    // AÇÃO EXPORTAR CSV (via backend)
    // ============================================
    const [exportandoCSV, setExportandoCSV] = useState(false);
    const exportarCSV = useCallback(async () =>
    {
        try
        {
            setExportandoCSV(true);
            await exportarCSVClientes({
                ids: filtrados
                    .map((c) => (typeof c.id === 'number' ? c.id : Number(c.id)))
                    .filter((n): n is number => Number.isFinite(n) && n > 0),
            });
            exibirToast('success', 'CSV de clientes gerado com sucesso.');
        }
        catch (err: any)
        {
            if (err?.sessaoInvalida || err?.erro?.toString().toLowerCase().includes('sessão inválida'))
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
    }, [exportarCSVClientes, exibirToast, logout, filtrados]);

    // ============================================
    // RENDER
    // ============================================
    return (
        <>
            <PageHeader
                eyebrow="Cadastros"
                title="Clientes"
                subtitle="Gerencie a carteira de clientes do seu negócio."
                actions={
                    <>
                        <SearchBar>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="7" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="search"
                                placeholder="Buscar nome, e-mail, telefone, estado..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
                        </SearchBar>
                        <StatusFilter value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as StatusFiltro)}>
                            <option value="Todos">Status: Todos</option>
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                            <option value="Bloqueado">Bloqueado</option>
                        </StatusFilter>
                        <ExportCSVButton
                            type="button"
                            onClick={exportarCSV}
                            disabled={exportandoCSV || carregando || clientes.length === 0}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Exportar para csv
                        </ExportCSVButton>
                        <PrimaryButton onClick={alternarForm} $variant={mostrarForm ? 'ghost' : 'primary'}>
                            {mostrarForm ? (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    Fechar formulário
                                </>
                            ) : (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Novo cliente
                                </>
                            )}
                        </PrimaryButton>
                    </>
                } />

            {mostrarForm && (
                <FormCard
                    title={editando ? `Editar cliente — ${editando.nome}` : 'Cadastrar novo cliente'}
                >
                    <ClienteForm
                        initialValue={editando}
                        onSubmit={handleSubmit}
                        onCancel={alternarForm}
                        submitting={submitting}
                    />
                </FormCard>
            )}

            <ConfigCard
                title="Lista de clientes"
                headerRight={
                    <>
                        <CountBadge>Total clientes: {totalClientes}</CountBadge>
                        {carregando ? <MutedText>carregando...</MutedText> : null}
                    </>
                }
            >
                {filtrados.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        }
                        title={carregando ? 'Carregando clientes...' : 'Nenhum cliente encontrado'}
                        description={carregando
                            ? 'Aguarde enquanto sincronizamos os dados.'
                            : 'Ajuste a busca, mude o filtro de status ou cadastre um novo cliente.'}
                    />
                ) : (
                    <ListTable>
                        <StyledTable>
                            <Thead>
                                <tr>
                                    <Th>Cliente</Th>
                                    <Th>Contato</Th>
                                    <Th>Instagram</Th>
                                    <Th>Estado</Th>
                                    <Th>Nascimento</Th>
                                    <Th>Cadastro</Th>
                                    <Th>Status</Th>
                                    <Th>Descrição</Th>
                                    <Th style={{ textAlign: 'right' }}>Ações</Th>
                                </tr>
                            </Thead>
                            <tbody>
                                {filtrados.map((cliente) =>
                                {
                                    const idade = calcularIdade(cliente.dataNascimento);
                                    return (
                                        <tr key={cliente.id}>
                                            <Td>
                                                <ClientCell>
                                                    <Avatar>{initials(cliente.nome)}</Avatar>
                                                    <div>
                                                        <ClientName>{cliente.nome}</ClientName>
                                                        {cliente.sexo ? (
                                                            <ClientHandle>{cliente.sexo}</ClientHandle>
                                                        ) : null}
                                                    </div>
                                                </ClientCell>
                                            </Td>
                                            <Td>
                                                <ContactItem>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                        <polyline points="22,6 12,13 2,6" />
                                                    </svg>
                                                    {cliente.email}
                                                </ContactItem>
                                                <ContactItem>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
                                                    </svg>
                                                    {cliente.telefone}
                                                </ContactItem>
                                            </Td>
                                            <Td>
                                                {cliente.instagram ? (
                                                    <InstagramCell>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                                        </svg>
                                                        {cliente.instagram}
                                                    </InstagramCell>
                                                ) : (<InstagramMuted>sem perfil</InstagramMuted>)}
                                            </Td>
                                            <Td>{cliente.estado || '—'}</Td>
                                            <Td>
                                                <NascLabel>
                                                    <span>{formatDateBR(cliente.dataNascimento)}</span>
                                                    {idade !== null ? (
                                                        <NascIdade>{idade} anos</NascIdade>
                                                    ) : null}
                                                </NascLabel>
                                            </Td>
                                            <Td>{formatDateBR(cliente.dataCadastramento)}</Td>
                                            <Td>
                                                <StatusChip label={cliente.status} tone={toneForStatus(cliente.status)} dot />
                                            </Td>
                                            <Td>
                                                {cliente.descricao ? (
                                                    <DescricaoCell>{cliente.descricao}</DescricaoCell>
                                                ) : (<DescricaoVazia>sem observações</DescricaoVazia>)}
                                            </Td>
                                            <TdActions>
                                                <ActionsGroup>
                                                    <IconButton
                                                        $tone="edit"
                                                        title={`Editar ${cliente.nome}`}
                                                        aria-label={`Editar ${cliente.nome}`}
                                                        onClick={() => iniciarEdicao(cliente)}>
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </IconButton>
                                                    <IconButton
                                                        $tone="delete"
                                                        title={`Excluir ${cliente.nome}`}
                                                        aria-label={`Excluir ${cliente.nome}`}
                                                        onClick={() => setParaExcluir(cliente)}>
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
                                    );
                                })}
                            </tbody>
                        </StyledTable>
                    </ListTable>
                )}
            </ConfigCard>

            <ConfirmDialog
                show={Boolean(paraExcluir)}
                title={excluindo ? 'Excluindo...' : 'Excluir cliente'}
                message={paraExcluir
                    ? `Tem certeza que deseja excluir ${paraExcluir.nome}? Esta ação não pode ser desfeita.`
                    : ''}
                confirmLabel={excluindo ? 'Excluindo...' : 'Excluir'}
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

export default ClientesPage;
