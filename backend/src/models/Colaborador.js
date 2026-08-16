// Modelo colaborador: solicitação de conexão direta usuário<->usuário
// (diferente de equipemembro, que é usuário<->equipe). Uma vez aceita, os
// dois usuários viram "colaboradores" um do outro.
const conexao = require('../config/database');

const modeloColaborador =
{
    // Busca um vínculo existente entre os dois usuários, EM QUALQUER DIREÇÃO
    // (evita que A peça pra B e, ao mesmo tempo, B peça pra A)
    buscarVinculo: async (usuarioId, colaboradorId) =>
    {
        const [linhas] = await conexao.query(
            `SELECT * FROM colaborador
             WHERE (usuarioId = ? AND colaboradorId = ?)
                OR (usuarioId = ? AND colaboradorId = ?)
             LIMIT 1`,
            [usuarioId, colaboradorId, colaboradorId, usuarioId]
        );
        return linhas[0];
    },

    buscarPorId: async (id) =>
    {
        const [linhas] = await conexao.query('SELECT * FROM colaborador WHERE id = ?', [id]);
        return linhas[0];
    },

    inserir: async (usuarioId, colaboradorId, status) =>
    {
        const [resultado] = await conexao.query(
            `INSERT INTO colaborador (usuarioId, colaboradorId, status, dataSolicitacao, dataResposta)
             VALUES (?, ?, ?, NOW(), NULL)`,
            [usuarioId, colaboradorId, status]
        );
        return resultado.insertId;
    },

    // Reenvia uma solicitação recusada anteriormente, respeitando quem é o
    // solicitante DESTA vez (pode ter invertido em relação à tentativa anterior)
    reenviarComoNovoSolicitante: async (id, usuarioId, colaboradorId) =>
    {
        const [resultado] = await conexao.query(
            `UPDATE colaborador SET usuarioId = ?, colaboradorId = ?, status = 'pendente',
                dataSolicitacao = NOW(), dataResposta = NULL
             WHERE id = ?`,
            [usuarioId, colaboradorId, id]
        );
        return resultado.affectedRows > 0;
    },

    // Solicitações pendentes RECEBIDAS pelo usuário logado (pro sino de notificação)
    listarPendentesRecebidas: async (usuarioId) =>
    {
        const [linhas] = await conexao.query(
            `SELECT c.id, c.usuarioId, c.dataSolicitacao,
                    u.nome AS solicitanteNome, u.nomeUser AS solicitanteNomeUser, u.codigo AS solicitanteCodigo
             FROM colaborador c
             INNER JOIN usuario u ON u.id = c.usuarioId
             WHERE c.colaboradorId = ? AND c.status = 'pendente'
             ORDER BY c.dataSolicitacao DESC`,
            [usuarioId]
        );
        return linhas;
    },

    // Só quem RECEBEU a solicitação (colaboradorId) pode responder
    responder: async (id, colaboradorIdLogado, novoStatus) =>
    {
        const [resultado] = await conexao.query(
            `UPDATE colaborador SET status = ?, dataResposta = NOW()
             WHERE id = ? AND colaboradorId = ? AND status = 'pendente'`,
            [novoStatus, id, colaboradorIdLogado]
        );
        return resultado.affectedRows > 0;
    },

    // Todos os ids de usuário já vinculados ao usuário logado (qualquer status,
    // em qualquer direção) — usado pra não sugerir de novo na busca
    listarVinculosDoUsuario: async (usuarioId) =>
    {
        const [linhas] = await conexao.query(
            `SELECT usuarioId, colaboradorId FROM colaborador WHERE usuarioId = ? OR colaboradorId = ?`,
            [usuarioId, usuarioId]
        );
        const ids = new Set();
        for (const l of linhas)
        {
            ids.add(l.usuarioId === usuarioId ? l.colaboradorId : l.usuarioId);
        }
        return ids;
    },
};

module.exports = modeloColaborador;
