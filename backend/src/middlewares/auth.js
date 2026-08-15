const { verificarToken } = require('../config/jwt');
const modeloUsuario = require('../models/Usuario');

const ROLES_VALIDOS = ['user', 'admin'];

function normalizarRole(valorBruto)
{
    const s = (valorBruto == null ? '' : String(valorBruto)).trim().toLowerCase();
    if (ROLES_VALIDOS.includes(s)) return s;
    return null;
}

const autenticar = async (req, res, next) =>
{
    try
    {
        const header = req.headers.authorization;

        if (!header || !header.startsWith('Bearer '))
        {
            return res.status(401).json({ erro: 'Token não fornecido' });
        }

        const token = header.split(' ')[1];

        let decodificado;
        try
        {
            decodificado = verificarToken(token);
        }
        catch (_errJwt)
        {
            return res.status(401).json({ erro: 'Token inválido ou expirado' });
        }

        if (!decodificado || typeof decodificado.id === 'undefined')
        {
            return res.status(401).json({ erro: 'Token inválido ou expirado' });
        }

        const usuarioExiste = await modeloUsuario.buscarPorId(decodificado.id);
        if (!usuarioExiste)
        {
            return res.status(401).json({
                erro: 'Sessão inválida. Saia e entre novamente para continuar.',
                sessaoInvalida: true,
            });
        }

        // HARDENING SEGURANÇA ROLE: usuário criado fora do cadastro / legado
        // tem role NULL no banco? Bloqueia com mensagem amigável 401.
        // Nunca deixamos passar req.usuario sem papel válido (evita falha de
        // "usuário inserido por SQL fora do site consegue logar").
        let roleNormalizado = normalizarRole(usuarioExiste.role);
        if (!roleNormalizado)
        {
            console.warn(
                '⚠️ auth: bloqueado usuário SEM papel válido. id=' +
                usuarioExiste.id +
                ' email=' +
                usuarioExiste.email +
                ' roleBruto=' +
                usuarioExiste.role
            );
            return res.status(401).json({
                erro: 'Conta com perfil de acesso inválido. Contate o administrador ou atualize o cadastro diretamente no banco.',
                contaSemRole: true,
                sessaoInvalida: true,
            });
        }

        req.usuario =
        {
            id: usuarioExiste.id,
            email: usuarioExiste.email,
            nome: usuarioExiste.nome,
            tipo: usuarioExiste.tipo,
            role: roleNormalizado,
        };

        next();
    }
    catch (error)
    {
        console.error('⚠️ auth middleware erro:', error);
        return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
};

module.exports = { autenticar, ROLES_VALIDOS, normalizarRole };
