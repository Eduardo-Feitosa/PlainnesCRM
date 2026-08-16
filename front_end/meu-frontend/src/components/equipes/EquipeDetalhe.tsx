import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ConfigCard } from '../layout/ConfigCard';
import { EmptyState } from '../ui/EmptyState';
import { StatusChip } from '../ui/StatusChip';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ToastMessage, type ToastVariant } from '../feedback/ToastMessage';
import { ConvidarMembroBox } from './ConvidarMembroBox';
import { buscarEquipePorId, listarMembros, removerMembro, sairDaEquipe } from '../../services/equipes';
import { formatDateBR, initials } from '../../utils/masks';
import type { Equipe, MembroEquipe, StatusMembro } from '../../types/equipe';

// ============================================
// STYLED COMPONENTS
// ============================================

const VoltarButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  color: var(--pl-muted);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.25rem;
  font-family: 'Inter', sans-serif;
  transition: color 0.15s ease;

  &:hover { color: var(--pl-navy); }
`;

const HeaderCard = styled.div`
  background: #fff;
  border: 1px solid var(--pl-line);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 18px 45px -40px rgba(27, 26, 74, 0.55);
  margin-bottom: 1.25rem;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const TituloWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const Titulo = styled.h2`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
`;

const CriadorTag = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
  font-family: 'Inter', sans-serif;
`;

const Descricao = styled.p`
  margin: 0.5rem 0 0;
  color: var(--pl-muted);
  font-size: 0.9rem;
  line-height: 1.5;
  font-family: 'Inter', sans-serif;
`;

const SairButton = styled.button`
  height: 40px;
  padding: 0 1rem;
  border-radius: 0.7rem;
  border: 1px solid var(--pl-coral-dark);
  background: transparent;
  color: var(--pl-coral-dark);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover:not(:disabled) { background: var(--pl-coral-dark); color: #fff; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.25rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--pl-line);
`;

const MetaLabel = styled.div`
  font-size: 0.7rem;
  color: var(--pl-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: 'Inter', sans-serif;
`;

const MetaValue = styled.div`
  font-size: 0.9rem;
  color: var(--pl-navy);
  font-weight: 600;
  margin-top: 0.15rem;
  font-family: 'Inter', sans-serif;
`;

const MembroRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid #f1eef9;

  &:last-child { border-bottom: none; }
`;

const Avatar = styled.span`
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: var(--pl-canvas);
  color: var(--pl-blue);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
`;

const MembroInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MembroNomeLinha = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const MembroNome = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
`;

const MembroSub = styled.div`
  font-size: 0.78rem;
  color: var(--pl-muted);
  margin-top: 0.1rem;
  font-family: 'Inter', sans-serif;
`;

const RemoverButton = styled.button`
  all: unset;
  cursor: pointer;
  width: 32px;
  height: 32px;
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

const InviteCard = styled(ConfigCard)`
  margin-top: 1.25rem;
`;

// ============================================
// HELPERS
// ============================================

const statusTone: Record<StatusMembro, 'success' | 'warning' | 'danger'> = {
    ativo: 'success',
    pendente: 'warning',
    recusado: 'danger',
};

const statusLabel: Record<StatusMembro, string> = {
    ativo: 'Ativo',
    pendente: 'Pendente',
    recusado: 'Recusado',
};

// ============================================
// TIPOS
// ============================================

export interface EquipeDetalheProps
{
    equipeId: number;
    onVoltar: () => void;
    onEquipeAlterada: () => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const EquipeDetalhe: React.FC<EquipeDetalheProps> = ({ equipeId, onVoltar, onEquipeAlterada }) =>
{
    const [equipe, setEquipe] = useState<Equipe | null>(null);
    const [membros, setMembros] = useState<MembroEquipe[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [saindo, setSaindo] = useState(false);
    const [removendoId, setRemovendoId] = useState<number | null>(null);
    const [paraRemover, setParaRemover] = useState<MembroEquipe | null>(null);

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
            const [e, m] = await Promise.all([buscarEquipePorId(equipeId), listarMembros(equipeId)]);
            setEquipe(e);
            setMembros(m);
        }
        catch (err: any)
        {
            exibirToast('error', err?.erro || 'Falha ao carregar a equipe.');
        }
        finally
        {
            setCarregando(false);
        }
    }, [equipeId, exibirToast]);

    useEffect(() => { carregar(); }, [carregar]);

    const handleConvidado = useCallback(() =>
    {
        exibirToast('success', 'Convite enviado! A pessoa precisa aceitar para entrar na equipe.');
        carregar();
    }, [carregar, exibirToast]);

    const handleRemoverConfirmado = async () =>
    {
        if (!paraRemover) return;
        setRemovendoId(paraRemover.usuarioId);
        try
        {
            await removerMembro(equipeId, paraRemover.usuarioId);
            exibirToast('success', `${paraRemover.nome} removido da equipe.`);
            setParaRemover(null);
            await carregar();
        }
        catch (err: any)
        {
            exibirToast('error', err?.erro || 'Falha ao remover membro.');
        }
        finally
        {
            setRemovendoId(null);
        }
    };

    const handleSair = async () =>
    {
        setSaindo(true);
        try
        {
            await sairDaEquipe(equipeId);
            exibirToast('success', 'Você saiu da equipe.');
            onEquipeAlterada();
            onVoltar();
        }
        catch (err: any)
        {
            exibirToast('error', err?.erro || 'Falha ao sair da equipe.');
        }
        finally
        {
            setSaindo(false);
        }
    };

    if (carregando && !equipe)
    {
        return <EmptyState title="Carregando equipe..." description="Aguarde um instante." />;
    }

    if (!equipe)
    {
        return <EmptyState title="Equipe não encontrada" description="Volte e tente novamente." />;
    }

    return (
        <>
            <VoltarButton type="button" onClick={onVoltar}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Voltar para Equipes
            </VoltarButton>

            <HeaderCard>
                <HeaderTop>
                    <div>
                        <TituloWrap>
                            <Titulo>{equipe.nome}</Titulo>
                            {equipe.souCriador && <CriadorTag>Sua equipe</CriadorTag>}
                        </TituloWrap>
                        {equipe.descricao && <Descricao>{equipe.descricao}</Descricao>}
                    </div>
                    {!equipe.souCriador && (
                        <SairButton type="button" onClick={handleSair} disabled={saindo}>
                            {saindo ? 'Saindo...' : 'Sair da equipe'}
                        </SairButton>
                    )}
                </HeaderTop>

                <MetaGrid>
                    <div>
                        <MetaLabel>Setor</MetaLabel>
                        <MetaValue>{equipe.setor || '—'}</MetaValue>
                    </div>
                    <div>
                        <MetaLabel>Objetivo</MetaLabel>
                        <MetaValue>{equipe.objetivo || '—'}</MetaValue>
                    </div>
                    <div>
                        <MetaLabel>Criada em</MetaLabel>
                        <MetaValue>{formatDateBR(equipe.dataCriacao)}</MetaValue>
                    </div>
                </MetaGrid>
            </HeaderCard>

            <ConfigCard
                title="Membros da equipe"
                headerRight={<span style={{ color: 'var(--pl-muted)', fontSize: '0.85rem' }}>{membros.length} no total</span>}
            >
                {membros.length === 0 ? (
                    <EmptyState title="Nenhum membro ainda" description="Convide alguém abaixo para começar." />
                ) : (
                    membros.map((m) => (
                        <MembroRow key={m.usuarioId}>
                            <Avatar>{initials(m.nome)}</Avatar>
                            <MembroInfo>
                                <MembroNomeLinha>
                                    <MembroNome>{m.nome}</MembroNome>
                                    {m.ehCriador && <CriadorTag>Criador</CriadorTag>}
                                </MembroNomeLinha>
                                <MembroSub>
                                    {m.funcao || 'sem função'}
                                    {m.codigo ? ` · código ${m.codigo}` : ''}
                                </MembroSub>
                            </MembroInfo>
                            <StatusChip label={statusLabel[m.status]} tone={statusTone[m.status]} />
                            {equipe.souCriador && !m.ehCriador && (
                                <RemoverButton
                                    type="button"
                                    title={`Remover ${m.nome}`}
                                    aria-label={`Remover ${m.nome}`}
                                    disabled={removendoId === m.usuarioId}
                                    onClick={() => setParaRemover(m)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </RemoverButton>
                            )}
                        </MembroRow>
                    ))
                )}
            </ConfigCard>

            {equipe.souCriador && (
                <InviteCard title="Adicionar membro" noDivider>
                    <ConvidarMembroBox
                        equipeId={equipeId}
                        onConvidado={handleConvidado}
                        onErro={(msg) => exibirToast('error', msg)}
                    />
                </InviteCard>
            )}

            <ConfirmDialog
                show={!!paraRemover}
                title="Remover membro"
                message={paraRemover ? `Tem certeza que deseja remover ${paraRemover.nome} da equipe?` : ''}
                confirmLabel="Remover"
                cancelLabel="Cancelar"
                onCancel={() => setParaRemover(null)}
                onConfirm={handleRemoverConfirmado}
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

export default EquipeDetalhe;
