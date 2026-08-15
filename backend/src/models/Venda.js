// Importa a conexão com o banco de dados (pool)
const conexao = require('../config/database');

// Helper de segurança: formata DECIMAL(10,2) do MySQL como Number float com 2 casas
function formatarDecimal(valor)
{
    if (valor === null || valor === undefined || valor === '') return null;
    const n = Number(valor);
    if (!Number.isFinite(n)) return null;
    return Number(n.toFixed(2));
}

// Helper normaliza strings vazias em NULL (bom para colunas NOT NULL futuras)
function normaliza(s)
{
    if (s === null || s === undefined) return null;
    const x = String(s).trim();
    return x === '' ? null : x;
}

function dataServidorHoje()
{
    const d = new Date();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function normalizarDataVendaModel(dataVenda)
{
    if (dataVenda === null || dataVenda === undefined) return null;
    const s = String(dataVenda).trim();
    if (s === '') return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    try
    {
        const d = new Date(dataVenda);
        if (!Number.isNaN(d.getTime()))
        {
            const yyyy = String(d.getUTCFullYear());
            const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(d.getUTCDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
    }
    catch (_) { /* ignore */ }
    return null;
}

// ============================================
// DETECÇÃO DE COLUNAS OPCIONAIS (anti-erro 1054 Unknown column)
// Usa INFORMATION_SCHEMA para verificar se a coluna existe antes de SELECT.
// Se não existir, retorna literal fallback em vez de crashar.
// Cache em memória para não fazer a consulta toda hora.
// ============================================
let colunasVendaCache = null;

async function colunasVendaExistem(forceRefresh = false)
{
    if (colunasVendaCache && !forceRefresh) return colunasVendaCache;
    let cols = new Set();
    try
    {
        const [linhas] = await conexao.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'venda'`
        );
        for (const r of linhas) cols.add(String((r.COLUMN_NAME || r.column_name || '').toLowerCase()));
    }
    catch (_) { }
    colunasVendaCache = cols;
    return cols;
}

function projs(colsSet)
{
    const f = (nome, fallback) =>
    {
        if (colsSet.has(nome.toLowerCase())) return `v.${nome}`;
        // Já vem com alias embutido pra não duplicar AS
        return `${fallback} AS ${nome}`;
    };
    return {
        observacao: f('observacao', 'NULL'),
        quantidade: f('quantidade', '0'),
    };
}

const modeloVenda =
{
    // Lista todas as vendas do USUÁRIO LOGADO (scoped), com inner join dados básicos cliente + itens agregados
    listarTodos: async (usuarioId) =>
    {
        const cols = await colunasVendaExistem();
        const p = projs(cols);
        const sql = `
            SELECT
                v.id,
                v.usuarioId,
                v.clienteId,
                v.dataVenda,
                v.avaliacao,
                ${p.observacao},
                v.valorTotal,
                v.canal,
                v.statusVenda,
                ${p.quantidade},
                c.nome  AS clienteNome,
                c.telefone AS clienteTelefone,
                c.email    AS clienteEmail
            FROM venda v
            LEFT JOIN cliente c ON c.id = v.clienteId
            WHERE v.usuarioId = ?
            ORDER BY v.dataVenda DESC, v.id DESC
        `;
        const [linhas] = await conexao.query(sql, [usuarioId]);
        const vendas = linhas.map((l) => ({
            ...l,
            quantidade: Number(l.quantidade) | 0,
            valorTotal: formatarDecimal(l.valorTotal),
            itens: [],
        }));
        if (!vendas.length) return vendas;

        const ids = vendas.map((v) => v.id);
        const placeholders = ids.map(() => '?').join(', ');
        const sqlItens = `
            SELECT
                i.id,
                i.vendaId,
                i.produtoId,
                i.precoUnitario,
                p.nome AS produtoNome
            FROM itemvenda i
            LEFT JOIN produto p ON p.id = i.produtoId
            WHERE i.vendaId IN (${placeholders})
            ORDER BY i.vendaId ASC, i.id ASC
        `;
        const [itensLinhas] = await conexao.query(sqlItens, ids);
        const mapaItens = {};
        for (const it of itensLinhas)
        {
            const vid = Number(it.vendaId);
            if (!mapaItens[vid]) mapaItens[vid] = [];
            mapaItens[vid].push({
                ...it,
                quantidade: 1,
                precoUnitario: formatarDecimal(it.precoUnitario),
                subtotal: formatarDecimal(1 * Number(it.precoUnitario)),
            });
        }
        for (const v of vendas) v.itens = mapaItens[v.id] || [];
        return vendas;
    },

    // Busca uma venda por ID (scoped por usuário), incluindo seus itens com dados do produto
    buscarPorId: async (id, usuarioId) =>
    {
        const cols = await colunasVendaExistem();
        const p = projs(cols);
        const sqlVenda = `
            SELECT
                v.id,
                v.usuarioId,
                v.clienteId,
                v.dataVenda,
                v.avaliacao,
                ${p.observacao},
                v.valorTotal,
                v.canal,
                v.statusVenda,
                ${p.quantidade},
                c.nome  AS clienteNome,
                c.telefone AS clienteTelefone,
                c.email    AS clienteEmail
            FROM venda v
            LEFT JOIN cliente c ON c.id = v.clienteId
            WHERE v.id = ? AND v.usuarioId = ?
        `;
        const [linhas] = await conexao.query(sqlVenda, [id, usuarioId]);
        if (!linhas || !linhas.length) return null;

        const venda = {
            ...linhas[0],
            quantidade: Number(linhas[0].quantidade) | 0,
            valorTotal: formatarDecimal(linhas[0].valorTotal),
        };

        const sqlItens = `
            SELECT
                i.id,
                i.vendaId,
                i.produtoId,
                i.precoUnitario,
                p.nome AS produtoNome
            FROM itemvenda i
            LEFT JOIN produto p ON p.id = i.produtoId
            WHERE i.vendaId = ?
            ORDER BY i.id ASC
        `;
        const [itens] = await conexao.query(sqlItens, [id]);
        venda.itens = itens.map((i) => ({
            ...i,
            quantidade: 1,
            precoUnitario: formatarDecimal(i.precoUnitario),
            subtotal: formatarDecimal(1 * Number(i.precoUnitario)),
        }));

        return venda;
    },

    // Cria uma venda (o Controller já garantiu valorTotal e quantidade calculados a partir dos itens)
    criar: async (usuarioId, dados) =>
    {
        const {
            clienteId,
            dataVenda,
            avaliacao,
            observacao,
            valorTotal,
            quantidade,
            canal,
            statusVenda,
        } = dados;

        const cols = await colunasVendaExistem();
        const temObs = cols.has('observacao');
        const temQtd = cols.has('quantidade');

        const colunas = ['usuarioId', 'clienteId', 'dataVenda', 'avaliacao'];
        const params = [
            usuarioId,
            clienteId ? clienteId : null,
            normalizarDataVendaModel(dataVenda),
            normaliza(avaliacao),
        ];
        if (temObs) { colunas.push('observacao'); params.push(normaliza(observacao)); }
        colunas.push('valorTotal'); params.push(formatarDecimal(valorTotal));
        if (temQtd) { colunas.push('quantidade'); params.push((Number(quantidade) | 0) || 0); }
        colunas.push('canal', 'statusVenda'); params.push(normaliza(canal), normaliza(statusVenda));

        const placeholders = colunas.map(() => '?').join(', ');
        const sql = `INSERT INTO venda (${colunas.join(', ')}) VALUES (${placeholders})`;
        const [resultado] = await conexao.query(sql, params);
        return resultado.insertId;
    },

    // Atualiza CABEÇA de venda (não mexe nos itens)
    atualizar: async (id, usuarioId, dados) =>
    {
        const {
            clienteId,
            dataVenda,
            avaliacao,
            observacao,
            valorTotal,
            quantidade,
            canal,
            statusVenda,
        } = dados;

        const cols = await colunasVendaExistem();
        const temObs = cols.has('observacao');
        const temQtd = cols.has('quantidade');

        const sets = [
            'clienteId = ?',
            'dataVenda = ?',
            'avaliacao = ?',
        ];
        const params = [
            clienteId ? clienteId : null,
            dataVenda ? dataVenda : null,
            normaliza(avaliacao),
        ];
        if (temObs) { sets.push('observacao = ?'); params.push(normaliza(observacao)); }
        sets.push('valorTotal = ?'); params.push(formatarDecimal(valorTotal));
        if (temQtd) { sets.push('quantidade = ?'); params.push((Number(quantidade) | 0) || 0); }
        sets.push('canal = ?', 'statusVenda = ?'); params.push(normaliza(canal), normaliza(statusVenda));
        params.push(id, usuarioId);

        const sql = `UPDATE venda SET ${sets.join(', ')} WHERE id = ? AND usuarioId = ?`;
        const [resultado] = await conexao.query(sql, params);
        return resultado.affectedRows > 0;
    },

    // Deleta cabeça de venda (itens geralmente deletados em cascade/separado antes)
    deletar: async (id, usuarioId) =>
    {
        const [resultado] = await conexao.query(
            'DELETE FROM venda WHERE id = ? AND usuarioId = ?',
            [id, usuarioId]
        );
        return resultado.affectedRows > 0;
    },

    // Utilitário: pool para quem quiser transactions (vamos expor conexao pra controller criar transaction)
    conexao,
};

module.exports = modeloVenda;
