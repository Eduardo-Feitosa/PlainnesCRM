const dashboardService = require('../services/DashboardService');

const DashboardController = {
    getMetrics: async (req, res) =>
    {
        try
        {
            const usuarioId = req?.usuario?.id;
            if (!usuarioId)
            {
                return res.status(401).json({ erro: 'Sessão inválida' });
            }

            const metrics = await dashboardService.getMetrics(usuarioId);

            return res.status(200).json({
                totalClientes: Number(metrics.totalClientes ?? 0),
                totalProdutos: Number(metrics.totalProdutos ?? 0),
                totalVendas:   Number(metrics.totalVendas ?? 0),
                totalFaturado: Number(metrics.totalFaturado ?? 0),
            });
        }
        catch (e)
        {
            console.error('[DashboardController.getMetrics] erro:', e);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    },
};

module.exports = DashboardController;
