// Modelo itemvenda: produtos incluídos em uma venda
const conexao = require('../config/database');

function formatarDecimal(valor)
{
    if (valor === null || valor === undefined || valor === '') return null;
    const n = Number(valor);
    if (!Number.isFinite(n)) return null;
    return Number(n.toFixed(2));
}

const modeloItemVenda =
{
    // Cria UM item de venda individual
    criar: async (vendaId, produtoId, precoUnitario) =>
    {
        const [resultado] = await conexao.query(
            `INSERT INTO itemvenda (vendaId, produtoId, precoUnitario)
             VALUES (?, ?, ?)`,
            [
                vendaId,
                produtoId,
                formatarDecimal(precoUnitario),
            ]
        );
        return resultado.insertId;
    },

    // Cria vários itens em lote (chamado dentro de transaction)
    criarLote: async (poolOrConexao, vendaId, itens) =>
    {
        const conex = poolOrConexao || conexao;
        for (const item of itens)
        {
            await conex.query(
                `INSERT INTO itemvenda (vendaId, produtoId, precoUnitario)
                 VALUES (?, ?, ?)`,
                [
                    vendaId,
                    Number(item.produtoId),
                    formatarDecimal(item.precoUnitario),
                ]
            );
        }
        return true;
    },

    // Lista todos itens de uma venda (com nome do produto via inner join)
    listarPorVendaId: async (vendaId) =>
    {
        const sql = `
            SELECT
                i.id,
                i.vendaId,
                i.produtoId,
                i.precoUnitario,
                p.nome AS produtoNome
            FROM itemvenda i
            INNER JOIN produto p ON p.id = i.produtoId
            WHERE i.vendaId = ?
            ORDER BY i.id ASC
        `;
        const [linhas] = await conexao.query(sql, [vendaId]);
        return linhas.map((i) => ({
            ...i,
            quantidade: 1,
            precoUnitario: formatarDecimal(i.precoUnitario),
            subtotal: formatarDecimal(1 * Number(i.precoUnitario)),
        }));
    },

    // Deleta TODOS os itens de uma venda (usado quando refaz lista na edição)
    deletarPorVendaId: async (poolOrConexao, vendaId) =>
    {
        const conex = poolOrConexao || conexao;
        const [resultado] = await conex.query(
            'DELETE FROM itemvenda WHERE vendaId = ?',
            [vendaId]
        );
        return resultado.affectedRows >= 0;
    },
};

module.exports = modeloItemVenda;
