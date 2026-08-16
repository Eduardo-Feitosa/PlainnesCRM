// Modelo notificacao: tabela genérica de notificações (usada hoje por convite de
// equipe, mas o campo "tipo" foi feito para servir qualquer evento futuro)
const conexao = require('../config/database');

const modeloNotificacao =
{
    criar: async (poolOrConexao, dados) =>
    {
        const conex = poolOrConexao || conexao;
        const { usuarioId, tipo, mensagem, link, referenciaId } = dados;
        const [resultado] = await conex.query(
            `INSERT INTO notificacao (usuarioId, tipo, mensagem, link, referenciaId, lida, dataCriacao)
             VALUES (?, ?, ?, ?, ?, 0, NOW())`,
            [usuarioId, tipo, mensagem, link || null, referenciaId || null]
        );
        return resultado.insertId;
    },

    listarPorUsuario: async (usuarioId, limite = 30) =>
    {
        const [linhas] = await conexao.query(
            `SELECT * FROM notificacao WHERE usuarioId = ? ORDER BY dataCriacao DESC LIMIT ?`,
            [usuarioId, limite]
        );
        return linhas;
    },

    contarNaoLidas: async (usuarioId) =>
    {
        const [linhas] = await conexao.query(
            'SELECT COUNT(*) AS total FROM notificacao WHERE usuarioId = ? AND lida = 0',
            [usuarioId]
        );
        return Number(linhas[0]?.total || 0);
    },

    marcarComoLida: async (id, usuarioId) =>
    {
        const [resultado] = await conexao.query(
            'UPDATE notificacao SET lida = 1 WHERE id = ? AND usuarioId = ?',
            [id, usuarioId]
        );
        return resultado.affectedRows > 0;
    },
};

module.exports = modeloNotificacao;
