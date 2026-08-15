const conexao = require('../config/database');

const normaliza = (valor) =>
{
    if (valor === undefined || valor === null) return null;
    if (typeof valor === 'string')
    {
        const limpo = valor.trim();
        return limpo === '' ? null : limpo;
    }
    return valor;
};

const formatarDataSql = (valor) =>
{
    const limpo = normaliza(valor);
    if (limpo === null) return null;
    const d = new Date(limpo);
    if (Number.isNaN(d.getTime())) return null;
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

const modeloCliente =
{
    listarTodos: async (usuarioId) =>
    {
        const [linhas] = await conexao.query(
            'SELECT * FROM Cliente WHERE usuarioId = ? ORDER BY nome',
            [usuarioId]
        );
        return linhas;
    },

    buscarPorId: async (id, usuarioId) =>
    {
        const [linhas] = await conexao.query(
            'SELECT * FROM Cliente WHERE id = ? AND usuarioId = ?',
            [id, usuarioId]
        );
        return linhas[0];
    },

    buscarPorEmail: async (email, usuarioId) =>
    {
        const [linhas] = await conexao.query(
            'SELECT * FROM Cliente WHERE email = ? AND usuarioId = ?',
            [email, usuarioId]
        );
        return linhas[0];
    },

    criar: async (dados) =>
    {
        const usuarioId = dados.usuarioId;
        const nome = normaliza(dados.nome);
        const telefone = normaliza(dados.telefone);
        const email = normaliza(dados.email);
        const instagram = normaliza(dados.instagram);
        const sexo = normaliza(dados.sexo);
        const estado = normaliza(dados.estado);
        const dataNascimento = formatarDataSql(dados.dataNascimento);
        const descricao = normaliza(dados.descricao);
        const status = normaliza(dados.status) || 'Ativo';
        const dataCadastramento = dados.dataCadastramento || new Date();

        const [resultado] =
        await conexao.query
        (
            `INSERT INTO Cliente
            (usuarioId, nome, telefone, email, instagram, sexo, estado, dataNascimento, descricao, statusCliente, dataCadastramento)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [usuarioId, nome, telefone, email, instagram, sexo, estado, dataNascimento, descricao, status, dataCadastramento]
        );

        return resultado.insertId;
    },

    atualizar: async (id, usuarioId, dados) =>
    {
        const nome = normaliza(dados.nome);
        const telefone = normaliza(dados.telefone);
        const email = normaliza(dados.email);
        const instagram = normaliza(dados.instagram);
        const sexo = normaliza(dados.sexo);
        const estado = normaliza(dados.estado);
        const dataNascimento = formatarDataSql(dados.dataNascimento);
        const descricao = normaliza(dados.descricao);
        const status = normaliza(dados.status) || 'Ativo';

        const [resultado] =
        await conexao.query
        (
            `UPDATE Cliente SET
            nome = ?, telefone = ?, email = ?, instagram = ?, sexo = ?, estado = ?,
            dataNascimento = ?, descricao = ?, statusCliente = ?
            WHERE id = ? AND usuarioId = ?`,
            [nome, telefone, email, instagram, sexo, estado, dataNascimento, descricao, status, id, usuarioId]
        );

        return resultado.affectedRows > 0;
    },

    deletar: async (id, usuarioId) =>
    {
        const [resultado] = await conexao.query(
            'DELETE FROM Cliente WHERE id = ? AND usuarioId = ?',
            [id, usuarioId]
        );

        return resultado.affectedRows > 0;
    },

    emailJaExiste: async (email, usuarioId, idExcluir = null) =>
    {
        const emailLimpo = normaliza(email);
        if (!emailLimpo) return false;

        let sql = 'SELECT id FROM Cliente WHERE email = ? AND usuarioId = ?';
        const params = [emailLimpo, usuarioId];

        if (idExcluir !== null)
        {
            sql += ' AND id != ?';
            params.push(idExcluir);
        }

        const [linhas] = await conexao.query(sql, params);
        return linhas.length > 0;
    }
};

module.exports = modeloCliente;
