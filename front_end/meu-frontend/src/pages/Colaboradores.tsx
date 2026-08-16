import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfigCard } from '../components/layout/ConfigCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ToastMessage, type ToastVariant } from '../components/feedback/ToastMessage';
import { listarColaboradores, removerColaborador } from '../services/colaboradores';
import { formatDateBR, initials } from '../utils/masks';
import type { ColaboradorAceito } from '../types/colaborador';

// ============================================
// STYLED COMPONENTS
// ============================================

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
    box-sizing: border-box;
    transition: all 0.15s ease;

    &::placeholder { color: var(--pl-muted); }

    &:focus {
      background-color: #fff;
      border-color: var(--pl-blue);
      box-shadow: 0 0 0 0.2rem rgba(59, 46, 232, 0.12);
    }
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
  font-family: Arial, sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid #f1eef9;

  &:last-child { border-bottom: none; }
`;

const Avatar = styled.span`
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: var(--pl-canvas);
  color: var(--pl-blue);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.88rem;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Nome = styled.div`
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
`;

const SubInfo = styled.div`
  font-size: 0.8rem;
  color: var(--pl-muted);
  margin-top: 0.1rem;
  font-family: 'Inter', sans-serif;
`;

const DataDesde = styled.span`
  font-size: 0.78rem;
  color: var(--pl-muted);
  white-space: nowrap;
  font-family: 'Inter', sans-serif;

  @media (max-width: 575.98px) { display: none; }
`;

const RemoverButton = styled.button`
  all: unset;
  cursor: pointer;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.55rem;
  color: #B02A3C;
  background: rgba(221,56,74,0.08);
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover { color: #fff; background: var(--pl-coral-dark); }
`;

// ============================================
// HELPERS
// ============================================

const mensagemErroApi = (data: any, fallback: string): string =>
{
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (typeof data.erro === 'string') return data.erro;
    if (typeof data.mensagem === 'string') return data.mensagem;
    return fallback;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ColaboradoresPage: React.FC = () =>
{
    const [colaboradores, setColaboradores] = useState<ColaboradorAceito[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [busca, setBusca] = useState('');

    const [paraRemover, setParaRemover] = useState<ColaboradorAceito | null>(null);
    const [removendo, setRemovendo] = useState(false);

    const [toast, setToast] = useState<{ variant: ToastVariant; message: string; visible: boolean }>({
        variant: 'success', message: '', visible: false,
    });
    const exibirToast = useCallback((variant: ToastVariant, message: string) =>
    {
        setToast({ variant, message, visible: true });
    }, []);

    const carregar = useCallback(async () =>
    {
        setCarregando(true);
        try
        {
            const dados = await listarColaboradores();
            setColaboradores(dados);
        }
        catch (err: any)
        {
            exibirToast('error', mensagemErroApi(err, 'Erro ao carregar colaboradores.'));
            setColaboradores([]);
        }
        finally
        {
            setCarregando(false);
        }
    }, [exibirToast]);

    useEffect(() => { carregar(); }, [carregar]);

    const confirmarRemover = useCallback(async () =>
    {
        if (!paraRemover) return;
        setRemovendo(true);
        try
        {
            await removerColaborador(paraRemover.id);
            exibirToast('success', `${paraRemover.nome} não é mais seu colaborador.`);
            setParaRemover(null);
            await carregar();
        }
        catch (err: any)
        {
            exibirToast('error', mensagemErroApi(err, 'Erro ao remover colaborador.'));
        }
        finally
        {
            setRemovendo(false);
        }
    }, [paraRemover, exibirToast, carregar]);

    const filtrados = colaboradores.filter((c) =>
    {
        const termo = busca.trim().toLowerCase();
        if (!termo) return true;
        const haystack = [c.nome, c.nomeUser ?? '', c.funcao ?? '', c.codigo ? String(c.codigo) : '']
            .join(' ').toLowerCase();
        return haystack.includes(termo);
    });

    return (
        <>
            <PageHeader
                eyebrow="Colaboradores"
                title="Colaboradores"
                subtitle="Pessoas com quem você tem uma colaboração aceita."
                actions={
                    <SearchBar>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="7" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="search"
                            placeholder="Buscar por nome, usuário ou código..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </SearchBar>
                }
            />

            <ConfigCard
                title="Meus colaboradores"
                headerRight={
                    <>
                        <CountBadge>Total: {colaboradores.length}</CountBadge>
                        {carregando ? <span style={{ color: 'var(--pl-muted)', fontSize: '0.85rem' }}>carregando...</span> : null}
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
                        title={carregando ? 'Carregando colaboradores...' : colaboradores.length === 0 ? 'Nenhum colaborador ainda' : 'Nenhum colaborador encontrado'}
                        description={carregando
                            ? 'Aguarde enquanto sincronizamos os dados.'
                            : colaboradores.length === 0
                                ? 'Envie uma solicitação de colaboração pela barra de busca do topo pra começar.'
                                : 'Ajuste a busca pra encontrar o colaborador.'}
                    />
                ) : (
                    <List>
                        {filtrados.map((c) => (
                            <Row key={c.id}>
                                <Avatar>{initials(c.nome)}</Avatar>
                                <Info>
                                    <Nome>{c.nome}</Nome>
                                    <SubInfo>
                                        {c.nomeUser ? `@${c.nomeUser}` : `Código ${c.codigo}`}
                                        {c.funcao ? ` · ${c.funcao}` : ''}
                                    </SubInfo>
                                </Info>
                                <DataDesde>Colaboradores desde {formatDateBR(c.dataColaboracao)}</DataDesde>
                                <RemoverButton
                                    type="button"
                                    title={`Remover ${c.nome}`}
                                    aria-label={`Remover ${c.nome}`}
                                    onClick={() => setParaRemover(c)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </RemoverButton>
                            </Row>
                        ))}
                    </List>
                )}
            </ConfigCard>

            <ConfirmDialog
                show={Boolean(paraRemover)}
                title={removendo ? 'Removendo...' : 'Remover colaborador'}
                message={paraRemover
                    ? `Tem certeza que deseja remover ${paraRemover.nome} da sua lista de colaboradores? Isso desfaz a relação para os dois lados.`
                    : ''}
                confirmLabel={removendo ? 'Removendo...' : 'Remover'}
                cancelLabel="Cancelar"
                onCancel={() => { if (!removendo) setParaRemover(null); }}
                onConfirm={confirmarRemover}
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

export default ColaboradoresPage;
