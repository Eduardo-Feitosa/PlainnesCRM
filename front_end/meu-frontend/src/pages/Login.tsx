import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth, type UsuarioDados } from '../contexts/AuthContext';
// import logo PNG com Vite ?inline → EMBUTIDO como base64 no bundle
// (0ms de carregamento, 0 requisições HTTP, idêntico ao arquivo original)
import logo from '../assets/LogotipoLogin.png?inline';

const API_URL = 'http://localhost:3000/api';

const PageWrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  font-family: 'Inter', sans-serif;
`;

const Logo = styled.img`
  height: 48px;
  width: auto;
  margin-bottom: 40px;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  display: inline-block;
`;

const BackButton = styled(Link)`
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  color: white;
`;

const BackButtonStyled = styled.button`
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

const Form = styled.form`
  width: 100%;
  max-width: 400px;
  padding: 40px;
  text-align: center;
`;

const Title = styled.h1<{ $hasError?: boolean }>`
  color: #3a367c;
  font-size: 28px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  margin-bottom: ${({ $hasError }) => ($hasError ? '16px' : '48px')};
`;

const ErrorMessage = styled.div`
  color: #ff0000;
  font-size: 14px;
  margin-bottom: 24px;
  font-family: 'Inter', sans-serif;
`;

const InputWrapper = styled.div`
  margin-bottom: 16px;
  text-align: left;
`;

const StyledInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 16px 20px;
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

const ErrorText = styled.div`
  color: #ff0000;
  font-size: 12px;
  margin-top: 5px;
  font-family: 'Inter', sans-serif;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 16px 20px;
  background-color: #2c1df4;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1f14c0;
  }
`;

const Divider = styled.hr`
  margin-top: 32px;
  margin-bottom: 24px;
  border: none;
  height: 2px;
  background-color: #000000;
  width: 100%;
`;

const RegisterText = styled.p`
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

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validarCampos = (): boolean => {
    const novosErros: { [key: string]: string } = {};

    if (!email.trim())
    {
      novosErros.email = 'Email é obrigatório';
    }
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      novosErros.email = 'Email inválido';
    }

    if (!senha.trim())
    {
      novosErros.senha = 'Senha é obrigatória';
    }
    else if (senha.length < 6)
    {
      novosErros.senha = 'Senha deve ter pelo menos 6 caracteres';
    }
    else if (senha.length > 8)
    {
      novosErros.senha = 'Senha deve ter no máximo 8 caracteres';
    }
    else if (!/[A-Za-z]/.test(senha))
    {
      novosErros.senha = 'Senha deve conter pelo menos 1 letra';
    }

    setErrors(novosErros);
    setErro('');
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validarCampos()) return;

    try {
      const resposta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          senha: senha
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro ao fazer login');
      }

      const usuarioDados: UsuarioDados = {
        id: String(dados.usuario.id),
        nome: dados.usuario.nome,
        email: dados.usuario.email,
        tipo: dados.usuario.tipo,
        role: dados.usuario.role || 'user',
        telefone: dados.usuario.telefone,
        setor: dados.usuario.setor,
        funcao: dados.usuario.funcao,
        cpf: dados.usuario.cpf ?? null,
        cnpj: dados.usuario.cnpj ?? null,
        dataNascimento: dados.usuario.dataNascimento ?? null,
        dataCadastro: dados.usuario.dataCadastro ?? null,
      };

      login(dados.token, usuarioDados);

      alert(dados.mensagem || 'Login realizado com sucesso!');

      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      navigate(from || '/dashboard', { replace: true });
    } catch (erro: any) {
      setErro(erro.message);
    }
  };

  const hasError = Object.keys(errors).length > 0 || !!erro;

  return (
    <PageWrapper>
      <BackButton to="/">
        <BackButtonStyled>Voltar</BackButtonStyled>
      </BackButton>

      <Form onSubmit={handleSubmit}>
        <Logo src={logo} alt="PlainnessCRM Logotipo" loading="eager" decoding="sync" />

        <Title $hasError={hasError}>Login</Title>

        {erro && <ErrorMessage>{erro}</ErrorMessage>}

        <InputWrapper>
          <StyledInput
            type="email"
            placeholder="Email"
            maxLength={70}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            $hasError={!!errors.email}
          />
          {errors.email && <ErrorText>{errors.email}</ErrorText>}
        </InputWrapper>

        <InputWrapper>
          <StyledInput
            type="password"
            placeholder="Senha"
            maxLength={8}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            $hasError={!!errors.senha}
          />
          {errors.senha && <ErrorText>{errors.senha}</ErrorText>}
        </InputWrapper>

        <SubmitButton type="submit">Logar</SubmitButton>

        <Divider />

        <RegisterText>
          Não tem uma conta? <StyledLink to="/cadastro">cadastre-se</StyledLink>
        </RegisterText>
      </Form>
    </PageWrapper>
  );
};

export default Login;
