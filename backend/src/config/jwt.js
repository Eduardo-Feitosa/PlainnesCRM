const jwt = require('jsonwebtoken');

const segredo = process.env.JWT_SECRET;
if (!segredo) 
{
  throw new Error('JWT_SECRET não definido no arquivo .env');
}

const tempoExpiracao = process.env.JWT_EXPIRES_IN || '1d';

const gerarToken = (dados) => {
  return jwt.sign(dados, segredo, { expiresIn: tempoExpiracao });
};

const verificarToken = (token) => {
  return jwt.verify(token, segredo);
};

module.exports = { gerarToken, verificarToken };