export const maskPhone = (value: string): string =>
{
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
};

export const onlyDigits = (value: string): string => value.replace(/\D/g, '');

export const initials = (name: string): string =>
{
    if (!name) return '??';
    const tokens = name.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return '??';
    if (tokens.length === 1)
    {
        const w = tokens[0];
        return (w[0] + (w[1] ?? '')).toUpperCase();
    }
    const first = tokens[0][0] ?? '';
    const last = tokens[tokens.length - 1][0] ?? '';
    return (first + last).toUpperCase();
};

export const formatDateBR = (dateIso: string | null | undefined): string =>
{
    if (!dateIso) return '—';
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const aaaa = d.getFullYear();
    return `${dd}/${mm}/${aaaa}`;
};

export const maskMoney = (value: string | number | null | undefined): string =>
{
    if (value === null || value === undefined || value === '') return '';
    const apenasDigitos = String(value).replace(/\D/g, '').slice(0, 12);
    if (!apenasDigitos) return '';
    const numero = Number(apenasDigitos) / 100;
    return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
    });
};

export const parseMoney = (valor: string | null | undefined): number | null =>
{
    if (valor === null || valor === undefined || valor === '') return null;
    const apenasDigitos = String(valor).replace(/\D/g, '');
    if (!apenasDigitos) return null;
    const numero = Number(apenasDigitos) / 100;
    if (!Number.isFinite(numero)) return null;
    return Number(numero.toFixed(2));
};

export const formatMoneyBR = (numero: number | string | null | undefined): string =>
{
    if (numero === null || numero === undefined || numero === '') return '—';
    const n = Number(numero);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
    });
};

export const decimalCasas = (valor: string | null | undefined): number | null =>
{
    if (valor === null || valor === undefined || valor === '') return 0;
    const separado = valor.split(/[,.]/);
    if (separado.length <= 1) return 0;
    const parteDecimal = separado[separado.length - 1].replace(/\D/g, '');
    return parteDecimal.length;
};

// ============================================================
// BAIXAR ARQUIVO BLOB (para CSV retornado do backend via API)
// ============================================================
export const baixarBlob = (
    blob: Blob,
    fallbackNomeArquivo: string,
    headerContentDisposition?: string | null,
): void =>
{
    let nome = fallbackNomeArquivo || 'download';
    try
    {
        const disposition = (headerContentDisposition || '').toString();
        const match = disposition.match(/filename\s*=\s*(?:"([^"]+)"|([^;\s]+))/i);
        if (match)
        {
            const raw = match[1] || match[2] || '';
            if (raw) nome = raw;
        }
    }
    catch (_) { /* não quebrar se disposition inválido */ }

    if (!nome.endsWith('.csv') && blob.type && blob.type.includes('csv'))
    {
        nome = nome.endsWith('.') ? `${nome}csv` : `${nome}.csv`;
    }

    const url = URL.createObjectURL(blob);
    try
    {
        const a = document.createElement('a');
        a.href = url;
        a.download = nome;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
    finally
    {
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
};
