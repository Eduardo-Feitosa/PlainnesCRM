// Importa a conexão com o banco de dados
const conexao = require('../config/database');
// Importa a biblioteca para criptografar e comparar senhas
const bcrypt = require('bcryptjs');

// "molde" do usuário, com todas as funções que manipulam a tabela Usuario
const modeloUsuario = 
{
        // Busca um usuário no banco pelo email (usado no login)
        buscarPorEmail: async (email) => 
        {
            const [linhas] = await conexao.query(
            'SELECT * FROM Usuario WHERE email = ?', 
            [email]
            );
            return linhas[0]; // Retorna o primeiro usuário encontrado
        },

        // Busca um usuário no banco pelo ID
        buscarPorId: async (id) =>
        {
            const [linhas] = await conexao.query(
            'SELECT * FROM Usuario WHERE id = ?',
            [id]
            );
            return linhas[0];
        },

        // Cria um novo usuário no banco de dados
        criar: async (dados) => 
        {
            // Extrai os campos enviados pelo frontend
            const { nome, email, senha, tipo, telefone, setor, cpf, dataNascimento, funcao, cnpj } = dados;
            
            // Criptografa a senha antes de salvar (segurança)
            const senhaCriptografada = await bcrypt.hash(senha, 10);

            // RF002: usuário por padrão SEMPRE recebe role 'user' no cadastro.
            // (role 'admin' nunca é atribuído por request; só via SQL ou rotas admin futuras)
            const rolePadrao = 'user';
            
            // Insere os dados na tabela Usuario
            const [resultado] = 
            await conexao.query
            (
            `INSERT INTO Usuario 
            (nome, email, senha, tipo, telefone, setor, cpf, dataNascimento, funcao, cnpj, role) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nome, email, senhaCriptografada, tipo, telefone, setor, cpf 
                || null, dataNascimento 
                || null, funcao, cnpj 
                || null, rolePadrao]
            );
            
            return resultado.insertId; // Retorna o ID do novo usuário criado
        },

        // Verifica se um email já está cadastrado (para evitar duplicidade)
        // Se idExcluir for passado, ignora o próprio usuário (útil para atualização)
        emailJaExiste: async (email, idExcluir = null) => 
        {
            let sql = 'SELECT id FROM Usuario WHERE email = ?';
            const params = [email];

            if (idExcluir)
            {
                sql += ' AND id <> ?';
                params.push(idExcluir);
            }

            const [linhas] = await conexao.query(sql, params);
            return linhas.length > 0; // Se achou algum, retorna verdadeiro
        },

        // Verifica se um CPF já está cadastrado (apenas para Pessoa Física)
        cpfJaExiste: async (cpf, idExcluir = null) => 
        {
            let sql = 'SELECT id FROM Usuario WHERE cpf = ?';
            const params = [cpf];

            if (idExcluir)
            {
                sql += ' AND id <> ?';
                params.push(idExcluir);
            }

            const [linhas] = await conexao.query(sql, params);
            return linhas.length > 0;
        },

        // Verifica se um CNPJ já está cadastrado (apenas para Pessoa Jurídica)
        cnpjJaExiste: async (cnpj, idExcluir = null) => {
            let sql = 'SELECT id FROM Usuario WHERE cnpj = ?';
            const params = [cnpj];

            if (idExcluir)
            {
                sql += ' AND id <> ?';
                params.push(idExcluir);
            }

            const [linhas] = await conexao.query(sql, params);
            return linhas.length > 0;
        },

        // Atualiza os dados de perfil do usuário (sem mexer na senha)
        atualizarDados: async (id, dados) =>
        {
            const { nome, email, tipo, telefone, setor, cpf, dataNascimento, funcao, cnpj } = dados;

            const [resultado] = await conexao.query(
                `UPDATE Usuario SET
                    nome = ?,
                    email = ?,
                    tipo = ?,
                    telefone = ?,
                    setor = ?,
                    cpf = ?,
                    dataNascimento = ?,
                    funcao = ?,
                    cnpj = ?
                WHERE id = ?`,
                [
                    nome, email, tipo, telefone, setor,
                    cpf || null, dataNascimento || null, funcao, cnpj || null,
                    id
                ]
            );

            return resultado.affectedRows > 0;
        },

        // Atualiza apenas a senha do usuário (recebe nova senha já criptografada)
        atualizarSenha: async (id, novaSenha) =>
        {
            const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

            const [resultado] = await conexao.query(
                'UPDATE Usuario SET senha = ? WHERE id = ?',
                [senhaCriptografada, id]
            );

            return resultado.affectedRows > 0;
        },

        // Compara a senha digitada com a senha criptografada salva no banco
        compararSenha: async (senhaDigitada, senhaSalva) => 
        {
            return await bcrypt.compare(senhaDigitada, senhaSalva);
        }

};

// Exporta o molde para ser usado no Controller
module.exports = modeloUsuario;
