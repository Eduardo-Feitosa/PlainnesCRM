const roteador = require('express').Router();
const { listar, buscarPorId, criar, atualizar, deletar } = require('../controllers/ClienteController');
const { exportarClientesCSV } = require('../controllers/ExportarController');
const { autenticar } = require('../middlewares/auth');

roteador.use(autenticar);

roteador.get('/', listar);
roteador.get('/exportar', exportarClientesCSV);
roteador.post('/exportar/filtrados', exportarClientesCSV);
roteador.get('/:id', buscarPorId);
roteador.post('/', criar);
roteador.put('/:id', atualizar);
roteador.delete('/:id', deletar);

module.exports = roteador;
