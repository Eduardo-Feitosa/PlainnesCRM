// Modelo equipemembro: vínculo N:N entre usuario e equipe (convite/aceite/recusa)
const conexao = require('../config/database');

const modeloEquipeMembro =
{
    // Vínculo atual entre um usuário e uma equipe (qualquer status), ou undefined se nunca existiu
    buscarVinculo: async (equipeId, usuarioId) =>
    {
        const [linhas] = await conexao.query(
            'SELECT * FROM equipemembro WHERE equipeId = ? AND usuarioId = ?',
            [equipeId, usuarioId]
        );
        return linhas[0];
    },

    // Cria um vínculo novo (convite pendente, ou o criador entrando já aceito)
    inserir: async (poolOrConexao, equipeId, usuarioId, status) =>
    {
        const conex = poolOrConexao || conexao;
        const dataRespostaImediata = status === 'aceito' ? new Date() : null;
        const [resultado] = await conex.query(
            `INSERT INTO equipemembro (equipeId, usuarioId, status, dataConvite, dataResposta)
             VALUES (?, ?, ?, NOW(), ?)`,
            [equipeId, usuarioId, status, dataRespostaImediata]
        );
        return resultado.insertId;
    },

    // Reenvia convite para quem já teve vínculo (ex.: recusou antes) — volta pra pendente
    reenviarConvite: async (equipeId, usuarioId) =>
    {
        const [resultado] = await conexao.query(
            `UPDATE equipemembro SET status = 'pendente', dataConvite = NOW(), dataResposta = NULL
             WHERE equipeId = ? AND usuarioId = ?`,
            [equipeId, usuarioId]
        );
        return resultado.affectedRows > 0;
    },

    // Lista os membros/convites de uma equipe, com dados básicos do usuário
    listarPorEquipe: async (equipeId) =>
    {
        const [linhas] = await conexao.query(
            `SELECT em.equipeId, em.usuarioId, em.status, em.dataConvite, em.dataResposta,
                    u.nome, u.nomeUser, u.codigo, u.funcao,
                    (u.id = e.criadoPor) AS ehCriador
             FROM equipemembro em
             INNER JOIN usuario u ON u.id = em.usuarioId
             INNER JOIN equipe e ON e.id = em.equipeId
             WHERE em.equipeId = ?
             ORDER BY ehCriador DESC, em.status ASC, u.nome ASC`,
            [equipeId]
        );
        return linhas;
    },

    // Convites pendentes recebidos pelo usuário logado (para o sino de notificação)
    listarConvitesPendentes: async (usuarioId) =>
    {
        const [linhas] = await conexao.query(
            `SELECT e.id AS equipeId, e.nome AS equipeNome, e.descricao AS equipeDescricao,
                    em.dataConvite, u.nome AS criadoPorNome
             FROM equipemembro em
             INNER JOIN equipe e ON e.id = em.equipeId
             INNER JOIN usuario u ON u.id = e.criadoPor
             WHERE em.usuarioId = ? AND em.status = 'pendente'
             ORDER BY em.dataConvite DESC`,
            [usuarioId]
        );
        return linhas;
    },

    // Usuário logado aceita ou recusa um convite pendente que recebeu
    responder: async (equipeId, usuarioId, novoStatus) =>
    {
        const [resultado] = await conexao.query(
            `UPDATE equipemembro SET status = ?, dataResposta = NOW()
             WHERE equipeId = ? AND usuarioId = ? AND status = 'pendente'`,
            [novoStatus, equipeId, usuarioId]
        );
        return resultado.affectedRows > 0;
    },

    // Criador remove um membro, ou membro sai por conta própria
    remover: async (equipeId, usuarioId) =>
    {
        const [resultado] = await conexao.query(
            'DELETE FROM equipemembro WHERE equipeId = ? AND usuarioId = ?',
            [equipeId, usuarioId]
        );
        return resultado.affectedRows > 0;
    },

    // Deleta todos os vínculos de uma equipe (usado ao excluir a equipe inteira)
    removerTodosDaEquipe: async (poolOrConexao, equipeId) =>
    {
        const conex = poolOrConexao || conexao;
        const [resultado] = await conex.query('DELETE FROM equipemembro WHERE equipeId = ?', [equipeId]);
        return resultado.affectedRows >= 0;
    },

    souMembroAceito: async (equipeId, usuarioId) =>
    {
        const [linhas] = await conexao.query(
            `SELECT 1 FROM equipemembro WHERE equipeId = ? AND usuarioId = ? AND status = 'aceito' LIMIT 1`,
            [equipeId, usuarioId]
        );
        return linhas.length > 0;
    },

    conexao,
};

module.exports = modeloEquipeMembro;
