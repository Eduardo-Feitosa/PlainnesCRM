// src/routes/auth.routes.js
const roteador = require('express').Router();
const { cadastrar, logar } = require('../controllers/UsuarioController');

roteador.post('/cadastrar', cadastrar);
roteador.post('/login', logar);

module.exports = roteador;