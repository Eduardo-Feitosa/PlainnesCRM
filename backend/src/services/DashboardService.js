const modeloCliente = require('../models/Cliente');
const modeloProduto = require('../models/Produto');
const modeloVenda   = require('../models/Venda');

const DashboardService = {
    async getMetrics(usuarioId)
    {
        const uId = Number(usuarioId);
        if (!Number.isFinite(uId) || uId <= 0)
        {
            throw new Error('Usuário inválido');
        }

        const [ clientes, produtos, vendas ] = await Promise.all([
            modeloCliente.listarTodos(uId).catch(() => []),
            modeloProduto.listarTodos(uId).catch(() => []),
            modeloVenda.listarTodos(uId).catch(() => []),
        ]);

        const totalClientes = Array.isArray(clientes) ? clientes.length : 0;
        const totalProdutos = Array.isArray(produtos) ? produtos.length : 0;
        const totalVendas   = Array.isArray(vendas)   ? vendas.length   : 0;
        const totalFaturado = Array.isArray(vendas)
            ? Number(
                vendas.reduce((acc, v) =>
                {
                    const n = Number(v?.valorTotal ?? v?.valor ?? 0);
                    return Number.isFinite(n) ? acc + n : acc;
                }, 0).toFixed(2),
              )
            : 0;

        return {
            totalClientes,
            totalProdutos,
            totalVendas,
            totalFaturado,
        };
    },
};

module.exports = DashboardService;
