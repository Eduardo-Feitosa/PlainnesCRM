import React, { useMemo, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FormField } from '../components/forms/FormField';
import { FormSelect } from '../components/forms/FormSelect';
import { PasswordEyeButton } from '../components/forms/PasswordEyeButton';
import { ConfigCard } from '../components/layout/ConfigCard';
import { AvatarDisplay } from '../components/layout/AvatarDisplay';
import { ToastMessage, type ToastVariant } from '../components/feedback/ToastMessage';
import { useAuth, type UsuarioDados } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

// ============================================
// STYLED COMPONENTS
// ============================================

const Eyebrow = styled.div`
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--pl-muted);
  margin-bottom: 0.4rem;
  font-family: 'Inter', sans-serif;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--pl-navy);
  margin: 0 0 0.25rem;
  font-family: 'Inter', sans-serif;
`;

const PageSubtitle = styled.p`
  color: var(--pl-muted);
  font-size: 0.95rem;
  margin: 0 0 1.75rem;
  font-family: 'Inter', sans-serif;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1.5rem;

  @media (max-width: 1099.98px) {
    grid-template-columns: 1fr;
  }
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  justify-content: flex-start;
`;

const ButtonsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.25rem;
  align-items: center;
`;

const SubmitButton = styled.button<{ $variant?: 'primary' | 'ghost'; $fullWidth?: boolean }>`
  ${({ $fullWidth }) => ($fullWidth ? 'width: 100%;' : 'min-width: 180px;')}
  height: 46px;
  padding: 0 1.25rem;
  background-color: ${({ $variant }) =>
    $variant === 'ghost' ? 'transparent' : 'var(--pl-blue)'};
  color: ${({ $variant }) => ($variant === 'ghost' ? 'var(--pl-navy-soft)' : '#fff')};
  border: ${({ $variant }) =>
    $variant === 'ghost' ? '1px solid #c6c3da' : '1px solid var(--pl-blue)'};
  border-radius: 0.75rem;
  font-size: 0.95rem;
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

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

// ============================================
// FUNÇÕES DE MÁSCARA (REUTILIZADAS DO CADASTRO)
// ============================================

const maskCPF = (value: string): string =>
{
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const maskCNPJ = (value: string): string =>
{
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

const maskTelefone = (value: string): string =>
{
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const apenasDigitos = (v: string) => v.replace(/\D/g, '');

const formatarDataBR = (dataISO?: string | null): string =>
{
  if (!dataISO) return '';
  const d = new Date(dataISO);
  if (Number.isNaN(d.getTime())) return dataISO;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ============================================
// VALIDAÇÕES
// ============================================

const validarEmail = (email: string): boolean =>
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.trim());

const validarCPF = (cpf: string): boolean =>
{
  const cpfLimpo = apenasDigitos(cpf);
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpfLimpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpfLimpo[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpfLimpo[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo[10])) return false;

  return true;
};

const validarCNPJ = (cnpj: string): boolean =>
{
  const cnpjLimpo = apenasDigitos(cnpj);
  if (cnpjLimpo.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false;

  let tamanho = 12;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--)
  {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = 13;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--)
  {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
};

const validarIdade = (dataNasc: string): boolean =>
{
  if (!dataNasc) return false;
  const nascimento = new Date(dataNasc);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate()))
  {
    idade--;
  }
  return idade >= 18;
};

// Regra de senha: 6-8 caracteres, pelo menos 1 letra
const validarFormatoSenha = (senha: string): boolean =>
{
  if (senha.length < 6 || senha.length > 8) return false;
  if (!/[A-Za-z]/.test(senha)) return false;
  return true;
};

// ============================================
// HELPERS TIPAGEM
// ============================================

type ErrorsMap = { [k: string]: string };

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const Configuracoes: React.FC = () =>
{
  const { usuario, token, atualizarDadosUsuario } = useAuth();

  // ====== ESTADOS DO PERFIL ======
  const [tipoPessoa, setTipoPessoa] = useState<'PF' | 'PJ'>('PF');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [setor, setSetor] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [funcao, setFuncao] = useState('');
  const [errorsPerfil, setErrorsPerfil] = useState<ErrorsMap>({});
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [snapshotPerfil, setSnapshotPerfil] = useState<Record<string, unknown> | null>(null);

  // ====== ESTADOS DA SENHA ======
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoNovaSenha, setConfirmacaoNovaSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmacaoNovaSenha, setShowConfirmacaoNovaSenha] = useState(false);
  const [errorsSenha, setErrorsSenha] = useState<ErrorsMap>({});
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // ====== TOAST ======
  const [toastVisible, setToastVisible] = useState(false);
  const [toastVariant, setToastVariant] = useState<ToastVariant>('success');
  const [toastMessage, setToastMessage] = useState('');

  const mostrarToast = useCallback((variant: ToastVariant, message: string) =>
  {
    setToastVariant(variant);
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  // Dados complementares do header do card (função, cliente desde...)
  const subInfoUsuario = useMemo(() =>
  {
    if (!usuario) return '';
    const partes: string[] = [];
    if (usuario.funcao) partes.push(usuario.funcao);
    const dataFormatada = formatarDataBR(usuario.dataCadastro);
    if (dataFormatada) partes.push(`Cliente desde ${dataFormatada}`);
    return partes.join(' · ');
  }, [usuario]);

  // ====== CARREGA DADOS INICIAIS DO USUÁRIO LOGADO ======
  useEffect(() =>
  {
    if (!usuario) return;
    const tipo: 'PF' | 'PJ' = usuario.tipo === 'PJ' ? 'PJ' : 'PF';
    setTipoPessoa(tipo);
    setNome(usuario.nome || '');
    setEmail(usuario.email || '');
    setTelefone(maskTelefone(usuario.telefone || ''));
    setSetor(usuario.setor || '');
    setCpf(maskCPF(usuario.cpf || ''));
    setCnpj(maskCNPJ(usuario.cnpj || ''));
    setDataNascimento(usuario.dataNascimento ? String(usuario.dataNascimento).slice(0, 10) : '');
    setFuncao(usuario.funcao || '');

    // Snapshot no mesmo formato do payload da API para comparação posterior
    const dataNasc = usuario.dataNascimento ? String(usuario.dataNascimento).slice(0, 10) : '';
    setSnapshotPerfil({
      nome: (usuario.nome || '').trim(),
      email: (usuario.email || '').trim(),
      tipo,
      telefone: apenasDigitos(usuario.telefone || ''),
      setor: (usuario.setor || '').trim(),
      ...(tipo === 'PF'
        ? {
            cpf: apenasDigitos(usuario.cpf || ''),
            dataNascimento: dataNasc || null,
            funcao: (usuario.funcao || '').trim(),
            cnpj: null,
          }
        : {
            cnpj: apenasDigitos(usuario.cnpj || ''),
            cpf: null,
            dataNascimento: null,
          }),
    });
  }, [usuario]);

  // ============================================
  // VALIDAÇÕES PERFIL
  // ============================================
  const validarPerfil = (): boolean =>
  {
    const err: ErrorsMap = {};

    if (!nome.trim()) err.nome = 'Nome completo / Razão social é obrigatório';
    else if (nome.trim().length < 3) err.nome = 'Nome deve ter pelo menos 3 caracteres';

    if (!email.trim()) err.email = 'E-mail é obrigatório';
    else if (!validarEmail(email)) err.email = 'E-mail inválido';

    if (!telefone.trim()) err.telefone = 'Telefone é obrigatório';
    else
    {
      const d = apenasDigitos(telefone);
      if (d.length < 10 || d.length > 11) err.telefone = 'Telefone inválido';
    }

    if (!setor.trim()) err.setor = 'Setor é obrigatório';
    else if (setor.trim().length < 2) err.setor = 'Setor deve ter pelo menos 2 caracteres';

    if (tipoPessoa === 'PF')
    {
      if (!cpf.trim()) err.cpf = 'CPF é obrigatório';
      else if (!validarCPF(cpf)) err.cpf = 'CPF inválido';

      if (!dataNascimento) err.dataNascimento = 'Data de nascimento é obrigatória';
      else if (!validarIdade(dataNascimento)) err.dataNascimento = 'Você deve ter pelo menos 18 anos';

      if (!funcao.trim()) err.funcao = 'Função é obrigatória';
      else if (funcao.trim().length < 2) err.funcao = 'Função deve ter pelo menos 2 caracteres';
    }
    else
    {
      // PJ não tem dataNascimento nem função obrigatórios
      if (!cnpj.trim()) err.cnpj = 'CNPJ é obrigatório';
      else if (!validarCNPJ(cnpj)) err.cnpj = 'CNPJ inválido';
    }

    setErrorsPerfil(err);
    return Object.keys(err).length === 0;
  };

  const descartarPerfil = () =>
  {
    if (!usuario) return;
    const tipo: 'PF' | 'PJ' = usuario.tipo === 'PJ' ? 'PJ' : 'PF';
    setTipoPessoa(tipo);
    setNome(usuario.nome || '');
    setEmail(usuario.email || '');
    setTelefone(maskTelefone(usuario.telefone || ''));
    setSetor(usuario.setor || '');
    setCpf(maskCPF(usuario.cpf || ''));
    setCnpj(maskCNPJ(usuario.cnpj || ''));
    setDataNascimento(usuario.dataNascimento ? String(usuario.dataNascimento).slice(0, 10) : '');
    setFuncao(usuario.funcao || '');
    setErrorsPerfil({});

    const dataNasc = usuario.dataNascimento ? String(usuario.dataNascimento).slice(0, 10) : '';
    setSnapshotPerfil({
      nome: (usuario.nome || '').trim(),
      email: (usuario.email || '').trim(),
      tipo,
      telefone: apenasDigitos(usuario.telefone || ''),
      setor: (usuario.setor || '').trim(),
      ...(tipo === 'PF'
        ? {
            cpf: apenasDigitos(usuario.cpf || ''),
            dataNascimento: dataNasc || null,
            funcao: (usuario.funcao || '').trim(),
            cnpj: null,
          }
        : {
            cnpj: apenasDigitos(usuario.cnpj || ''),
            cpf: null,
            dataNascimento: null,
          }),
    });
  };

  // ============================================
  // VALIDAÇÕES SENHA
  // ============================================
  const validarSenha = (): boolean =>
  {
    const err: ErrorsMap = {};

    if (!senhaAtual.trim()) err.senhaAtual = 'Senha atual é obrigatória';
    else if (senhaAtual.length < 6 || senhaAtual.length > 8)
      err.senhaAtual = 'Senha atual deve ter entre 6 e 8 caracteres';

    if (!novaSenha.trim()) err.novaSenha = 'Nova senha é obrigatória';
    else if (!validarFormatoSenha(novaSenha))
      err.novaSenha = 'Nova senha deve ter 6-8 caracteres e pelo menos 1 letra';

    if (!confirmacaoNovaSenha.trim()) err.confirmacaoNovaSenha = 'Confirme a nova senha';
    else if (confirmacaoNovaSenha !== novaSenha)
      err.confirmacaoNovaSenha = 'Confirmação não confere com a nova senha';

    if (!err.novaSenha && senhaAtual && novaSenha === senhaAtual)
      err.novaSenha = 'Nova senha deve ser diferente da atual';

    setErrorsSenha(err);
    return Object.keys(err).length === 0;
  };

  const limparFormSenha = () =>
  {
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmacaoNovaSenha('');
    setShowSenhaAtual(false);
    setShowNovaSenha(false);
    setShowConfirmacaoNovaSenha(false);
    setErrorsSenha({});
  };

  // ============================================
  // SUBMISSÕES
  // ============================================

  const headersAutorizados = useMemo(() =>
  {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, [token]);

  const handleSalvarPerfil = async (e: React.FormEvent) =>
  {
    e.preventDefault();
    if (!validarPerfil()) return;

    const payloadPerfil: Record<string, unknown> =
    {
      nome: nome.trim(),
      email: email.trim(),
      tipo: tipoPessoa,
      telefone: apenasDigitos(telefone),
      setor: setor.trim(),
      ...(tipoPessoa === 'PF'
        ? {
            cpf: apenasDigitos(cpf),
            dataNascimento: dataNascimento || null,
            funcao: funcao.trim(),
            cnpj: null,
          }
        : {
            cnpj: apenasDigitos(cnpj),
            cpf: null,
            dataNascimento: null,
          }),
    };

    if (snapshotPerfil && JSON.stringify(payloadPerfil) === JSON.stringify(snapshotPerfil))
    {
      mostrarToast('info', 'Nenhuma mudança detectada');
      return;
    }

    if (!token)
    {
      mostrarToast('error', 'Você precisa estar logado para atualizar seus dados');
      return;
    }
    setSalvandoPerfil(true);
    setErrorsPerfil({});

    try
    {
      const resposta = await fetch(`${API_URL}/usuarios/perfil`,
      {
        method: 'PUT',
        headers: headersAutorizados,
        body: JSON.stringify(payloadPerfil),
      });
      const json = await resposta.json();

      if (!resposta.ok)
      {
        throw new Error(json.erro || 'Erro ao atualizar dados');
      }

      // Atualiza contexto com os dados e novo token (backend retorna novos ambos)
      const usuarioAtualizado: Partial<UsuarioDados> = {
        ...(json.usuario || {}),
      };
      atualizarDadosUsuario({
        ...usuarioAtualizado,
        token: json.token,
      });
      // Atualiza snapshot com os dados salvos (para próximas validações)
      setSnapshotPerfil(payloadPerfil);
      mostrarToast('success', json.mensagem || 'Dados atualizados com sucesso');
    }
    catch (erro: any)
    {
      mostrarToast('error', erro?.message || 'Erro ao atualizar dados');
    }
    finally
    {
      setSalvandoPerfil(false);
    }
  };

  const handleSalvarSenha = async (e: React.FormEvent) =>
  {
    e.preventDefault();

    const senhaAtualVazia = !senhaAtual.trim();
    const novaVazia = !novaSenha.trim();
    const confVazia = !confirmacaoNovaSenha.trim();
    if (senhaAtualVazia && novaVazia && confVazia)
    {
      mostrarToast('info', 'Nenhuma mudança detectada');
      return;
    }

    if (!validarSenha()) return;
    if (!token)
    {
      mostrarToast('error', 'Você precisa estar logado para alterar sua senha');
      return;
    }
    setSalvandoSenha(true);

    try
    {
      const resposta = await fetch(`${API_URL}/usuarios/senha`,
      {
        method: 'PUT',
        headers: headersAutorizados,
        body: JSON.stringify({
          senhaAtual,
          novaSenha,
          confirmacaoNovaSenha,
        }),
      });
      const json = await resposta.json();

      if (!resposta.ok)
      {
        let mensagem = json.erro || 'Erro ao alterar senha';
        // Traduz a mensagem do backend conforme especificado
        if (/senha atual/i.test(mensagem) && /incorreta|invalida|inválida/i.test(mensagem))
        {
          mensagem = 'Senha errada tente novamente';
        }
        throw new Error(mensagem);
      }

      limparFormSenha();
      mostrarToast('success', json.mensagem || 'Senha alterada com sucesso');
    }
    catch (erro: any)
    {
      mostrarToast('error', erro?.message || 'Erro ao alterar senha');
    }
    finally
    {
      setSalvandoSenha(false);
    }
  };

  if (!usuario)
  {
    return (
      <>
        <PageTitle>Carregando...</PageTitle>
      </>
    );
  }

  return (
    <>
      <ToastMessage
        variant={toastVariant}
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <Eyebrow>Conta</Eyebrow>
      <PageTitle>Configurações</PageTitle>
      <PageSubtitle>Atualize seus dados de perfil e sua senha de acesso</PageSubtitle>

      <CardsGrid>
        {/* ================= CARD 1: DADOS DO PERFIL ================= */}
        <ConfigCard title="Dados do perfil">
          <AvatarDisplay
            nome={usuario.nome}
            subInfo={subInfoUsuario || 'Cliente desde ' + formatarDataBR(usuario.dataCadastro)}
            size="lg"
            bg="var(--pl-navy)"
          />

          <form onSubmit={handleSalvarPerfil} noValidate>
            <Row>
              <FormField
                label="Nome completo"
                name="nome"
                placeholder="Digite seu nome / razão social"
                required
                maxLength={70}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                error={errorsPerfil.nome}
              />
              <FormField
                label="E-mail"
                name="email"
                type="email"
                placeholder="voce@exemplo.com.br"
                required
                maxLength={70}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errorsPerfil.email}
              />
            </Row>

            <Row>
              <FormSelect
                label="Tipo de cadastro"
                name="tipo"
                value={tipoPessoa}
                onChange={(e) => setTipoPessoa(e.target.value as 'PF' | 'PJ')}
                options={[
                  { value: 'PF', label: 'Pessoa Física' },
                  { value: 'PJ', label: 'Empresa' },
                ]}
              />
              <FormField
                label={tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}
                name="doc"
                placeholder={tipoPessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                required
                maxLength={tipoPessoa === 'PF' ? 14 : 18}
                value={tipoPessoa === 'PF' ? maskCPF(cpf) : maskCNPJ(cnpj)}
                onChange={(e) =>
                  tipoPessoa === 'PF' ? setCpf(e.target.value) : setCnpj(e.target.value)
                }
                error={tipoPessoa === 'PF' ? errorsPerfil.cpf : errorsPerfil.cnpj}
              />
              <FormField
                label="Telefone"
                name="telefone"
                placeholder="(00) 00000-0000"
                required
                maxLength={15}
                value={maskTelefone(telefone)}
                onChange={(e) => setTelefone(e.target.value)}
                error={errorsPerfil.telefone}
              />
            </Row>

            {tipoPessoa === 'PF' && (
              <Row>
                <FormField
                  label="Data de nascimento"
                  name="dataNascimento"
                  type="date"
                  required
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  error={errorsPerfil.dataNascimento}
                />
                <FormField
                  label="Função"
                  name="funcao"
                  placeholder="Ex: Gerente de Vendas"
                  required
                  maxLength={70}
                  value={funcao}
                  onChange={(e) => setFuncao(e.target.value)}
                  error={errorsPerfil.funcao}
                />
                <FormField
                  label="Setor"
                  name="setor"
                  placeholder="Ex: Tecnologia"
                  required
                  maxLength={70}
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  error={errorsPerfil.setor}
                />
              </Row>
            )}

            {tipoPessoa === 'PJ' && (
              <Row>
                <FormField
                  label="Setor"
                  name="setor"
                  placeholder="Ex: Tecnologia"
                  required
                  maxLength={70}
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  error={errorsPerfil.setor}
                />
              </Row>
            )}

            <ButtonsRow>
              <SubmitButton type="submit" disabled={salvandoPerfil}>
                {salvandoPerfil ? 'Salvando...' : 'Salvar alterações'}
              </SubmitButton>
              <SubmitButton
                type="button"
                $variant="ghost"
                onClick={descartarPerfil}
                disabled={salvandoPerfil}
              >
                Descartar
              </SubmitButton>
            </ButtonsRow>
          </form>
        </ConfigCard>

        {/* ================= CARD 2: ALTERAR SENHA ================= */}
        <ConfigCard title="Alterar senha">
          <form onSubmit={handleSalvarSenha} noValidate>
            <FormField
              label="Senha atual"
              name="senhaAtual"
              type={showSenhaAtual ? 'text' : 'password'}
              placeholder="Digite sua senha atual"
              required
              maxLength={8}
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              error={errorsSenha.senhaAtual}
              suffix={
                <PasswordEyeButton
                  visualizando={showSenhaAtual}
                  onClick={() => setShowSenhaAtual((v) => !v)}
                />
              }
            />
            <FormField
              label="Nova senha"
              name="novaSenha"
              type={showNovaSenha ? 'text' : 'password'}
              placeholder="Crie uma nova senha"
              required
              maxLength={8}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              error={errorsSenha.novaSenha}
              helperText="Mínimo de 6, máximo de 8 caracteres, pelo menos 1 letra."
              suffix={
                <PasswordEyeButton
                  visualizando={showNovaSenha}
                  onClick={() => setShowNovaSenha((v) => !v)}
                />
              }
            />
            <FormField
              label="Repita a nova senha"
              name="confirmacaoNovaSenha"
              type={showConfirmacaoNovaSenha ? 'text' : 'password'}
              placeholder="Digite a nova senha novamente"
              required
              maxLength={8}
              value={confirmacaoNovaSenha}
              onChange={(e) => setConfirmacaoNovaSenha(e.target.value)}
              error={errorsSenha.confirmacaoNovaSenha}
              suffix={
                <PasswordEyeButton
                  visualizando={showConfirmacaoNovaSenha}
                  onClick={() => setShowConfirmacaoNovaSenha((v) => !v)}
                />
              }
            />

            <SubmitButton type="submit" $fullWidth disabled={salvandoSenha} $variant="primary">
              {salvandoSenha ? 'Atualizando...' : 'Atualizar senha'}
            </SubmitButton>
          </form>
        </ConfigCard>
      </CardsGrid>
    </>
  );
};

export default Configuracoes;
