// app.js
const express = require('express');
const cors = require('cors');
const pool = require('./src/config/database');

// 🔹 Importar as rotas de autenticação
const rotasAuth = require('./src/routes/auth.routes');
const rotasClientes = require('./src/routes/clientes.routes');
const rotasProdutos = require('./src/routes/produtos.routes');
const rotasUsuarios = require('./src/routes/usuarios.routes');
const rotasVendas = require('./src/routes/vendas.routes');
const rotasDashboard = require('./src/routes/dashboard.routes');
const rotasEquipes = require('./src/routes/equipes.routes');
const rotasNotificacoes = require('./src/routes/notificacoes.routes');
const rotasColaboradores = require('./src/routes/colaboradores.routes');

const app = express();

// 1. MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. ROTAS DA API
app.use('/api/auth', rotasAuth);   // ← ESSENCIAL!
app.use('/api/clientes', rotasClientes);
app.use('/api/produtos', rotasProdutos);
app.use('/api/usuarios', rotasUsuarios);
app.use('/api/vendas', rotasVendas);
app.use('/api/dashboard', rotasDashboard);
app.use('/api/equipes', rotasEquipes);
app.use('/api/notificacoes', rotasNotificacoes);
app.use('/api/colaboradores', rotasColaboradores);

// 3. ROTAS DE TESTE
app.get('/api/plainness', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando!' });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 + 1 AS resultado');
    res.json({
      success: true,
      message: '✅ Conexão com o banco de dados OK!',
      resultado: result[0].resultado,
      database: process.env.DB_NAME || 'plainness_crm'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. ROTA 404 (sempre no final)
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// 5. ROTA 500
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

module.exports = app;