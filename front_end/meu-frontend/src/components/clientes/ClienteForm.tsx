import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FormField } from '../forms/FormField';
import { FormSelect } from '../forms/FormSelect';
import { TextAreaField } from '../forms/TextAreaField';
import { estadosBrasil, opcoesSexo, statusClienteOptions } from '../../data/clientes';
import { maskPhone, onlyDigits } from '../../utils/masks';
import type { Cliente, ClienteFormValues } from '../../types/cliente';

// ============================================
// STYLED COMPONENTS
// ============================================

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

// ============================================
// HELPERS / CONSTANTES
// ============================================

const emptyValues: ClienteFormValues =
{
    nome: '',
    telefone: '',
    email: '',
    instagram: '',
    sexo: '',
    estado: '',
    dataNascimento: null,
    descricao: '',
    status: 'Ativo',
    dataCadastramento: null,
};

type Errors = Partial<Record<keyof ClienteFormValues, string>>;

const validarEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v.trim());

const validarInstagram = (v: string): boolean =>
{
    if (!v || !v.trim()) return true;
    return v.trim().startsWith('@');
};

const calcularIdade = (dataNascStr: string | null | undefined): number | null =>
{
    if (!dataNascStr) return null;
    const d = new Date(dataNascStr);
    if (Number.isNaN(d.getTime())) return null;
    const hj = new Date();
    let idade = hj.getFullYear() - d.getFullYear();
    const m = hj.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && hj.getDate() < d.getDate())) idade--;
    return idade;
};

const idadeMinimaPermitida = 18;

const hojeISO = (): string =>
{
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const validar = (values: ClienteFormValues): Errors =>
{
    const erros: Errors = {};
    const nome = values.nome?.trim() ?? '';
    if (!nome) erros.nome = 'campo nome não pode ser vazio';
    else if (nome.length < 3) erros.nome = 'campo nome precisa ter pelo menos 3 caracteres';
    else if (nome.length > 70) erros.nome = 'campo nome pode ter no máximo 70 caracteres';

    const email = values.email?.trim() ?? '';
    if (!email) erros.email = 'campo email não pode ser vazio';
    else if (!validarEmail(email)) erros.email = 'campo email inválido';

    const telOnly = onlyDigits(values.telefone ?? '');
    if (!values.telefone || !values.telefone.trim()) erros.telefone = 'campo telefone não pode ser vazio';
    else if (telOnly.length < 10) erros.telefone = 'campo telefone incompleto (10 ou 11 dígitos)';

    if (values.instagram && !validarInstagram(values.instagram))
    {
        erros.instagram = 'campo instagram precisa começar com @';
    }

    if (!values.sexo) erros.sexo = 'campo sexo não pode ser vazio';
    else if (!opcoesSexo.includes(values.sexo))
    {
        erros.sexo = 'campo sexo precisa ser Masculino, Feminino ou Outro';
    }

    if (values.estado && values.estado.length > 30)
    {
        erros.estado = 'campo estado pode ter no máximo 30 caracteres';
    }

    const idade = calcularIdade(values.dataNascimento);
    if (values.dataNascimento)
    {
        const d = new Date(values.dataNascimento);
        if (Number.isNaN(d.getTime())) erros.dataNascimento = 'campo data de nascimento inválido';
        else if (idade !== null && idade < idadeMinimaPermitida) erros.dataNascimento = `campo data de nascimento: cliente precisa ter pelo menos ${idadeMinimaPermitida} anos`;
    }

    if (values.descricao && values.descricao.length > 500)
    {
        erros.descricao = 'campo descrição pode ter no máximo 500 caracteres';
    }

    const statusOpcoes = statusClienteOptions.map((o) => o.value);
    if (!values.status) erros.status = 'campo status não pode ser vazio';
    else if (!(statusOpcoes as string[]).includes(values.status)) erros.status = 'campo status inválido';

    return erros;
};

const formatarParaSubmit = (v: ClienteFormValues): Record<string, unknown> =>
{
    const trimOrNull = (s: string | null | undefined) =>
    {
        if (s === undefined || s === null) return null;
        const t = String(s).trim();
        return t === '' ? null : t;
    };

    const isoDateOrNull = (s: string | null | undefined) =>
    {
        if (!s) return null;
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    return {
        nome: trimOrNull(v.nome),
        telefone: trimOrNull(v.telefone),
        email: trimOrNull(v.email),
        instagram: trimOrNull(v.instagram),
        sexo: trimOrNull(v.sexo),
        estado: trimOrNull(v.estado),
        dataNascimento: isoDateOrNull(v.dataNascimento),
        descricao: trimOrNull(v.descricao),
        status: v.status || 'Ativo',
    };
};

const formatarDataBRParaInput = (iso: string | null | undefined): string =>
{
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ============================================
// TIPOS
// ============================================

export interface ClienteFormProps
{
    initialValue?: Cliente | null;
    onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
    onCancel?: () => void;
    submitting?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ClienteForm: React.FC<ClienteFormProps> = ({ initialValue, onSubmit, onCancel, submitting }) =>
{
    const [values, setValues] = useState<ClienteFormValues>(emptyValues);
    const [errors, setErrors] = useState<Errors>({});

    useEffect(() =>
    {
        if (initialValue)
        {
            setValues({
                nome: initialValue.nome ?? '',
                telefone: initialValue.telefone ?? '',
                email: initialValue.email ?? '',
                instagram: initialValue.instagram ?? '',
                sexo: initialValue.sexo ?? '',
                estado: initialValue.estado ?? '',
                dataNascimento: formatarDataBRParaInput(initialValue.dataNascimento) as ClienteFormValues['dataNascimento'],
                descricao: initialValue.descricao ?? '',
                status: initialValue.statusCliente ?? initialValue.status ?? 'Ativo',
                dataCadastramento: initialValue.dataCadastramento ?? null,
            });
        }
        else
        {
            setValues({
                ...emptyValues,
                status: 'Ativo',
                dataCadastramento: null,
            });
        }
        setErrors({});
    }, [initialValue]);

    const setField = <K extends keyof ClienteFormValues>(campo: K, valor: ClienteFormValues[K]) =>
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
                    label="Nome completo"
                    required
                    placeholder="Ex.: Fernanda Rocha"
                    value={values.nome}
                    maxLength={70}
                    error={errors.nome}
                    fullWidth
                    onChange={(e) => setField('nome', e.target.value)}
                />
                <FormField
                    name="email"
                    label="E-mail"
                    required
                    type="email"
                    placeholder="cliente@empresa.com.br"
                    value={values.email}
                    maxLength={70}
                    error={errors.email}
                    fullWidth
                    onChange={(e) => setField('email', e.target.value)}
                />
            </Row>

            <Row $cols={3}>
                <FormField
                    name="telefone"
                    label="Telefone"
                    required
                    placeholder="(11) 99999-9999"
                    inputMode="tel"
                    value={values.telefone}
                    error={errors.telefone}
                    fullWidth
                    onChange={(e) => setField('telefone', maskPhone(e.target.value))}
                />
                <FormField
                    name="instagram"
                    label="Instagram"
                    placeholder="@perfil"
                    value={values.instagram ?? ''}
                    maxLength={50}
                    error={errors.instagram}
                    helperText="O perfil precisa começar com @ caso preenchido."
                    fullWidth
                    onChange={(e) => setField('instagram', e.target.value)}
                />
                <FormField
                    name="dataNascimento"
                    label="Data de nascimento"
                    type="date"
                    value={values.dataNascimento ?? ''}
                    max={hojeISO()}
                    error={errors.dataNascimento}
                    helperText={values.dataNascimento ? `${calcularIdade(values.dataNascimento) ?? '—'} anos` : 'Idade mínima 18 anos.'}
                    fullWidth
                    onChange={(e) => setField('dataNascimento', (e.target.value || null) as ClienteFormValues['dataNascimento'])}
                />
            </Row>

            <Row $cols={3}>
                <FormSelect
                    name="sexo"
                    label="Sexo"
                    required
                    placeholder="Selecione"
                    fullWidth
                    value={values.sexo ?? ''}
                    error={errors.sexo}
                    options={opcoesSexo.map((s) => ({ value: s, label: s }))}
                    onChange={(e) => setField('sexo', e.target.value as ClienteFormValues['sexo'])}
                />
                <FormSelect
                    name="estado"
                    label="Estado (UF)"
                    placeholder="Selecione a UF"
                    fullWidth
                    value={values.estado ?? ''}
                    error={errors.estado}
                    options={estadosBrasil.map((uf) => ({ value: uf, label: uf }))}
                    onChange={(e) => setField('estado', e.target.value as ClienteFormValues['estado'])}
                />
                <FormSelect
                    name="status"
                    label="Status do cliente"
                    required
                    placeholder="Selecione"
                    fullWidth
                    value={values.status}
                    error={errors.status}
                    options={statusClienteOptions}
                    onChange={(e) => setField('status', e.target.value as ClienteFormValues['status'])}
                />
            </Row>

            <TextAreaField
                name="descricao"
                label="Descrição / Observações"
                placeholder="Histórico, preferências, observações sobre o cliente..."
                value={values.descricao ?? ''}
                maxLength={500}
                error={errors.descricao}
                helperText={`${(values.descricao ?? '').length} / 500 caracteres`}
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
                    {submitting ? 'Salvando...' : initialValue ? 'Salvar alterações' : 'Cadastrar cliente'}
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

export default ClienteForm;
