const roteador = require('express').Router();
const { buscarUsuarios, solicitar, listarPendentes, responder } = require('../controllers/ColaboradorController');
const { autenticar } = require('../middlewares/auth');

roteador.use(autenticar);

roteador.get('/buscar', buscarUsuarios);
roteador.get('/pendentes', listarPendentes);
roteador.post('/', solicitar);
roteador.put('/:id/responder', responder);

module.exports = roteador;
