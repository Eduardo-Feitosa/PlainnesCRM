const roteador = require('express').Router();
const {
    listar, buscarPorId, criar, atualizar, deletar,
    listarMembros, buscarUsuarios, convidar, removerMembro, sair,
    listarConvites, responderConvite,
} = require('../controllers/EquipeController');
const { autenticar } = require('../middlewares/auth');

roteador.use(autenticar);

// Rotas estáticas (sem :id) precisam vir ANTES de '/:id' pro Express não
// interpretar "convites" como um valor de :id
roteador.get('/convites', listarConvites);
roteador.get('/', listar);
roteador.post('/', criar);

roteador.get('/:id', buscarPorId);
roteador.put('/:id', atualizar);
roteador.delete('/:id', deletar);
roteador.put('/:id/convite', responderConvite);
roteador.post('/:id/sair', sair);

roteador.get('/:id/membros', listarMembros);
roteador.get('/:id/membros/buscar', buscarUsuarios);
roteador.post('/:id/membros', convidar);
roteador.delete('/:id/membros/:membroId', removerMembro);

module.exports = roteador;
