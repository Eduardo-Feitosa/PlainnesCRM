const roteador = require('express').Router();
const DashboardController = require('../controllers/DashboardController');
const { autenticar } = require('../middlewares/auth');

roteador.use(autenticar);

roteador.get('/metrics', DashboardController.getMetrics);

module.exports = roteador;
