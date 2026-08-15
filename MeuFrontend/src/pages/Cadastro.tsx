import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircle2Icon,
  HomeIcon,
  IdCardIcon,
  Loader2Icon,
  MailIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserIcon } from
'lucide-react';
import { BrandPanel } from '../components/BrandPanel';
import { Logo } from '../components/Logo';
import { PasswordField } from '../components/PasswordField';
import { PersonTypeToggle } from '../components/PersonTypeToggle';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { setores } from '../data/setores';
import { maskCNPJ, maskCPF, maskPhone } from '../utils/masks';
import {
  FormErrors,
  FormValues,
  PersonType,
  validateAll,
  validateField } from
'../utils/validation';

const initialValues: FormValues = {
  nome: '',
  email: '',
  senha: '',
  tipo: 'pf',
  documento: '',
  nascimento: '',
  funcao: '',
  telefone: '',
  setor: ''
};

const requiredFields: (keyof FormValues)[] = [
'nome',
'email',
'senha',
'documento',
'nascimento',
'telefone',
'setor'];


export function Cadastro() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const isPF = values.tipo === 'pf';

  const progress = useMemo(() => {
    const filled = requiredFields.filter((field) => {
      const value = values[field];
      return Boolean(value) && !validateField(field, values);
    }).length;
    return Math.round(filled / requiredFields.length * 100);
  }, [values]);

  const setValue = (field: keyof FormValues, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      if (touched[field]) {
        setErrors((prevErrors) => ({ ...prevErrors, [field]: validateField(field, next) }));
      }
      return next;
    });
  };

  const handleBlur = (field: keyof FormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values) }));
  };

  const handleTypeChange = (tipo: PersonType) => {
    setValues((prev) => ({ ...prev, tipo, documento: '' }));
    setErrors((prev) => ({ ...prev, documento: undefined }));
    setTouched((prev) => ({ ...prev, documento: false }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateAll(values);
    setErrors(nextErrors);
    setTouched(
      requiredFields.reduce((acc, field) => ({ ...acc, [field]: true }), {} as Record<string, boolean>)
    );

    const firstError = requiredFields.find((field) => nextErrors[field]);
    if (firstError) {
      document.getElementById(firstError)?.focus();
      return;
    }

    setStatus('submitting');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setStatus('success');
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      <BrandPanel />

      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-10">
          <Logo className="text-xl lg:hidden" />
          <span className="hidden text-sm text-ink-muted lg:block">
            Já tem conta?{' '}
            <a href="#login" className="font-semibold text-brand-600 underline-offset-4 hover:underline">
              Faça login
            </a>
          </span>
          <a
            href="#inicio"
            className="inline-flex items-center gap-2 rounded-xl border border-surface-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-300 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
            
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            Início
          </a>
        </header>

        <div className="flex flex-1 justify-center px-5 pb-14 sm:px-10">
          <div className="w-full max-w-[640px]">
            <AnimatePresence mode="wait">
              {status === 'success' ?
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 rounded-xl2 border border-surface-line bg-surface-sunken p-10 text-center shadow-card">
                
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/10">
                    <CheckCircle2Icon className="h-8 w-8 text-brand-600" aria-hidden="true" />
                  </span>
                  <h1 className="mt-5 text-2xl font-extrabold text-ink">Cadastro concluído!</h1>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
                    Enviamos um e-mail de confirmação para <strong className="text-ink">{values.email}</strong>. Confirme
                    para ativar sua conta no Plainness CRM.
                  </p>
                  <a
                  href="#login"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                  
                    Ir para o login
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </a>
                </motion.div> :

              <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="mt-4">
                    <h1 className="text-[32px] font-extrabold leading-tight text-ink sm:text-[38px]">Bem-vindo!</h1>
                    <p className="mt-1.5 text-[15px] text-ink-soft">
                      Crie sua conta em poucos minutos e comece a organizar seus clientes.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-line">
                      <motion.div
                      className="h-full rounded-full bg-brand-600"
                      animate={{ width: `${progress}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 30 }} />
                    
                    </div>
                    <span className="text-xs font-semibold text-ink-muted">{progress}% completo</span>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-8">
                    <section className="space-y-5">
                      <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                        Dados de acesso
                      </h2>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <TextField
                        id="nome"
                        label={isPF ? 'Nome completo' : 'Razão social'}
                        placeholder={isPF ? 'Ex.: Ana Souza Lima' : 'Ex.: Souza Comércio LTDA'}
                        autoComplete="name"
                        icon={isPF ? <UserIcon className="h-[18px] w-[18px]" /> : <BuildingIcon className="h-[18px] w-[18px]" />}
                        value={values.nome}
                        error={errors.nome}
                        onChange={(e) => setValue('nome', e.target.value)}
                        onBlur={() => handleBlur('nome')} />
                      
                        <TextField
                        id="email"
                        label="E-mail"
                        type="email"
                        inputMode="email"
                        placeholder="voce@empresa.com.br"
                        autoComplete="email"
                        icon={<MailIcon className="h-[18px] w-[18px]" />}
                        value={values.email}
                        error={errors.email}
                        onChange={(e) => setValue('email', e.target.value)}
                        onBlur={() => handleBlur('email')} />
                      
                      </div>
                      <PasswordField
                      id="senha"
                      label="Senha"
                      value={values.senha}
                      error={errors.senha}
                      onChange={(value) => setValue('senha', value)}
                      onBlur={() => handleBlur('senha')} />
                    
                    </section>

                    <section className="space-y-5 border-t border-surface-line pt-8">
                      <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                        Dados do titular
                      </h2>
                      <PersonTypeToggle value={values.tipo} onChange={handleTypeChange} />
                      <div className="grid gap-5 sm:grid-cols-2">
                        <TextField
                        id="documento"
                        label={isPF ? 'CPF' : 'CNPJ'}
                        inputMode="numeric"
                        placeholder={isPF ? '000.000.000-00' : '00.000.000/0000-00'}
                        icon={<IdCardIcon className="h-[18px] w-[18px]" />}
                        value={values.documento}
                        error={errors.documento}
                        onChange={(e) => setValue('documento', isPF ? maskCPF(e.target.value) : maskCNPJ(e.target.value))}
                        onBlur={() => handleBlur('documento')} />
                      
                        <TextField
                        id="nascimento"
                        label={isPF ? 'Data de nascimento' : 'Data de abertura'}
                        type="date"
                        icon={<CalendarIcon className="h-[18px] w-[18px]" />}
                        value={values.nascimento}
                        error={errors.nascimento}
                        onChange={(e) => setValue('nascimento', e.target.value)}
                        onBlur={() => handleBlur('nascimento')} />
                      
                        <TextField
                        id="telefone"
                        label="Telefone"
                        inputMode="tel"
                        placeholder="(11) 99999-9999"
                        autoComplete="tel"
                        icon={<PhoneIcon className="h-[18px] w-[18px]" />}
                        value={values.telefone}
                        error={errors.telefone}
                        onChange={(e) => setValue('telefone', maskPhone(e.target.value))}
                        onBlur={() => handleBlur('telefone')} />
                      
                        <TextField
                        id="funcao"
                        label="Função"
                        optional
                        placeholder="Ex.: Gerente comercial"
                        icon={<BriefcaseIcon className="h-[18px] w-[18px]" />}
                        value={values.funcao}
                        onChange={(e) => setValue('funcao', e.target.value)} />
                      
                      </div>
                      <SelectField
                      id="setor"
                      label="Setor de atuação"
                      placeholder="Selecione o setor"
                      options={setores}
                      value={values.setor}
                      error={errors.setor}
                      onChange={(e) => setValue('setor', e.target.value)}
                      onBlur={() => handleBlur('setor')} />
                    
                    </section>

                    <div className="space-y-4">
                      <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-4 text-[15px] font-bold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-70">
                      
                        {status === 'submitting' ?
                      <>
                            <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
                            Criando sua conta...
                          </> :

                      <>
                            Criar minha conta
                            <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                          </>
                      }
                      </button>

                      <p className="flex items-center justify-center gap-2 text-xs text-ink-muted">
                        <ShieldCheckIcon className="h-4 w-4 text-brand-400" aria-hidden="true" />
                        Seus dados são protegidos e usados apenas para criar sua conta.
                      </p>

                      <p className="text-center text-sm text-ink-soft lg:hidden">
                        Já tem conta?{' '}
                        <a href="#login" className="font-semibold text-brand-600 underline-offset-4 hover:underline">
                          Faça login
                        </a>
                      </p>
                    </div>
                  </form>
                </motion.div>
              }
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>);

}