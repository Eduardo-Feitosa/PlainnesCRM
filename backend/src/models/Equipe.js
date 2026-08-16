// Modelo equipe: dados da equipe em si (membros ficam em EquipeMembro)
const conexao = require('../config/database');

const normaliza = (valor) =>
{
    if (valor === undefined || valor === null) return null;
    if (typeof valor === 'string')
    {
        const limpo = valor.trim();
        return limpo === '' ? null : limpo;
    }
    return valor;
};

const modeloEquipe =
{
    // Lista as equipes onde o usuário logado é MEMBRO ACEITO (isso já cobre o
    // criador, que vira membro aceito automaticamente na criação da equipe)
    listarMinhas: async (usuarioId) =>
    {
        const [linhas] = await conexao.query(
            `SELECT e.*, (e.criadoPor = ?) AS souCriador,
                    (SELECT COUNT(*) FROM equipemembro em2 WHERE em2.equipeId = e.id AND em2.status = 'aceito') AS totalMembros
             FROM equipe e
             INNER JOIN equipemembro em ON em.equipeId = e.id
             WHERE em.usuarioId = ? AND em.status = 'aceito'
             ORDER BY e.dataCriacao DESC`,
            [usuarioId, usuarioId]
        );
        return linhas;
    },

    buscarPorId: async (id) =>
    {
        const [linhas] = await conexao.query('SELECT * FROM equipe WHERE id = ?', [id]);
        return linhas[0];
    },

    criar: async (poolOrConexao, dados) =>
    {
        const conex = poolOrConexao || conexao;
        const { nome, descricao, criadoPor, setor, objetivo } = dados;

        const [resultado] = await conex.query(
            `INSERT INTO equipe (nome, descricao, criadoPor, dataCriacao, setor, objetivo)
             VALUES (?, ?, ?, NOW(), ?, ?)`,
            [nome, normaliza(descricao), criadoPor, normaliza(setor), normaliza(objetivo)]
        );
        return resultado.insertId;
    },

    // Só o criador pode editar
    atualizar: async (id, criadoPorId, dados) =>
    {
        const { nome, descricao, setor, objetivo } = dados;
        const [resultado] = await conexao.query(
            `UPDATE equipe SET nome = ?, descricao = ?, setor = ?, objetivo = ?
             WHERE id = ? AND criadoPor = ?`,
            [nome, normaliza(descricao), normaliza(setor), normaliza(objetivo), id, criadoPorId]
        );
        return resultado.affectedRows > 0;
    },

    // Só o criador pode excluir
    deletar: async (poolOrConexao, id, criadoPorId) =>
    {
        const conex = poolOrConexao || conexao;
        const [resultado] = await conex.query(
            'DELETE FROM equipe WHERE id = ? AND criadoPor = ?',
            [id, criadoPorId]
        );
        return resultado.affectedRows > 0;
    },

    // Utilitário: pool para quem quiser transactions (mesmo padrão de Venda.js)
    conexao,
};

module.exports = modeloEquipe;
