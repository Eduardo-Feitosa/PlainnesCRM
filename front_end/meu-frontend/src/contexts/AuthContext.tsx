import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';

export type PapelUsuario = 'user' | 'admin';

export interface UsuarioDados {
  id: string;
  nome: string;
  email: string;
  tipo: 'PF' | 'PJ';
  role?: PapelUsuario;
  telefone?: string;
  setor?: string;
  funcao?: string;
  cpf?: string | null;
  cnpj?: string | null;
  dataNascimento?: string | null;
  dataCadastro?: string | null;
  tipoPerfil?: 'publico' | 'privado' | null;
  codigo?: number | null;
}

interface AuthContextData {
  usuario: UsuarioDados | null;
  token: string | null;
  autenticado: boolean;
  carregando: boolean;
  login: (token: string, usuario: UsuarioDados) => void;
  logout: () => void;
  atualizarDadosUsuario: (novosDados: Partial<UsuarioDados> & { token?: string }) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// ============================================
// HELPERS PARA LOCALSTORAGE
// ============================================

const STORAGE_KEYS = {
  token: 'token',
  id: 'usuario_id',
  nome: 'usuario_nome',
  email: 'usuario_email',
  tipo: 'usuario_tipo',
  role: 'usuario_role',
  telefone: 'usuario_telefone',
  setor: 'usuario_setor',
  funcao: 'usuario_funcao',
  cpf: 'usuario_cpf',
  cnpj: 'usuario_cnpj',
  dataNascimento: 'usuario_data_nascimento',
  dataCadastro: 'usuario_data_cadastro',
  tipoPerfil: 'usuario_tipo_perfil',
  codigo: 'usuario_codigo',
};

const salvarItem = (chave: string, valor?: string | null) =>
{
  if (valor !== undefined && valor !== null && valor !== '')
  {
    localStorage.setItem(chave, valor);
  }
  else
  {
    localStorage.removeItem(chave);
  }
};

const limparStorage = () =>
{
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
};

const restaurarUsuarioDoStorage = (): UsuarioDados | null =>
{
  const token = localStorage.getItem(STORAGE_KEYS.token);
  const id = localStorage.getItem(STORAGE_KEYS.id);
  const nome = localStorage.getItem(STORAGE_KEYS.nome);
  const email = localStorage.getItem(STORAGE_KEYS.email);
  const tipo = localStorage.getItem(STORAGE_KEYS.tipo) as 'PF' | 'PJ' | null;
  const roleRaw = localStorage.getItem(STORAGE_KEYS.role) as PapelUsuario | null;

  if (!token || !id || !nome || !email || !tipo) return null;

  const roleValidos: PapelUsuario[] = ['user', 'admin'];
  const role: PapelUsuario = (roleRaw && roleValidos.includes(roleRaw))
    ? roleRaw
    // Sessão criada ANTES da coluna role existir (legada):
    // Não invalidamos o login do usuário, mas marcamos temporariamente user.
    // No próximo login de credenciais o backend retorna role real do banco e
    // substitui aqui.
    : 'user';

  return {
    id,
    nome,
    email,
    tipo,
    role,
    telefone: localStorage.getItem(STORAGE_KEYS.telefone) || undefined,
    setor: localStorage.getItem(STORAGE_KEYS.setor) || undefined,
    funcao: localStorage.getItem(STORAGE_KEYS.funcao) || undefined,
    cpf: localStorage.getItem(STORAGE_KEYS.cpf) || null,
    cnpj: localStorage.getItem(STORAGE_KEYS.cnpj) || null,
    dataNascimento: localStorage.getItem(STORAGE_KEYS.dataNascimento) || null,
    dataCadastro: localStorage.getItem(STORAGE_KEYS.dataCadastro) || null,
    tipoPerfil: (localStorage.getItem(STORAGE_KEYS.tipoPerfil) as 'publico' | 'privado' | null) || null,
    codigo: localStorage.getItem(STORAGE_KEYS.codigo) ? Number(localStorage.getItem(STORAGE_KEYS.codigo)) : null,
  };
};

// ============================================
// PROVIDER
// ============================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) =>
{
  const [usuario, setUsuario] = useState<UsuarioDados | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() =>
  {
    const restaurado = restaurarUsuarioDoStorage();
    if (restaurado)
    {
      setToken(localStorage.getItem(STORAGE_KEYS.token));
      setUsuario(restaurado);
    }
    setCarregando(false);
  }, []);

  const login = useCallback((novoToken: string, novoUsuario: UsuarioDados) =>
  {
    salvarItem(STORAGE_KEYS.token, novoToken);
    salvarItem(STORAGE_KEYS.id, novoUsuario.id);
    salvarItem(STORAGE_KEYS.nome, novoUsuario.nome);
    salvarItem(STORAGE_KEYS.email, novoUsuario.email);
    salvarItem(STORAGE_KEYS.tipo, novoUsuario.tipo);
    salvarItem(STORAGE_KEYS.role, novoUsuario.role);
    salvarItem(STORAGE_KEYS.telefone, novoUsuario.telefone);
    salvarItem(STORAGE_KEYS.setor, novoUsuario.setor);
    salvarItem(STORAGE_KEYS.funcao, novoUsuario.funcao);
    salvarItem(STORAGE_KEYS.cpf, novoUsuario.cpf);
    salvarItem(STORAGE_KEYS.cnpj, novoUsuario.cnpj);
    salvarItem(STORAGE_KEYS.dataNascimento, novoUsuario.dataNascimento);
    salvarItem(STORAGE_KEYS.dataCadastro, novoUsuario.dataCadastro);
    salvarItem(STORAGE_KEYS.tipoPerfil, novoUsuario.tipoPerfil);
    salvarItem(STORAGE_KEYS.codigo, novoUsuario.codigo ? String(novoUsuario.codigo) : null);

    setToken(novoToken);
    setUsuario(novoUsuario);
  }, []);

  const atualizarDadosUsuario = useCallback((novosDados: Partial<UsuarioDados> & { token?: string }) =>
  {
    setUsuario((atual) =>
    {
      if (!atual) return atual;
      const mesclado: UsuarioDados = { ...atual, ...novosDados };

      salvarItem(STORAGE_KEYS.id, mesclado.id);
      salvarItem(STORAGE_KEYS.nome, mesclado.nome);
      salvarItem(STORAGE_KEYS.email, mesclado.email);
      salvarItem(STORAGE_KEYS.tipo, mesclado.tipo);
      salvarItem(STORAGE_KEYS.role, mesclado.role);
      salvarItem(STORAGE_KEYS.telefone, mesclado.telefone);
      salvarItem(STORAGE_KEYS.setor, mesclado.setor);
      salvarItem(STORAGE_KEYS.funcao, mesclado.funcao);
      salvarItem(STORAGE_KEYS.cpf, mesclado.cpf);
      salvarItem(STORAGE_KEYS.cnpj, mesclado.cnpj);
      salvarItem(STORAGE_KEYS.dataNascimento, mesclado.dataNascimento);
      salvarItem(STORAGE_KEYS.dataCadastro, mesclado.dataCadastro);
      salvarItem(STORAGE_KEYS.tipoPerfil, mesclado.tipoPerfil);
      salvarItem(STORAGE_KEYS.codigo, mesclado.codigo ? String(mesclado.codigo) : null);

      return mesclado;
    });

    if (novosDados.token)
    {
      salvarItem(STORAGE_KEYS.token, novosDados.token);
      setToken(novosDados.token);
    }
  }, []);

  const logout = useCallback(() =>
  {
    limparStorage();
    setToken(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        autenticado: !!usuario && !!token,
        carregando,
        login,
        logout,
        atualizarDadosUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextData
{
  const context = useContext(AuthContext);
  if (!context)
  {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
