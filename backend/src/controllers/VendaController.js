const modeloVenda = require('../models/Venda');
const modeloItemVenda = require('../models/ItemVenda');
const modeloCliente = require('../models/Cliente');
const modeloProduto = require('../models/Produto');
const Joi = require('joi');
const { enviarCSV, limparLinhaSegura, formatarDataBR, formatarDinheiroBR } = require('../utils/csv');

const STATUS_VENDA_VALIDOS = ['Pendente', 'Em Andamento', 'Concluída', 'Cancelada'];
const CANAIS_VENDA_VALIDOS = ['Facebook', 'Instagram', 'WhatsApp', 'Site', 'Outros'];

// ============================================
// HELPERS DE MENSAGENS (padrão produto / cliente)
// ============================================
function msgVazio(campo) { return { 'any.required': `campo ${campo} não pode ser vazio`, 'string.empty': `campo ${campo} não pode ser vazio`, 'string.base': `campo ${campo} não pode ser vazio` }; }
function numMsgVazio(campo) { return { 'any.required': `campo ${campo} não pode ser vazio`, 'number.base': `campo ${campo} não pode ser vazio`, 'number.empty': `campo ${campo} não pode ser vazio` }; }
function msgMaxCasas(campo) { return { 'number.precision': `campo ${campo} deve ter no máximo 2 casas decimais` }; }
function msgMaiorZero(campo) { return { 'number.min': `campo ${campo} deve ser maior que zero` }; }

// ============================================
// ITEM VENDA SCHEMA
// ============================================
const esquemaItem = Joi.object({
    produtoId: Joi.number().integer().positive().required().messages(numMsgVazio('produtoId')),
    quantidade: Joi.number().integer().min(1).allow(null, '', 0).optional(),
    precoUnitario: Joi.number().precision(2).min(0.01).required()
        .messages({ ...numMsgVazio('preço unitário'), ...msgMaxCasas('preço unitário'), ...msgMaiorZero('preço unitário') }),
});

// ============================================
// SCHEMAS JOI
// ============================================
const esquemaCriarVenda = Joi.object({
    clienteId: Joi.number().integer().positive().allow(null, '').optional(),
    dataVenda: Joi.alternatives()
        .try(
            Joi.date().iso(),
            Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        )
        .required()
        .messages({
            'any.required': 'O campo data é obrigatório',
            'alternatives.types': 'campo data da venda inválido',
            'string.empty': 'O campo data é obrigatório',
        }),
    avaliacao: Joi.string().trim().allow(null, '').max(255).optional(),
    observacao: Joi.string().trim().allow(null, '').max(45).optional(),
    quantidade: Joi.number().integer().min(0).allow(null, '').optional(),
    canal: Joi.string().trim().valid(...CANAIS_VENDA_VALIDOS).allow(null, '').optional(),
    statusVenda: Joi.string().trim().valid(...STATUS_VENDA_VALIDOS).allow(null, '').optional(),
    itens: Joi.array().min(1).items(esquemaItem).required()
        .messages({
            'any.required': 'venda precisa ter pelo menos 1 item',
            'array.base': 'venda precisa ter pelo menos 1 item',
            'array.min': 'venda precisa ter pelo menos 1 item',
        }),
});

const esquemaAtualizarVenda = Joi.object({
    clienteId: Joi.number().integer().positive().allow(null, '').optional(),
    dataVenda: Joi.alternatives()
        .try(
            Joi.date().iso(),
            Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        )
        .required()
        .messages({
            'any.required': 'O campo data é obrigatório',
            'alternatives.types': 'campo data da venda inválido',
            'string.empty': 'O campo data é obrigatório',
        }),
    avaliacao: Joi.string().trim().allow(null, '').max(255).optional(),
    observacao: Joi.string().trim().allow(null, '').max(45).optional(),
    quantidade: Joi.number().integer().min(0).allow(null, '').optional(),
    canal: Joi.string().trim().valid(...CANAIS_VENDA_VALIDOS).allow(null, '').optional(),
    statusVenda: Joi.string().trim().valid(...STATUS_VENDA_VALIDOS).allow(null, '').optional(),
    itens: Joi.array().min(1).items(esquemaItem).required()
        .messages({
            'any.required': 'venda precisa ter pelo menos 1 item',
            'array.base': 'venda precisa ter pelo menos 1 item',
            'array.min': 'venda precisa ter pelo menos 1 item',
        }),
});

// ============================================
// HELPERS
// ============================================
const mapaCampo = {
    usuarioId: 'usuário',
    clienteId: 'cliente',
    dataVenda: 'data da venda',
    avaliacao: 'avaliação',
    valorTotal: 'valor total',
    canal: 'canal',
    statusVenda: 'status da venda',
    vendaId: 'venda',
    produtoId: 'produto',
    quantidade: 'quantidade',
    precoUnitario: 'preço unitário',
    observacao: 'observações',
};

function parseErroNull(error)
{
    if (!error || (error.code !== 'ER_BAD_NULL_ERROR' && error.errno !== 1048)) return null;
    const m = /Column\s+'([^']+)'/i.exec(error.sqlMessage || '');
    if (!m) return null;
    const col = m[1];
    const nome = mapaCampo[col] || col;
    return { status: 400, body: { erro: `campo ${nome} não pode ser vazio` } };
}

function parseErroFk(error)
{
    if (!error) return null;
    // errno 1452 -> FK clienteId ou usuarioId não existe
    if (error.errno === 1452 || error.code === 'ER_NO_REFERENCED_ROW_2')
    {
        const sm = (error.sqlMessage || '').toString();
        if (/cliente/i.test(sm)) return { status: 400, body: { erro: 'Cliente não encontrado ou não pertence a este usuário.' } };
        if (/produto/i.test(sm)) return { status: 400, body: { erro: 'Produto não encontrado ou não pertence a este usuário.' } };
        if (/usuario/i.test(sm)) return { status: 401, body: { erro: 'Sessão inválida. Saia e entre novamente.', sessaoInvalida: true } };
        return { status: 400, body: { erro: 'Relacionamento inválido ao salvar a venda.' } };
    }
    // errno 1451 -> DELETE itemvenda/venda com referencia externa (não deve ter nenhum, mas por segurança)
    if (error.errno === 1451 || error.code === 'ER_ROW_IS_REFERENCED_2')
    {
        const sm = (error.sqlMessage || '').toString();
        if (/notificacao|tarefa/i.test(sm)) return { status: 400, body: { erro: 'Não é possível excluir a venda pois ela está associada a outros registros do sistema.' } };
    }
    // errno 1062 DUP (pouco provável em venda, mas ok)
    if (error.errno === 1062 || error.code === 'ER_DUP_ENTRY')
    {
        return { status: 400, body: { erro: 'Dados duplicados ao salvar a venda.' } };
    }
    return null;
}

function parseErroJoi(joiError)
{
    if (!joiError) return null;
    const msg = (joiError.details && joiError.details[0] && joiError.details[0].message) || joiError.message;
    return { status: 400, body: { erro: String(msg) } };
}

function formatarDecimal(v)
{
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Number(n.toFixed(2));
}

function calcularValorTotal(itens)
{
    let total = 0;
    for (const it of itens)
    {
        const preco = Number(it.precoUnitario) || 0;
        total += preco;
    }
    return formatarDecimal(total) || 0;
}

function dataServidorISO()
{
    const d = new Date();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function normalizarDataVenda(dataVenda)
{
    if (dataVenda === null || dataVenda === undefined) return null;
    const s = String(dataVenda).trim();
    if (s === '') return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    try
    {
        const d = new Date(dataVenda);
        if (!Number.isNaN(d.getTime()))
        {
            const yyyy = String(d.getUTCFullYear());
            const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(d.getUTCDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
    }
    catch (_) { /* ignore */ }
    return null;
}

function normalizarCampoTextoOpcional(valor)
{
    if (valor === null || valor === undefined) return null;
    const s = String(valor).trim();
    return s === '' ? null : s;
}

async function validarClienteUsuario(clienteId, usuarioId)
{
    if (!clienteId) return true;
    const c = await modeloCliente.buscarPorId(clienteId, usuarioId);
    return !!c;
}

async function validarProdutosUsuario(itens, usuarioId)
{
    const ids = Array.from(new Set(itens.map((it) => Number(it.produtoId))));
    if (!ids.length) return { ok: true, produtos: {} };
    const idsNum = ids.filter((n) => Number.isFinite(n) && n > 0);
    // Model Produto não tem listarPorIds, vamos fazer um por um (pequeno lote em venda sempre)
    const mapa = {};
    for (const id of idsNum)
    {
        const p = await modeloProduto.buscarPorId(id, usuarioId);
        if (!p) return { ok: false, produtos: null, produtoInvalidoId: id };
        mapa[id] = p;
    }
    return { ok: true, produtos: mapa };
}

// ============================================
// 1. LISTAR TODAS VENDAS (scoped usuario)
// ============================================
const listar = async (req, res) =>
{
    try
    {
        const lista = await modeloVenda.listarTodos(req.usuario.id);
        return res.json(lista);
    }
    catch (error)
    {
        const fk = parseErroFk(error); if (fk) return res.status(fk.status).json(fk.body);
        const nu = parseErroNull(error); if (nu) return res.status(nu.status).json(nu.body);
        console.error('❌ listar vendas:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 2. BUSCAR UMA VENDA POR ID (scoped) COM ITENS
// ============================================
const buscarPorId = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de venda inválido' });
        const v = await modeloVenda.buscarPorId(id, req.usuario.id);
        if (!v) return res.status(404).json({ erro: 'Venda não encontrada.' });
        return res.json(v);
    }
    catch (error)
    {
        const fk = parseErroFk(error); if (fk) return res.status(fk.status).json(fk.body);
        const nu = parseErroNull(error); if (nu) return res.status(nu.status).json(nu.body);
        console.error('❌ buscar venda id:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 3. CRIAR VENDA (transaction: cabeça + itens)
// ============================================
const criar = async (req, res) =>
{
    const pool = modeloVenda.conexao;
    let conexaoTransacao = null;
    try
    {
        const { error } = esquemaCriarVenda.validate(req.body, { abortEarly: true });
        if (error)
        {
            const j = parseErroJoi(error); return res.status(j.status).json(j.body);
        }

        let { clienteId, dataVenda, avaliacao, observacao, canal, statusVenda, itens } = req.body;
        if (!statusVenda) statusVenda = 'Pendente';
        dataVenda = normalizarDataVenda(dataVenda);
        avaliacao = normalizarCampoTextoOpcional(avaliacao);
        observacao = normalizarCampoTextoOpcional(observacao);
        canal = normalizarCampoTextoOpcional(canal);

        // Multi-tenant: Cliente tem que existir E pertencer ao usuário logado
        if (clienteId && !(await validarClienteUsuario(clienteId, req.usuario.id)))
            return res.status(400).json({ erro: 'Cliente não encontrado ou não pertence a este usuário.' });

        // Multi-tenant: Todos produtos pertencem ao usuário logado
        const valProd = await validarProdutosUsuario(itens, req.usuario.id);
        if (!valProd.ok) return res.status(400).json({ erro: 'Produto não encontrado ou não pertence a este usuário.' });

        // Calcula valorTotal NO BACKEND, nunca confia no body.enviado de valorTotal
        // Calcula quantidade NO BACKEND = número de itens (INTEGER sempre), nunca confia no body
        const valorTotal = calcularValorTotal(itens);
        const quantidade = Number(itens.length) | 0;
        if (!valorTotal || valorTotal <= 0) return res.status(400).json({ erro: 'O valor total da venda deve ser maior que zero.' });

        // ---- TRANSACTION ----
        conexaoTransacao = await pool.getConnection();
        await conexaoTransacao.beginTransaction();

        const idVenda = await modeloVenda.criar(req.usuario.id, {
            clienteId: clienteId || null,
            dataVenda,
            avaliacao,
            observacao,
            valorTotal,
            quantidade,
            canal,
            statusVenda,
        });

        await modeloItemVenda.criarLote(conexaoTransacao, idVenda, itens);

        await conexaoTransacao.commit();
        conexaoTransacao.release(); conexaoTransacao = null;

        const vendaComItens = await modeloVenda.buscarPorId(idVenda, req.usuario.id);
        return res.status(201).json({
            mensagem: 'Venda registrada com sucesso!',
            venda: vendaComItens,
        });
    }
    catch (error)
    {
        if (conexaoTransacao)
        {
            try { await conexaoTransacao.rollback(); } catch (_) {}
            try { conexaoTransacao.release(); } catch (_) {}
        }
        const fk = parseErroFk(error); if (fk) return res.status(fk.status).json(fk.body);
        const nu = parseErroNull(error); if (nu) return res.status(nu.status).json(nu.body);
        console.error('❌ criar venda:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 4. ATUALIZAR VENDA (transaction: delete itens + reinsere + atualiza cabeça)
// ============================================
const atualizar = async (req, res) =>
{
    const pool = modeloVenda.conexao;
    let conexaoTransacao = null;
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de venda inválido' });

        const existe = await modeloVenda.buscarPorId(id, req.usuario.id);
        if (!existe) return res.status(404).json({ erro: 'Venda não encontrada.' });

        const { error } = esquemaAtualizarVenda.validate(req.body, { abortEarly: true });
        if (error) { const j = parseErroJoi(error); return res.status(j.status).json(j.body); }

        let { clienteId, dataVenda, avaliacao, observacao, canal, statusVenda, itens } = req.body;
        if (!statusVenda) statusVenda = 'Pendente';
        dataVenda = normalizarDataVenda(dataVenda);
        avaliacao = normalizarCampoTextoOpcional(avaliacao);
        observacao = normalizarCampoTextoOpcional(observacao);
        canal = normalizarCampoTextoOpcional(canal);

        if (clienteId && !(await validarClienteUsuario(clienteId, req.usuario.id)))
            return res.status(400).json({ erro: 'Cliente não encontrado ou não pertence a este usuário.' });

        const valProd = await validarProdutosUsuario(itens, req.usuario.id);
        if (!valProd.ok) return res.status(400).json({ erro: 'Produto não encontrado ou não pertence a este usuário.' });

        const valorTotal = calcularValorTotal(itens);
        const quantidade = Number(itens.length) | 0;
        if (!valorTotal || valorTotal <= 0) return res.status(400).json({ erro: 'O valor total da venda deve ser maior que zero.' });

        // ---- TRANSACTION ----
        conexaoTransacao = await pool.getConnection();
        await conexaoTransacao.beginTransaction();

        await modeloItemVenda.deletarPorVendaId(conexaoTransacao, id);
        await modeloItemVenda.criarLote(conexaoTransacao, id, itens);

        const atualizou = await modeloVenda.atualizar(id, req.usuario.id, {
            clienteId: clienteId || null,
            dataVenda,
            avaliacao,
            observacao,
            valorTotal,
            quantidade,
            canal,
            statusVenda,
        });
        if (!atualizou) { await conexaoTransacao.rollback(); conexaoTransacao.release(); return res.status(500).json({ erro: 'Falha ao atualizar a venda.' }); }

        await conexaoTransacao.commit();
        conexaoTransacao.release(); conexaoTransacao = null;

        const vendaAtualizada = await modeloVenda.buscarPorId(id, req.usuario.id);
        return res.json({ mensagem: 'Venda atualizada com sucesso!', venda: vendaAtualizada });
    }
    catch (error)
    {
        if (conexaoTransacao)
        {
            try { await conexaoTransacao.rollback(); } catch (_) {}
            try { conexaoTransacao.release(); } catch (_) {}
        }
        const fk = parseErroFk(error); if (fk) return res.status(fk.status).json(fk.body);
        const nu = parseErroNull(error); if (nu) return res.status(nu.status).json(nu.body);
        console.error('❌ atualizar venda:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 5. DELETAR VENDA (itemvenda em cascade/separado)
// ============================================
const deletar = async (req, res) =>
{
    const pool = modeloVenda.conexao;
    let conexaoTransacao = null;
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de venda inválido' });
        const existe = await modeloVenda.buscarPorId(id, req.usuario.id);
        if (!existe) return res.status(404).json({ erro: 'Venda não encontrada.' });

        conexaoTransacao = await pool.getConnection();
        await conexaoTransacao.beginTransaction();
        await modeloItemVenda.deletarPorVendaId(conexaoTransacao, id);
        const deletou = await modeloVenda.deletar(id, req.usuario.id);
        if (!deletou) { await conexaoTransacao.rollback(); conexaoTransacao.release(); return res.status(500).json({ erro: 'Falha ao excluir a venda.' }); }
        await conexaoTransacao.commit();
        conexaoTransacao.release(); conexaoTransacao = null;

        return res.json({ mensagem: 'Venda excluída com sucesso!' });
    }
    catch (error)
    {
        if (conexaoTransacao)
        {
            try { await conexaoTransacao.rollback(); } catch (_) {}
            try { conexaoTransacao.release(); } catch (_) {}
        }
        const fk = parseErroFk(error); if (fk) return res.status(fk.status).json(fk.body);
        const nu = parseErroNull(error); if (nu) return res.status(nu.status).json(nu.body);
        console.error('❌ deletar venda:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

module.exports = { listar, buscarPorId, criar, atualizar, deletar };
