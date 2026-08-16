import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FormField } from '../forms/FormField';
import { TextAreaField } from '../forms/TextAreaField';
import type { Equipe, EquipeFormValues } from '../../types/equipe';

// ============================================
// STYLED COMPONENTS
// ============================================

const FormRoot = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: flex-start;

  & > * {
    flex: 1 1 260px;
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

const SubmitButton = styled.button`
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

  &:disabled { opacity: 0.75; cursor: not-allowed; }
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

// ============================================
// HELPERS
// ============================================

const emptyValues: EquipeFormValues =
{
    nome: '',
    descricao: '',
    setor: '',
    objetivo: '',
};

type Errors = Partial<Record<keyof EquipeFormValues, string>>;

// setor/objetivo limitados a 45 caracteres — espelha o VARCHAR(45) da tabela equipe
const LIMITE_SETOR_OBJETIVO = 45;

const validar = (values: EquipeFormValues): Errors =>
{
    const erros: Errors = {};
    const nome = values.nome?.trim() ?? '';
    if (!nome) erros.nome = 'campo nome não pode ser vazio';
    else if (nome.length < 3) erros.nome = 'campo nome precisa ter pelo menos 3 caracteres';
    else if (nome.length > 70) erros.nome = 'campo nome pode ter no máximo 70 caracteres';

    if (values.setor && values.setor.length > LIMITE_SETOR_OBJETIVO)
    {
        erros.setor = `campo setor pode ter no máximo ${LIMITE_SETOR_OBJETIVO} caracteres`;
    }
    if (values.objetivo && values.objetivo.length > LIMITE_SETOR_OBJETIVO)
    {
        erros.objetivo = `campo objetivo pode ter no máximo ${LIMITE_SETOR_OBJETIVO} caracteres`;
    }
    if (values.descricao && values.descricao.length > 2000)
    {
        erros.descricao = 'campo descrição pode ter no máximo 2000 caracteres';
    }

    return erros;
};

const formatarParaSubmit = (v: EquipeFormValues): EquipeFormValues =>
{
    const trimOrEmpty = (s: string | null | undefined) => (s ?? '').trim();
    return {
        nome: trimOrEmpty(v.nome),
        descricao: trimOrEmpty(v.descricao),
        setor: trimOrEmpty(v.setor),
        objetivo: trimOrEmpty(v.objetivo),
    };
};

// ============================================
// TIPOS
// ============================================

export interface EquipeFormProps
{
    initialValue?: Equipe | null;
    onSubmit: (values: EquipeFormValues) => Promise<void> | void;
    onCancel?: () => void;
    submitting?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const EquipeForm: React.FC<EquipeFormProps> = ({ initialValue, onSubmit, onCancel, submitting }) =>
{
    const [values, setValues] = useState<EquipeFormValues>(emptyValues);
    const [errors, setErrors] = useState<Errors>({});

    useEffect(() =>
    {
        if (initialValue)
        {
            setValues({
                nome: initialValue.nome ?? '',
                descricao: initialValue.descricao ?? '',
                setor: initialValue.setor ?? '',
                objetivo: initialValue.objetivo ?? '',
            });
        }
        else
        {
            setValues(emptyValues);
        }
        setErrors({});
    }, [initialValue]);

    const setField = <K extends keyof EquipeFormValues>(campo: K, valor: EquipeFormValues[K]) =>
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

        await onSubmit(formatarParaSubmit(values));
    };

    return (
        <FormRoot noValidate onSubmit={handleSubmit}>
            <FormField
                name="nome"
                label="Nome da equipe"
                required
                placeholder="Ex.: Time de Vendas"
                value={values.nome}
                maxLength={70}
                error={errors.nome}
                fullWidth
                onChange={(e) => setField('nome', e.target.value)}
            />

            <Row>
                <FormField
                    name="setor"
                    label="Setor"
                    placeholder="Ex.: Comercial"
                    value={values.setor ?? ''}
                    maxLength={LIMITE_SETOR_OBJETIVO}
                    error={errors.setor}
                    fullWidth
                    onChange={(e) => setField('setor', e.target.value)}
                />
                <FormField
                    name="objetivo"
                    label="Objetivo"
                    placeholder="Ex.: Aumentar vendas em 20%"
                    value={values.objetivo ?? ''}
                    maxLength={LIMITE_SETOR_OBJETIVO}
                    error={errors.objetivo}
                    fullWidth
                    onChange={(e) => setField('objetivo', e.target.value)}
                />
            </Row>

            <TextAreaField
                name="descricao"
                label="Descrição"
                placeholder="Descreva o propósito desta equipe..."
                value={values.descricao ?? ''}
                maxLength={2000}
                error={errors.descricao}
                fullWidth
                onChange={(e) => setField('descricao', e.target.value)}
            />

            <ButtonsRow>
                <SubmitButton type="submit" disabled={submitting}>
                    {submitting ? 'Salvando...' : initialValue ? 'Salvar alterações' : 'Criar equipe'}
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

export default EquipeForm;
