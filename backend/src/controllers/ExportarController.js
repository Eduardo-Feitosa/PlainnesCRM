const modeloCliente = require('../models/Cliente');
const modeloProduto = require('../models/Produto');
const modeloVenda = require('../models/Venda');

const {
    enviarCSV,
    limparLinhaSegura,
    formatarDataBR,
    formatarDinheiroBR,
} = require('../utils/csv');

// ============================================
// HELPERS DE FILTRO (prioridade: IDS da tela front)
// ============================================

function extrairIdsFiltrados(req)
{
    if (!req) return null;

    const idsRaw = (req?.query?.ids !== undefined && req?.query?.ids !== null)
        ? String(req.query.ids).trim() : '';
    if (idsRaw)
    {
        const nums = idsRaw.split(',')
            .map((x) => Number(String(x).trim()))
            .filter((n) => Number.isFinite(n) && n > 0);
        if (nums.length) return new Set(nums);
    }

    if (req?.body && Array.isArray(req.body.ids))
    {
        const nums = (req.body.ids || [])
            .map((x) => Number(x))
            .filter((n) => Number.isFinite(n) && n > 0);
        if (nums.length) return new Set(nums);
    }

    return null;
}

function validarSessao(req, res)
{
    if (!req?.usuario?.id)
    {
        res.status(401).json({
            erro: 'Sessão inválida. Saia e entre novamente.',
            sessaoInvalida: true,
        });
        return null;
    }
    return req.usuario.id;
}

// ============================================
// HELPERS DE ERRO COMPARTILHADOS
// ============================================

function parseErroFkUsuario(error)
{
    if (!error) return null;
    if (error.code !== 'ER_NO_REFERENCED_ROW_2' && error.errno !== 1452 && error.code !== 'ER_ROW_IS_REFERENCED_2') return null;
    const sqlMsg = (error.sqlMessage || '').toString();
    if (/cliente_ibfk/i.test(sqlMsg) || /FOREIGN KEY.*usuario/i.test(sqlMsg) || /REFERENCES.*usuario/i.test(sqlMsg))
    {
        return {
            status: 401,
            body: { erro: 'Sessão inválida. Saia e entre novamente para continuar.', sessaoInvalida: true },
        };
    }
    return null;
}

const mapaCampoVenda = {
    dataVenda: 'data da venda',
    statusVenda: 'status da venda',
    clienteId: 'cliente',
    usuarioId: 'usuário',
    observacao: 'observações',
};

function parseErroNullVenda(error)
{
    if (!error || (error.code !== 'ER_BAD_NULL_ERROR' && error.errno !== 1048)) return null;
    const m = /Column\s+'([^']+)'/i.exec(error.sqlMessage || '');
    if (!m) return null;
    const col = m[1];
    const nome = mapaCampoVenda[col] || col;
    return { status: 400, body: { erro: `campo ${nome} não pode ser vazio` } };
}

function parseErroFkVenda(error)
{
    if (!error) return null;
    if (error.errno === 1452 || error.code === 'ER_NO_REFERENCED_ROW_2')
    {
        const sm = (error.sqlMessage || '').toString();
        if (/cliente/i.test(sm)) return { status: 400, body: { erro: 'Cliente não encontrado ou não pertence a este usuário.' } };
        if (/produto/i.test(sm)) return { status: 400, body: { erro: 'Produto não encontrado ou não pertence a este usuário.' } };
        if (/usuario/i.test(sm)) return { status: 401, body: { erro: 'Sessão inválida. Saia e entre novamente.', sessaoInvalida: true } };
        return { status: 400, body: { erro: 'Relacionamento inválido.' } };
    }
    if (error.errno === 1451 || error.code === 'ER_ROW_IS_REFERENCED_2')
    {
        return { status: 400, body: { erro: 'Registro associado a outros dados do sistema.' } };
    }
    if (error.errno === 1062 || error.code === 'ER_DUP_ENTRY')
    {
        return { status: 400, body: { erro: 'Dados duplicados.' } };
    }
    return null;
}

// ============================================
// 1. EXPORTAR CLIENTES
// ============================================

const exportarClientesCSV = async (req, res) =>
{
    try
    {
        const usuarioId = validarSessao(req, res);
        if (usuarioId === null) return;

        const todos = await modeloCliente.listarTodos(usuarioId);
        const somenteIds = extrairIdsFiltrados(req);

        const busca = (req?.query?.busca && String(req.query.busca).trim()) || '';
        const status = (req?.query?.status && String(req.query.status).trim()) || '';
        const sexo = (req?.query?.sexo && String(req.query.sexo).trim()) || '';
        const estado = (req?.query?.estado && String(req.query.estado).trim()) || '';
        const termo = busca.toLowerCase();

        const filtrados = (todos || []).filter((c) =>
        {
            if (somenteIds)
            {
                if (!somenteIds.has(Number(c.id))) return false;
            }
            else
            {
                if (status)
                {
                    const sAtual = String(c.statusCliente || c.status || '').trim();
                    if (sAtual !== String(status).trim()) return false;
                }
                if (sexo)
                {
                    const s = String(c.sexo || '').trim();
                    if (s.toLowerCase() !== String(sexo).trim().toLowerCase()) return false;
                }
                if (estado)
                {
                    const e = String(c.estado || '').trim();
                    if (e.toLowerCase() !== String(estado).trim().toLowerCase()) return false;
                }
                if (termo)
                {
                    const haystack = [
                        c.nome, c.email, c.telefone, c.estado,
                        c.instagram ?? '', c.sexo ?? '', c.descricao ?? '',
                        c.cpfCnpj ?? '', c.dataNascimento ?? '',
                    ].join(' ').toLowerCase();
                    if (!haystack.includes(termo)) return false;
                }
            }
            return true;
        });

        const linhas = filtrados.map(limparLinhaSegura);
        const colunas = [
            { header: 'Nome',          value: (c) => c.nome || '' },
            { header: 'Email',         value: (c) => c.email || '' },
            { header: 'Telefone',      value: (c) => c.telefone || '' },
            { header: 'Instagram',     value: (c) => c.instagram || '' },
            { header: 'Sexo',          value: (c) => c.sexo || '' },
            { header: 'Estado',        value: (c) => c.estado || '' },
            { header: 'Nascimento',    value: (c) => formatarDataBR(c.dataNascimento) },
            { header: 'Status',        value: (c) => c.statusCliente || c.status || '' },
            { header: 'Descrição',     value: (c) => c.descricao || '' },
            { header: 'Cadastrado em', value: (c) => formatarDataBR(c.dataCadastramento) },
        ];

        enviarCSV(res, 'clientes', colunas, linhas);
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json(fk.body || { erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        console.error('❌ ExportarController exportarClientesCSV:', error);
        res.status(500).json({ erro: 'Erro interno ao gerar CSV de clientes' });
    }
};

// ============================================
// 2. EXPORTAR PRODUTOS
// ============================================

const exportarProdutosCSV = async (req, res) =>
{
    try
    {
        const usuarioId = validarSessao(req, res);
        if (usuarioId === null) return;

        const todos = await modeloProduto.listarTodos(usuarioId);
        const somenteIds = extrairIdsFiltrados(req);

        const busca = (req?.query?.busca && String(req.query.busca).trim()) || '';
        const classificacao = (req?.query?.classificacao && String(req.query.classificacao).trim()) || '';
        const nicho = (req?.query?.nicho && String(req.query.nicho).trim()) || '';
        const b = busca.toLowerCase();

        const filtrados = (todos || []).filter((p) =>
        {
            if (somenteIds)
            {
                if (!somenteIds.has(Number(p.id))) return false;
            }
            else
            {
                if (classificacao)
                {
                    const c = String(p.classificacaoPorPreco || '').trim().toLowerCase();
                    if (c !== String(classificacao).trim().toLowerCase()) return false;
                }
                if (nicho)
                {
                    const n = String(p.nicho || '').trim().toLowerCase();
                    if (n !== String(nicho).trim().toLowerCase()) return false;
                }
                if (b)
                {
                    const nome = (p.nome ?? '').toLowerCase();
                    const nichoLinha = (p.nicho ?? '').toLowerCase();
                    const desc = (p.descricao ?? '').toLowerCase();
                    const classifStr = String(p.classificacaoPorPreco ?? '').toLowerCase();
                    const valorNum = Number(p.valor);
                    const investNum = Number(p.investimento);
                    const valorStr = Number.isFinite(valorNum)
                        ? valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).toLowerCase()
                        : '';
                    const investStr = Number.isFinite(investNum)
                        ? investNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).toLowerCase()
                        : '';
                    const match = nome.includes(b) || nichoLinha.includes(b) || desc.includes(b)
                        || valorStr.includes(b) || investStr.includes(b) || classifStr.includes(b);
                    if (!match) return false;
                }
            }
            return true;
        });

        const linhas = filtrados.map(limparLinhaSegura);
        const colunas = [
            { header: 'Nome',               value: (p) => p.nome || '' },
            { header: 'Descrição',          value: (p) => p.descricao || '' },
            { header: 'Nicho',              value: (p) => p.nicho || '' },
            { header: 'Valor (R$)',         value: (p) => formatarDinheiroBR(p.valor) },
            { header: 'Investimento (R$)',  value: (p) => formatarDinheiroBR(p.investimento) },
            { header: 'Classificação',      value: (p) => p.classificacaoPorPreco || '' },
        ];

        enviarCSV(res, 'produtos', colunas, linhas);
    }
    catch (error)
    {
        const fk = parseErroFkUsuario(error);
        if (fk) return res.status(fk.status).json(fk.body || { erro: fk.msg, sessaoInvalida: !!fk.sessaoInvalida });
        console.error('❌ ExportarController exportarProdutosCSV:', error);
        res.status(500).json({ erro: 'Erro interno ao gerar CSV de produtos' });
    }
};

// ============================================
// 3. EXPORTAR VENDAS
// ============================================

const exportarVendasCSV = async (req, res) =>
{
    try
    {
        const usuarioId = validarSessao(req, res);
        if (usuarioId === null) return;

        const todas = await modeloVenda.listarTodos(usuarioId);
        const somenteIds = extrairIdsFiltrados(req);

        const busca = (req?.query?.busca && String(req.query.busca).trim()) || '';
        const status = (req?.query?.status && String(req.query.status).trim()) || '';
        const canal = (req?.query?.canal && String(req.query.canal).trim()) || '';
        const dataInicio = (req?.query?.dataInicio && String(req.query.dataInicio).trim()) || '';
        const dataFim = (req?.query?.dataFim && String(req.query.dataFim).trim()) || '';
        const clienteIdRaw = (req?.query?.clienteId !== undefined && req?.query?.clienteId !== null)
            ? String(req.query.clienteId).trim() : '';
        const clienteIdNum = clienteIdRaw ? Number(clienteIdRaw) : null;
        const b = busca.toLowerCase();

        const filtradas = (todas || []).filter((v) =>
        {
            if (somenteIds)
            {
                if (!somenteIds.has(Number(v.id))) return false;
            }
            else
            {
                if (b)
                {
                    const clienteNome = String(v.clienteNome || '').toLowerCase();
                    const obs = String(v.observacao || '').toLowerCase();
                    const aval = String(v.avaliacao || '').toLowerCase();
                    const cpfCnpj = String(v.clienteCpfCnpj || '').toLowerCase();
                    const email = String(v.clienteEmail || '').toLowerCase();
                    const tel = String(v.clienteTelefone || '').toLowerCase();
                    const canalLinha = String(v.canal || '').toLowerCase();
                    const statusLinha = String(v.statusVenda || '').toLowerCase();
                    const itensNomes = Array.isArray(v.itens)
                        ? v.itens.map((i) => String(i?.produtoNome || '').toLowerCase()).join(' ')
                        : '';
                    const match = clienteNome.includes(b) || obs.includes(b) || aval.includes(b)
                        || cpfCnpj.includes(b) || email.includes(b) || tel.includes(b)
                        || canalLinha.includes(b) || statusLinha.includes(b) || itensNomes.includes(b);
                    if (!match) return false;
                }
                if (status && String(v.statusVenda || '') !== String(status)) return false;
                if (canal && String(v.canal || '') !== String(canal)) return false;
                if (clienteIdNum && Number(v.clienteId || 0) !== Number(clienteIdNum)) return false;
                if (dataInicio && /^\d{4}-\d{2}-\d{2}$/.test(dataInicio))
                {
                    const d = formatarDataBR(v.dataVenda);
                    const iso = d && /\//.test(d) ? d.split('/').reverse().join('-') : String(v.dataVenda || '').slice(0, 10);
                    if (iso && iso < dataInicio) return false;
                }
                if (dataFim && /^\d{4}-\d{2}-\d{2}$/.test(dataFim))
                {
                    const d = formatarDataBR(v.dataVenda);
                    const iso = d && /\//.test(d) ? d.split('/').reverse().join('-') : String(v.dataVenda || '').slice(0, 10);
                    if (iso && iso > dataFim) return false;
                }
            }
            return true;
        });

        const linhasSeguras = filtradas.map(limparLinhaSegura);
        const colunas = [
            { header: 'Cliente',        value: (v) => v.clienteNome || '' },
            { header: 'Produtos',       value: (v) => Array.isArray(v.itens)
                ? v.itens.map((i) => String(i?.produtoNome || '')).filter(Boolean).join(', ')
                : '' },
            { header: 'Qtd. itens',     value: (v) => Number(v.quantidade ?? (Array.isArray(v.itens) ? v.itens.length : 0)) | 0 },
            { header: 'Valor total',    value: (v) => formatarDinheiroBR(v.valorTotal) },
            { header: 'Data',           value: (v) => formatarDataBR(v.dataVenda) },
            { header: 'Canal',          value: (v) => v.canal || '' },
            { header: 'Status',         value: (v) => v.statusVenda || '' },
            { header: 'Avaliação',      value: (v) => v.avaliacao || '' },
            { header: 'Observação',     value: (v) => v.observacao || '' },
        ];

        enviarCSV(res, 'vendas', colunas, linhasSeguras);
    }
    catch (error)
    {
        const fk = parseErroFkVenda(error);
        if (fk) return res.status(fk.status).json(fk.body);
        const nu = parseErroNullVenda(error);
        if (nu) return res.status(nu.status).json(nu.body);
        console.error('❌ ExportarController exportarVendasCSV:', error);
        res.status(500).json({ erro: 'Erro interno ao gerar CSV de vendas' });
    }
};

module.exports = {
    exportarClientesCSV,
    exportarProdutosCSV,
    exportarVendasCSV,
};
