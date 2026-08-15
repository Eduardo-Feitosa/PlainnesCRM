// src/controllers/UsuarioController.js

// Importa o modelo do usuário (para acessar o banco)
const modeloUsuario = require('../models/Usuario');
// Importa a função que gera o token JWT
const { gerarToken } = require('../config/jwt');
// Importa a biblioteca de validação de dados
const Joi = require('joi');

const ROLES_VALIDOS = ['user', 'admin'];
function normalizarRole(valorBruto)
{
  const s = (valorBruto == null ? '' : String(valorBruto)).trim().toLowerCase();
  if (ROLES_VALIDOS.includes(s)) return s;
  return null;
}

// ========================================
// 1. REGRAS (SCHEMAS) PARA VALIDAR OS DADOS
// ========================================

// Esquema de validação para o CADASTRO
const esquemaCadastro = Joi.object
({
        nome: Joi.string().min(3).max(70).required(),
        email: Joi.string().email().required(),
        senha: Joi.string().min(6).max(8).required(),
        tipo: Joi.string().valid('PF', 'PJ').required(),
        telefone: Joi.string().min(10).max(15).required(),
        setor: Joi.string().min(2).max(70).required(),
        cpf: Joi.string().length(11).when('tipo', { is: 'PF', then: Joi.required(), otherwise: Joi.allow(null, '') }),
        dataNascimento: Joi.date().when('tipo', { is: 'PF', then: Joi.required(), otherwise: Joi.allow(null) }),
        funcao: Joi.string().min(2).max(70).when('tipo', { is: 'PF', then: Joi.required(), otherwise: Joi.forbidden().error(() => new Error('Função não é permitido para Pessoa Jurídica')) }),
        cnpj: Joi.string().length(14).when('tipo', { is: 'PJ', then: Joi.required(), otherwise: Joi.allow(null, '') }),
});

// Esquema de validação para o LOGIN
const esquemaLogin = 
Joi.object
({
        email: Joi.string().email().required(),
        senha: Joi.string().min(6).max(8).required(), // ✅ Correto,
});

// Esquema de validação para ATUALIZAR DADOS DO PERFIL
const esquemaAtualizarDados = Joi.object
({
        nome: Joi.string().min(3).max(70).required(),
        email: Joi.string().email().max(70).required(),
        tipo: Joi.string().valid('PF', 'PJ').required(),
        telefone: Joi.string().min(10).max(15).required(),
        setor: Joi.string().min(2).max(70).required(),
        cpf: Joi.string().length(11).when('tipo', { is: 'PF', then: Joi.required(), otherwise: Joi.allow(null, '') }),
        dataNascimento: Joi.date().when('tipo', { is: 'PF', then: Joi.required(), otherwise: Joi.allow(null) }),
        funcao: Joi.string().min(2).max(70).when('tipo', { is: 'PF', then: Joi.required(), otherwise: Joi.forbidden().error(() => new Error('Função não é permitido para Pessoa Jurídica')) }),
        cnpj: Joi.string().length(14).when('tipo', { is: 'PJ', then: Joi.required(), otherwise: Joi.allow(null, '') }),
});

// Esquema de validação para ATUALIZAR SENHA
const esquemaAtualizarSenha = Joi.object
({
        senhaAtual: Joi.string().min(6).max(8).required(),
        novaSenha: Joi.string().min(6).max(8).pattern(/[A-Za-z]/).required()
                .messages({
                    'string.pattern.base': 'Nova senha deve conter pelo menos 1 letra'
                }),
        confirmacaoNovaSenha: Joi.string().min(6).max(8).required(),
});

// ========================================
// 2. FUNÇÃO PARA CADASTRAR (register)
// ========================================
const cadastrar = async (req, res) => 
{
  try 
  {
    // Passo 1: Validar os dados recebidos
    const { error } = esquemaCadastro.validate(req.body);
    if (error) 
    {
      return res.status(400).json({ erro: error.details[0].message });
    }

    // Extrair os dados do corpo da requisição
    let { nome, email, senha, tipo, telefone, setor, cpf, dataNascimento, funcao, cnpj } = req.body;

    // Garante que campos proibidos por tipo sejam NULL mesmo que enviados via request
    if (tipo === 'PF') {
      cnpj = null;
    } else {
      cpf = null;
      dataNascimento = null;
      funcao = null;
    }

    // Passo 2: Verificar se o email já existe
    if (await modeloUsuario.emailJaExiste(email)) 
    {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    // Passo 3: Verificar CPF (se for PF) ou CNPJ (se for PJ)
    if (tipo === 'PF') 
    {
      if (await modeloUsuario.cpfJaExiste(cpf)) 
      {
        return res.status(400).json({ erro: 'CPF já cadastrado' });
      }
    } else {
      if (await modeloUsuario.cnpjJaExiste(cnpj)) {
        return res.status(400).json({ erro: 'CNPJ já cadastrado' });
      }
    }

    // Passo 4: Chamar o model para criar o usuário
    const id = await modeloUsuario.criar
    ({
      nome, email, senha, tipo, telefone, setor, cpf, dataNascimento, funcao, cnpj
    });

    // Passo 5: Responder com sucesso
    res.status(201).json
    ({
      mensagem: 'Usuário cadastrado com sucesso!',
      id: id,
      email: email,
      nome: nome
     });

  } 
  catch (error) {
    console.error('❌ Erro no cadastro:', error);

    // Tratamento para UNIQUE CONSTRAINT do MySQL (evita ER_DUP_ENTRY virar erro 500 genérico)
    if (error && (error.code === 'ER_DUP_ENTRY' || error.errno === 1062))
    {
      const sqlMsg = (error.sqlMessage || '').toString();
      if (/usuario\.email/i.test(sqlMsg))
      {
        return res.status(400).json({ erro: 'Email já cadastrado' });
      }
      if (/cpf/i.test(sqlMsg))
      {
        return res.status(400).json({ erro: 'CPF já cadastrado' });
      }
      if (/cnpj/i.test(sqlMsg))
      {
        return res.status(400).json({ erro: 'CNPJ já cadastrado' });
      }
      return res.status(400).json({ erro: 'Dados duplicados no sistema' });
    }

    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// ========================================
// 3. FUNÇÃO PARA LOGAR (login)
// ========================================
const logar = async (req, res) => 
{
  try {
    // Passo 1: Validar os dados recebidos
    const { error } = esquemaLogin.validate(req.body);
    if (error) 
    {
      return res.status(400).json({ erro: error.details[0].message });
    }

    const { email, senha } = req.body;

    // Passo 2: Buscar o usuário no banco pelo email
    const usuario = await modeloUsuario.buscarPorEmail(email);
    if (!usuario) 
    {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    // Passo 3: Comparar a senha digitada com a do banco
    const senhaConfere = await modeloUsuario.compararSenha(senha, usuario.senha);
    if (!senhaConfere) 
    {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    // HARDENING: Usuário criado fora do cadastro (SQL direto / legado)
    // tem role NULL no banco? Bloqueia login com 401 amigável.
    // Nunca emitimos token JWT para conta SEM papel válido.
    const roleNormalizado = normalizarRole(usuario.role);
    if (!roleNormalizado)
    {
      console.warn(
        '⚠️ login bloqueado: usuário SEM role válida. id=' +
        usuario.id +
        ' email=' +
        usuario.email +
        ' roleBruto=' +
        usuario.role
      );
      return res.status(401).json({
        erro: 'Conta com perfil de acesso inválido. Contate o administrador ou atualize o cadastro diretamente no banco.',
        contaSemRole: true,
      });
    }

    // Passo 4: Gerar o Token JWT com os dados do usuário
    const token = gerarToken
    ({
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      tipo: usuario.tipo,
      role: roleNormalizado,
    });

    // Passo 5: Devolver o token e os dados básicos
    res.json
    ({
      token: token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        role: roleNormalizado,
        telefone: usuario.telefone,
        setor: usuario.setor,
        funcao: usuario.funcao,
        cpf: usuario.cpf || null,
        cnpj: usuario.cnpj || null,
        dataNascimento: usuario.dataNascimento || null,
        dataCadastro: usuario.dataCadastro || null,
      },
      mensagem: 'Login realizado com sucesso!'
    });

  } catch (error) 
  {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// ========================================
// 4. FUNÇÃO PARA ATUALIZAR DADOS DO PERFIL
// ========================================
const atualizarDados = async (req, res) =>
{
  try
  {
    const idUsuarioLogado = req.usuario.id;

    // Passo 1: Validar os dados recebidos
    const { error } = esquemaAtualizarDados.validate(req.body);
    if (error)
    {
      return res.status(400).json({ erro: error.details[0].message });
    }

    let { nome, email, tipo, telefone, setor, cpf, dataNascimento, funcao, cnpj } = req.body;

    // Garante que campos proibidos por tipo sejam NULL mesmo que enviados via request
    if (tipo === 'PF') {
      cnpj = null;
    } else {
      cpf = null;
      dataNascimento = null;
      funcao = null;
    }

    // Passo 2: Buscar o usuário no banco (garante que existe)
    const usuario = await modeloUsuario.buscarPorId(idUsuarioLogado);
    if (!usuario)
    {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Passo 3: Verificar se o email já existe, mas ignorando o próprio usuário
    if (await modeloUsuario.emailJaExiste(email, idUsuarioLogado))
    {
      return res.status(400).json({ erro: 'Email já cadastrado por outro usuário' });
    }

    // Passo 4: Verificar CPF/CNPJ duplicado, ignorando o próprio usuário
    if (tipo === 'PF')
    {
      if (await modeloUsuario.cpfJaExiste(cpf, idUsuarioLogado))
      {
        return res.status(400).json({ erro: 'CPF já cadastrado por outro usuário' });
      }
    }
    else
    {
      if (await modeloUsuario.cnpjJaExiste(cnpj, idUsuarioLogado))
      {
        return res.status(400).json({ erro: 'CNPJ já cadastrado por outro usuário' });
      }
    }

    // Passo 5: Chamar o model para atualizar
    const atualizou = await modeloUsuario.atualizarDados(idUsuarioLogado,
      {
        nome, email, tipo, telefone, setor, cpf, dataNascimento, funcao, cnpj
      });

    if (!atualizou)
    {
      return res.status(500).json({ erro: 'Falha ao atualizar os dados' });
    }

    // Passo 6: Busca o usuário atualizado para retornar os dados novos
    const usuarioAtualizado = await modeloUsuario.buscarPorId(idUsuarioLogado);

    // Hardening: mesmo após atualizar perfil, garante role válida
    // (nunca enviamos role inválida nem para o frontend)
    const roleNormalizado = normalizarRole(usuarioAtualizado.role) || 'user';

    // Passo 7: Gera um novo token (caso nome/email tenham mudado)
    const novoToken = gerarToken
    ({
      id: usuarioAtualizado.id,
      email: usuarioAtualizado.email,
      nome: usuarioAtualizado.nome,
      tipo: usuarioAtualizado.tipo,
      role: roleNormalizado,
    });

    res.json
    ({
      mensagem: 'Dados atualizados com sucesso!',
      token: novoToken,
      usuario: {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        tipo: usuarioAtualizado.tipo,
        role: roleNormalizado,
        telefone: usuarioAtualizado.telefone,
        setor: usuarioAtualizado.setor,
        funcao: usuarioAtualizado.funcao,
        cpf: usuarioAtualizado.cpf || null,
        cnpj: usuarioAtualizado.cnpj || null,
        dataNascimento: usuarioAtualizado.dataNascimento || null,
      }
    });

  }
  catch (error)
  {
    console.error('❌ Erro ao atualizar dados do usuário:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// ========================================
// 5. FUNÇÃO PARA ATUALIZAR SENHA
// ========================================
const atualizarSenha = async (req, res) =>
{
  try
  {
    const idUsuarioLogado = req.usuario.id;

    // Passo 1: Validar estrutura dos campos
    const { error } = esquemaAtualizarSenha.validate(req.body);
    if (error)
    {
      return res.status(400).json({ erro: error.details[0].message });
    }

    const { senhaAtual, novaSenha, confirmacaoNovaSenha } = req.body;

    // Passo 2: Confirmar que a nova senha bate com a confirmação
    if (novaSenha !== confirmacaoNovaSenha)
    {
      return res.status(400).json({ erro: 'Confirmação de nova senha não confere' });
    }

    // Passo 3: Não permitir que a nova senha seja igual à atual
    if (senhaAtual === novaSenha)
    {
      return res.status(400).json({ erro: 'A nova senha deve ser diferente da senha atual' });
    }

    // Passo 4: Buscar o usuário para comparar senha atual
    const usuario = await modeloUsuario.buscarPorId(idUsuarioLogado);
    if (!usuario)
    {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Passo 5: Verificar se a senha atual informada está correta (bcrypt)
    const senhaAtualConfere = await modeloUsuario.compararSenha(senhaAtual, usuario.senha);
    if (!senhaAtualConfere)
    {
      return res.status(401).json({ erro: 'Senha atual incorreta' });
    }

    // Passo 6: Chamar o model para atualizar a senha (criptografa internamente)
    const atualizou = await modeloUsuario.atualizarSenha(idUsuarioLogado, novaSenha);

    if (!atualizou)
    {
      return res.status(500).json({ erro: 'Falha ao atualizar a senha' });
    }

    res.json
    ({
      mensagem: 'Senha atualizada com sucesso!'
    });

  }
  catch (error)
  {
    console.error('❌ Erro ao atualizar senha do usuário:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// ========================================
// 6. EXPORTAR AS FUNÇÕES PARA AS ROTAS
// ========================================
module.exports = { cadastrar, logar, atualizarDados, atualizarSenha };
