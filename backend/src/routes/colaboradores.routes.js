const roteador = require('express').Router();
const { buscarUsuarios, solicitar, listarPendentes, responder, listarColaboradores, remover } = require('../controllers/ColaboradorController');
const { autenticar } = require('../middlewares/auth');

roteador.use(autenticar);

roteador.get('/buscar', buscarUsuarios);
roteador.get('/pendentes', listarPendentes);
roteador.get('/', listarColaboradores);
roteador.post('/', solicitar);
roteador.put('/:id/responder', responder);
roteador.delete('/:id', remover);

module.exports = roteador;
