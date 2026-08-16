const modeloColaborador = require('../models/Colaborador');
const modeloUsuario = require('../models/Usuario');
const modeloNotificacao = require('../models/Notificacao');
const Joi = require('joi');

// ============================================
// VALORES FIXOS (ENUM do banco)
// ATENÇÃO: precisam bater exatamente com o ENUM criado em `colaborador.status`.
// Mesma convenção usada em EquipeController — ajuste só aqui se o ENUM real
// do banco usar outras strings.
// ============================================
const STATUS_COLABORADOR = { PENDENTE: 'pendente', ACEITO: 'aceito', RECUSADO: 'recusado' };
const TIPO_NOTIFICACAO = {
    SOLICITACAO_COLABORADOR: 'solicitacao_colaborador',
    COLABORADOR_ACEITO: 'colaborador_aceito',
    COLABORADOR_RECUSADO: 'colaborador_recusado',
};

const esquemaSolicitar = Joi.object
({
    usuarioId: Joi.number().integer().positive().required().messages({ 'any.required': 'campo usuário não pode ser vazio', 'number.base': 'campo usuário inválido' }),
});

const esquemaResponder = Joi.object
({
    aceitar: Joi.boolean().required().messages({ 'any.required': 'campo aceitar não pode ser vazio' }),
});

function parseErroJoi(joiError)
{
    if (!joiError) return null;
    return { status: 400, body: { erro: joiError.details[0].message } };
}

// ============================================
// 1. BUSCAR USUÁRIOS PARA SOLICITAR COLABORAÇÃO (barra de pesquisa do header)
// ============================================
const buscarUsuarios = async (req, res) =>
{
    try
    {
        const termo = String(req.query.termo || '').trim();
        if (!termo) return res.json([]);

        const candidatos = await modeloUsuario.buscarParaConvite(termo, req.usuario.id);
        const idsVinculados = await modeloColaborador.listarVinculosDoUsuario(req.usuario.id);

        return res.json(candidatos.filter((c) => !idsVinculados.has(c.id)));
    }
    catch (error)
    {
        console.error('❌ buscar usuários para colaboração:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 2. ENVIAR SOLICITAÇÃO DE COLABORAÇÃO
// ============================================
const solicitar = async (req, res) =>
{
    try
    {
        const { error, value } = esquemaSolicitar.validate(req.body, { abortEarly: true });
        if (error) { const j = parseErroJoi(error); return res.status(j.status).json(j.body); }
        const { usuarioId } = value;

        if (usuarioId === req.usuario.id)
        {
            return res.status(400).json({ erro: 'Você não pode enviar uma solicitação para si mesmo.' });
        }

        const usuarioAlvo = await modeloUsuario.buscarPorId(usuarioId);
        if (!usuarioAlvo) return res.status(404).json({ erro: 'Usuário não encontrado.' });

        const vinculo = await modeloColaborador.buscarVinculo(req.usuario.id, usuarioId);
        if (vinculo && vinculo.status === STATUS_COLABORADOR.PENDENTE)
        {
            return res.status(400).json({ erro: 'Já existe uma solicitação pendente entre vocês.' });
        }
        if (vinculo && vinculo.status === STATUS_COLABORADOR.ACEITO)
        {
            return res.status(400).json({ erro: 'Vocês já são colaboradores.' });
        }

        if (vinculo)
        {
            // já existiu e foi recusada — reenvia, respeitando quem é o solicitante desta vez
            await modeloColaborador.reenviarComoNovoSolicitante(vinculo.id, req.usuario.id, usuarioId);
        }
        else
        {
            await modeloColaborador.inserir(req.usuario.id, usuarioId, STATUS_COLABORADOR.PENDENTE);
        }

        await modeloNotificacao.criar(null, {
            usuarioId,
            tipo: TIPO_NOTIFICACAO.SOLICITACAO_COLABORADOR,
            mensagem: `${req.usuario.nome} enviou uma solicitação de colaboração.`,
            link: null,
            referenciaId: null,
        });

        return res.status(201).json({ mensagem: 'Solicitação enviada com sucesso!' });
    }
    catch (error)
    {
        console.error('❌ solicitar colaboração:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 3. LISTAR SOLICITAÇÕES PENDENTES RECEBIDAS (sino de notificação)
// ============================================
const listarPendentes = async (req, res) =>
{
    try
    {
        const pendentes = await modeloColaborador.listarPendentesRecebidas(req.usuario.id);
        return res.json(pendentes);
    }
    catch (error)
    {
        console.error('❌ listar solicitações de colaboração pendentes:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 4. ACEITAR/RECUSAR SOLICITAÇÃO
// ============================================
const responder = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de solicitação inválido' });

        const { error, value } = esquemaResponder.validate(req.body, { abortEarly: true });
        if (error) { const j = parseErroJoi(error); return res.status(j.status).json(j.body); }
        const { aceitar } = value;

        const vinculo = await modeloColaborador.buscarPorId(id);
        if (!vinculo) return res.status(404).json({ erro: 'Solicitação não encontrada.' });
        if (vinculo.colaboradorId !== req.usuario.id)
        {
            return res.status(403).json({ erro: 'Você não pode responder a esta solicitação.' });
        }
        if (vinculo.status !== STATUS_COLABORADOR.PENDENTE)
        {
            return res.status(400).json({ erro: 'Esta solicitação já foi respondida.' });
        }

        const novoStatus = aceitar ? STATUS_COLABORADOR.ACEITO : STATUS_COLABORADOR.RECUSADO;
        const respondeu = await modeloColaborador.responder(id, req.usuario.id, novoStatus);
        if (!respondeu) return res.status(400).json({ erro: 'Esta solicitação já foi respondida.' });

        const tipoNotif = aceitar ? TIPO_NOTIFICACAO.COLABORADOR_ACEITO : TIPO_NOTIFICACAO.COLABORADOR_RECUSADO;
        const mensagem = aceitar
            ? `${req.usuario.nome} aceitou sua solicitação de colaboração.`
            : `${req.usuario.nome} recusou sua solicitação de colaboração.`;
        await modeloNotificacao.criar(null, {
            usuarioId: vinculo.usuarioId, tipo: tipoNotif, mensagem, link: null, referenciaId: null,
        });

        return res.json({ mensagem: aceitar ? 'Solicitação aceita! Vocês agora são colaboradores.' : 'Solicitação recusada.' });
    }
    catch (error)
    {
        console.error('❌ responder solicitação de colaboração:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

module.exports = { buscarUsuarios, solicitar, listarPendentes, responder };
