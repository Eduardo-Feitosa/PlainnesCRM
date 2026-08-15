export type ClassificacaoPreco = 'baixo' | 'medio' | 'alto';

export interface Produto
{
    id: number;
    usuarioId?: number;
    nome: string;
    descricao: string | null;
    nicho: string | null;
    valor: number;
    investimento: number | null;
    classificacaoPorPreco: ClassificacaoPreco | string | null;
}

export type ProdutoFormValues = Omit<Produto, 'id' | 'usuarioId' | 'valor' | 'investimento'> & {
    valor: string;
    investimento: string;
};

export const opcoesClassificacaoPreco: { value: ClassificacaoPreco | ''; label: string }[] = [
    { value: '', label: 'Não classificado' },
    { value: 'baixo', label: 'Baixo' },
    { value: 'medio', label: 'Médio' },
    { value: 'alto', label: 'Alto' },
];

export const rotuloClassificacaoPreco = (valor: string | null | undefined): string =>
{
    switch (valor)
    {
        case 'baixo': return 'Baixo';
        case 'medio': return 'Médio';
        case 'alto': return 'Alto';
        default: return '';
    }
};
