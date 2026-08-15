const express = require('express');
const ProdutoController = require('../controllers/ProdutoController');
const { exportarProdutosCSV } = require('../controllers/ExportarController');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

router.use(autenticar);

router.get('/', ProdutoController.listar);
router.get('/exportar', exportarProdutosCSV);
router.post('/exportar/filtrados', exportarProdutosCSV);
router.get('/:id', ProdutoController.buscarPorId);
router.post('/', ProdutoController.criar);
router.put('/:id', ProdutoController.atualizar);
router.delete('/:id', ProdutoController.deletar);

module.exports = router;