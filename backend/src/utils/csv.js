const dayjs = require('dayjs');

// ============================================================
// HELPERS CSV
// ============================================================

const escaparCSV = (valor) =>
{
    if (valor === null || valor === undefined) return '';
    const str = String(valor);
    if (/[",;\n\r\t]/.test(str))
    {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
};

const gerarConteudoCSV = (colunas, linhas) =>
{
    if (!Array.isArray(colunas) || colunas.length === 0)
    {
        throw new Error('colunas CSV inválidas');
    }
    const linhasSeguras = Array.isArray(linhas) ? linhas : [];

    const cabecalho = colunas.map((c) => escaparCSV(String(c.header || c))).join(';');
    const corpo = linhasSeguras.map((linha) =>
        colunas.map((c) =>
        {
            const valorBruto = typeof c.value === 'function'
                ? c.value(linha || {})
                : (typeof c === 'string' || typeof c === 'number' ? linha?.[c] : '');
            return escaparCSV(valorBruto);
        }).join(';')
    ).join('\r\n');

    return cabecalho + '\r\n' + corpo;
};

const dataYYYYMMDD = () =>
{
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const enviarCSV = (res, nomeArquivo, colunas, linhas) =>
{
    const nomeFinal = String(nomeArquivo || 'exportacao').endsWith('.csv')
        ? String(nomeArquivo)
        : `${String(nomeArquivo || 'exportacao')}_${dataYYYYMMDD()}.csv`;

    const conteudo = gerarConteudoCSV(colunas, linhas);
    const BOM = '\uFEFF';
    const payload = BOM + conteudo;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeFinal}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).send(payload);
};

// Hardening: remover campos sensíveis (IDs, FKs, tokens) de forma blindada
// Garante que NUNCA esses campos saiam no CSV (mesmo se alguém esquecer na lista de colunas)
const listaProibida = new Set([
    'id', 'usuarioId', 'senha', 'token', 'refreshToken', 'hash',
    'clienteId', 'produtoId', 'vendaId', 'itemVendaId',
]);
const limparLinhaSegura = (linha) =>
{
    if (!linha || typeof linha !== 'object') return {};
    const saida = {};
    for (const k of Object.keys(linha))
    {
        const kl = String(k).toLowerCase();
        if (listaProibida.has(k)) continue;
        if (kl.endsWith('id')) continue;
        saida[k] = linha[k];
    }
    return saida;
};

const formatarDataBR = (valor) =>
{
    if (!valor) return '';
    const d = dayjs(valor);
    if (!d.isValid()) return String(valor);
    return d.format('DD/MM/YYYY');
};

const formatarDinheiroBR = (valor) =>
{
    const n = Number(valor || 0);
    if (Number.isNaN(n)) return String(valor ?? '');
    return n.toFixed(2).replace('.', ',');
};

module.exports = {
    escaparCSV,
    gerarConteudoCSV,
    dataYYYYMMDD,
    enviarCSV,
    limparLinhaSegura,
    formatarDataBR,
    formatarDinheiroBR,
};
