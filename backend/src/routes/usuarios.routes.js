// src/routes/usuarios.routes.js
const roteador = require('express').Router();
const { autenticar } = require('../middlewares/auth');
const { atualizarDados, atualizarSenha } = require('../controllers/UsuarioController');

// Todas as rotas abaixo exigem que o usuário esteja logado (JWT)
roteador.put('/perfil', autenticar, atualizarDados);
roteador.put('/senha', autenticar, atualizarSenha);

module.exports = roteador;
