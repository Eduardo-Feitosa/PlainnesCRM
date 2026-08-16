const modeloNotificacao = require('../models/Notificacao');

const listar = async (req, res) =>
{
    try
    {
        const notificacoes = await modeloNotificacao.listarPorUsuario(req.usuario.id);
        return res.json(notificacoes);
    }
    catch (error)
    {
        console.error('❌ listar notificações:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

const contarNaoLidas = async (req, res) =>
{
    try
    {
        const total = await modeloNotificacao.contarNaoLidas(req.usuario.id);
        return res.json({ total });
    }
    catch (error)
    {
        console.error('❌ contar notificações não lidas:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

const marcarComoLida = async (req, res) =>
{
    try
    {
        const id = Number(req.params.id);
        if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ erro: 'ID de notificação inválido' });

        const marcou = await modeloNotificacao.marcarComoLida(id, req.usuario.id);
        if (!marcou) return res.status(404).json({ erro: 'Notificação não encontrada.' });

        return res.json({ mensagem: 'Notificação marcada como lida.' });
    }
    catch (error)
    {
        console.error('❌ marcar notificação como lida:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
};

module.exports = { listar, contarNaoLidas, marcarComoLida };
