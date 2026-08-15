const express = require('express');
const VendaController = require('../controllers/VendaController');
const { exportarVendasCSV } = require('../controllers/ExportarController');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

router.use(autenticar);

router.get('/', VendaController.listar);
router.get('/exportar', exportarVendasCSV);
router.post('/exportar/filtrados', exportarVendasCSV);
router.get('/:id', VendaController.buscarPorId);
router.post('/', VendaController.criar);
router.put('/:id', VendaController.atualizar);
router.delete('/:id', VendaController.deletar);

module.exports = router;
