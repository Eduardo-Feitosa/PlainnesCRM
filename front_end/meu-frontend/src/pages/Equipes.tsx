import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfigCard } from '../components/layout/ConfigCard';
import { EquipeForm } from '../components/equipes/EquipeForm';
import { EquipeDetalhe } from '../components/equipes/EquipeDetalhe';
import { ToastMessage, type ToastVariant } from '../components/feedback/ToastMessage';
import { listarEquipes, criarEquipe, atualizarEquipe, deletarEquipe } from '../services/equipes';
import type { Equipe, EquipeFormValues } from '../types/equipe';

// ============================================
// STYLED COMPONENTS
// ============================================

const PrimaryButton = styled.button`
  min-width: 170px;
  height: 44px;
  padding: 0 1.1rem;
  background-color: var(--pl-blue);
  color: #fff;
  border: 1px solid var(--pl-blue);
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

  &:hover:not(:disabled) { background-color: var(--pl-blue-dark); border-color: var(--pl-blue-dark); }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
`;

const FormCard = styled(ConfigCard)`
  margin-bottom: 1.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.1rem;
`;

const Card = styled.button`
  all: unset;
  cursor: pointer;
  box-sizing: border-box;
  text-align: left;
  background: #fff;
  border: 1px solid var(--pl-line);
  border-radius: 1rem;
  padding: 1.25rem;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 18px 45px -30px rgba(27, 26, 74, 0.55);
    transform: translateY(-2px);
    border-color: #c6c3da;
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
`;

const CardTitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
`;

const IconCircle = styled.span`
  width: 38px;
  height: 38px;
  border-radius: 0.7rem;
  background: var(--pl-blue-soft);
  color: var(--pl-blue);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const CardNome = styled.div`
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardSetor = styled.span`
  display: inline-block;
  margin-top: 0.2rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--pl-blue-soft);
  color: var(--pl-blue);
  font-family: 'Inter', sans-serif;
`;

const CriadorTag = styled.span`
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
`;

const CardDescricao = styled.p`
  margin: 0.85rem 0 0;
  font-size: 0.82rem;
  color: var(--pl-muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid #f1eef9;
`;

const MembrosCount = styled.span`
  font-size: 0.78rem;
  color: var(--pl-muted);
  font-family: 'Inter', sans-serif;
`;

const AcoesRow = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const IconButton = styled.span<{ $tone?: 'edit' | 'delete' }>`
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: all 0.15s ease;
  color: ${({ $tone }) => ($tone === 'delete' ? '#B02A3C' : 'var(--pl-navy-soft)')};
  background: ${({ $tone }) => ($tone === 'delete' ? 'rgba(221,56,74,0.08)' : 'rgba(105,100,160,0.09)')};

  &:hover {
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
  font-family: Arial, sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
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

const EquipesPage: React.FC = () =>
{
    const [equipes, setEquipes] = useState<Equipe[]>([]);
    const [carregando, setCarregando] = useState(true);

    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState<Equipe | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [paraExcluir, setParaExcluir] = useState<Equipe | null>(null);
    const [excluindo, setExcluindo] = useState(false);

    const [equipeSelecionadaId, setEquipeSelecionadaId] = useState<number | null>(null);

    const [toast, setToast] = useState<{ variant: ToastVariant; message: string; visible: boolean }>({
        variant: 'success', message: '', visible: false,
    });
    const exibirToast = useCallback((variant: ToastVariant, message: string) =>
    {
        setToast({ variant, message, visible: true });
    }, []);

    const carregarEquipes = useCallback(async () =>
    {
        setCarregando(true);
        try
        {
            const dados = await listarEquipes();
            setEquipes(dados);
        }
        catch (err: any)
        {
            exibirToast('error', mensagemErroApi(err, 'Erro ao carregar equipes.'));
            setEquipes([]);
        }
        finally
        {
            setCarregando(false);
        }
    }, [exibirToast]);

    useEffect(() => { carregarEquipes(); }, [carregarEquipes]);

    const handleSubmit = useCallback(async (payload: EquipeFormValues) =>
    {
        setSubmitting(true);
        try
        {
            if (editando)
            {
                await atualizarEquipe(editando.id, payload);
                exibirToast('success', `Equipe ${payload.nome} atualizada com sucesso.`);
            }
            else
            {
                await criarEquipe(payload);
                exibirToast('success', `Equipe ${payload.nome} criada com sucesso.`);
            }
            await carregarEquipes();
            setEditando(null);
            setMostrarForm(false);
        }
        catch (err: any)
        {
            exibirToast('error', mensagemErroApi(err, editando ? 'Erro ao atualizar equipe.' : 'Erro ao criar equipe.'));
        }
        finally
        {
            setSubmitting(false);
        }
    }, [editando, exibirToast, carregarEquipes]);

    const iniciarEdicao = useCallback((e: Equipe, ev: React.MouseEvent) =>
    {
        ev.stopPropagation();
        setEditando(e);
        setMostrarForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const alternarForm = useCallback(() =>
    {
        setEditando(null);
        setMostrarForm((v) => !v);
    }, []);

    const confirmarExcluir = useCallback(async () =>
    {
        if (!paraExcluir) return;
        setExcluindo(true);
        try
        {
            await deletarEquipe(paraExcluir.id);
            exibirToast('success', `Equipe ${paraExcluir.nome} excluída.`);
            setParaExcluir(null);
            await carregarEquipes();
        }
        catch (err: any)
        {
            exibirToast('error', mensagemErroApi(err, 'Erro ao excluir equipe.'));
        }
        finally
        {
            setExcluindo(false);
        }
    }, [paraExcluir, exibirToast, carregarEquipes]);

    if (equipeSelecionadaId !== null)
    {
        return (
            <EquipeDetalhe
                equipeId={equipeSelecionadaId}
                onVoltar={() => setEquipeSelecionadaId(null)}
                onEquipeAlterada={carregarEquipes}
            />
        );
    }

    return (
        <>
            <PageHeader
                eyebrow="Colaboradores"
                title="Equipes"
                subtitle="Crie equipes e convide colaboradores para colaborar com você."
                actions={
                    <PrimaryButton onClick={alternarForm}>
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
                                Nova equipe
                            </>
                        )}
                    </PrimaryButton>
                }
            />

            {mostrarForm && (
                <FormCard title={editando ? `Editar equipe — ${editando.nome}` : 'Criar nova equipe'}>
                    <EquipeForm
                        initialValue={editando}
                        onSubmit={handleSubmit}
                        onCancel={alternarForm}
                        submitting={submitting}
                    />
                </FormCard>
            )}

            <ConfigCard
                title="Minhas equipes"
                headerRight={
                    <>
                        <CountBadge>Total: {equipes.length}</CountBadge>
                        {carregando ? <span style={{ color: 'var(--pl-muted)', fontSize: '0.85rem' }}>carregando...</span> : null}
                    </>
                }
            >
                {equipes.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        }
                        title={carregando ? 'Carregando equipes...' : 'Nenhuma equipe ainda'}
                        description={carregando
                            ? 'Aguarde enquanto sincronizamos os dados.'
                            : 'Crie sua primeira equipe para começar a colaborar com outras pessoas.'}
                    />
                ) : (
                    <Grid>
                        {equipes.map((e) => (
                            <Card key={e.id} type="button" onClick={() => setEquipeSelecionadaId(e.id)}>
                                <CardTop>
                                    <CardTitleWrap>
                                        <IconCircle>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                        </IconCircle>
                                        <div style={{ minWidth: 0 }}>
                                            <CardNome>{e.nome}</CardNome>
                                            {e.setor && <CardSetor>{e.setor}</CardSetor>}
                                        </div>
                                    </CardTitleWrap>
                                    {e.souCriador && <CriadorTag>Criador</CriadorTag>}
                                </CardTop>

                                {e.descricao && <CardDescricao>{e.descricao}</CardDescricao>}

                                <CardFooter>
                                    <MembrosCount>{e.totalMembros ?? 0} membro{(e.totalMembros ?? 0) !== 1 ? 's' : ''}</MembrosCount>
                                    {e.souCriador && (
                                        <AcoesRow>
                                            <IconButton
                                                title={`Editar ${e.nome}`}
                                                aria-label={`Editar ${e.nome}`}
                                                onClick={(ev) => iniciarEdicao(e, ev)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </IconButton>
                                            <IconButton
                                                $tone="delete"
                                                title={`Excluir ${e.nome}`}
                                                aria-label={`Excluir ${e.nome}`}
                                                onClick={(ev) => { ev.stopPropagation(); setParaExcluir(e); }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                                                </svg>
                                            </IconButton>
                                        </AcoesRow>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </Grid>
                )}
            </ConfigCard>

            <ConfirmDialog
                show={Boolean(paraExcluir)}
                title={excluindo ? 'Excluindo...' : 'Excluir equipe'}
                message={paraExcluir
                    ? `Tem certeza que deseja excluir a equipe ${paraExcluir.nome}? Todos os membros perderão acesso a ela. Esta ação não pode ser desfeita.`
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

export default EquipesPage;
