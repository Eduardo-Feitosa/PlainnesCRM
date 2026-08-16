const modeloEquipe = require('../models/Equipe');
const modeloEquipeMembro = require('../models/EquipeMembro');
const modeloUsuario = require('../models/Usuario');
const modeloNotificacao = require('../models/Notificacao');
const Joi = require('joi');

// ============================================
// VALORES FIXOS (ENUM do banco) — conferidos via SHOW CREATE TABLE:
// equipemembro.status = ENUM('pendente','ativo','recusado')
// notificacao.tipo    = ENUM('convite_equipe','tarefa_atribuida','lead_dia','solicitacao_colaborador')
// notificacao.tipo não tem valor específico pra "convite aceito/recusado", então
// reaproveitamos CONVITE_EQUIPE pros 3 momentos (enviado/aceito/recusado),
// diferenciando só pelo texto da mensagem.
// ============================================
const STATUS_MEMBRO = { PENDENTE: 'pendente', ATIVO: 'ativo', RECUSADO: 'recusado' };
const TIPO_NOTIFICACAO = { CONVITE_EQUIPE: 'convite_equipe' };

// ============================================
// HELPERS DE MENSAGEM PADRONIZADA (padrão cliente/produto/venda)
// ============================================
const msgVazio = (campo) => ({ 'any.required': `campo ${campo} não pode ser vazio`, 'string.empty': `campo ${campo} não pode ser vazio` });

// Os limites de setor/objetivo (45) espelham o VARCHAR(45) já criado no banco.
const esquemaCriarEquipe = Joi.object
({
    nome: Joi.string().trim().min(3).max(70).required()
        .messages({ ...msgVazio('nome'), 'string.min': 'campo nome precisa ter pelo menos 3 caracteres', 'string.max': 'campo nome pode ter no máximo 70 caracteres' }),
    descricao: Joi.string().trim().allow(null, '').max(2000)
        .messages({ 'string.max': 'campo descrição pode ter no máximo 2000 caracteres' }),
    setor: Joi.string().trim().allow(null, '').max(45)
        .messages({ 'string.max': 'campo setor pode ter no máximo 45 caracteres' }),
    objetivo: Joi.string().trim().allow(null, '').max(45)
        .messages({ 'string.max': 'campo objetivo pode ter no máximo 45 caracteres' }),
});

const esquemaAtualizarEquipe = esquemaCriarEquipe;

const esquemaConvidar = Joi.object
({
    usuarioId: Joi.number().integer().positive().required().messages({ 'any.required': 'campo usuário não pode ser vazio', 'number.base': 'campo usuário inválido' }),
});

const esquemaResponderConvite = Joi.object
({
    aceitar: Joi.boolean().required().messages({ 'any.required': 'campo aceitar não pode ser vazio' }),
});

// ============================================
// HELPERS DE ERRO
// ============================================
const mapaCampo = { nome: 'nome', descricao: 'descrição', criadoPor: 'criador', setor: 'setor', objetivo: 'objetivo' };

function parseErroNull(error)
{
    if (!error || (error.code !== 'ER_BAD_NULL_ERROR' && error.errno !== 1048)) return null;
    const m = /Column\s+'([^']+)'/i.exec(error.sqlMessage || '');
    if (!m) return null;
    const nome = mapaCampo[m[1]] || m[1];
    return { status: 400, body: { erro: `campo ${nome} não pode ser vazio` } };
}

function parseErroFk(error)
{
    if (!error) return null;
    if (error.errno === 1451 || error.code === 'ER_ROW_IS_REFERENCED_2')
    {
        const sm = (error.sqlMessage || '').toString();
        if (/tarefa/i.test(sm)) return { status: 400, body: { erro: 'Não é possível excluir a equipe pois ela possui tarefas associadas.' } };
        return { status: 400, body: { erro: 'Não é possível excluir a equipe pois ela está associada a outros registros do sistema.' } };
    }
    if (error.errno === 1452 || error.code === 'ER_NO_REFERENCED_ROW_2')
    {
        return { status: 401, body: { erro: 'Sessão inválida. Saia e entre novamente para continuar.', sessaoInvalida: true } };
    }
    return null;
}

function parseErroJoi(joiError)
{
    if (!joiError) return null;
    return { status: 400, body: { erro: joiError.details[0].message } };
}

// Verifica se o usuário logado pode VER a equipe (criador ou membro ativo)
async function autorizadoParaVer(equipe, usuarioId)
{
    if (equipe.criadoPor === usuarioId) return true;
    return modeloEquipeMembro.souMembroAtivo(equipe.id, usuarioId);
}

// ============================================
// 1. LISTAR MINHAS EQUIPES
// ============================================
const listar = async (req, res) =>
{
    try
    {
        const equipes = await modeloEquipe.listarMinhas(req.usuario.id);
        return res.json(equipes.map((e) => ({ ...e, souCriador: !!e.souCriador })));
    }
    catch (error)
    {
        console.error('❌ listar equipes:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 2. BUSCAR EQUIPE POR ID
// ============================================
const buscarPorId = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de equipe inválido' });

        const equipe = await modeloEquipe.buscarPorId(id);
        if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada.' });

        if (!(await autorizadoParaVer(equipe, req.usuario.id)))
        {
            return res.status(403).json({ erro: 'Você não tem acesso a esta equipe.' });
        }

        return res.json({ ...equipe, souCriador: equipe.criadoPor === req.usuario.id });
    }
    catch (error)
    {
        console.error('❌ buscar equipe id:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 3. CRIAR EQUIPE (transaction: equipe + criador como membro aceito)
// ============================================
const criar = async (req, res) =>
{
    const pool = modeloEquipe.conexao;
    let conexaoTransacao = null;
    try
    {
        const { error, value } = esquemaCriarEquipe.validate(req.body, { abortEarly: true });
        if (error) { const j = parseErroJoi(error); return res.status(j.status).json(j.body); }

        const { nome, descricao, setor, objetivo } = value;

        conexaoTransacao = await pool.getConnection();
        await conexaoTransacao.beginTransaction();

        const idEquipe = await modeloEquipe.criar(conexaoTransacao, {
            nome, descricao, setor, objetivo, criadoPor: req.usuario.id,
        });
        await modeloEquipeMembro.inserir(conexaoTransacao, idEquipe, req.usuario.id, STATUS_MEMBRO.ATIVO);

        await conexaoTransacao.commit();
        conexaoTransacao.release(); conexaoTransacao = null;

        const equipeCriada = await modeloEquipe.buscarPorId(idEquipe);
        return res.status(201).json({
            mensagem: 'Equipe criada com sucesso!',
            equipe: { ...equipeCriada, souCriador: true },
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
        console.error('❌ criar equipe:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 4. ATUALIZAR EQUIPE (só o criador)
// ============================================
const atualizar = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de equipe inválido' });

        const equipe = await modeloEquipe.buscarPorId(id);
        if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada.' });
        if (equipe.criadoPor !== req.usuario.id)
        {
            return res.status(403).json({ erro: 'Apenas o criador da equipe pode editá-la.' });
        }

        const { error, value } = esquemaAtualizarEquipe.validate(req.body, { abortEarly: true });
        if (error) { const j = parseErroJoi(error); return res.status(j.status).json(j.body); }

        const atualizou = await modeloEquipe.atualizar(id, req.usuario.id, value);
        if (!atualizou) return res.status(500).json({ erro: 'Falha ao atualizar a equipe.' });

        const equipeAtualizada = await modeloEquipe.buscarPorId(id);
        return res.json({ mensagem: 'Equipe atualizada com sucesso!', equipe: { ...equipeAtualizada, souCriador: true } });
    }
    catch (error)
    {
        const nu = parseErroNull(error); if (nu) return res.status(nu.status).json(nu.body);
        console.error('❌ atualizar equipe:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 5. DELETAR EQUIPE (só o criador; remove membros em cascata)
// ============================================
const deletar = async (req, res) =>
{
    const pool = modeloEquipe.conexao;
    let conexaoTransacao = null;
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de equipe inválido' });

        const equipe = await modeloEquipe.buscarPorId(id);
        if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada.' });
        if (equipe.criadoPor !== req.usuario.id)
        {
            return res.status(403).json({ erro: 'Apenas o criador da equipe pode excluí-la.' });
        }

        conexaoTransacao = await pool.getConnection();
        await conexaoTransacao.beginTransaction();

        await modeloEquipeMembro.removerTodosDaEquipe(conexaoTransacao, id);
        const deletou = await modeloEquipe.deletar(conexaoTransacao, id, req.usuario.id);
        if (!deletou)
        {
            await conexaoTransacao.rollback(); conexaoTransacao.release();
            return res.status(500).json({ erro: 'Falha ao excluir a equipe.' });
        }

        await conexaoTransacao.commit();
        conexaoTransacao.release(); conexaoTransacao = null;

        return res.json({ mensagem: 'Equipe excluída com sucesso!' });
    }
    catch (error)
    {
        if (conexaoTransacao)
        {
            try { await conexaoTransacao.rollback(); } catch (_) {}
            try { conexaoTransacao.release(); } catch (_) {}
        }
        const fk = parseErroFk(error); if (fk) return res.status(fk.status).json(fk.body);
        console.error('❌ deletar equipe:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 6. LISTAR MEMBROS DE UMA EQUIPE
// ============================================
const listarMembros = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de equipe inválido' });

        const equipe = await modeloEquipe.buscarPorId(id);
        if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada.' });
        if (!(await autorizadoParaVer(equipe, req.usuario.id)))
        {
            return res.status(403).json({ erro: 'Você não tem acesso a esta equipe.' });
        }

        const membros = await modeloEquipeMembro.listarPorEquipe(id);
        return res.json(membros.map((m) => ({ ...m, ehCriador: !!m.ehCriador })));
    }
    catch (error)
    {
        console.error('❌ listar membros:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 7. BUSCAR USUÁRIO PARA CONVIDAR (regra de privacidade)
// ============================================
const buscarUsuarios = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de equipe inválido' });

        const equipe = await modeloEquipe.buscarPorId(id);
        if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada.' });
        if (equipe.criadoPor !== req.usuario.id)
        {
            return res.status(403).json({ erro: 'Apenas o criador da equipe pode convidar membros.' });
        }

        const termo = String(req.query.termo || '').trim();
        if (!termo) return res.json([]);

        const candidatos = await modeloUsuario.buscarParaConvite(termo, req.usuario.id);
        const vinculos = await modeloEquipeMembro.listarPorEquipe(id);
        const idsVinculados = new Set(vinculos.map((v) => v.usuarioId));

        return res.json(candidatos.filter((c) => !idsVinculados.has(c.id)));
    }
    catch (error)
    {
        console.error('❌ buscar usuários para convite:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 8. CONVIDAR MEMBRO (cria solicitação pendente + notificação)
// ============================================
const convidar = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de equipe inválido' });

        const equipe = await modeloEquipe.buscarPorId(id);
        if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada.' });
        if (equipe.criadoPor !== req.usuario.id)
        {
            return res.status(403).json({ erro: 'Apenas o criador da equipe pode convidar membros.' });
        }

        const { error, value } = esquemaConvidar.validate(req.body, { abortEarly: true });
        if (error) { const j = parseErroJoi(error); return res.status(j.status).json(j.body); }
        const { usuarioId } = value;

        if (usuarioId === req.usuario.id)
        {
            return res.status(400).json({ erro: 'Você já faz parte desta equipe.' });
        }

        const usuarioAlvo = await modeloUsuario.buscarPorId(usuarioId);
        if (!usuarioAlvo) return res.status(404).json({ erro: 'Usuário não encontrado.' });

        const vinculo = await modeloEquipeMembro.buscarVinculo(id, usuarioId);
        if (vinculo && vinculo.status === STATUS_MEMBRO.PENDENTE)
        {
            return res.status(400).json({ erro: 'Este usuário já tem um convite pendente para esta equipe.' });
        }
        if (vinculo && vinculo.status === STATUS_MEMBRO.ATIVO)
        {
            return res.status(400).json({ erro: 'Este usuário já é membro desta equipe.' });
        }

        if (vinculo)
        {
            await modeloEquipeMembro.reenviarConvite(id, usuarioId);
        }
        else
        {
            await modeloEquipeMembro.inserir(null, id, usuarioId, STATUS_MEMBRO.PENDENTE);
        }

        try
        {
            // Isolado de propósito: o convite (equipemembro) já foi salvo acima —
            // se só a notificação falhar, isso não pode virar erro 500 pro usuário.
            await modeloNotificacao.criar(null, {
                usuarioId,
                tipo: TIPO_NOTIFICACAO.CONVITE_EQUIPE,
                mensagem: `${req.usuario.nome} convidou você para a equipe "${equipe.nome}".`,
                link: '/equipes',
                referenciaId: id,
            });
        }
        catch (erroNotificacao)
        {
            console.error('⚠️ falha ao criar notificação de convite (convite já foi salvo normalmente):', erroNotificacao);
        }

        return res.status(201).json({ mensagem: 'Convite enviado com sucesso! O usuário precisa aceitar para entrar na equipe.' });
    }
    catch (error)
    {
        console.error('❌ convidar membro:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 9. REMOVER MEMBRO (só o criador; não remove a si mesmo)
// ============================================
const removerMembro = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        const membroId = Number(req.params.membroId);
        if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(membroId) || membroId <= 0)
        {
            return res.status(400).json({ erro: 'ID inválido' });
        }

        const equipe = await modeloEquipe.buscarPorId(id);
        if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada.' });
        if (equipe.criadoPor !== req.usuario.id)
        {
            return res.status(403).json({ erro: 'Apenas o criador da equipe pode remover membros.' });
        }
        if (membroId === equipe.criadoPor)
        {
            return res.status(400).json({ erro: 'O criador não pode ser removido da equipe. Exclua a equipe se desejar encerrá-la.' });
        }

        const removeu = await modeloEquipeMembro.remover(id, membroId);
        if (!removeu) return res.status(404).json({ erro: 'Membro não encontrado nesta equipe.' });

        return res.json({ mensagem: 'Membro removido com sucesso!' });
    }
    catch (error)
    {
        console.error('❌ remover membro:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 10. SAIR DA EQUIPE (membro comum, não o criador)
// ============================================
const sair = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de equipe inválido' });

        const equipe = await modeloEquipe.buscarPorId(id);
        if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada.' });
        if (equipe.criadoPor === req.usuario.id)
        {
            return res.status(400).json({ erro: 'Você é o criador desta equipe. Para sair, exclua a equipe.' });
        }

        const saiu = await modeloEquipeMembro.remover(id, req.usuario.id);
        if (!saiu) return res.status(404).json({ erro: 'Você não é membro desta equipe.' });

        return res.json({ mensagem: 'Você saiu da equipe.' });
    }
    catch (error)
    {
        console.error('❌ sair da equipe:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 11. LISTAR CONVITES PENDENTES RECEBIDOS (sino de notificação)
// ============================================
const listarConvites = async (req, res) =>
{
    try
    {
        const convites = await modeloEquipeMembro.listarConvitesPendentes(req.usuario.id);
        return res.json(convites);
    }
    catch (error)
    {
        console.error('❌ listar convites pendentes:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

// ============================================
// 12. ACEITAR/RECUSAR CONVITE
// ============================================
const responderConvite = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de equipe inválido' });

        const { error, value } = esquemaResponderConvite.validate(req.body, { abortEarly: true });
        if (error) { const j = parseErroJoi(error); return res.status(j.status).json(j.body); }
        const { aceitar } = value;

        const equipe = await modeloEquipe.buscarPorId(id);
        if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada.' });

        const novoStatus = aceitar ? STATUS_MEMBRO.ATIVO : STATUS_MEMBRO.RECUSADO;
        const respondeu = await modeloEquipeMembro.responder(id, req.usuario.id, novoStatus);
        if (!respondeu)
        {
            return res.status(400).json({ erro: 'Convite não encontrado ou já respondido.' });
        }

        const mensagem = aceitar
            ? `${req.usuario.nome} aceitou seu convite para a equipe "${equipe.nome}".`
            : `${req.usuario.nome} recusou seu convite para a equipe "${equipe.nome}".`;
        try
        {
            // Isolado de propósito: se a notificação falhar, a resposta ao convite
            // (que já está salva) não pode virar erro 500 pro usuário.
            await modeloNotificacao.criar(null, {
                usuarioId: equipe.criadoPor, tipo: TIPO_NOTIFICACAO.CONVITE_EQUIPE, mensagem, link: '/equipes', referenciaId: id,
            });
        }
        catch (erroNotificacao)
        {
            console.error('⚠️ falha ao criar notificação de resposta de convite (convite já foi respondido normalmente):', erroNotificacao);
        }

        return res.json({ mensagem: aceitar ? 'Convite aceito! Você agora é membro da equipe.' : 'Convite recusado.' });
    }
    catch (error)
    {
        console.error('❌ responder convite:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

module.exports = {
    listar, buscarPorId, criar, atualizar, deletar,
    listarMembros, buscarUsuarios, convidar, removerMembro, sair,
    listarConvites, responderConvite,
};
