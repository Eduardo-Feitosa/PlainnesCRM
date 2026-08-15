const modeloProduto = require('../models/Produto');
const Joi = require('joi');
const { enviarCSV, limparLinhaSegura, formatarDinheiroBR } = require('../utils/csv');

// ============================================
// HELPERS DE MENSAGEM PADRONIZADA
// ============================================

const msgVazio = (campo) => ({ 'any.required': `campo ${campo} não pode ser vazio`, 'string.empty': `campo ${campo} não pode ser vazio`, 'number.base': `campo ${campo} não pode ser vazio` });

// ============================================
// 1. SCHEMAS DE VALIDAÇÃO (JOI)
// ============================================

const esquemaCriarProduto = Joi.object
({
    nome: Joi.string()
        .trim()
        .min(3).messages({ 'string.min': 'campo nome precisa ter pelo menos 3 caracteres' })
        .max(70).messages({ 'string.max': 'campo nome pode ter no máximo 70 caracteres' })
        .required()
        .messages(msgVazio('nome')),

    descricao: Joi.string()
        .trim()
        .allow(null, '')
        .max(2000).messages({ 'string.max': 'campo descrição pode ter no máximo 2000 caracteres' }),

    nicho: Joi.string()
        .trim()
        .allow(null, '')
        .max(50).messages({ 'string.max': 'campo nicho pode ter no máximo 50 caracteres' }),

    valor: Joi.number()
        .precision(2).messages({ 'number.precision': 'campo valor unitário deve ter no máximo 2 casas decimais' })
        .min(0.01).messages({ 'number.min': 'campo valor unitário deve ser maior que zero' })
        .required()
        .messages({
            ...msgVazio('valor unitário'),
            'number.base': 'campo valor unitário inválido',
            'number.unsafe': 'campo valor unitário inválido',
        }),

    investimento: Joi.number()
        .precision(2).messages({ 'number.precision': 'campo investimento deve ter no máximo 2 casas decimais' })
        .min(0).messages({ 'number.min': 'campo investimento não pode ser negativo' })
        .allow(null, '')
        .messages({
            'number.base': 'campo investimento inválido',
            'number.unsafe': 'campo investimento inválido',
        }),

    classificacaoPorPreco: Joi.string()
        .trim()
        .lowercase()
        .valid('baixo', 'medio', 'alto')
        .allow(null, '')
        .messages({
            'any.only': 'campo classificação por preço precisa ser Baixo, Médio ou Alto',
            'string.max': 'campo classificação por preço pode ter no máximo 40 caracteres',
        }),
});

const esquemaAtualizarProduto = Joi.object
({
    nome: Joi.string()
        .trim()
        .min(3).messages({ 'string.min': 'campo nome precisa ter pelo menos 3 caracteres' })
        .max(70).messages({ 'string.max': 'campo nome pode ter no máximo 70 caracteres' })
        .required()
        .messages(msgVazio('nome')),

    descricao: Joi.string()
        .trim()
        .allow(null, '')
        .max(2000).messages({ 'string.max': 'campo descrição pode ter no máximo 2000 caracteres' }),

    nicho: Joi.string()
        .trim()
        .allow(null, '')
        .max(50).messages({ 'string.max': 'campo nicho pode ter no máximo 50 caracteres' }),

    valor: Joi.number()
        .precision(2).messages({ 'number.precision': 'campo valor unitário deve ter no máximo 2 casas decimais' })
        .min(0.01).messages({ 'number.min': 'campo valor unitário deve ser maior que zero' })
        .required()
        .messages({
            ...msgVazio('valor unitário'),
            'number.base': 'campo valor unitário inválido',
            'number.unsafe': 'campo valor unitário inválido',
        }),

    investimento: Joi.number()
        .precision(2).messages({ 'number.precision': 'campo investimento deve ter no máximo 2 casas decimais' })
        .min(0).messages({ 'number.min': 'campo investimento não pode ser negativo' })
        .allow(null, '')
        .messages({
            'number.base': 'campo investimento inválido',
            'number.unsafe': 'campo investimento inválido',
        }),

    classificacaoPorPreco: Joi.string()
        .trim()
        .lowercase()
        .valid('baixo', 'medio', 'alto')
        .allow(null, '')
        .messages({
            'any.only': 'campo classificação por preço precisa ser Baixo, Médio ou Alto',
            'string.max': 'campo classificação por preço pode ter no máximo 40 caracteres',
        }),
});

const parseErroUnico = (error) =>
{
    if (!error || (error.code !== 'ER_DUP_ENTRY' && error.errno !== 1062)) return null;
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
            descricao: 'descrição',
            nicho: 'nicho',
            valor: 'valor unitário',
            investimento: 'investimento',
            classificacaoPorPreco: 'classificação por preço',
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
    if (/produto_ibfk/i.test(sqlMsg) || /FOREIGN KEY.*usuario/i.test(sqlMsg) || /REFERENCES.*usuario/i.test(sqlMsg))
    {
        return {
            status: 401,
            msg: 'Sessão inválida. Saia e entre novamente para continuar.',
            sessaoInvalida: true,
        };
    }
    if (error.errno === 1451 || error.code === 'ER_ROW_IS_REFERENCED_2')
    {
        return {
            status: 400,
            msg: 'Não é possível excluir o produto pois ele está associado a vendas.',
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
        const produtos = await modeloProduto.listarTodos(usuarioId);
        res.status(200).json(produtos);
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json({ erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        console.error('❌ Erro ao listar produtos:', error);
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

        const produto = await modeloProduto.buscarPorId(id, usuarioId);

        if (!produto)
        {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }

        res.status(200).json(produto);
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json({ erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        console.error('❌ Erro ao buscar produto:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

const criar = async (req, res) =>
{
    try
    {
        const { error, value } = esquemaCriarProduto.validate(req.body, { abortEarly: true, convert: true });
        if (error)
        {
            return res.status(400).json({ erro: error.details[0].message });
        }

        const usuarioId = req.usuario.id;
        const { nome, descricao, nicho, valor, investimento, classificacaoPorPreco } = value;

        const id = await modeloProduto.criar
        ({
            usuarioId, nome, descricao, nicho, valor, investimento, classificacaoPorPreco
        });

        res.status(201).json
        ({
            mensagem: 'Produto cadastrado com sucesso!',
            id: id,
            nome: nome,
        });
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json({ erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        const nullCol = parseErroNull(error);
        if (nullCol) return res.status(nullCol.status).json({ erro: nullCol.msg });
        const dup = parseErroUnico(error);
        if (dup) return res.status(dup.status).json({ erro: dup.msg });

        console.error('❌ Erro no cadastro de produto:', error);
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

        const produtoExistente = await modeloProduto.buscarPorId(id, usuarioId);
        if (!produtoExistente)
        {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }

        const { error, value } = esquemaAtualizarProduto.validate(req.body, { abortEarly: true, convert: true });
        if (error)
        {
            return res.status(400).json({ erro: error.details[0].message });
        }

        const { nome, descricao, nicho, valor, investimento, classificacaoPorPreco } = value;

        const atualizado = await modeloProduto.atualizar(id, usuarioId,
            { nome, descricao, nicho, valor, investimento, classificacaoPorPreco });

        if (!atualizado)
        {
            return res.status(500).json({ erro: 'Erro ao atualizar produto' });
        }

        res.status(200).json
        ({
            mensagem: 'Produto atualizado com sucesso!',
            id: id,
            nome: nome,
        });
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json({ erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        const nullCol = parseErroNull(error);
        if (nullCol) return res.status(nullCol.status).json({ erro: nullCol.msg });
        const dup = parseErroUnico(error);
        if (dup) return res.status(dup.status).json({ erro: dup.msg });

        console.error('❌ Erro ao atualizar produto:', error);
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

        const produtoExistente = await modeloProduto.buscarPorId(id, usuarioId);
        if (!produtoExistente)
        {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }

        const deletado = await modeloProduto.deletar(id, usuarioId);

        if (!deletado)
        {
            return res.status(500).json({ erro: 'Erro ao deletar produto' });
        }

        res.status(200).json
        ({
            mensagem: 'Produto deletado com sucesso!',
            id: id,
        });
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json({ erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        console.error('❌ Erro ao deletar produto:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

module.exports = { listar, buscarPorId, criar, atualizar, deletar };