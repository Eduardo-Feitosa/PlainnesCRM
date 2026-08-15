const modeloCliente = require('../models/Cliente');
const Joi = require('joi');
const dayjs = require('dayjs');
const { enviarCSV, limparLinhaSegura, formatarDataBR } = require('../utils/csv');

// ============================================
// HELPERS DE MENSAGEM PADRONIZADA
// ============================================

const msgVazio = (campo) => ({ 'any.required': `campo ${campo} não pode ser vazio`, 'string.empty': `campo ${campo} não pode ser vazio` });

// ============================================
// HELPERS DATA
// ============================================

const calcularIdade = (dataNascStr) =>
{
    if (!dataNascStr) return null;
    const n = dayjs(dataNascStr);
    if (!n.isValid()) return null;
    const hoje = dayjs();
    const idade = hoje.diff(n, 'year');
    const aniversarioEsseAno = n.add(idade, 'year');
    if (hoje.isBefore(aniversarioEsseAno)) return idade - 1;
    return idade;
};

// ============================================
// 1. SCHEMAS DE VALIDAÇÃO (JOI)
// ============================================

const esquemaCriarCliente = Joi.object
({
    nome: Joi.string()
        .trim()
        .min(3).messages({ 'string.min': 'campo nome precisa ter pelo menos 3 caracteres' })
        .max(70).messages({ 'string.max': 'campo nome pode ter no máximo 70 caracteres' })
        .required()
        .messages(msgVazio('nome')),

    telefone: Joi.alternatives()
        .try(
            Joi.string().trim().pattern(/^\d{10,11}$/).messages({
                'string.pattern.base': 'campo telefone inválido (apenas dígitos, 10 ou 11 caracteres)',
                'string.max': 'campo telefone pode ter no máximo 15 caracteres',
            }),
            Joi.string().trim().min(10).max(15).messages({
                'string.min': 'campo telefone precisa ter pelo menos 10 caracteres',
                'string.max': 'campo telefone pode ter no máximo 15 caracteres',
            })
        )
        .required()
        .messages({ ...msgVazio('telefone'), 'alternatives.types': 'campo telefone inválido' }),

    email: Joi.string()
        .trim()
        .email({ tlds: { allow: false } }).messages({ 'string.email': 'campo email inválido' })
        .max(70).messages({ 'string.max': 'campo email pode ter no máximo 70 caracteres' })
        .required()
        .messages(msgVazio('email')),

    instagram: Joi.string()
        .trim()
        .allow(null, '')
        .max(50).messages({ 'string.max': 'campo instagram pode ter no máximo 50 caracteres' })
        .pattern(/^@/).messages({ 'string.pattern.base': 'campo instagram precisa começar com @' }),

    sexo: Joi.string()
        .trim()
        .valid('Masculino', 'Feminino', 'Outro')
        .max(20).messages({ 'string.max': 'campo sexo pode ter no máximo 20 caracteres', 'any.only': 'campo sexo precisa ser Masculino, Feminino ou Outro' })
        .required()
        .messages(msgVazio('sexo')),

    estado: Joi.string()
        .trim()
        .allow(null, '')
        .max(30).messages({ 'string.max': 'campo estado pode ter no máximo 30 caracteres' }),

    dataNascimento: Joi.date()
        .iso().messages({ 'date.format': 'campo data de nascimento inválido' })
        .allow(null, ''),

    descricao: Joi.string()
        .trim()
        .allow(null, '')
        .max(500).messages({ 'string.max': 'campo descrição pode ter no máximo 500 caracteres' }),

    status: Joi.string()
        .trim()
        .valid('Ativo', 'Inativo', 'Bloqueado').messages({ 'any.only': 'campo status precisa ser Ativo, Inativo ou Bloqueado' })
        .default('Ativo'),

    dataCadastramento: Joi.date().allow(null, ''),
});

const esquemaAtualizarCliente = Joi.object
({
    nome: Joi.string()
        .trim()
        .min(3).messages({ 'string.min': 'campo nome precisa ter pelo menos 3 caracteres' })
        .max(70).messages({ 'string.max': 'campo nome pode ter no máximo 70 caracteres' })
        .required()
        .messages(msgVazio('nome')),

    telefone: Joi.alternatives()
        .try(
            Joi.string().trim().pattern(/^\d{10,11}$/).messages({
                'string.pattern.base': 'campo telefone inválido (apenas dígitos, 10 ou 11 caracteres)',
                'string.max': 'campo telefone pode ter no máximo 15 caracteres',
            }),
            Joi.string().trim().min(10).max(15).messages({
                'string.min': 'campo telefone precisa ter pelo menos 10 caracteres',
                'string.max': 'campo telefone pode ter no máximo 15 caracteres',
            })
        )
        .required()
        .messages({ ...msgVazio('telefone'), 'alternatives.types': 'campo telefone inválido' }),

    email: Joi.string()
        .trim()
        .email({ tlds: { allow: false } }).messages({ 'string.email': 'campo email inválido' })
        .max(70).messages({ 'string.max': 'campo email pode ter no máximo 70 caracteres' })
        .required()
        .messages(msgVazio('email')),

    instagram: Joi.string()
        .trim()
        .allow(null, '')
        .max(50).messages({ 'string.max': 'campo instagram pode ter no máximo 50 caracteres' })
        .pattern(/^@/).messages({ 'string.pattern.base': 'campo instagram precisa começar com @' }),

    sexo: Joi.string()
        .trim()
        .valid('Masculino', 'Feminino', 'Outro')
        .max(20).messages({ 'string.max': 'campo sexo pode ter no máximo 20 caracteres', 'any.only': 'campo sexo precisa ser Masculino, Feminino ou Outro' })
        .required()
        .messages(msgVazio('sexo')),

    estado: Joi.string()
        .trim()
        .allow(null, '')
        .max(30).messages({ 'string.max': 'campo estado pode ter no máximo 30 caracteres' }),

    dataNascimento: Joi.date()
        .iso().messages({ 'date.format': 'campo data de nascimento inválido' })
        .allow(null, ''),

    descricao: Joi.string()
        .trim()
        .allow(null, '')
        .max(500).messages({ 'string.max': 'campo descrição pode ter no máximo 500 caracteres' }),

    status: Joi.string()
        .trim()
        .valid('Ativo', 'Inativo', 'Bloqueado').messages({ 'any.only': 'campo status precisa ser Ativo, Inativo ou Bloqueado' })
        .required()
        .messages(msgVazio('status')),
});

const parseErroUnico = (error) =>
{
    if (!error || (error.code !== 'ER_DUP_ENTRY' && error.errno !== 1062)) return null;
    const sqlMsg = (error.sqlMessage || '').toString();
    if (/email/i.test(sqlMsg)) return { status: 400, msg: 'Email já cadastrado para este usuário' };
    return { status: 400, msg: 'Dados duplicados no sistema' };
};

const parseErroNull = (error) =>
{
    if (!error || (error.code !== 'ER_BAD_NULL_ERROR' && error.errno !== 1048)) return null;
    const sqlMsg = (error.sqlMessage || '').toString();
    const match = sqlMsg.match(/Column\s+'([^']+)'\s+cannot\s+be\s+null/i);
    if (match && match[1])
    {
        const coluna = match[1];
        const mapaCampo = {
            usuarioId: 'usuário',
            nome: 'nome',
            telefone: 'telefone',
            email: 'email',
            instagram: 'instagram',
            sexo: 'sexo',
            estado: 'estado',
            dataNascimento: 'data de nascimento',
            descricao: 'descrição',
            statusCliente: 'status',
            dataCadastramento: 'data de cadastramento',
        };
        const campo = mapaCampo[coluna] || coluna;
        return { status: 400, msg: `campo ${campo} não pode ser vazio` };
    }
    return { status: 400, msg: 'Campo obrigatório não preenchido' };
};

const parseErroFkUsuario = (error) =>
{
    if (!error) return null;
    if (error.code !== 'ER_NO_REFERENCED_ROW_2' && error.errno !== 1452 && error.code !== 'ER_ROW_IS_REFERENCED_2') return null;
    const sqlMsg = (error.sqlMessage || '').toString();
    if (/cliente_ibfk/i.test(sqlMsg) || /FOREIGN KEY.*usuario/i.test(sqlMsg) || /REFERENCES.*usuario/i.test(sqlMsg))
    {
        return {
            status: 401,
            msg: 'Sessão inválida. Saia e entre novamente para continuar.',
            sessaoInvalida: true,
        };
    }
    return null;
};

// ============================================
// 2. FUNÇÕES DO CONTROLLER (CRUD)
// ============================================

const listar = async (req, res) =>
{
    try
    {
        const usuarioId = req.usuario.id;
        const clientes = await modeloCliente.listarTodos(usuarioId);
        res.status(200).json(clientes);
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json({ erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        console.error('❌ Erro ao listar clientes:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

const buscarPorId = async (req, res) =>
{
    try
    {
        const usuarioId = req.usuario.id;
        const id = parseInt(req.params.id);

        if (isNaN(id))
        {
            return res.status(400).json({ erro: 'ID inválido' });
        }

        const cliente = await modeloCliente.buscarPorId(id, usuarioId);

        if (!cliente)
        {
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }

        res.status(200).json(cliente);
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json({ erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        console.error('❌ Erro ao buscar cliente:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

const criar = async (req, res) =>
{
    try
    {
        const { error, value } = esquemaCriarCliente.validate(req.body, { abortEarly: true, convert: true });
        if (error)
        {
            return res.status(400).json({ erro: error.details[0].message });
        }

        const idade = calcularIdade(value.dataNascimento);
        if (idade !== null && idade < 18)
        {
            return res.status(400).json({ erro: 'campo data de nascimento: cliente precisa ter pelo menos 18 anos' });
        }

        const usuarioId = req.usuario.id;
        const { nome, telefone, email, instagram, sexo, estado, dataNascimento, descricao, status, dataCadastramento } = value;

        if (await modeloCliente.emailJaExiste(email, usuarioId))
        {
            return res.status(400).json({ erro: 'Email já cadastrado para este usuário' });
        }

        const id = await modeloCliente.criar
        ({
            usuarioId, nome, telefone, email, instagram, sexo, estado, dataNascimento, descricao, status, dataCadastramento
        });

        res.status(201).json
        ({
            mensagem: 'Cliente cadastrado com sucesso!',
            id: id,
            nome: nome,
            email: email
        });
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json({ erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        const nullCol = parseErroNull(error);
        if (nullCol) return res.status(nullCol.status).json({ erro: nullCol.msg });
        const dup = parseErroUnico(error);
        if (dup)
        {
            return res.status(dup.status).json({ erro: dup.msg });
        }

        console.error('❌ Erro no cadastro de cliente:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

const atualizar = async (req, res) =>
{
    try
    {
        const usuarioId = req.usuario.id;
        const id = parseInt(req.params.id);

        if (isNaN(id))
        {
            return res.status(400).json({ erro: 'ID inválido' });
        }

        const clienteExistente = await modeloCliente.buscarPorId(id, usuarioId);
        if (!clienteExistente)
        {
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }

        const { error, value } = esquemaAtualizarCliente.validate(req.body, { abortEarly: true, convert: true });
        if (error)
        {
            return res.status(400).json({ erro: error.details[0].message });
        }

        const idade = calcularIdade(value.dataNascimento);
        if (idade !== null && idade < 18)
        {
            return res.status(400).json({ erro: 'campo data de nascimento: cliente precisa ter pelo menos 18 anos' });
        }

        const { nome, telefone, email, instagram, sexo, estado, dataNascimento, descricao, status } = value;

        if (await modeloCliente.emailJaExiste(email, usuarioId, id))
        {
            return res.status(400).json({ erro: 'Email já cadastrado para outro cliente' });
        }

        const atualizado = await modeloCliente.atualizar(id, usuarioId,
            { nome, telefone, email, instagram, sexo, estado, dataNascimento, descricao, status });

        if (!atualizado)
        {
            return res.status(500).json({ erro: 'Erro ao atualizar cliente' });
        }

        res.status(200).json
        ({
            mensagem: 'Cliente atualizado com sucesso!',
            id: id,
            nome: nome
        });
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json({ erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        const nullCol = parseErroNull(error);
        if (nullCol) return res.status(nullCol.status).json({ erro: nullCol.msg });
        const dup = parseErroUnico(error);
        if (dup)
        {
            return res.status(dup.status).json({ erro: dup.msg });
        }

        console.error('❌ Erro ao atualizar cliente:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

const deletar = async (req, res) =>
{
    try
    {
        const usuarioId = req.usuario.id;
        const id = parseInt(req.params.id);

        if (isNaN(id))
        {
            return res.status(400).json({ erro: 'ID inválido' });
        }

        const clienteExistente = await modeloCliente.buscarPorId(id, usuarioId);
        if (!clienteExistente)
        {
            return res.status(404).json({ erro: 'Cliente não encontrado' });
        }

        const deletado = await modeloCliente.deletar(id, usuarioId);

        if (!deletado)
        {
            return res.status(500).json({ erro: 'Erro ao deletar cliente' });
        }

        res.status(200).json
        ({
            mensagem: 'Cliente deletado com sucesso!',
            id: id
        });
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json({ erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        console.error('❌ Erro ao deletar cliente:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

module.exports = { listar, buscarPorId, criar, atualizar, deletar };
