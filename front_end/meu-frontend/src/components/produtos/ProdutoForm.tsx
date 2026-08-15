import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FormField } from '../forms/FormField';
import { FormSelect } from '../forms/FormSelect';
import { TextAreaField } from '../forms/TextAreaField';
import { maskMoney, parseMoney, decimalCasas } from '../../utils/masks';
import { opcoesClassificacaoPreco } from '../../types/produto';
import type { Produto, ProdutoFormValues } from '../../types/produto';

const FormRoot = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
`;

const Row = styled.div<{ $cols?: 2 | 3 }>`
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: flex-start;

  & > * {
    flex: 1 1 ${({ $cols }) => ($cols === 3 ? '220px' : '300px')};
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  align-items: center;
  justify-content: flex-start;
`;

const SubmitButton = styled.button<{ $submitting?: boolean }>`
  min-width: 200px;
  height: 46px;
  padding: 0 1.25rem;
  background-color: var(--pl-blue);
  color: #fff;
  border: 1px solid var(--pl-blue);
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background-color: var(--pl-blue-dark);
    border-color: var(--pl-blue-dark);
  }

  &:disabled {
    opacity: 0.75;
    cursor: not-allowed;
  }
`;

const GhostButton = styled.button`
  height: 46px;
  padding: 0 1.25rem;
  background: transparent;
  color: var(--pl-navy);
  border: 1px solid #c6c3da;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;

  &:hover {
    background: var(--pl-canvas);
    border-color: var(--pl-blue);
    color: var(--pl-blue);
  }
`;

const emptyValues: ProdutoFormValues =
{
    nome: '',
    descricao: '',
    nicho: '',
    valor: '',
    investimento: '',
    classificacaoPorPreco: '',
};

const VALORES_CLASSIFICACAO = opcoesClassificacaoPreco.map(o => o.value).filter(Boolean) as string[];

type Errors = Partial<Record<keyof ProdutoFormValues, string>>;

const validar = (values: ProdutoFormValues): Errors =>
{
    const erros: Errors = {};
    const nome = values.nome?.trim() ?? '';
    if (!nome) erros.nome = 'campo nome não pode ser vazio';
    else if (nome.length < 3) erros.nome = 'campo nome precisa ter pelo menos 3 caracteres';
    else if (nome.length > 70) erros.nome = 'campo nome pode ter no máximo 70 caracteres';

    if (values.nicho && values.nicho.length > 50)
    {
        erros.nicho = 'campo nicho pode ter no máximo 50 caracteres';
    }

    if (values.descricao && values.descricao.length > 2000)
    {
        erros.descricao = 'campo descrição pode ter no máximo 2000 caracteres';
    }

    const valorNumerico = parseMoney(values.valor);
    if (valorNumerico === null || !values.valor) erros.valor = 'campo valor unitário não pode ser vazio';
    else if (!Number.isFinite(valorNumerico)) erros.valor = 'campo valor unitário inválido';
    else if (valorNumerico <= 0) erros.valor = 'campo valor unitário deve ser maior que zero';
    else
    {
        const casas = decimalCasas(values.valor);
        if (casas !== null && casas > 2) erros.valor = 'campo valor unitário deve ter no máximo 2 casas decimais';
    }

    if (values.investimento?.trim())
    {
        const invest = parseMoney(values.investimento);
        if (invest === null || !Number.isFinite(invest)) erros.investimento = 'campo investimento inválido';
        else if (invest < 0) erros.investimento = 'campo investimento não pode ser negativo';
        else
        {
            const casas = decimalCasas(values.investimento);
            if (casas !== null && casas > 2) erros.investimento = 'campo investimento deve ter no máximo 2 casas decimais';
        }
    }

    if (values.classificacaoPorPreco?.trim())
    {
        const classificacao = values.classificacaoPorPreco.trim().toLowerCase();
        if (!VALORES_CLASSIFICACAO.includes(classificacao))
        {
            erros.classificacaoPorPreco = 'campo classificação por preço precisa ser Baixo, Médio ou Alto';
        }
    }

    return erros;
};

const formatarParaSubmit = (v: ProdutoFormValues): Record<string, unknown> =>
{
    const trimOrNull = (s: string | null | undefined) =>
    {
        if (s === undefined || s === null) return null;
        const t = String(s).trim();
        return t === '' ? null : t;
    };

    const classificacaoRaw = v.classificacaoPorPreco?.trim().toLowerCase() ?? null;
    const classificacao = classificacaoRaw && classificacaoRaw !== ''
        ? classificacaoRaw
        : null;

    const invest = v.investimento?.trim() ? parseMoney(v.investimento) : null;

    return {
        nome: trimOrNull(v.nome),
        descricao: trimOrNull(v.descricao),
        nicho: trimOrNull(v.nicho),
        valor: parseMoney(v.valor),
        investimento: invest,
        classificacaoPorPreco: classificacao,
    };
};

const valorFormularioInicial = (valorBanco: number | string | null | undefined): string =>
{
    if (valorBanco === null || valorBanco === undefined || valorBanco === '') return '';
    const n = Number(valorBanco);
    if (!Number.isFinite(n)) return '';
    return maskMoney((n * 100).toFixed(0));
};

export interface ProdutoFormProps
{
    initialValue?: Produto | null;
    onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
    onCancel?: () => void;
    submitting?: boolean;
}

export const ProdutoForm: React.FC<ProdutoFormProps> = ({ initialValue, onSubmit, onCancel, submitting }) =>
{
    const [values, setValues] = useState<ProdutoFormValues>(emptyValues);
    const [errors, setErrors] = useState<Errors>({});

    useEffect(() =>
    {
        if (initialValue)
        {
            setValues({
                nome: initialValue.nome ?? '',
                descricao: initialValue.descricao ?? '',
                nicho: initialValue.nicho ?? '',
                valor: valorFormularioInicial(initialValue.valor),
                investimento: valorFormularioInicial(initialValue.investimento),
                classificacaoPorPreco: (initialValue.classificacaoPorPreco as any) ?? '',
            });
        }
        else
        {
            setValues({ ...emptyValues });
        }
        setErrors({});
    }, [initialValue]);

    const setField = <K extends keyof ProdutoFormValues>(campo: K, valor: ProdutoFormValues[K]) =>
    {
        setValues((prev) => ({ ...prev, [campo]: valor }));
        setErrors((prev) => ({ ...prev, [campo]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) =>
    {
        e.preventDefault();
        const proxErros = validar(values);
        setErrors(proxErros);
        if (Object.keys(proxErros).length > 0) return;

        const payload = formatarParaSubmit(values);
        await onSubmit(payload);
    };

    return (
        <FormRoot noValidate onSubmit={handleSubmit}>
            <Row $cols={2}>
                <FormField
                    name="nome"
                    label="Nome do produto"
                    required
                    placeholder="Ex.: curso, camiseta, bolo, etc."
                    value={values.nome}
                    maxLength={70}
                    error={errors.nome}
                    fullWidth
                    onChange={(e) => setField('nome', e.target.value)}
                />
                <FormField
                    name="valor"
                    label="Valor unitário (R$)"
                    required
                    placeholder="R$ 0,00"
                    inputMode="decimal"
                    value={values.valor}
                    error={errors.valor}
                    helperText="Ex.: 1.234,56 — máximo 2 casas decimais."
                    fullWidth
                    onChange={(e) => setField('valor', maskMoney(e.target.value))}
                />
            </Row>

            <Row $cols={3}>
                <FormField
                    name="investimento"
                    label="Qual foi o investimento sobre o produto (R$)?"
                    placeholder="R$ 0,00"
                    inputMode="decimal"
                    value={values.investimento}
                    error={errors.investimento}
                    helperText="Opcional. Quanto custou para produzir/adquirir este item."
                    fullWidth
                    onChange={(e) => setField('investimento', maskMoney(e.target.value))}
                />
                <FormSelect
                    name="classificacaoPorPreco"
                    label="Classificação por preço"
                    value={(values.classificacaoPorPreco as any) ?? ''}
                    error={errors.classificacaoPorPreco}
                    helperText="Opcional. Agrupe produtos por faixa de valor."
                    placeholder="Selecione (opcional)"
                    fullWidth
                    options={opcoesClassificacaoPreco}
                    onChange={(e) => setField('classificacaoPorPreco', e.target.value as any)}
                />
                <FormField
                    name="nicho"
                    label="Nicho / Categoria"
                    placeholder="Ex.: Beleza, Tecnologia, Moda, Ensino"
                    value={values.nicho ?? ''}
                    maxLength={50}
                    error={errors.nicho}
                    helperText="Até 50 caracteres. Ex.: Beleza, Tecnologia, Moda, Ensino, etc."
                    fullWidth
                    onChange={(e) => setField('nicho', e.target.value)}
                />
            </Row>

            <TextAreaField
                name="descricao"
                label="Descrição do produto"
                placeholder="Descreva características, conteúdo, benefícios, observações..."
                value={values.descricao ?? ''}
                maxLength={2000}
                error={errors.descricao}
                helperText={`${(values.descricao ?? '').length} / 2000 caracteres`}
                fullWidth
                onChange={(e) => setField('descricao', e.target.value)}
            />

            <ButtonsRow>
                <SubmitButton type="submit" disabled={submitting} $submitting={submitting}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                    </svg>
                    {submitting ? 'Salvando...' : initialValue ? 'Salvar alterações' : 'Cadastrar produto'}
                </SubmitButton>
                {onCancel && (
                    <GhostButton type="button" onClick={onCancel} disabled={submitting}>
                        Cancelar
                    </GhostButton>
                )}
            </ButtonsRow>
        </FormRoot>
    );
};

export default ProdutoForm;
