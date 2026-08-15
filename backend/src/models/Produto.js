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

const formatarDecimal = (valor) =>
{
    if (valor === undefined || valor === null) return null;
    const n = Number(valor);
    if (!Number.isFinite(n)) return null;
    return Number(n.toFixed(2));
};

const modeloProduto =
{
    listarTodos: async (usuarioId) =>
    {
        const [linhas] = await conexao.query(
            'SELECT * FROM Produto WHERE usuarioId = ? ORDER BY nome',
            [usuarioId]
        );
        return linhas;
    },

    buscarPorId: async (id, usuarioId) =>
    {
        const [linhas] = await conexao.query(
            'SELECT * FROM Produto WHERE id = ? AND usuarioId = ?',
            [id, usuarioId]
        );
        return linhas[0];
    },

    criar: async (dados) =>
    {
        const usuarioId = dados.usuarioId;
        const nome = normaliza(dados.nome);
        const descricao = normaliza(dados.descricao);
        const nicho = normaliza(dados.nicho);
        const valor = formatarDecimal(dados.valor);
        const investimento = formatarDecimal(dados.investimento);
        const classificacaoPorPreco = normaliza(dados.classificacaoPorPreco);

        const [resultado] =
        await conexao.query
        (
            `INSERT INTO Produto
            (usuarioId, nome, descricao, nicho, valor, investimento, classificacaoPorPreco)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [usuarioId, nome, descricao, nicho, valor, investimento, classificacaoPorPreco]
        );

        return resultado.insertId;
    },

    atualizar: async (id, usuarioId, dados) =>
    {
        const nome = normaliza(dados.nome);
        const descricao = normaliza(dados.descricao);
        const nicho = normaliza(dados.nicho);
        const valor = formatarDecimal(dados.valor);
        const investimento = formatarDecimal(dados.investimento);
        const classificacaoPorPreco = normaliza(dados.classificacaoPorPreco);

        const [resultado] =
        await conexao.query
        (
            `UPDATE Produto SET
            nome = ?, descricao = ?, nicho = ?, valor = ?, investimento = ?, classificacaoPorPreco = ?
            WHERE id = ? AND usuarioId = ?`,
            [nome, descricao, nicho, valor, investimento, classificacaoPorPreco, id, usuarioId]
        );

        return resultado.affectedRows > 0;
    },

    deletar: async (id, usuarioId) =>
    {
        const [resultado] = await conexao.query(
            'DELETE FROM Produto WHERE id = ? AND usuarioId = ?',
            [id, usuarioId]
        );

        return resultado.affectedRows > 0;
    },
};

module.exports = modeloProduto;