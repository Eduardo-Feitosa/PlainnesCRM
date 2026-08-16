import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import notificacaoIcon from '../../assets/notificacaoIcon.png';
import { listarConvitesPendentes, responderConvite } from '../../services/equipes';
import { listarNotificacoes, contarNotificacoesNaoLidas, marcarNotificacaoComoLida } from '../../services/notificacoes';
import { listarSolicitacoesPendentes, responderSolicitacao } from '../../services/colaboradores';
import type { ConviteEquipe } from '../../types/equipe';
import type { Notificacao } from '../../types/notificacao';
import type { SolicitacaoColaborador } from '../../types/colaborador';

// ============================================
// STYLED COMPONENTS
// ============================================

const Wrapper = styled.div`
  position: relative;
`;

const NotificationButton = styled.button`
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background-color: transparent;
  color: var(--pl-navy);
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.15s ease;
  position: relative;

  &:hover, &:focus-visible {
    background-color: var(--pl-blue-soft);
    outline: none;
  }

  > span {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    opacity: 0.78;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--pl-coral-dark);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
`;

const Dropdown = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  width: 360px;
  max-width: 90vw;
  max-height: 480px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid var(--pl-line);
  border-radius: 0.9rem;
  box-shadow: 0 20px 55px -20px rgba(27, 26, 74, 0.35);
  z-index: 1050;
`;

const DropdownHeader = styled.div`
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid var(--pl-line);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
`;

const SectionLabel = styled.div`
  padding: 0.7rem 1.1rem 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pl-muted);
  font-family: 'Inter', sans-serif;
`;

const ConviteItem = styled.div`
  padding: 0.75rem 1.1rem;
  border-bottom: 1px solid #f1eef9;
`;

const ConviteTexto = styled.p`
  margin: 0 0 0.6rem;
  font-size: 0.86rem;
  color: #3e3c65;
  line-height: 1.4;
  font-family: 'Inter', sans-serif;

  strong { color: var(--pl-navy); }
`;

const ConviteBotoes = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const BotaoAceitar = styled.button`
  flex: 1;
  height: 32px;
  border-radius: 0.55rem;
  border: none;
  background: var(--pl-green);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: opacity 0.15s ease;
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const BotaoRecusar = styled.button`
  flex: 1;
  height: 32px;
  border-radius: 0.55rem;
  border: 1px solid var(--pl-line);
  background: transparent;
  color: var(--pl-navy-soft);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s ease;
  &:hover:not(:disabled) { background: var(--pl-canvas); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const NotifItem = styled.button<{ $lida: boolean }>`
  all: unset;
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem 1.1rem;
  border-bottom: 1px solid #f1eef9;
  cursor: pointer;
  background: ${({ $lida }) => ($lida ? 'transparent' : 'var(--pl-blue-soft)')};

  &:hover { background: var(--pl-canvas); }
`;

const NotifTexto = styled.p`
  margin: 0 0 0.2rem;
  font-size: 0.85rem;
  color: #3e3c65;
  line-height: 1.4;
  font-family: 'Inter', sans-serif;
`;

const NotifData = styled.span`
  font-size: 0.72rem;
  color: var(--pl-muted);
  font-family: 'Inter', sans-serif;
`;

const EmptyBox = styled.div`
  padding: 2.5rem 1.1rem;
  text-align: center;
  color: var(--pl-muted);
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
`;

// ============================================
// HELPERS
// ============================================

const formatarDataHora = (iso: string | null | undefined): string =>
{
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' +
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const NotificationBell: React.FC = () =>
{
    const navigate = useNavigate();
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(false);
    const [contagem, setContagem] = useState(0);
    const [convites, setConvites] = useState<ConviteEquipe[]>([]);
    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoColaborador[]>([]);
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [respondendoId, setRespondendoId] = useState<number | null>(null);
    const [respondendoColabId, setRespondendoColabId] = useState<number | null>(null);

    const atualizarContagem = useCallback(async () =>
    {
        try
        {
            const [conv, colab, naoLidas] = await Promise.all([
                listarConvitesPendentes().catch(() => []),
                listarSolicitacoesPendentes().catch(() => []),
                contarNotificacoesNaoLidas().catch(() => 0),
            ]);
            setContagem(conv.length + colab.length + naoLidas);
        }
        catch
        {
            /* badge é best-effort, não quebra a tela */
        }
    }, []);

    useEffect(() =>
    {
        atualizarContagem();
    }, [atualizarContagem]);

    // Retry leve: se a contagem inicial falhar silenciosamente (rede instável,
    // backend reiniciando, etc.) ou uma notificação nova chegar enquanto o
    // usuário está parado numa página, o badge se autocorrige sozinho em vez
    // de ficar preso até a próxima ação de aceitar/recusar.
    useEffect(() =>
    {
        const intervalo = setInterval(() => { atualizarContagem(); }, 45000);
        return () => clearInterval(intervalo);
    }, [atualizarContagem]);

    useEffect(() =>
    {
        const handleClickOutside = (e: MouseEvent) =>
        {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const carregarLista = useCallback(async () =>
    {
        setCarregando(true);
        try
        {
            const [conv, colab, notifs] = await Promise.all([
                listarConvitesPendentes().catch(() => []),
                listarSolicitacoesPendentes().catch(() => []),
                listarNotificacoes().catch(() => []),
            ]);
            setConvites(conv);
            setSolicitacoes(colab);
            setNotificacoes(notifs);
        }
        finally
        {
            setCarregando(false);
        }
    }, []);

    const handleToggle = () =>
    {
        const proximo = !open;
        setOpen(proximo);
        if (proximo)
        {
            // Recarrega lista E contagem juntas — antes só a lista era buscada
            // aqui, então o número do badge podia ficar sem bater com o
            // conteúdo real do painel até alguém aceitar/recusar algo.
            carregarLista();
            atualizarContagem();
        }
    };

    const handleResponder = async (convite: ConviteEquipe, aceitar: boolean) =>
    {
        setRespondendoId(convite.equipeId);
        try
        {
            await responderConvite(convite.equipeId, aceitar);
            // Recarrega tudo (não só filtra localmente): responder também marca a
            // notificação original como lida no backend, e precisamos refletir isso
            // na aba "Atividade recente" sem esperar um reload de página.
            await Promise.all([carregarLista(), atualizarContagem()]);
        }
        catch (err)
        {
            console.error(err);
        }
        finally
        {
            setRespondendoId(null);
        }
    };

    const handleResponderColaborador = async (solicitacao: SolicitacaoColaborador, aceitar: boolean) =>
    {
        setRespondendoColabId(solicitacao.id);
        try
        {
            await responderSolicitacao(solicitacao.id, aceitar);
            await Promise.all([carregarLista(), atualizarContagem()]);
        }
        catch (err)
        {
            console.error(err);
        }
        finally
        {
            setRespondendoColabId(null);
        }
    };

    const handleClickNotificacao = async (n: Notificacao) =>
    {
        if (!n.lida)
        {
            try { await marcarNotificacaoComoLida(n.id); } catch (err) { console.error(err); }
            setNotificacoes((prev) => prev.map((x) => (x.id === n.id ? { ...x, lida: true } : x)));
            atualizarContagem();
        }
        if (n.link)
        {
            setOpen(false);
            navigate(n.link);
        }
    };

    const semNada = !carregando && convites.length === 0 && solicitacoes.length === 0 && notificacoes.length === 0;

    return (
        <Wrapper ref={wrapperRef}>
            <NotificationButton
                type="button"
                aria-label="Notificações"
                title="Notificações"
                onClick={handleToggle}
            >
                <span><img src={notificacaoIcon} alt="" aria-hidden="true" /></span>
                {contagem > 0 && <Badge>{contagem > 9 ? '9+' : contagem}</Badge>}
            </NotificationButton>

            {open && (
                <Dropdown>
                    <DropdownHeader>Notificações</DropdownHeader>

                    {carregando ? (
                        <EmptyBox>Carregando...</EmptyBox>
                    ) : semNada ? (
                        <EmptyBox>Nenhuma notificação por aqui.</EmptyBox>
                    ) : (
                        <>
                            {convites.length > 0 && (
                                <>
                                    <SectionLabel>Convites de equipe</SectionLabel>
                                    {convites.map((c) => (
                                        <ConviteItem key={c.equipeId}>
                                            <ConviteTexto>
                                                <strong>{c.criadoPorNome}</strong> convidou você para a equipe{' '}
                                                <strong>{c.equipeNome}</strong>.
                                            </ConviteTexto>
                                            <ConviteBotoes>
                                                <BotaoAceitar
                                                    type="button"
                                                    disabled={respondendoId === c.equipeId}
                                                    onClick={() => handleResponder(c, true)}
                                                >
                                                    Aceitar
                                                </BotaoAceitar>
                                                <BotaoRecusar
                                                    type="button"
                                                    disabled={respondendoId === c.equipeId}
                                                    onClick={() => handleResponder(c, false)}
                                                >
                                                    Recusar
                                                </BotaoRecusar>
                                            </ConviteBotoes>
                                        </ConviteItem>
                                    ))}
                                </>
                            )}

                            {solicitacoes.length > 0 && (
                                <>
                                    <SectionLabel>Solicitações de colaboração</SectionLabel>
                                    {solicitacoes.map((s) => (
                                        <ConviteItem key={s.id}>
                                            <ConviteTexto>
                                                <strong>{s.solicitanteNome}</strong> quer se conectar com você
                                                {s.solicitanteNomeUser ? <> (@{s.solicitanteNomeUser})</> : s.solicitanteCodigo ? <> (código {s.solicitanteCodigo})</> : null}.
                                            </ConviteTexto>
                                            <ConviteBotoes>
                                                <BotaoAceitar
                                                    type="button"
                                                    disabled={respondendoColabId === s.id}
                                                    onClick={() => handleResponderColaborador(s, true)}
                                                >
                                                    Aceitar
                                                </BotaoAceitar>
                                                <BotaoRecusar
                                                    type="button"
                                                    disabled={respondendoColabId === s.id}
                                                    onClick={() => handleResponderColaborador(s, false)}
                                                >
                                                    Recusar
                                                </BotaoRecusar>
                                            </ConviteBotoes>
                                        </ConviteItem>
                                    ))}
                                </>
                            )}

                            {notificacoes.length > 0 && (
                                <>
                                    <SectionLabel>Atividade recente</SectionLabel>
                                    {notificacoes.map((n) => (
                                        <NotifItem key={n.id} type="button" $lida={n.lida} onClick={() => handleClickNotificacao(n)}>
                                            <NotifTexto>{n.mensagem}</NotifTexto>
                                            <NotifData>{formatarDataHora(n.dataCriacao)}</NotifData>
                                        </NotifItem>
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </Dropdown>
            )}
        </Wrapper>
    );
};

export default NotificationBell;
