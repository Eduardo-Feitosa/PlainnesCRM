import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { buscarUsuariosParaConvite, convidarMembro } from '../../services/equipes';
import type { UsuarioBusca } from '../../types/equipe';

// ============================================
// STYLED COMPONENTS
// ============================================

const Wrapper = styled.div`
  position: relative;
`;

const SearchInputWrap = styled.div`
  position: relative;

  & > svg {
    position: absolute;
    top: 50%;
    left: 16px;
    transform: translateY(-50%);
    color: var(--pl-muted);
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 46px;
  padding-left: 44px;
  padding-right: 18px;
  background-color: #f7f7fc;
  border: 1px solid transparent;
  border-radius: 0.75rem;
  font-size: 0.92rem;
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
`;

const ResultsBox = styled.div`
  margin-top: 0.6rem;
  border: 1px solid var(--pl-line);
  border-radius: 0.75rem;
  overflow: hidden;
`;

const ResultRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid #f1eef9;

  &:last-child { border-bottom: none; }
`;

const Avatar = styled.span`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: var(--pl-canvas);
  color: var(--pl-blue);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.78rem;
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Nome = styled.div`
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--pl-navy);
  font-family: 'Inter', sans-serif;
`;

const SubInfo = styled.div`
  font-size: 0.76rem;
  color: var(--pl-muted);
  font-family: 'Inter', sans-serif;
`;

const CodigoTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: 'Inter', sans-serif;
`;

const ConvidarButton = styled.button`
  height: 34px;
  padding: 0 0.9rem;
  border-radius: 0.6rem;
  border: 1px solid var(--pl-blue);
  background: var(--pl-blue-soft);
  color: var(--pl-blue);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover:not(:disabled) { background: var(--pl-blue); color: #fff; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const HelperText = styled.p`
  margin: 0.4rem 0 0;
  font-size: 0.78rem;
  color: var(--pl-muted);
  font-family: 'Inter', sans-serif;
`;

// ============================================
// HELPERS
// ============================================

function initials(nome: string): string
{
    if (!nome) return '?';
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// ============================================
// TIPOS
// ============================================

export interface ConvidarMembroBoxProps
{
    equipeId: number;
    onConvidado: () => void;
    onErro: (mensagem: string) => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ConvidarMembroBox: React.FC<ConvidarMembroBoxProps> = ({ equipeId, onConvidado, onErro }) =>
{
    const [termo, setTermo] = useState('');
    const [resultados, setResultados] = useState<UsuarioBusca[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [convidandoId, setConvidandoId] = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() =>
    {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const termoLimpo = termo.trim();
        if (!termoLimpo)
        {
            setResultados([]);
            setBuscando(false);
            return;
        }

        setBuscando(true);
        debounceRef.current = setTimeout(async () =>
        {
            try
            {
                const r = await buscarUsuariosParaConvite(equipeId, termoLimpo);
                setResultados(r);
            }
            catch (err: any)
            {
                onErro(err?.erro || 'Falha ao buscar usuários.');
                setResultados([]);
            }
            finally
            {
                setBuscando(false);
            }
        }, 350);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [termo, equipeId]);

    const handleConvidar = async (usuario: UsuarioBusca) =>
    {
        setConvidandoId(usuario.id);
        try
        {
            await convidarMembro(equipeId, usuario.id);
            setResultados((prev) => prev.filter((u) => u.id !== usuario.id));
            setTermo('');
            onConvidado();
        }
        catch (err: any)
        {
            onErro(err?.erro || 'Falha ao convidar usuário.');
        }
        finally
        {
            setConvidandoId(null);
        }
    };

    return (
        <Wrapper>
            <SearchInputWrap>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <SearchInput
                    type="text"
                    placeholder="Buscar por nome de usuário (perfil público) ou código de 5 dígitos..."
                    value={termo}
                    onChange={(e) => setTermo(e.target.value)}
                />
            </SearchInputWrap>

            <HelperText>
                Perfis públicos podem ser encontrados pelo nome de usuário. Perfis privados só aparecem se você souber o código exato.
            </HelperText>

            {buscando && <HelperText>Buscando...</HelperText>}

            {!buscando && termo.trim() && resultados.length === 0 && (
                <HelperText>Nenhum usuário encontrado.</HelperText>
            )}

            {resultados.length > 0 && (
                <ResultsBox>
                    {resultados.map((u) => (
                        <ResultRow key={u.id}>
                            <Avatar>{initials(u.nome)}</Avatar>
                            <Info>
                                <Nome>{u.nome}</Nome>
                                <SubInfo>
                                    {u.tipoPerfil === 'publico' && u.nomeUser ? (
                                        <>@{u.nomeUser} · {u.funcao || 'sem função'}</>
                                    ) : (
                                        <CodigoTag>Perfil privado · código {u.codigo}</CodigoTag>
                                    )}
                                </SubInfo>
                            </Info>
                            <ConvidarButton
                                type="button"
                                disabled={convidandoId === u.id}
                                onClick={() => handleConvidar(u)}
                            >
                                {convidandoId === u.id ? 'Convidando...' : 'Convidar'}
                            </ConvidarButton>
                        </ResultRow>
                    ))}
                </ResultsBox>
            )}
        </Wrapper>
    );
};

export default ConvidarMembroBox;
