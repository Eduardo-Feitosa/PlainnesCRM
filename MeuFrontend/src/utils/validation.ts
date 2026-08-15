import { onlyDigits } from './masks';

export type PersonType = 'pf' | 'pj';

export interface FormValues {
  nome: string;
  email: string;
  senha: string;
  tipo: PersonType;
  documento: string;
  nascimento: string;
  funcao: string;
  telefone: string;
  setor: string;
}

export type FormErrors = Partial<Record<keyof FormValues, string>>;

export function passwordScore(senha: string): number {
  let score = 0;
  if (senha.length >= 8) score++;
  if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) score++;
  if (/\d/.test(senha)) score++;
  if (/[^A-Za-z0-9]/.test(senha)) score++;
  return score;
}

export const passwordLabels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];

export function validateField(name: keyof FormValues, values: FormValues): string | undefined {
  const value = values[name];

  switch (name) {
    case 'nome':
      if (!value.trim()) return 'Informe o nome';
      if (value.trim().length < 3) return 'Nome muito curto';
      return undefined;
    case 'email':
      if (!value.trim()) return 'Informe o e-mail';
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value.trim())) return 'E-mail inválido';
      return undefined;
    case 'senha':
      if (!value) return 'Crie uma senha';
      if (value.length < 8) return 'Use no mínimo 8 caracteres';
      if (passwordScore(value) < 2) return 'Combine letras e números';
      return undefined;
    case 'documento':{
        const digits = onlyDigits(value);
        const expected = values.tipo === 'pf' ? 11 : 14;
        if (!digits) return values.tipo === 'pf' ? 'Informe o CPF' : 'Informe o CNPJ';
        if (digits.length !== expected) return values.tipo === 'pf' ? 'CPF incompleto' : 'CNPJ incompleto';
        return undefined;
      }
    case 'nascimento':
      if (!value) return values.tipo === 'pf' ? 'Informe a data de nascimento' : 'Informe a data de abertura';
      if (new Date(value) > new Date()) return 'A data não pode ser futura';
      return undefined;
    case 'telefone':{
        const digits = onlyDigits(value);
        if (!digits) return 'Informe o telefone';
        if (digits.length < 10) return 'Telefone incompleto';
        return undefined;
      }
    case 'setor':
      if (!value) return 'Selecione o setor';
      return undefined;
    default:
      return undefined;
  }
}

export function validateAll(values: FormValues): FormErrors {
  const fields: (keyof FormValues)[] = [
  'nome',
  'email',
  'senha',
  'documento',
  'nascimento',
  'telefone',
  'setor'];

  const errors: FormErrors = {};
  fields.forEach((field) => {
    const error = validateField(field, values);
    if (error) errors[field] = error;
  });
  return errors;
}