import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import searchIcon from '../../assets/search.png';
import { buscarUsuariosColaborador, solicitarColaboracao } from '../../services/colaboradores';
import { ToastMessage, type ToastVariant } from '../feedback/ToastMessage';
import type { UsuarioBusca } from '../../types/colaborador';

// ============================================
// STYLED COMPONENTS
// ============================================

const Wrapper = styled.div`
  flex: 1;
  max-width: 500px;
  position: relative;
`;

const SearchIcon = styled.img`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  opacity: 0.6;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border: 1px solid var(--pl-line);
  border-radius: 0.75rem;
  background-color: #f7f7fc;
  font-size: 0.925rem;
  font-family: 'Inter', sans-serif;
  color: var(--pl-navy);
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;

  &:focus {
    background-color: #fff;
    border-color: var(--pl-blue);
    box-shadow: 0 0 0 0.2rem rgba(59, 46, 232, 0.14);
  }
`;

const Dropdown = styled.div`
  position: absolute;
  left: 0;
  top: calc(100% + 0.5rem);
  width: 100%;
  min-width: 320px;
  max-height: 420px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid var(--pl-line);
  border-radius: 0.9rem;
  box-shadow: 0 20px 55px -20px rgba(27, 26, 74, 0.35);
  z-index: 1060;
`;

const ResultRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid #f1eef9;

  &:last-child { border-bottom: none; }
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
  font-size: 0.8rem;
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

const EnviarButton = styled.button`
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
  white-space: nowrap;

  &:hover:not(:disabled) { background: var(--pl-blue); color: #fff; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const EnviadoTag = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--pl-green);
  flex-shrink: 0;
  font-family: 'Inter', sans-serif;
`;

const InfoBox = styled.div`
  padding: 1rem;
  text-align: center;
  color: var(--pl-muted);
  font-size: 0.85rem;
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
// COMPONENTE PRINCIPAL
// ============================================

export const HeaderUserSearch: React.FC = () =>
{
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [termo, setTermo] = useState('');
    const [resultados, setResultados] = useState<UsuarioBusca[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [open, setOpen] = useState(false);
    const [enviandoId, setEnviandoId] = useState<number | null>(null);
    const [enviadosIds, setEnviadosIds] = useState<Set<number>>(new Set());

    const [toast, setToast] = useState<{ variant: ToastVariant; message: string; visible: boolean }>({
        variant: 'success', message: '', visible: false,
    });

    useEffect(() =>
    {
        const handleClickOutside = (e: MouseEvent) =>
        {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                const r = await buscarUsuariosColaborador(termoLimpo);
                setResultados(r);
            }
            catch (err: any)
            {
                setResultados([]);
                setToast({ variant: 'error', message: err?.erro || 'Falha ao buscar usuários.', visible: true });
            }
            finally
            {
                setBuscando(false);
            }
        }, 350);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [termo]);

    const handleEnviar = async (usuario: UsuarioBusca) =>
    {
        setEnviandoId(usuario.id);
        try
        {
            await solicitarColaboracao(usuario.id);
            setEnviadosIds((prev) => new Set(prev).add(usuario.id));
            setToast({ variant: 'success', message: `Solicitação enviada para ${usuario.nome}.`, visible: true });
        }
        catch (err: any)
        {
            setToast({ variant: 'error', message: err?.erro || 'Falha ao enviar solicitação.', visible: true });
        }
        finally
        {
            setEnviandoId(null);
        }
    };

    return (
        <Wrapper ref={wrapperRef}>
            <SearchIcon src={searchIcon} alt="Buscar" />
            <SearchInput
                type="text"
                placeholder="Buscar usuário por nome ou código para colaborar..."
                aria-label="Buscar usuário"
                value={termo}
                onFocus={() => setOpen(true)}
                onChange={(e) => { setTermo(e.target.value); setOpen(true); }}
            />

            {open && termo.trim() && (
                <Dropdown>
                    {buscando ? (
                        <InfoBox>Buscando...</InfoBox>
                    ) : resultados.length === 0 ? (
                        <InfoBox>Nenhum usuário encontrado.</InfoBox>
                    ) : (
                        resultados.map((u) => (
                            <ResultRow key={u.id}>
                                <Avatar>{initials(u.nome)}</Avatar>
                                <Info>
                                    <Nome>{u.nome}</Nome>
                                    <SubInfo>
                                        {u.tipoPerfil === 'publico' && u.nomeUser
                                            ? `@${u.nomeUser}${u.codigo ? ` · código ${u.codigo}` : ''}`
                                            : `Perfil privado · código ${u.codigo}`}
                                    </SubInfo>
                                </Info>
                                {enviadosIds.has(u.id) ? (
                                    <EnviadoTag>Solicitação enviada</EnviadoTag>
                                ) : (
                                    <EnviarButton
                                        type="button"
                                        disabled={enviandoId === u.id}
                                        onClick={() => handleEnviar(u)}
                                    >
                                        {enviandoId === u.id ? 'Enviando...' : 'Enviar solicitação'}
                                    </EnviarButton>
                                )}
                            </ResultRow>
                        ))
                    )}
                </Dropdown>
            )}

            <ToastMessage
                variant={toast.variant}
                message={toast.message}
                visible={toast.visible}
                onClose={() => setToast((t) => ({ ...t, visible: false }))}
            />
        </Wrapper>
    );
};

export default HeaderUserSearch;
