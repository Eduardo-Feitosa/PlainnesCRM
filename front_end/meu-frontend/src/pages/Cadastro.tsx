import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// import logo PNG com Vite ?inline → EMBUTIDO como base64 no bundle
// (0ms de carregamento, 0 requisições HTTP, idêntico ao arquivo original)
import logo from '../assets/LogotipoCadastro.png?inline';
import iconeCadastro from '../assets/IconeCadastroJovemComLaptop.png';

// ============================================
// STYLED COMPONENTS
// ============================================

const PageWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  min-height: 100vh;
  background-color: #ffffff;
  width: 100vw;
  font-family: 'Inter', sans-serif;
  overflow-y: auto;
  padding: 40px 20px;
  box-sizing: border-box;
`;

const BackButton = styled(Link)`
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  color: white;
`;

const HomeButton = styled.button`
  background-color: #3a367c;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 24px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  position: absolute;
  right: 40px;
  top: 50px;
  &:hover {
    background-color: #2d2b61;
  }
`;

const IconLeft = styled.img`
  position: fixed;
  left: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
`;

const TitleWrapper = styled.div`
  position: relative;
  text-align: center;
  margin-top: 50px;
  z-index: 2;
  margin-bottom: 30px;
`;

const MainTitle = styled.div`
  font-size: 50px;
  font-weight: 700;
  color: #1a1a1a;
`;

const SubTitle = styled.div`
  font-size: 30px;
  font-weight: 400;
  color: #1a1a1a;
`;

const LogoContainer = styled.div`
  position: absolute;
  left: 20px;
  top: 20px;
`;

const LogoImage = styled.img`
  position: relative;
  top: 12px;
  left: 22px;
  object-fit: contain;
  pointer-events: none;
  z-index: 0;
  user-select: none;
  display: inline-block;
  height: 70px;
  width: auto;
`;

const Form = styled.form`
  position: relative;
  z-index: 1;
  background-color: white;
  padding: 40px;
  width: 100%;
  max-width: 900px;
  box-sizing: border-box;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  margin-bottom: 20px;
`;

const FieldGroup = styled.div<{ flex?: number }>`
  width: 100%;
  max-width: 400px;
  flex: ${({ flex }) => flex || '1 1 300px'};
`;

const FullWidthGroup = styled.div`
  width: 100%;
  max-width: 820px;
`;

const StyledInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  height: 55px;
  padding: 0 20px;
  background-color: #d9d9d9;
  border: ${({ $hasError }) => ($hasError ? '1px solid #ff0000' : 'none')};
  border-radius: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
  outline: none;

  &:focus {
    border-color: #3f5fff;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  height: 55px;
  padding: 0 20px;
  background-color: #d9d9d9;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
  outline: none;

  &:focus {
    border: 1px solid #3f5fff;
  }
`;

const ErrorText = styled.div`
  color: #ff0000;
  font-size: 12px;
  margin-top: 5px;
  font-family: 'Inter', sans-serif;
`;

const SubmitButton = styled.button`
  width: 100%;
  max-width: 820px;
  height: 60px;
  background-color: #2c1df4;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1f14c0;
  }
`;

const LoginLink = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #000000;
  font-family: 'Verdana', sans-serif;
  font-size: 16px;
  margin: 0;
`;

const StyledLink = styled(Link)`
  font-weight: bold;
  color: #3f5fff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

// ============================================
// FUNÇÕES DE MÁSCARA
// ============================================

const maskCPF = (value: string): string =>
{
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const maskCNPJ = (value: string): string => 
{
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

const maskTelefone = (value: string): string => 
{
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const API_URL = 'http://localhost:3000/api';

const Cadastro = () => 
{
  const navigate = useNavigate();

  const [tipoPessoa, setTipoPessoa] = useState<'PF' | 'PJ'>('PF');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [funcao, setFuncao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [setor, setSetor] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ===== VALIDAÇÕES =====
  const validarCPF = (cpf: string): boolean => 
  {
    const cpfLimpo = cpf.replace(/\D/g, '');
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
    const cnpjLimpo = cnpj.replace(/\D/g, '');
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

  const validarCampos = (): boolean => 
  {
    const novosErros: { [key: string]: string } = {};

    // Campos comuns
    if (!nome.trim()) novosErros.nome = 'Nome completo / Razão social é obrigatório';
    else if (nome.trim().length < 3) novosErros.nome = 'Nome deve ter pelo menos 3 caracteres';

    if (!email.trim()) novosErros.email = 'Email é obrigatório';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) 
    {
      novosErros.email = 'Email inválido';
    }

    if (!senha.trim()) novosErros.senha = 'Senha é obrigatória';
    else if (senha.length < 6) novosErros.senha = 'Senha deve ter pelo menos 6 caracteres';
    else if (senha.length > 8) novosErros.senha = 'Senha deve ter no máximo 8 caracteres';
    else if (!/[A-Za-z]/.test(senha)) novosErros.senha = 'Senha deve conter pelo menos 1 letra';

    // Validações específicas por tipo
    if (tipoPessoa === 'PF') 
    {
      if (!cpf.trim()) novosErros.cpf = 'CPF é obrigatório';
      else if (!validarCPF(cpf)) novosErros.cpf = 'CPF inválido';

      if (!dataNascimento) novosErros.dataNascimento = 'Data de nascimento é obrigatória';
      else if (!validarIdade(dataNascimento)) {
        novosErros.dataNascimento = 'Você deve ter pelo menos 18 anos';
      }

      if (!funcao.trim()) novosErros.funcao = 'Função é obrigatória';
      else if (funcao.trim().length < 2) novosErros.funcao = 'Função deve ter pelo menos 2 caracteres';
    } else {
      // PJ
      if (!cnpj.trim()) novosErros.cnpj = 'CNPJ é obrigatório';
      else if (!validarCNPJ(cnpj)) novosErros.cnpj = 'CNPJ inválido';
    }

    // Telefone (comum)
    if (!telefone.trim()) novosErros.telefone = 'Telefone é obrigatório';
    else {
      const digits = telefone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 11) {
        novosErros.telefone = 'Telefone inválido. Use (XX) XXXXX-XXXX ou (XX) XXXX-XXXX';
      }
    }

    // Setor (comum)
    if (!setor.trim()) novosErros.setor = 'Setor é obrigatório';
    else if (setor.trim().length < 2) novosErros.setor = 'Setor deve ter pelo menos 2 caracteres';

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // ===== SUBMISSÃO =====
 // ===== SUBMISSÃO (COM BACKEND) =====
 // ============================================

const handleSubmit = async (e: React.FormEvent) => 
  {
  e.preventDefault();
  if (!validarCampos()) return;

  // Monta o objeto com os dados que o backend espera
  const dados = 
  {
    nome: nome.trim(),
    email: email.trim(),
    senha,
    tipo: tipoPessoa,
    telefone: telefone.replace(/\D/g, ''),
    setor: setor.trim(),
    ...(tipoPessoa === 'PF'
      ? { 
          cpf: cpf.replace(/\D/g, ''), 
          dataNascimento, 
          funcao: funcao.trim() 
        }
      : { 
          cnpj: cnpj.replace(/\D/g, '') 
        }
    )
  };

  try {
    const resposta = await fetch(`${API_URL}/auth/cadastrar`, 
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const dadosResposta = await resposta.json();

    if (!resposta.ok) 
    {
      // Se o backend retornou erro (400, 500, etc.)
      throw new Error(dadosResposta.erro || 'Erro ao cadastrar');
    }

    alert(dadosResposta.mensagem || 'Cadastro realizado com sucesso!');
    navigate('/login');
  } catch (erro: any) 
  {
    alert(erro.message);
  }
};

  // ============================================
  // RENDER
  // ============================================
  return (
    <PageWrapper>
      <HomeButton>
        <BackButton to="/">Início</BackButton>
      </HomeButton>

      <IconLeft src={iconeCadastro} alt="Ícone Cadastro" />

      <TitleWrapper>
        <MainTitle>Bem-vindo!</MainTitle>
        <SubTitle>Inicie seu cadastramento aqui</SubTitle>
      </TitleWrapper>

      <LogoContainer>
        <LogoImage
          src={logo}
          alt="PlainnessCRM Logotipo"
          loading="eager"
          decoding="sync"
        />
      </LogoContainer>

      <Form onSubmit={handleSubmit}>
        {/* Nome e Email */}
        <Row>
          <FieldGroup>
            <StyledInput
              type="text"
              placeholder="Nome completo / Razão social"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              $hasError={!!errors.nome}
              maxLength={70}
            />
            {errors.nome && <ErrorText>{errors.nome}</ErrorText>}
          </FieldGroup>
          <FieldGroup>
            <StyledInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              $hasError={!!errors.email}
              maxLength={70}
            />
            {errors.email && <ErrorText>{errors.email}</ErrorText>}
          </FieldGroup>
        </Row>

        {/* Senha */}
        <Row>
          <FullWidthGroup>
            <StyledInput
              type="password"
              placeholder="Senha"
              maxLength={8}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              $hasError={!!errors.senha}
            />
            {errors.senha && <ErrorText>{errors.senha}</ErrorText>}
          </FullWidthGroup>
        </Row>

        {/* Tipo de Pessoa */}
        <Row>
          <FullWidthGroup>
            <StyledSelect
              value={tipoPessoa}
              onChange={(e) => setTipoPessoa(e.target.value as 'PF' | 'PJ')}
            >
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Empresa</option>
            </StyledSelect>
          </FullWidthGroup>
        </Row>

        {/* PF - CPF, Data Nascimento e Função */}
        {tipoPessoa === 'PF' && (
          <>
            <Row>
              <FieldGroup>
                <StyledInput
                  type="text"
                  placeholder="CPF"
                  maxLength={14}
                  value={maskCPF(cpf)}
                  onChange={(e) => setCpf(e.target.value)}
                  $hasError={!!errors.cpf}
                />
                {errors.cpf && <ErrorText>{errors.cpf}</ErrorText>}
              </FieldGroup>
              <FieldGroup>
                <StyledInput
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  $hasError={!!errors.dataNascimento}
                />
                {errors.dataNascimento && <ErrorText>{errors.dataNascimento}</ErrorText>}
              </FieldGroup>
            </Row>
            <Row>
              <FullWidthGroup>
                <StyledInput
                  type="text"
                  placeholder="Função"
                  maxLength={70}
                  value={funcao}
                  onChange={(e) => setFuncao(e.target.value)}
                  $hasError={!!errors.funcao}
                />
                {errors.funcao && <ErrorText>{errors.funcao}</ErrorText>}
              </FullWidthGroup>
            </Row>
          </>
        )}

        {/* PJ - CNPJ (com máscara) */}
        {tipoPessoa === 'PJ' && (
          <Row>
            <FullWidthGroup>
              <StyledInput
                type="text"
                placeholder="CNPJ"
                maxLength={18}
                value={maskCNPJ(cnpj)}
                onChange={(e) => setCnpj(e.target.value)}
                $hasError={!!errors.cnpj}
              />
              {errors.cnpj && <ErrorText>{errors.cnpj}</ErrorText>}
            </FullWidthGroup>
          </Row>
        )}

        {/* Telefone (com máscara) */}
        <Row>
          <FullWidthGroup>
            <StyledInput
              type="text"
              placeholder="Telefone"
              maxLength={15}
              value={maskTelefone(telefone)}
              onChange={(e) => setTelefone(e.target.value)}
              $hasError={!!errors.telefone}
            />
            {errors.telefone && <ErrorText>{errors.telefone}</ErrorText>}
          </FullWidthGroup>
        </Row>

        {/* Setor */}
        <Row>
          <FullWidthGroup>
            <StyledInput
              type="text"
              placeholder="Setor"
              maxLength={70}
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              $hasError={!!errors.setor}
            />
            {errors.setor && <ErrorText>{errors.setor}</ErrorText>}
          </FullWidthGroup>
        </Row>

        <Row>
          <FullWidthGroup>
            <SubmitButton type="submit">Cadastrar</SubmitButton>
          </FullWidthGroup>
        </Row>

        <LoginLink>
          Já tem conta? <StyledLink to="/login">Faça login</StyledLink>
        </LoginLink>
      </Form>
    </PageWrapper>
  );
};

export default Cadastro;