const roteador = require('express').Router();
const { listar, contarNaoLidas, marcarComoLida } = require('../controllers/NotificacaoController');
const { autenticar } = require('../middlewares/auth');

roteador.use(autenticar);

roteador.get('/', listar);
roteador.get('/contagem', contarNaoLidas);
roteador.put('/:id/lida', marcarComoLida);

module.exports = roteador;
